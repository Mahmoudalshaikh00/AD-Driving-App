import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, ActivityIndicator, TouchableOpacity, Alert, Platform } from 'react-native';
import { Plus, Search, Shield, AlertTriangle, CheckCircle, XCircle, Clock, User, ChevronLeft, LogOut, Users, Phone, Edit3, Trash2 } from 'lucide-react-native';
import { useTaskStore } from '@/hooks/useTaskStore';
import { useAuth } from '@/hooks/useAuthStore';
import { useStudentStore } from '@/hooks/useStudentStore';
import TaskCard from '@/components/TaskCard';
import Colors from '@/constants/colors';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

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

export default function TasksScreen() {
  const { tasks, loading, addTask } = useTaskStore();
  const { user, signOut } = useAuth();
  const { refreshStudents } = useStudentStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskSection, setNewTaskSection] = useState<1 | 2 | 3 | 4>(1);
  
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
    return matchesSearch && matchesRole;
  });

  const handleAddTask = () => {
    if (newTaskName.trim()) {
      addTask({
        name: newTaskName.trim(),
        capital: newTaskSection,
      });
      setNewTaskName('');
      setNewTaskSection(1);
      setIsAddingTask(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      (async () => {
        const res = await signOut();
        if (!res.success) {
          Alert.alert('Error', res.error || 'Failed to logout');
        }
      })();
      return;
    }
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            const res = await signOut();
            if (!res.success) {
              Alert.alert('Error', res.error || 'Failed to logout');
            }
          },
        },
      ]
    );
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.topHeader, { paddingTop: Math.max(10, insets.top + 6) }]} testID="users-header">
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} testID="users-back" accessibilityLabel="Back">
          <ChevronLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Users</Text>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutHeaderBtn}
          testID="logout-button"
        >
          <LogOut size={16} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.contentWrapper}>
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
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{filteredUsers.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{filteredUsers.filter(u => u.role === 'admin').length}</Text>
            <Text style={styles.statLabel}>Admin</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{filteredUsers.filter(u => u.role === 'instructor').length}</Text>
            <Text style={styles.statLabel}>Instructor</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{filteredUsers.filter(u => u.role === 'student').length}</Text>
            <Text style={styles.statLabel}>Student</Text>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  logoutHeaderBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrapper: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 50,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  addTaskForm: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: Colors.light.textLight,
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.textLight,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 8,
  },
  sectionSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  sectionOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    borderWidth: 2,
    borderColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionOptionActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  sectionOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textLight,
  },
  sectionOptionTextActive: {
    color: '#fff',
  },
  // User card styles
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
});