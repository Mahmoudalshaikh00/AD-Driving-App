import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStudentStore } from '@/hooks/useStudentStore';
import { useTaskStore } from '@/hooks/useTaskStore';
import { useEvaluationStore } from '@/hooks/useEvaluationStore';
import { useNotificationStore } from '@/hooks/useNotificationStore';
import { useAuth } from '@/hooks/useAuthStore';
import EvaluationHistoryItem from '@/components/EvaluationHistoryItem';
import Colors from '@/constants/colors';
import { TrendingUp, ChevronDown, ChevronUp, Filter, ChevronLeft } from 'lucide-react-native';


export default function StudentEvaluationsScreen() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { getStudentById } = useStudentStore();
  const { tasks, subtasks, loading: tasksLoading, getTasksByInstructor, getDefaultTasks } = useTaskStore();
  const { getEvaluationsByStudentId, getEvaluationNotes, loading: evaluationsLoading } = useEvaluationStore();
  const { markAsReadByStudentAndType } = useNotificationStore();
  const insets = useSafeAreaInsets();
  
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState<boolean>(false);
  
  const student = getStudentById(studentId);
  const studentEvaluations = getEvaluationsByStudentId(studentId);
  const isInstructor = user?.role === 'instructor';
  
  // Mark evaluation notifications as read when entering this screen
  React.useEffect(() => {
    if (studentId && isInstructor) {
      markAsReadByStudentAndType(studentId, 'evaluation');
    }
  }, [studentId, isInstructor, markAsReadByStudentAndType]);
  
  // Filter evaluations by selected task
  const filteredEvaluations = useMemo(() => {
    if (!selectedTaskId) return studentEvaluations;
    return studentEvaluations.filter(evaluation => evaluation.taskId === selectedTaskId);
  }, [studentEvaluations, selectedTaskId]);
  
  // Sort evaluations by timestamp (newest first)
  const sortedEvaluations = useMemo(() => {
    return [...filteredEvaluations].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [filteredEvaluations]);

  // Get subtask by ID
  const getSubtask = (subtaskId: string) => {
    return subtasks.find(s => s.id === subtaskId);
  };

  // Get filtered tasks for current instructor
  const filteredTasks = useMemo(() => {
    if (!user || user.role !== 'instructor') return tasks;
    const instructorTasks = getTasksByInstructor(user.id);
    const defaultTasks = getDefaultTasks();
    return [...instructorTasks, ...defaultTasks];
  }, [tasks, user, getTasksByInstructor, getDefaultTasks]);

  // Calculate percentage completion for each capital based on star ratings
  const capitalPercentages = useMemo(() => {
    const percentages: Record<1 | 2 | 3 | 4, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    
    [1, 2, 3, 4].forEach(capital => {
      const capitalTasks = filteredTasks.filter(task => task.capital === capital);
      if (capitalTasks.length === 0) {
        percentages[capital as 1 | 2 | 3 | 4] = 0;
        return;
      }
      
      let totalStars = 0;
      let totalPossibleStars = 0;
      
      capitalTasks.forEach(task => {
        const taskSubtasks = subtasks.filter(subtask => subtask.taskId === task.id);
        totalPossibleStars += taskSubtasks.length * 5; // Each subtask can have max 5 stars
        
        taskSubtasks.forEach(subtask => {
          const evaluation = studentEvaluations.find(
            evaluation => evaluation.taskId === task.id && evaluation.subtaskId === subtask.id
          );
          totalStars += evaluation ? evaluation.rating : 0;
        });
      });
      
      const percentage = totalPossibleStars > 0 ? (totalStars / totalPossibleStars) * 100 : 0;
      percentages[capital as 1 | 2 | 3 | 4] = Math.round(percentage * 10) / 10; // Round to 1 decimal place
    });
    
    return percentages;
  }, [filteredTasks, subtasks, studentEvaluations]);

  // Calculate overall percentage
  const overallPercentage = useMemo(() => {
    const values = Object.values(capitalPercentages);
    return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
  }, [capitalPercentages]);

  if (!student) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Student not found</Text>
      </View>
    );
  }

  if (tasksLoading || evaluationsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.topHeader, { paddingTop: Math.max(10, insets.top + 6) }]} testID="evaluations-header">
        <TouchableOpacity style={styles.backBtn} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} testID="evaluations-back" accessibilityLabel="Back">
          <ChevronLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Evaluations</Text>
        <View style={{ width: 36 }} />
      </View>
      
      <View style={styles.scrollContainer}>
        <View style={styles.contentCard} testID="student-evals-content-card">
          <View style={styles.header}>
            <Text style={styles.studentName}>{student.name}</Text>
            <Text style={styles.evaluationCount}>
              {studentEvaluations.length} {studentEvaluations.length === 1 ? 'evaluation' : 'evaluations'}
            </Text>
          </View>

          {/* Progress Summary */}
          <View style={styles.progressSummary}>
            <View style={styles.progressHeader}>
              <TrendingUp size={20} color={Colors.light.primary} />
              <Text style={styles.progressTitle}>Progress Summary</Text>
            </View>
            
            <View style={styles.overallProgress}>
              <Text style={styles.overallPercentage}>{overallPercentage}%</Text>
              <Text style={styles.overallLabel}>Overall Complete</Text>
            </View>
            
            <View style={styles.capitalGrid}>
              {[1, 2, 3, 4].map(capital => (
                <View key={capital} style={styles.capitalProgressItem}>
                  <Text style={styles.capitalLabel}>Section {capital}</Text>
                  <Text style={styles.capitalPercentage}>
                    {capitalPercentages[capital as 1 | 2 | 3 | 4]}%
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.filterContainer}>
            <TouchableOpacity 
              style={styles.filterHeader}
              onPress={() => setIsFilterExpanded(!isFilterExpanded)}
            >
              <View style={styles.filterHeaderContent}>
                <Filter size={16} color={Colors.light.primary} />
                <Text style={styles.filterLabel}>Filter by Task</Text>
                {selectedTaskId && (
                  <View style={styles.activeFilterBadge}>
                    <Text style={styles.activeFilterText}>1</Text>
                  </View>
                )}
              </View>
              {isFilterExpanded ? (
                <ChevronUp size={20} color={Colors.light.textLight} />
              ) : (
                <ChevronDown size={20} color={Colors.light.textLight} />
              )}
            </TouchableOpacity>
            
            {isFilterExpanded && (
              <View style={styles.taskFilters}>
                <TouchableOpacity
                  style={[
                    styles.taskFilterButton,
                    !selectedTaskId && styles.taskFilterButtonActive
                  ]}
                  onPress={() => setSelectedTaskId(null)}
                >
                  <Text style={[
                    styles.taskFilterText,
                    !selectedTaskId && styles.taskFilterTextActive
                  ]}>All</Text>
                </TouchableOpacity>
                
                {filteredTasks.filter(task => {
                  // Only show tasks that have evaluations for this student
                  return studentEvaluations.some(evaluation => evaluation.taskId === task.id);
                }).map(task => (
                  <TouchableOpacity
                    key={task.id}
                    style={[
                      styles.taskFilterButton,
                      selectedTaskId === task.id && styles.taskFilterButtonActive
                    ]}
                    onPress={() => setSelectedTaskId(task.id)}
                  >
                    <Text style={[
                      styles.taskFilterText,
                      selectedTaskId === task.id && styles.taskFilterTextActive
                    ]}>{task.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.evaluationsCard}>
          <Text style={styles.evaluationsTitle}>Evaluation History</Text>
          <FlatList
            data={sortedEvaluations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const taskNotes = getEvaluationNotes(studentId, item.taskId);
              const task = filteredTasks.find(t => t.id === item.taskId);
              return (
                <EvaluationHistoryItem
                  evaluation={item}
                  task={task}
                  subtask={getSubtask(item.subtaskId)}
                  notes={taskNotes || undefined}
                />
              );
            }}
            contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(20, insets.bottom + 12) }]}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No evaluations found</Text>
                {selectedTaskId && (
                  <Text style={styles.emptySubtext}>
                    Try selecting a different task filter
                  </Text>
                )}
              </View>
            }
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContainer: {
    flex: 1,
    padding: 12,
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
  topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.light.primary, paddingHorizontal: 12, paddingVertical: 14, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontWeight: '800', fontSize: 16 },
  header: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  studentName: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  evaluationCount: {
    fontSize: 14,
    color: Colors.light.textLight,
  },
  filterContainer: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  filterHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  activeFilterBadge: {
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFilterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  taskFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  taskFilterButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: Colors.light.background,
    marginBottom: 6,
  },
  taskFilterButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  taskFilterText: {
    fontSize: 12,
    color: Colors.light.textLight,
  },
  taskFilterTextActive: {
    color: '#fff',
    fontWeight: '500',
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
  progressSummary: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginLeft: 6,
  },
  overallProgress: {
    alignItems: 'center',
    marginBottom: 7,
  },
  overallPercentage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  overallLabel: {
    fontSize: 11,
    color: Colors.light.textLight,
    marginTop: 1,
  },
  capitalGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  capitalProgressItem: {
    alignItems: 'center',
    flex: 1,
  },
  capitalLabel: {
    fontSize: 11,
    color: Colors.light.textLight,
    marginBottom: 2,
  },
  capitalPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  contentCard: { 
    backgroundColor: Colors.light.cardBackground, 
    borderRadius: 12, 
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  evaluationsCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  evaluationsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
});