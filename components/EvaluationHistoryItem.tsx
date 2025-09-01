import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SubtaskEvaluation, Student, Task, Subtask, EvaluationWithNotes } from '@/types';
import Colors from '@/constants/colors';
import RatingInput from './RatingInput';

interface EvaluationHistoryItemProps {
  evaluation: SubtaskEvaluation;
  student?: Student;
  task?: Task;
  subtask?: Subtask;
  notes?: EvaluationWithNotes;
}

export default function EvaluationHistoryItem({ 
  evaluation, 
  student, 
  task, 
  subtask,
  notes
}: EvaluationHistoryItemProps) {
  // Format the timestamp to a readable date and time
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View 
      style={styles.container}
      testID={`evaluation-item-${evaluation.id}`}
    >
      <View style={styles.header}>
        {student && <Text style={styles.student}>{student.name}</Text>}
        {task && <Text style={styles.task}>{task.name}</Text>}
        <Text style={styles.timestamp}>{formatDate(evaluation.timestamp)}</Text>
      </View>
      
      <View style={styles.content}>
        {subtask && (
          <Text style={styles.subtask}>{subtask.name}</Text>
        )}
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingLabel}>Rating:</Text>
          <RatingInput value={evaluation.rating} onChange={() => {}} disabled size="small" />
        </View>
        
        {notes && notes.notes.trim() && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Task Notes:</Text>
            <View style={styles.notesContent}>
              <Text style={styles.notes}>{notes.notes}</Text>
              <Text style={styles.notesTimestamp}>
                Added: {formatDate(notes.timestamp)}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  header: {
    marginBottom: 12,
  },
  student: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  task: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 14,
    color: Colors.light.textLight,
  },
  content: {
    gap: 12,
  },
  subtask: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.text,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textLight,
  },
  notesContainer: {
    marginTop: 8,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.primary,
  },
  notesContent: {
    gap: 4,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textLight,
    marginBottom: 4,
  },
  notes: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  notesTimestamp: {
    fontSize: 12,
    color: Colors.light.textLight,
    fontStyle: 'italic',
    marginTop: 4,
  },
});