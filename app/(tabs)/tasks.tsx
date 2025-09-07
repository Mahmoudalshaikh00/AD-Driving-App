import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Plus, Search } from 'lucide-react-native';
import { useTaskStore } from '@/hooks/useTaskStore';
import TaskCard from '@/components/TaskCard';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TasksScreen() {
  const { tasks, loading, addTask } = useTaskStore();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskSection, setNewTaskSection] = useState<1 | 2 | 3 | 4>(1);

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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

      {!isAddingTask ? (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsAddingTask(true)}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add New Task</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.addTaskForm}>
          <TextInput
            style={styles.input}
            placeholder="Task name"
            value={newTaskName}
            onChangeText={setNewTaskName}
            placeholderTextColor={Colors.light.textLight}
          />
          <Text style={styles.sectionLabel}>Section:</Text>
          <View style={styles.sectionSelector}>
            {[1, 2, 3, 4].map((section) => (
              <TouchableOpacity
                key={section}
                style={[
                  styles.sectionOption,
                  newTaskSection === section && styles.sectionOptionActive,
                ]}
                onPress={() => setNewTaskSection(section as 1 | 2 | 3 | 4)}
              >
                <Text
                  style={[
                    styles.sectionOptionText,
                    newTaskSection === section && styles.sectionOptionTextActive,
                  ]}
                >
                  {section}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setIsAddingTask(false);
                setNewTaskName('');
                setNewTaskSection(1);
              }}
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
      )}

      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            showActions={true}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tasks found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8fa',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f8fa',
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
});