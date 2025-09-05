import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, TextInput, ActivityIndicator, Switch } from 'react-native';
import { Users, Search, Plus, Edit3, Trash2, Shield, User, Mail, Phone, Calendar, CheckCircle, XCircle, AlertTriangle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useStudentStore } from '@/hooks/useStudentStore';
import Colors from '@/constants/colors';

type UserRole = 'admin' | 'instructor' | 'student';
type UserStatus = 'active' | 'restricted' | 'pending';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastActive?: string;
  phone?: string;
}

export default function AdminUsersScreen() {
  const router = useRouter();
  const { students } = useStudentStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // Mock users data - in real app, fetch from API
    const mockUsers: User[] = [
      {
        id: '1',
        name: 'Admin User',
        email: 'mahmoud200276@gmail.com',
        role: 'admin',
        status: 'active',
        createdAt: '2024-01-15',
        lastActive: '2024-01-20',
      },
      {
        id: '2',
        name: 'John Smith',
        email: 'john.smith@example.com',
        role: 'instructor',
        status: 'active',
        createdAt: '2024-01-10',
        lastActive: '2024-01-19',
        phone: '+1234567890',
      },
      {
        id: '3',
        name: 'Sarah Johnson',
        email: 'sarah.j@example.com',
        role: 'instructor',
        status: 'pending',
        createdAt: '2024-01-18',
        phone: '+1234567891',
      },
      {
        id: '4',
        name: 'Mike Wilson',
        email: 'mike.w@example.com',
        role: 'instructor',
        status: 'restricted',
        createdAt: '2024-01-05',
        lastActive: '2024-01-15',
        phone: '+1234567892',
      },
      ...students.map(student => ({
        id: student.id,
        name: student.name,
        email: student.email,
        role: 'student' as UserRole,
        status: 'active' as UserStatus,
        createdAt: '2024-01-01',
        lastActive: '2024-01-19',
      }))
    ];
    setUsers(mockUsers);
  }, [students]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleUserAction = (userId: string, action: 'edit' | 'delete' | 'approve' | 'restrict' | 'activate') => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    switch (action) {
      case 'edit':
        Alert.alert('Edit User', `Edit ${user.name}?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Edit', onPress: () => console.log('Edit user:', userId) }
        ]);
        break;
      case 'delete':
        Alert.alert('Delete User', `Delete ${user.name}? This action cannot be undone.`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => {
            setUsers(prev => prev.filter(u => u.id !== userId));
          }}
        ]);
        break;
      case 'approve':
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'active' } : u));
        Alert.alert('Success', `${user.name} has been approved.`);
        break;
      case 'restrict':
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'restricted' } : u));
        Alert.alert('Success', `${user.name} has been restricted.`);
        break;
      case 'activate':
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'active' } : u));
        Alert.alert('Success', `${user.name} has been activated.`);
        break;
    }
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

  const UserCard = ({ user }: { user: User }) => (
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
    <View style={styles.container}>
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
});