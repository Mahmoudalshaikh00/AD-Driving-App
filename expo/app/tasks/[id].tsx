import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTaskStore } from '@/hooks/useTaskStore';
import { useAuth } from '@/hooks/useAuthStore';
import Colors from '@/constants/colors';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react-native';

export default function TaskDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTaskById, getSubtasksByTaskId, loading, addSubtask, updateSubtask, deleteSubtask } = useTaskStore();
  const { user } = useAuth();
  
  const [isAddingSubTask, setIsAddingSubTask] = useState(false);
  const [newSubTaskName, setNewSubTaskName] = useState('');
  const [editingSubTaskId, setEditingSubTaskId] = useState<string | null>(null);
  const [editSubTaskName, setEditSubTaskName] = useState('');
  
  const task = getTaskById(id);
  const subTasks = getSubtasksByTaskId(id);
  
  // Check if current user can edit this task
  const canEdit = user && (
    user.role === 'admin' || 
    (user.role === 'instructor' && task?.instructor_id === user.id)
  );

  const handleAddSubTask = () => {
    if (newSubTaskName.trim()) {
      addSubtask({
        name: newSubTaskName.trim(),
        taskId: id,
      });
      setNewSubTaskName('');
      setIsAddingSubTask(false);
    }
  };

  const handleEditSubTask = (subTaskId: string, currentName: string) => {
    setEditingSubTaskId(subTaskId);
    setEditSubTaskName(currentName);
  };

  const handleSaveSubTask = (subTaskId: string) => {
    if (editSubTaskName.trim()) {
      const subTask = subTasks.find(s => s.id === subTaskId);
      if (subTask) {
        updateSubtask({
          ...subTask,
          name: editSubTaskName.trim(),
        });
      }
      setEditingSubTaskId(null);
      setEditSubTaskName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingSubTaskId(null);
    setEditSubTaskName('');
  };

  const handleDeleteSubTask = (subTaskId: string, subTaskName: string) => {
    Alert.alert(
      'Delete SubTask',
      `Are you sure you want to delete "${subTaskName}"? This will also delete all related evaluations.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteSubtask(subTaskId),
        },
      ]
    );
  };

  if (!task) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Task not found</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.taskInfoCard}>
        <Text style={styles.taskName}>{task.name}</Text>
        <Text style={styles.subTaskCount}>
          {subTasks.length} {subTasks.length === 1 ? 'SubTask' : 'SubTasks'}
        </Text>
      </View>

      {canEdit && (
        isAddingSubTask ? (
          <View style={styles.addSubTaskForm}>
            <TextInput
              style={styles.input}
              placeholder="SubTask Name"
              value={newSubTaskName}
              onChangeText={setNewSubTaskName}
              placeholderTextColor={Colors.light.textLight}
              autoFocus
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={() => setIsAddingSubTask(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]} 
                onPress={handleAddSubTask}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setIsAddingSubTask(true)}
          >
            <Plus size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add SubTask</Text>
          </TouchableOpacity>
        )
      )}

      <Text style={styles.sectionTitle}>SubTasks</Text>
      
      <FlatList
        data={subTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isEditing = editingSubTaskId === item.id;
          
          if (isEditing) {
            return (
              <View style={styles.subTaskItem}>
                <View style={styles.subTaskContent}>
                  <TextInput
                    style={styles.editInput}
                    value={editSubTaskName}
                    onChangeText={setEditSubTaskName}
                    placeholder="SubTask Name"
                    placeholderTextColor={Colors.light.textLight}
                    autoFocus
                  />
                </View>
                <View style={styles.actionContainer}>
                  <TouchableOpacity 
                    style={styles.actionButton} 
                    onPress={() => handleSaveSubTask(item.id)}
                  >
                    <Save size={18} color={Colors.light.secondary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton} 
                    onPress={handleCancelEdit}
                  >
                    <X size={18} color={Colors.light.textLight} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }
          
          return (
            <View style={styles.subTaskItem}>
              <View style={styles.subTaskContent}>
                <Text style={styles.subTaskName}>{item.name}</Text>
              </View>
              {canEdit && (
                <View style={styles.actionContainer}>
                  <TouchableOpacity 
                    style={styles.actionButton} 
                    onPress={() => handleEditSubTask(item.id, item.name)}
                  >
                    <Edit2 size={18} color={Colors.light.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton} 
                    onPress={() => handleDeleteSubTask(item.id, item.name)}
                  >
                    <Trash2 size={18} color={Colors.light.danger} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No SubTasks available</Text>
            <Text style={styles.emptySubtext}>
              Add SubTasks to evaluate students on this task
            </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  errorText: {
    fontSize: 18,
    color: Colors.light.danger,
  },
  taskInfoCard: {
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
  taskName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  subTaskCount: {
    fontSize: 16,
    color: Colors.light.textLight,
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
  addSubTaskForm: {
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.light.text,
  },
  subTaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  subTaskContent: {
    flex: 1,
  },
  subTaskName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
  },
  editInput: {
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
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
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textLight,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.textLight,
    textAlign: 'center',
  },
});