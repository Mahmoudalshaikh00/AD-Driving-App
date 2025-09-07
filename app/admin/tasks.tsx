import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { Plus, Edit3, Trash2, Eye, EyeOff, ChevronLeft, LogOut, Settings, Users, Save, X } from 'lucide-react-native';
import { useTaskStore } from '@/hooks/useTaskStore';
import { useAuth } from '@/hooks/useAuthStore';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { Task, Subtask } from '@/types';

interface AdminTask extends Task {
  createdBy: 'admin' | 'instructor';
  createdByName?: string;
  createdAt: string;
  isHidden?: boolean;
}

interface AdminSubtask extends Subtask {
  createdBy: 'admin' | 'instructor';
  createdByName?: string;
  createdAt: string;
  isHidden?: boolean;
}

export default function AdminTasksScreen() {
  const { tasks, subtasks, loading, addTask, updateTask, deleteTask, addSubtask, updateSubtask, deleteSubtask } = useTaskStore();
  const { signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [adminTasks, setAdminTasks] = useState<AdminTask[]>([]);
  const [adminSubtasks, setAdminSubtasks] = useState<AdminSubtask[]>([]);
  const [instructorTasks, setInstructorTasks] = useState<AdminTask[]>([]);
  const [instructorSubtasks, setInstructorSubtasks] = useState<AdminSubtask[]>([]);
  
  const [selectedTab, setSelectedTab] = useState<'admin' | 'instructor'>('admin');
  const [editingTask, setEditingTask] = useState<AdminTask | null>(null);
  const [editingSubtask, setEditingSubtask] = useState<AdminSubtask | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  
  const [taskForm, setTaskForm] = useState({ name: '', section: 1 as 1 | 2 | 3 | 4 });
  const [subtaskForm, setSubtaskForm] = useState({ name: '', taskId: '' });



  // Initialize admin and instructor tasks/subtasks
  useEffect(() => {
    if (!loading) {
      // Convert existing tasks to admin tasks (assuming they're admin-created)
      const adminTasksData: AdminTask[] = tasks.map(task => ({
        ...task,
        createdBy: 'admin' as const,
        createdByName: 'System Administrator',
        createdAt: new Date().toISOString(),
        isHidden: false
      }));
      
      const adminSubtasksData: AdminSubtask[] = subtasks.map(subtask => ({
        ...subtask,
        createdBy: 'admin' as const,
        createdByName: 'System Administrator',
        createdAt: new Date().toISOString(),
        isHidden: false
      }));
      
      // Mock instructor-created tasks for demonstration
      const instructorTasksData: AdminTask[] = [
        {
          id: 'inst-task-1',
          name: 'Advanced Parking Techniques',
          capital: 4,
          createdBy: 'instructor',
          createdByName: 'John Smith',
          createdAt: '2024-01-15T10:30:00Z',
          isHidden: false
        },
        {
          id: 'inst-task-2',
          name: 'Highway Merging',
          capital: 2,
          createdBy: 'instructor',
          createdByName: 'Sarah Johnson',
          createdAt: '2024-01-18T14:20:00Z',
          isHidden: false
        }
      ];
      
      const instructorSubtasksData: AdminSubtask[] = [
        {
          id: 'inst-subtask-1',
          name: 'Check Mirrors',
          taskId: 'inst-task-1',
          createdBy: 'instructor',
          createdByName: 'John Smith',
          createdAt: '2024-01-15T10:35:00Z',
          isHidden: false
        },
        {
          id: 'inst-subtask-2',
          name: 'Signal Early',
          taskId: 'inst-task-2',
          createdBy: 'instructor',
          createdByName: 'Sarah Johnson',
          createdAt: '2024-01-18T14:25:00Z',
          isHidden: false
        }
      ];
      
      setAdminTasks(adminTasksData);
      setAdminSubtasks(adminSubtasksData);
      setInstructorTasks(instructorTasksData);
      setInstructorSubtasks(instructorSubtasksData);
    }
  }, [tasks, subtasks, loading]);

  const handleAddTask = async () => {
    if (taskForm.name.trim()) {
      const newTask = await addTask({
        name: taskForm.name.trim(),
        capital: taskForm.section,
      });
      
      const adminTask: AdminTask = {
        ...newTask,
        createdBy: 'admin',
        createdByName: 'System Administrator',
        createdAt: new Date().toISOString(),
        isHidden: false
      };
      
      setAdminTasks(prev => [...prev, adminTask]);
      setTaskForm({ name: '', section: 1 });
      setIsAddingTask(false);
      Alert.alert('Success', 'Task added successfully. This change will be visible to all Instructors.');
    }
  };

  const handleEditTask = async (task: AdminTask) => {
    if (task.createdBy === 'instructor') {
      Alert.alert('Cannot Edit', 'You cannot edit Tasks created by Instructors.');
      return;
    }
    
    if (taskForm.name.trim()) {
      const updatedTask = {
        ...task,
        name: taskForm.name.trim(),
        capital: taskForm.section,
      };
      
      await updateTask(updatedTask);
      setAdminTasks(prev => prev.map(t => t.id === task.id ? { ...updatedTask, createdBy: task.createdBy, createdByName: task.createdByName, createdAt: task.createdAt, isHidden: task.isHidden } : t));
      setEditingTask(null);
      setTaskForm({ name: '', section: 1 });
      Alert.alert('Success', 'Task updated successfully. This change will be visible to all Instructors.');
    }
  };

  const handleDeleteTask = async (task: AdminTask) => {
    if (task.createdBy === 'instructor') {
      Alert.alert('Cannot Delete', 'You cannot delete Tasks created by Instructors.');
      return;
    }
    
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${task.name}"? This will also delete all associated SubTasks and cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTask(task.id);
            setAdminTasks(prev => prev.filter(t => t.id !== task.id));
            setAdminSubtasks(prev => prev.filter(s => s.taskId !== task.id));
            Alert.alert('Success', 'Task deleted successfully. This change will be visible to all Instructors.');
          }
        }
      ]
    );
  };

  const handleToggleTaskVisibility = (task: AdminTask) => {
    if (task.createdBy === 'instructor') {
      Alert.alert('Cannot Hide', 'You cannot hide Tasks created by Instructors.');
      return;
    }
    
    const updatedTask = { ...task, isHidden: !task.isHidden };
    setAdminTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
    Alert.alert('Success', `Task ${updatedTask.isHidden ? 'hidden' : 'shown'} successfully.`);
  };

  const handleAddSubtask = async () => {
    if (subtaskForm.name.trim() && subtaskForm.taskId) {
      const newSubtask = await addSubtask({
        name: subtaskForm.name.trim(),
        taskId: subtaskForm.taskId,
      });
      
      const adminSubtask: AdminSubtask = {
        ...newSubtask,
        createdBy: 'admin',
        createdByName: 'System Administrator',
        createdAt: new Date().toISOString(),
        isHidden: false
      };
      
      setAdminSubtasks(prev => [...prev, adminSubtask]);
      setSubtaskForm({ name: '', taskId: '' });
      setIsAddingSubtask(false);

      Alert.alert('Success', 'SubTask added successfully. This change will be visible to all Instructors.');
    }
  };

  const handleEditSubtask = async (subtask: AdminSubtask) => {
    if (subtask.createdBy === 'instructor') {
      Alert.alert('Cannot Edit', 'You cannot edit SubTasks created by Instructors.');
      return;
    }
    
    if (subtaskForm.name.trim()) {
      const updatedSubtask = {
        ...subtask,
        name: subtaskForm.name.trim(),
      };
      
      await updateSubtask(updatedSubtask);
      setAdminSubtasks(prev => prev.map(s => s.id === subtask.id ? { ...updatedSubtask, createdBy: subtask.createdBy, createdByName: subtask.createdByName, createdAt: subtask.createdAt, isHidden: subtask.isHidden } : s));
      setEditingSubtask(null);
      setSubtaskForm({ name: '', taskId: '' });
      Alert.alert('Success', 'SubTask updated successfully. This change will be visible to all Instructors.');
    }
  };

  const handleDeleteSubtask = async (subtask: AdminSubtask) => {
    if (subtask.createdBy === 'instructor') {
      Alert.alert('Cannot Delete', 'You cannot delete SubTasks created by Instructors.');
      return;
    }
    
    Alert.alert(
      'Delete SubTask',
      `Are you sure you want to delete "${subtask.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteSubtask(subtask.id);
            setAdminSubtasks(prev => prev.filter(s => s.id !== subtask.id));
            Alert.alert('Success', 'SubTask deleted successfully. This change will be visible to all Instructors.');
          }
        }
      ]
    );
  };

  const handleToggleSubtaskVisibility = (subtask: AdminSubtask) => {
    if (subtask.createdBy === 'instructor') {
      Alert.alert('Cannot Hide', 'You cannot hide SubTasks created by Instructors.');
      return;
    }
    
    const updatedSubtask = { ...subtask, isHidden: !subtask.isHidden };
    setAdminSubtasks(prev => prev.map(s => s.id === subtask.id ? updatedSubtask : s));
    Alert.alert('Success', `SubTask ${updatedSubtask.isHidden ? 'hidden' : 'shown'} successfully.`);
  };

  const getSectionName = (section: number) => {
    switch (section) {
      case 1: return 'Section 1';
      case 2: return 'Section 2';
      case 3: return 'Section 3';
      case 4: return 'Section 4';
      default: return `Section ${section}`;
    }
  };

  const getSectionColor = (section: number) => {
    switch (section) {
      case 1: return '#3b82f6';
      case 2: return '#10b981';
      case 3: return '#f59e0b';
      case 4: return '#ef4444';
      default: return Colors.light.textLight;
    }
  };

  const currentTasks = selectedTab === 'admin' ? adminTasks : instructorTasks;
  const currentSubtasks = selectedTab === 'admin' ? adminSubtasks : instructorSubtasks;

  const TaskCard = ({ task }: { task: AdminTask }) => {
    const taskSubtasks = currentSubtasks.filter(s => s.taskId === task.id);
    
    return (
      <View style={styles.taskCard}>
        <View style={styles.taskHeader}>
          <View style={styles.taskInfo}>
            <Text style={styles.taskName}>{task.name}</Text>
            <View style={styles.taskMeta}>
              <View style={[styles.sectionBadge, { backgroundColor: getSectionColor(task.capital) }]}>
                <Text style={styles.sectionBadgeText}>{getSectionName(task.capital)}</Text>
              </View>
              {task.isHidden && (
                <View style={styles.hiddenBadge}>
                  <Text style={styles.hiddenBadgeText}>Hidden</Text>
                </View>
              )}
            </View>
            <Text style={styles.createdBy}>
              Created by {task.createdByName} • {new Date(task.createdAt).toLocaleDateString()}
            </Text>
          </View>
          
          {selectedTab === 'admin' && task.createdBy === 'admin' && (
            <View style={styles.taskActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setEditingTask(task);
                  setTaskForm({ name: task.name, section: task.capital });
                }}
              >
                <Edit3 size={16} color={Colors.light.primary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleToggleTaskVisibility(task)}
              >
                {task.isHidden ? (
                  <Eye size={16} color="#10b981" />
                ) : (
                  <EyeOff size={16} color="#f59e0b" />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteTask(task)}
              >
                <Trash2 size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {taskSubtasks.length > 0 && (
          <View style={styles.subtasksContainer}>
            <Text style={styles.subtasksTitle}>SubTasks ({taskSubtasks.length})</Text>
            {taskSubtasks.map(subtask => (
              <View key={subtask.id} style={styles.subtaskItem}>
                <View style={styles.subtaskInfo}>
                  <Text style={[styles.subtaskName, subtask.isHidden && styles.hiddenText]}>
                    {subtask.name}
                  </Text>
                  {subtask.isHidden && (
                    <Text style={styles.hiddenLabel}>Hidden</Text>
                  )}
                  <Text style={styles.subtaskCreatedBy}>
                    Created by {subtask.createdByName}
                  </Text>
                </View>
                
                {selectedTab === 'admin' && subtask.createdBy === 'admin' && (
                  <View style={styles.subtaskActions}>
                    <TouchableOpacity
                      style={styles.smallActionButton}
                      onPress={() => {
                        setEditingSubtask(subtask);
                        setSubtaskForm({ name: subtask.name, taskId: subtask.taskId });
                      }}
                    >
                      <Edit3 size={12} color={Colors.light.primary} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.smallActionButton}
                      onPress={() => handleToggleSubtaskVisibility(subtask)}
                    >
                      {subtask.isHidden ? (
                        <Eye size={12} color="#10b981" />
                      ) : (
                        <EyeOff size={12} color="#f59e0b" />
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.smallActionButton}
                      onPress={() => handleDeleteSubtask(subtask)}
                    >
                      <Trash2 size={12} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
            
            {selectedTab === 'admin' && (
              <TouchableOpacity
                style={styles.addSubtaskButton}
                onPress={() => {
                  setSubtaskForm({ name: '', taskId: task.id });
                  setIsAddingSubtask(true);
                }}
              >
                <Plus size={14} color={Colors.light.primary} />
                <Text style={styles.addSubtaskText}>Add SubTask</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(10, insets.top + 6) }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Tasks</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <LogOut size={16} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'admin' && styles.activeTab]}
            onPress={() => setSelectedTab('admin')}
          >
            <Settings size={16} color={selectedTab === 'admin' ? '#fff' : Colors.light.textLight} />
            <Text style={[styles.tabText, selectedTab === 'admin' && styles.activeTabText]}>
              Admin Data
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'instructor' && styles.activeTab]}
            onPress={() => setSelectedTab('instructor')}
          >
            <Users size={16} color={selectedTab === 'instructor' ? '#fff' : Colors.light.textLight} />
            <Text style={[styles.tabText, selectedTab === 'instructor' && styles.activeTabText]}>
              Instructor Contributions
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{currentTasks.length}</Text>
            <Text style={styles.statLabel}>Tasks</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{currentSubtasks.length}</Text>
            <Text style={styles.statLabel}>SubTasks</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{currentTasks.filter(t => t.isHidden).length}</Text>
            <Text style={styles.statLabel}>Hidden</Text>
          </View>
        </View>
        
        {selectedTab === 'admin' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsAddingTask(true)}
          >
            <Plus size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add New Task</Text>
          </TouchableOpacity>
        )}
        
        <FlatList
          data={currentTasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TaskCard task={item} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {selectedTab === 'admin' ? 'No admin Tasks found' : 'No instructor contributions found'}
              </Text>
            </View>
          }
        />
      </View>
      
      {/* Add Task Modal */}
      <Modal
        visible={isAddingTask}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsAddingTask(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsAddingTask(false)}>
              <X size={24} color={Colors.light.textLight} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Task</Text>
            <TouchableOpacity onPress={handleAddTask}>
              <Save size={24} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Task Name</Text>
            <TextInput
              style={styles.input}
              value={taskForm.name}
              onChangeText={(text) => setTaskForm(prev => ({ ...prev, name: text }))}
              placeholder="Enter Task name"
              placeholderTextColor={Colors.light.textLight}
            />
            
            <Text style={styles.inputLabel}>Section</Text>
            <View style={styles.sectionSelector}>
              {[1, 2, 3, 4].map(section => (
                <TouchableOpacity
                  key={section}
                  style={[
                    styles.sectionOption,
                    taskForm.section === section && styles.sectionOptionActive
                  ]}
                  onPress={() => setTaskForm(prev => ({ ...prev, section: section as 1 | 2 | 3 | 4 }))}
                >
                  <Text style={[
                    styles.sectionOptionText,
                    taskForm.section === section && styles.sectionOptionTextActive
                  ]}>
                    {section}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Edit Task Modal */}
      <Modal
        visible={!!editingTask}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditingTask(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditingTask(null)}>
              <X size={24} color={Colors.light.textLight} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Task</Text>
            <TouchableOpacity onPress={() => editingTask && handleEditTask(editingTask)}>
              <Save size={24} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Task Name</Text>
            <TextInput
              style={styles.input}
              value={taskForm.name}
              onChangeText={(text) => setTaskForm(prev => ({ ...prev, name: text }))}
              placeholder="Enter Task name"
              placeholderTextColor={Colors.light.textLight}
            />
            
            <Text style={styles.inputLabel}>Section</Text>
            <View style={styles.sectionSelector}>
              {[1, 2, 3, 4].map(section => (
                <TouchableOpacity
                  key={section}
                  style={[
                    styles.sectionOption,
                    taskForm.section === section && styles.sectionOptionActive
                  ]}
                  onPress={() => setTaskForm(prev => ({ ...prev, section: section as 1 | 2 | 3 | 4 }))}
                >
                  <Text style={[
                    styles.sectionOptionText,
                    taskForm.section === section && styles.sectionOptionTextActive
                  ]}>
                    {section}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Add SubTask Modal */}
      <Modal
        visible={isAddingSubtask}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsAddingSubtask(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsAddingSubtask(false)}>
              <X size={24} color={Colors.light.textLight} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New SubTask</Text>
            <TouchableOpacity onPress={handleAddSubtask}>
              <Save size={24} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>SubTask Name</Text>
            <TextInput
              style={styles.input}
              value={subtaskForm.name}
              onChangeText={(text) => setSubtaskForm(prev => ({ ...prev, name: text }))}
              placeholder="Enter SubTask name"
              placeholderTextColor={Colors.light.textLight}
            />
          </View>
        </View>
      </Modal>
      
      {/* Edit SubTask Modal */}
      <Modal
        visible={!!editingSubtask}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditingSubtask(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditingSubtask(null)}>
              <X size={24} color={Colors.light.textLight} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit SubTask</Text>
            <TouchableOpacity onPress={() => editingSubtask && handleEditSubtask(editingSubtask)}>
              <Save size={24} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>SubTask Name</Text>
            <TextInput
              style={styles.input}
              value={subtaskForm.name}
              onChangeText={(text) => setSubtaskForm(prev => ({ ...prev, name: text }))}
              placeholder="Enter SubTask name"
              placeholderTextColor={Colors.light.textLight}
            />
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
  },
  header: {
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
  backButton: {
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
  logoutButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: Colors.light.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textLight,
  },
  activeTabText: {
    color: '#fff',
  },
  statsContainer: {
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 8,
  },
  addButtonText: {
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
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.textLight,
    textAlign: 'center',
  },
  taskCard: {
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
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  hiddenBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hiddenBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  createdBy: {
    fontSize: 12,
    color: Colors.light.textLight,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtasksContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 12,
  },
  subtasksTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtaskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    marginBottom: 4,
  },
  subtaskInfo: {
    flex: 1,
  },
  subtaskName: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 2,
  },
  hiddenText: {
    opacity: 0.5,
    textDecorationLine: 'line-through',
  },
  hiddenLabel: {
    fontSize: 10,
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  subtaskCreatedBy: {
    fontSize: 10,
    color: Colors.light.textLight,
  },
  subtaskActions: {
    flexDirection: 'row',
    gap: 4,
  },
  smallActionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSubtaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    borderStyle: 'dashed',
    marginTop: 4,
    gap: 4,
  },
  addSubtaskText: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '600',
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
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 16,
  },
  sectionSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  sectionOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.light.cardBackground,
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
});