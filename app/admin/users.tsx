import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { Users, Search, Edit3, Trash2, Shield, User, Phone, CheckCircle, XCircle, AlertTriangle, Save, X, Eye, EyeOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useStudentStore } from '@/hooks/useStudentStore';

import { supabase } from '@/lib/supabase';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type UserRole = 'admin' | 'instructor' | 'student';
type UserStatus = 'active' | 'restricted' | 'pending';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastActive?: string;
  phone?: string;
  instructor_id?: string;
  is_approved?: boolean;
  is_restricted?: boolean;
  password?: string;
}

export default function AdminUsersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { refreshStudents } = useStudentStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | 'all'>('all');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', role: 'student' as UserRole, password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      console.log('🔄 Loading all users from database...');
      
      // Fetch all users from database
      const result = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false }) as unknown as Promise<{ data: any[] | null; error: any }>;
      const { data: dbUsers, error } = await result;

      if (error) {
        console.error('❌ Error fetching users:', error);
        throw error;
      }

      console.log('✅ Fetched users from database:', dbUsers?.length || 0);

      // Add mock admin if not exists
      const adminExists = dbUsers?.some((u: any) => u.email === 'mahmoud200276@gmail.com');
      const mockAdmin: AdminUser = {
        id: 'admin-001',
        name: 'System Administrator',
        email: 'mahmoud200276@gmail.com',
        role: 'admin',
        status: 'active',
        createdAt: '2024-01-15T00:00:00Z',
        lastActive: new Date().toISOString(),
        is_approved: true,
        is_restricted: false
      };

      // Add mock instructors if database is empty
      const mockInstructors: AdminUser[] = [
        {
          id: 'instructor-001',
          name: 'John Smith',
          email: 'john.smith@example.com',
          role: 'instructor',
          status: 'active',
          createdAt: '2024-01-10T00:00:00Z',
          lastActive: '2024-01-19T00:00:00Z',
          phone: '+1234567890',
          is_approved: true,
          is_restricted: false
        },
        {
          id: 'instructor-002',
          name: 'Sarah Johnson',
          email: 'sarah.j@example.com',
          role: 'instructor',
          status: 'active',
          createdAt: '2024-01-18T00:00:00Z',
          phone: '+1234567891',
          is_approved: true,
          is_restricted: false
        },
        {
          id: 'instructor-003',
          name: 'Mike Wilson',
          email: 'mike.w@example.com',
          role: 'instructor',
          status: 'active',
          createdAt: '2024-01-05T00:00:00Z',
          lastActive: '2024-01-15T00:00:00Z',
          phone: '+1234567892',
          is_approved: true,
          is_restricted: false
        }
      ];

      // Convert database users to AdminUser format
      const formattedUsers: AdminUser[] = (dbUsers || []).map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as UserRole,
        status: user.is_restricted ? 'restricted' : (user.is_approved ? 'active' : 'pending'),
        createdAt: user.created_at || new Date().toISOString(),
        lastActive: user.updated_at,
        phone: user.phone,
        instructor_id: user.instructor_id,
        is_approved: user.is_approved,
        is_restricted: user.is_restricted,
        password: user.password
      }));

      // Combine all users
      const allUsers = [
        ...(!adminExists ? [mockAdmin] : []),
        ...(formattedUsers.length === 0 ? mockInstructors : []),
        ...formattedUsers
      ];

      setUsers(allUsers);
      console.log('📊 Users loaded successfully:', allUsers.length);
    } catch (error) {
      console.error('🚨 Error loading users:', error);
      Alert.alert('Error', 'Failed to load users. Please try again.');
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (user.phone && user.phone.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleUserAction = async (userId: string, action: 'edit' | 'delete' | 'approve' | 'restrict' | 'activate' | 'view') => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    switch (action) {
      case 'edit':
        setEditingUser(user);
        setEditForm({
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          role: user.role,
          password: user.password || ''
        });
        break;
      case 'view':
        Alert.alert(
          `User Details: ${user.name}`,
          `Email: ${user.email}\nRole: ${user.role.toUpperCase()}\nStatus: ${user.status.toUpperCase()}\nCreated: ${new Date(user.createdAt).toLocaleDateString()}${user.phone ? `\nPhone: ${user.phone}` : ''}${user.instructor_id ? `\nInstructor ID: ${user.instructor_id}` : ''}${user.password ? `\nPassword: ${user.password}` : ''}`,
          [{ text: 'OK' }]
        );
        break;
      case 'delete':
        if (user.role === 'admin') {
          Alert.alert('Error', 'Cannot delete admin users.');
          return;
        }
        Alert.alert(
          'Delete User', 
          `Are you sure you want to delete ${user.name}? This action cannot be undone.`, 
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Delete', 
              style: 'destructive', 
              onPress: async () => {
                try {
                  if (user.id.startsWith('instructor-') || user.id.startsWith('admin-')) {
                    // Mock user - just remove from local state
                    setUsers(prev => prev.filter(u => u.id !== userId));
                  } else {
                    // Real user - delete from database
                    const deleteResult = supabase
                      .from('users')
                      .delete()
                      .eq('id', userId) as unknown as Promise<{ data: any; error: any }>;
                    const { error } = await deleteResult;
                    
                    if (error) throw error;
                    
                    setUsers(prev => prev.filter(u => u.id !== userId));
                    await refreshStudents();
                  }
                  Alert.alert('Success', `${user.name} has been deleted.`);
                  await loadUsers(); // Refresh the list
                } catch (error) {
                  console.error('Error deleting user:', error);
                  Alert.alert('Error', 'Failed to delete user. Please try again.');
                }
              }
            }
          ]
        );
        break;
      case 'approve':
        await updateUserStatus(userId, { is_approved: true, is_restricted: false });
        break;
      case 'restrict':
        await updateUserStatus(userId, { is_restricted: true });
        break;
      case 'activate':
        await updateUserStatus(userId, { is_approved: true, is_restricted: false });
        break;
    }
  };

  const updateUserStatus = async (userId: string, updates: { is_approved?: boolean; is_restricted?: boolean }) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    try {
      if (user.id.startsWith('instructor-') || user.id.startsWith('admin-')) {
        // Mock user - just update local state
        const newStatus = updates.is_restricted ? 'restricted' : (updates.is_approved ? 'active' : 'pending');
        setUsers(prev => prev.map(u => 
          u.id === userId 
            ? { ...u, status: newStatus, is_approved: updates.is_approved ?? u.is_approved, is_restricted: updates.is_restricted ?? u.is_restricted }
            : u
        ));
      } else {
        // Real user - update in database
        const updateResult = supabase
          .from('users')
          .update(updates)
          .eq('id', userId) as unknown as Promise<{ data: any; error: any }>;
        const { error } = await updateResult;
        
        if (error) throw error;
        
        const newStatus = updates.is_restricted ? 'restricted' : (updates.is_approved ? 'active' : 'pending');
        setUsers(prev => prev.map(u => 
          u.id === userId 
            ? { ...u, status: newStatus, is_approved: updates.is_approved ?? u.is_approved, is_restricted: updates.is_restricted ?? u.is_restricted }
            : u
        ));
        await refreshStudents();
      }
      
      const statusText = updates.is_restricted ? 'restricted' : (updates.is_approved ? 'approved and activated' : 'updated');
      Alert.alert('Success', `${user.name} has been ${statusText}.`);
      await loadUsers(); // Refresh stats
    } catch (error) {
      console.error('Error updating user status:', error);
      Alert.alert('Error', 'Failed to update user status. Please try again.');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    
    if (!editForm.name.trim() || !editForm.email.trim()) {
      Alert.alert('Error', 'Name and email are required.');
      return;
    }

    try {
      // Validate email and password
      if (!editForm.email.includes('@')) {
        Alert.alert('Error', 'Email must contain "@" symbol.');
        return;
      }

      if (editForm.password && (editForm.password.length === 0 || editForm.password[0] !== editForm.password[0].toUpperCase() || editForm.password[0] === editForm.password[0].toLowerCase())) {
        Alert.alert('Error', 'Password must start with a capital letter.');
        return;
      }

      const updates: any = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim() || null,
        role: editForm.role
      };

      // Only include password if it's provided
      if (editForm.password.trim()) {
        updates.password = editForm.password.trim();
      }

      if (editingUser.id.startsWith('instructor-') || editingUser.id.startsWith('admin-')) {
        // Mock user - just update local state
        setUsers(prev => prev.map(u => 
          u.id === editingUser.id 
            ? { ...u, ...updates, phone: updates.phone || undefined }
            : u
        ));
      } else {
        // Real user - update in database
        const updateResult = supabase
          .from('users')
          .update(updates)
          .eq('id', editingUser.id) as unknown as Promise<{ data: any; error: any }>;
        const { error } = await updateResult;
        
        if (error) throw error;
        
        setUsers(prev => prev.map(u => 
          u.id === editingUser.id 
            ? { ...u, ...updates, phone: updates.phone || undefined }
            : u
        ));
        await refreshStudents();
      }
      
      setEditingUser(null);
      setEditForm({ name: '', email: '', phone: '', role: 'student', password: '' });
      setShowPassword(false);
      Alert.alert('Success', 'User information updated successfully.');
      await loadUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'Failed to update user information. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({ name: '', email: '', phone: '', role: 'student', password: '' });
    setShowPassword(false);
  };

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'restricted': return '#ef4444';
      default: return Colors.light.textLight;
    }
  };

  const getStatusIcon = (status: UserStatus) => {
    switch (status) {
      case 'active': return <CheckCircle size={16} color="#10b981" />;
      case 'pending': return <AlertTriangle size={16} color="#f59e0b" />;
      case 'restricted': return <XCircle size={16} color="#ef4444" />;
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <Shield size={20} color={Colors.light.primary} />;
      case 'instructor': return <User size={20} color="#10b981" />;
      case 'student': return <Users size={20} color="#3b82f6" />;
    }
  };

  const UserCard = ({ user }: { user: AdminUser }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userIcon}>
          {getRoleIcon(user.role)}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.userMeta}>
            <Text style={[styles.userRole, { color: user.role === 'admin' ? Colors.light.primary : user.role === 'instructor' ? '#10b981' : '#3b82f6' }]}>
              {user.role.toUpperCase()}
            </Text>
            <View style={styles.statusContainer}>
              {getStatusIcon(user.status)}
              <Text style={[styles.statusText, { color: getStatusColor(user.status) }]}>
                {user.status.toUpperCase()}
              </Text>
            </View>
          </View>
          {user.phone && (
            <View style={styles.phoneContainer}>
              <Phone size={12} color={Colors.light.textLight} />
              <Text style={styles.phoneText}>{user.phone}</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.userActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleUserAction(user.id, 'edit')}
        >
          <Edit3 size={16} color="#3b82f6" />
        </TouchableOpacity>
        
        {user.status === 'pending' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleUserAction(user.id, 'approve')}
          >
            <CheckCircle size={16} color="#10b981" />
          </TouchableOpacity>
        )}
        
        {user.status === 'active' && user.role !== 'admin' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.restrictButton]}
            onPress={() => handleUserAction(user.id, 'restrict')}
          >
            <XCircle size={16} color="#f59e0b" />
          </TouchableOpacity>
        )}
        
        {user.status === 'restricted' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.activateButton]}
            onPress={() => handleUserAction(user.id, 'activate')}
          >
            <CheckCircle size={16} color="#10b981" />
          </TouchableOpacity>
        )}
        
        {user.role !== 'admin' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleUserAction(user.id, 'delete')}
          >
            <Trash2 size={16} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const FilterButton = ({ title, isSelected, onPress }: { title: string; isSelected: boolean; onPress: () => void }) => (
    <TouchableOpacity
      style={[styles.filterButton, isSelected && styles.filterButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterButtonText, isSelected && styles.filterButtonTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Manage Users</Text>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.light.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.light.textLight}
        />
      </View>

      <View style={styles.filtersContainer}>
        <Text style={styles.filterLabel}>Role:</Text>
        <View style={styles.filterRow}>
          <FilterButton title="All" isSelected={selectedRole === 'all'} onPress={() => setSelectedRole('all')} />
          <FilterButton title="Admin" isSelected={selectedRole === 'admin'} onPress={() => setSelectedRole('admin')} />
          <FilterButton title="Instructor" isSelected={selectedRole === 'instructor'} onPress={() => setSelectedRole('instructor')} />
          <FilterButton title="Student" isSelected={selectedRole === 'student'} onPress={() => setSelectedRole('student')} />
        </View>
        
        <Text style={styles.filterLabel}>Status:</Text>
        <View style={styles.filterRow}>
          <FilterButton title="All" isSelected={selectedStatus === 'all'} onPress={() => setSelectedStatus('all')} />
          <FilterButton title="Active" isSelected={selectedStatus === 'active'} onPress={() => setSelectedStatus('active')} />
          <FilterButton title="Pending" isSelected={selectedStatus === 'pending'} onPress={() => setSelectedStatus('pending')} />
          <FilterButton title="Restricted" isSelected={selectedStatus === 'restricted'} onPress={() => setSelectedStatus('restricted')} />
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredUsers.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredUsers.filter(u => u.status === 'active').length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredUsers.filter(u => u.status === 'pending').length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredUsers.filter(u => u.status === 'restricted').length}</Text>
          <Text style={styles.statLabel}>Restricted</Text>
        </View>
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <UserCard user={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Users size={48} color={Colors.light.textLight} />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />

      {/* Edit User Modal */}
      <Modal
        visible={!!editingUser}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancelEdit}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCancelEdit} style={styles.modalCloseButton}>
              <X size={24} color={Colors.light.textLight} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit User</Text>
            <TouchableOpacity onPress={handleSaveEdit} style={styles.modalSaveButton}>
              <Save size={24} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.modalInput}
                value={editForm.name}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
                placeholder="Enter name"
                placeholderTextColor={Colors.light.textLight}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.modalInput}
                value={editForm.email}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
                placeholder="Enter email"
                placeholderTextColor={Colors.light.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.modalInput}
                value={editForm.phone}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, phone: text }))}
                placeholder="Enter phone number"
                placeholderTextColor={Colors.light.textLight}
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={editForm.password}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, password: text }))}
                  placeholder="Enter new password (leave empty to keep current)"
                  placeholderTextColor={Colors.light.textLight}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={Colors.light.textLight} />
                  ) : (
                    <Eye size={20} color={Colors.light.textLight} />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.passwordHint}>Password must start with a capital letter</Text>
            </View>
            
            {editingUser && (
              <View style={styles.userInfoCard}>
                <Text style={styles.userInfoTitle}>User Information</Text>
                <Text style={styles.userInfoText}>Role: {editingUser.role.toUpperCase()}</Text>
                <Text style={styles.userInfoText}>Status: {editingUser.status.toUpperCase()}</Text>
                <Text style={styles.userInfoText}>Created: {new Date(editingUser.createdAt).toLocaleDateString()}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.light.text,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
    marginTop: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterButtonText: {
    fontSize: 12,
    color: Colors.light.textLight,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textLight,
    marginTop: 4,
  },
  userCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.light.textLight,
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneText: {
    fontSize: 12,
    color: Colors.light.textLight,
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#3b82f6' + '15',
  },
  approveButton: {
    backgroundColor: '#10b981' + '15',
  },
  restrictButton: {
    backgroundColor: '#f59e0b' + '15',
  },
  activateButton: {
    backgroundColor: '#10b981' + '15',
  },
  deleteButton: {
    backgroundColor: '#ef4444' + '15',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.textLight,
    marginTop: 12,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.cardBackground,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  modalSaveButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  userInfoCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  userInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 12,
  },
  userInfoText: {
    fontSize: 14,
    color: Colors.light.textLight,
    marginBottom: 4,
  },
  passwordHint: {
    fontSize: 12,
    color: Colors.light.textLight,
    marginTop: 4,
    fontStyle: 'italic',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  passwordToggle: {
    padding: 12,
  },
});