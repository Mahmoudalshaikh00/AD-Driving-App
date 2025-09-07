import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useStudentStore } from '@/hooks/useStudentStore';
import { useTaskStore } from '@/hooks/useTaskStore';
import { useEvaluationStore } from '@/hooks/useEvaluationStore';
import { useAuth } from '@/hooks/useAuthStore';
import SubTaskItem from '@/components/SubtaskItem';
import Colors from '@/constants/colors';
import { CheckCircle, Save } from 'lucide-react-native';

export default function EvaluateStudentScreen() {
  const { studentId, taskId } = useLocalSearchParams<{ studentId: string; taskId: string }>();
  
  const { user } = useAuth();
  const { getStudentById } = useStudentStore();
  const { getTaskById, getSubtasksByTaskId, loading: tasksLoading } = useTaskStore();
  const { addEvaluation, getLatestEvaluation, addEvaluationNotes, getEvaluationNotes } = useEvaluationStore();
  
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  
  const student = getStudentById(studentId);
  const task = getTaskById(taskId);
  const subTasks = getSubtasksByTaskId(taskId);

  const initializedRef = useRef<string>('');

  // Initialize ratings and notes with latest evaluations
  useEffect(() => {
    if (!studentId || !taskId || tasksLoading) return;
    
    const key = `${studentId}-${taskId}`;
    if (initializedRef.current === key) return;
    
    const currentSubTasks = getSubtasksByTaskId(taskId);
    if (currentSubTasks.length === 0) return;
    
    const initialRatings: Record<string, number> = {};
    
    currentSubTasks.forEach(subTask => {
      const latestEval = getLatestEvaluation(studentId, taskId, subTask.id);
      if (latestEval) {
        initialRatings[subTask.id] = latestEval.rating;
      }
    });
    
    setRatings(initialRatings);
    
    // Load existing notes
    const existingNotes = getEvaluationNotes(studentId, taskId);
    if (existingNotes) {
      setNotes(existingNotes.notes);
    }
    
    initializedRef.current = key;
  }, [studentId, taskId, tasksLoading]);

  const handleRatingChange = async (subTaskId: string, rating: number) => {
    console.log('Rating change requested:', { subTaskId, rating, studentId, taskId });
    
    // Update local state immediately for responsive UI
    setRatings(prev => ({
      ...prev,
      [subTaskId]: rating
    }));
    
    // Save the evaluation immediately (this will overwrite existing rating)
    try {
      const result = await addEvaluation({
        studentId,
        taskId,
        subtaskId: subTaskId,
        rating,
      });
      console.log(`✅ Saved rating ${rating} for SubTask ${subTaskId}:`, result);
    } catch (error) {
      console.error('❌ Failed to save evaluation:', error);
      // Revert the local state if save failed
      setRatings(prev => {
        const reverted = { ...prev };
        delete reverted[subTaskId];
        return reverted;
      });
    }
  };

  const handleSaveNotes = async () => {
    if (!notes.trim()) return;
    
    setSaving(true);
    
    try {
      // Save notes separately from ratings
      await addEvaluationNotes({
        studentId,
        taskId,
        notes: notes.trim()
      });
      
      setSaveSuccess(true);
      
      // Reset success state after 2 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to save notes:', error);
    } finally {
      setSaving(false);
    }
  };

  // Check if user is an instructor
  if (!user || user.role !== 'instructor') {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Access denied. Only instructors can evaluate students.</Text>
      </View>
    );
  }

  if (!student || !task) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Student or task not found</Text>
      </View>
    );
  }

  if (tasksLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }



  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.studentName}>{student.name}</Text>
        <Text style={styles.taskName}>{task.name}</Text>
      </View>

      <Text style={styles.instructions}>
        Rate each SubTask from 1-5 stars
      </Text>
      
      <FlatList
        data={subTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SubTaskItem
            subTask={item}
            studentId={studentId}
            onRatingChange={handleRatingChange}
            latestRating={ratings[item.id] || 0}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No SubTasks available</Text>
            <Text style={styles.emptySubtext}>
              Add SubTasks to this task first
            </Text>
          </View>
        }
      />
      
      <View style={styles.notesContainer}>
        <Text style={styles.notesLabel}>Task Notes (Optional)</Text>
        <Text style={styles.notesDescription}>
          Notes are saved per task and displayed with evaluations
        </Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Enter notes for this task evaluation..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={2}
          placeholderTextColor={Colors.light.textLight}
        />
      </View>

      {notes.trim() && (
        <TouchableOpacity 
          style={[
            styles.saveButton,
            saving && styles.saveButtonDisabled,
            saveSuccess && styles.saveButtonSuccess
          ]}
          onPress={handleSaveNotes}
          disabled={saving || saveSuccess}
        >
          {saveSuccess ? (
            <>
              <CheckCircle size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Notes Saved</Text>
            </>
          ) : (
            <>
              <Save size={20} color="#fff" />
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving Notes...' : 'Save Notes'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
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
  header: {
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
  studentName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  taskName: {
    fontSize: 18,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  instructions: {
    fontSize: 16,
    color: Colors.light.textLight,
    marginBottom: 16,
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
  notesContainer: {
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
  notesLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 4,
  },
  notesDescription: {
    fontSize: 12,
    color: Colors.light.textLight,
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: Colors.light.text,
    minHeight: 50,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.light.textLight,
    opacity: 0.7,
  },
  saveButtonSuccess: {
    backgroundColor: Colors.light.secondary,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});