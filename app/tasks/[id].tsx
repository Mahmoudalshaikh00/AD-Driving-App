import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTaskStore } from '@/hooks/useTaskStore';
import Colors from '@/constants/colors';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react-native';

export default function TaskDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTaskById, getSubtasksByTaskId, loading, addSubtask, updateSubtask, deleteSubtask } = useTaskStore();
  
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editSubtaskName, setEditSubtaskName] = useState('');
  
  const task = getTaskById(id);
  const subtasks = getSubtasksByTaskId(id);

  const handleAddSubtask = () => {
    if (newSubtaskName.trim()) {
      addSubtask({
        name: newSubtaskName.trim(),
        taskId: id,
      });
      setNewSubtaskName('');
      setIsAddingSubtask(false);
    }
  };

  const handleEditSubtask = (subtaskId: string, currentName: string) => {
    setEditingSubtaskId(subtaskId);
    setEditSubtaskName(currentName);
  };

  const handleSaveSubtask = (subtaskId: string) => {
    if (editSubtaskName.trim()) {
      const subtask = subtasks.find(s => s.id === subtaskId);
      if (subtask) {
        updateSubtask({
          ...subtask,
          name: editSubtaskName.trim(),
        });
      }
      setEditingSubtaskId(null);
      setEditSubtaskName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingSubtaskId(null);
    setEditSubtaskName('');
  };

  const handleDeleteSubtask = (subtaskId: string, subtaskName: string) => {
    Alert.alert(
      'Delete Subtask',
      `Are you sure you want to delete "${subtaskName}"? This will also delete all related evaluations.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteSubtask(subtaskId),
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
        <Text style={styles.subtaskCount}>
          {subtasks.length} {subtasks.length === 1 ? 'subtask' : 'subtasks'}
        </Text>
      </View>

      {isAddingSubtask ? (
        <View style={styles.addSubtaskForm}>
          <TextInput
            style={styles.input}
            placeholder="Subtask Name"
            value={newSubtaskName}
            onChangeText={setNewSubtaskName}
            placeholderTextColor={Colors.light.textLight}
            autoFocus
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={() => setIsAddingSubtask(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.saveButton]} 
              onPress={handleAddSubtask}
            >
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setIsAddingSubtask(true)}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Subtask</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.sectionTitle}>Subtasks</Text>
      
      <FlatList
        data={subtasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isEditing = editingSubtaskId === item.id;
          
          if (isEditing) {
            return (
              <View style={styles.subtaskItem}>
                <View style={styles.subtaskContent}>
                  <TextInput
                    style={styles.editInput}
                    value={editSubtaskName}
                    onChangeText={setEditSubtaskName}
                    placeholder="Subtask Name"
                    placeholderTextColor={Colors.light.textLight}
                    autoFocus
                  />
                </View>
                <View style={styles.actionContainer}>
                  <TouchableOpacity 
                    style={styles.actionButton} 
                    onPress={() => handleSaveSubtask(item.id)}
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
            <View style={styles.subtaskItem}>
              <View style={styles.subtaskContent}>
                <Text style={styles.subtaskName}>{item.name}</Text>
              </View>
              <View style={styles.actionContainer}>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => handleEditSubtask(item.id, item.name)}
                >
                  <Edit2 size={18} color={Colors.light.primary} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => handleDeleteSubtask(item.id, item.name)}
                >
                  <Trash2 size={18} color={Colors.light.danger} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No subtasks available</Text>
            <Text style={styles.emptySubtext}>
              Add subtasks to evaluate students on this task
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
  subtaskCount: {
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
  addSubtaskForm: {
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
  subtaskItem: {
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
  subtaskContent: {
    flex: 1,
  },
  subtaskName: {
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