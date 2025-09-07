import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ClipboardList, Edit2, Trash2, Save, X } from 'lucide-react-native';
import { Task, User } from '@/types';
import Colors from '@/constants/colors';
import { useTaskStore } from '@/hooks/useTaskStore';

interface TaskCardProps {
  task: Task;
  studentId?: string;
  showActions?: boolean;
  currentUser?: User | null;
}

export default function TaskCard({ task, studentId, showActions = false, currentUser }: TaskCardProps) {
  const router = useRouter();
  const { updateTask, deleteTask } = useTaskStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(task.name);
  const [editSection, setEditSection] = useState<1 | 2 | 3 | 4>(task.capital);

  const handlePress = () => {
    if (!isEditing) {
      if (studentId) {
        router.push(`/evaluate/${studentId}/${task.id}`);
      } else {
        router.push(`/tasks/${task.id}`);
      }
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditName(task.name);
    setEditSection(task.capital);
  };

  const handleSave = () => {
    if (editName.trim()) {
      updateTask({
        ...task,
        name: editName.trim(),
        capital: editSection,
      });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditName(task.name);
    setEditSection(task.capital);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${task.name}"? This will also delete all its SubTasks and evaluations.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTask(task.id),
        },
      ]
    );
  };

  if (isEditing) {
    return (
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <ClipboardList size={24} color={Colors.light.primary} />
        </View>
        <View style={styles.infoContainer}>
          <TextInput
            style={styles.editInput}
            value={editName}
            onChangeText={setEditName}
            placeholder="Task Name"
            placeholderTextColor={Colors.light.textLight}
          />
          <View style={styles.sectionEditContainer}>
            <Text style={styles.sectionEditLabel}>Section:</Text>
            <View style={styles.sectionEditSelector}>
              {[1, 2, 3, 4].map((section) => (
                <TouchableOpacity
                  key={section}
                  style={[
                    styles.sectionEditOption,
                    editSection === section && styles.sectionEditOptionActive
                  ]}
                  onPress={() => setEditSection(section as 1 | 2 | 3 | 4)}
                >
                  <Text style={[
                    styles.sectionEditOptionText,
                    editSection === section && styles.sectionEditOptionTextActive
                  ]}>
                    {section}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
            <Save size={18} color={Colors.light.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleCancel}>
            <X size={18} color={Colors.light.textLight} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      testID={`task-card-${task.id}`}
    >
      <View style={styles.iconContainer}>
        <ClipboardList size={24} color={Colors.light.primary} />
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{task.name}</Text>
        <Text style={styles.section}>Section {task.capital}</Text>
      </View>
      {showActions && currentUser && (
        // Only show actions for tasks created by the current instructor (not default tasks)
        (currentUser.role === 'admin' || 
         (currentUser.role === 'instructor' && task.instructor_id === currentUser.id)) && (
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
              <Edit2 size={18} color={Colors.light.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
              <Trash2 size={18} color={Colors.light.danger} />
            </TouchableOpacity>
          </View>
        )
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  section: {
    fontSize: 14,
    color: Colors.light.textLight,
    fontWeight: '500',
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
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  sectionEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionEditLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  sectionEditSelector: {
    flexDirection: 'row',
    gap: 4,
  },
  sectionEditOption: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionEditOptionActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  sectionEditOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textLight,
  },
  sectionEditOptionTextActive: {
    color: '#fff',
  },
});