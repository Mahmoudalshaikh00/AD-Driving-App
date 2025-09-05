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
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    marginBottom: 8,
  },
  student: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  task: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.primary,
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 11,
    color: Colors.light.textLight,
  },
  content: {
    gap: 8,
  },
  subtask: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.text,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.textLight,
  },
  notesContainer: {
    marginTop: 6,
    backgroundColor: Colors.light.background,
    borderRadius: 6,
    padding: 8,
    borderLeftWidth: 2,
    borderLeftColor: Colors.light.primary,
  },
  notesContent: {
    gap: 2,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.light.textLight,
    marginBottom: 2,
  },
  notes: {
    fontSize: 11,
    color: Colors.light.text,
    lineHeight: 16,
  },
  notesTimestamp: {
    fontSize: 10,
    color: Colors.light.textLight,
    fontStyle: 'italic',
    marginTop: 2,
  },
});