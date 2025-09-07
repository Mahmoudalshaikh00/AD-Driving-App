import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, ActivityIndicator, TouchableOpacity, Alert, Platform } from 'react-native';
import { Plus, Search, Shield, AlertTriangle, CheckCircle, XCircle, Clock, User, ChevronLeft, LogOut } from 'lucide-react-native';
import { useTaskStore } from '@/hooks/useTaskStore';
import { useAuth } from '@/hooks/useAuthStore';
import TaskCard from '@/components/TaskCard';
import Colors from '@/constants/colors';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TasksScreen() {
  const { tasks, loading, addTask } = useTaskStore();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskSection, setNewTaskSection] = useState<1 | 2 | 3 | 4>(1);
  
  // Mock reports data for admin
  const [reports] = useState([
    {
      id: 'report-1',
      reported_user_id: 'trainer-1',
      reporter_id: 'student-1',
      reason: 'Inappropriate behavior',
      description: 'The trainer was unprofessional during the lesson and made inappropriate comments.',
      status: 'pending' as const,
      created_at: '2024-01-20T10:30:00Z',
      reportedUser: { name: 'John Smith', email: 'john@example.com', role: 'trainer' },
      reporter: { name: 'Alice Johnson', email: 'alice@example.com', role: 'student' }
    },
    {
      id: 'report-2',
      reported_user_id: 'student-2',
      reporter_id: 'trainer-2',
      reason: 'No-show',
      description: 'Student did not show up for scheduled lesson without notice.',
      status: 'reviewed' as const,
      created_at: '2024-01-18T14:15:00Z',
      resolved_at: '2024-01-19T09:00:00Z',
      resolution_notes: 'Contacted student, rescheduled lesson.',
      reportedUser: { name: 'Bob Wilson', email: 'bob@example.com', role: 'student' },
      reporter: { name: 'Sarah Johnson', email: 'sarah@example.com', role: 'trainer' }
    }
  ]);
  
  const handleReportAction = (reportId: string, action: 'review' | 'resolve') => {
    // Mock implementation - in real app, this would call API
    console.log(`Report ${reportId} marked as ${action}`);
  };

  const filteredTasks = tasks.filter(task => 
    task.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }
  
  // Admin Reports View
  if (user?.role === 'admin') {
    const ReportCard = ({ report }: { report: any }) => {
      const getStatusColor = () => {
        switch (report.status) {
          case 'pending': return '#f59e0b';
          case 'reviewed': return '#3b82f6';
          case 'resolved': return '#10b981';
          default: return Colors.light.textLight;
        }
      };
      
      const getStatusIcon = () => {
        switch (report.status) {
          case 'pending': return <Clock size={16} color={getStatusColor()} />;
          case 'reviewed': return <AlertTriangle size={16} color={getStatusColor()} />;
          case 'resolved': return <CheckCircle size={16} color={getStatusColor()} />;
          default: return <XCircle size={16} color={getStatusColor()} />;
        }
      };
      
      return (
        <View style={styles.reportCard}>
          <View style={styles.reportHeader}>
            <View style={styles.reportInfo}>
              <Text style={styles.reportReason}>{report.reason}</Text>
              <Text style={styles.reportDate}>
                {new Date(report.created_at).toLocaleDateString()}
              </Text>
            </View>
            <View style={[styles.reportStatusBadge, { backgroundColor: getStatusColor() + '15' }]}>
              {getStatusIcon()}
              <Text style={[styles.reportStatusText, { color: getStatusColor() }]}>
                {report.status.toUpperCase()}
              </Text>
            </View>
          </View>
          
          <Text style={styles.reportDescription} numberOfLines={2}>
            {report.description}
          </Text>
          
          <View style={styles.reportUsers}>
            <View style={styles.reportUser}>
              <Text style={styles.reportUserLabel}>Reported:</Text>
              <Text style={styles.reportUserName}>
                {report.reportedUser.name} ({report.reportedUser.role})
              </Text>
            </View>
            <View style={styles.reportUser}>
              <Text style={styles.reportUserLabel}>Reporter:</Text>
              <Text style={styles.reportUserName}>
                {report.reporter.name} ({report.reporter.role})
              </Text>
            </View>
          </View>
          
          {report.status === 'pending' && (
            <View style={styles.reportActions}>
              <TouchableOpacity
                style={[styles.reportActionButton, styles.reviewButton]}
                onPress={() => handleReportAction(report.id, 'review')}
              >
                <AlertTriangle size={16} color="#fff" />
                <Text style={styles.reportActionText}>Review</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reportActionButton, styles.resolveButton]}
                onPress={() => handleReportAction(report.id, 'resolve')}
              >
                <CheckCircle size={16} color="#fff" />
                <Text style={styles.reportActionText}>Resolve</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {report.resolution_notes && (
            <View style={styles.resolutionContainer}>
              <Text style={styles.resolutionTitle}>Resolution Notes:</Text>
              <Text style={styles.resolutionText}>{report.resolution_notes}</Text>
            </View>
          )}
        </View>
      );
    };
    
    return (
      <View style={styles.container}>
        <View style={[styles.topHeader, { paddingTop: Math.max(10, insets.top + 6) }]} testID="admin-reports-header">
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} testID="admin-reports-back" accessibilityLabel="Back">
            <ChevronLeft size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>User Reports</Text>
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutHeaderBtn}
            testID="logout-button"
          >
            <LogOut size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.adminHeader}>
          <View style={styles.adminHeaderInfo}>
            <View style={styles.adminIcon}>
              <Shield size={24} color={Colors.light.primary} />
            </View>
            <View>
              <Text style={styles.adminTitle}>User Reports</Text>
              <Text style={styles.adminSubtitle}>Monitor and manage user reports</Text>
            </View>
          </View>
        </View>
        
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ReportCard report={item} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <AlertTriangle size={64} color={Colors.light.textLight} />
              <Text style={styles.emptyText}>No reports found</Text>
              <Text style={styles.emptySubtext}>All user reports will appear here</Text>
            </View>
          }
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.topHeader, { paddingTop: Math.max(10, insets.top + 6) }]} testID="tasks-header">
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} testID="tasks-back" accessibilityLabel="Back">
          <ChevronLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tasks</Text>
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
          placeholder="Search tasks..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.light.textLight}
        />
      </View>

      {isAddingTask ? (
        <View style={styles.addTaskForm}>
          <TextInput
            style={styles.input}
            placeholder="Task Name"
            value={newTaskName}
            onChangeText={setNewTaskName}
            placeholderTextColor={Colors.light.textLight}
            autoFocus
          />
          
          <Text style={styles.sectionLabel}>Select Section:</Text>
          <View style={styles.sectionSelector}>
            {[1, 2, 3, 4].map((section) => (
              <TouchableOpacity
                key={section}
                style={[
                  styles.sectionOption,
                  newTaskSection === section && styles.sectionOptionActive
                ]}
                onPress={() => setNewTaskSection(section as 1 | 2 | 3 | 4)}
              >
                <Text style={[
                  styles.sectionOptionText,
                  newTaskSection === section && styles.sectionOptionTextActive
                ]}>
                  {section}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={() => setIsAddingTask(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.saveButton]} 
              onPress={handleAddTask}
            >
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setIsAddingTask(true)}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Task</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TaskCard task={item} showActions={true} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tasks found</Text>
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
  // Admin styles
  adminHeader: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  adminHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adminIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  adminSubtitle: {
    fontSize: 14,
    color: Colors.light.textLight,
    marginTop: 2,
  },
  reportCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reportInfo: {
    flex: 1,
  },
  reportReason: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  reportDate: {
    fontSize: 12,
    color: Colors.light.textLight,
    marginTop: 2,
  },
  reportStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  reportStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  reportDescription: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  reportUsers: {
    gap: 6,
    marginBottom: 12,
  },
  reportUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportUserLabel: {
    fontSize: 12,
    color: Colors.light.textLight,
    fontWeight: '600',
    width: 70,
  },
  reportUserName: {
    fontSize: 12,
    color: Colors.light.text,
    flex: 1,
  },
  reportActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  reportActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  reviewButton: {
    backgroundColor: '#3b82f6',
  },
  resolveButton: {
    backgroundColor: '#10b981',
  },
  reportActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  resolutionContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  resolutionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  resolutionText: {
    fontSize: 12,
    color: Colors.light.textLight,
    lineHeight: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.textLight,
    textAlign: 'center',
    marginTop: 8,
  },
});