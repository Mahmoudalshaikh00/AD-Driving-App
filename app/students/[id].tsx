import React, { useState, useMemo, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, ScrollView, Animated, Easing, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useStudentStore } from '@/hooks/useStudentStore';
import { useTaskStore } from '@/hooks/useTaskStore';
import { useEvaluationStore } from '@/hooks/useEvaluationStore';
import Colors from '@/constants/colors';
import { User, ClipboardList, MessageSquare, Calendar, ChevronLeft } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuthStore';
import Svg, { Circle } from 'react-native-svg';
import { NotificationBadge } from '@/components/NotificationBadge';

export default function StudentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getStudentById } = useStudentStore();
  const { tasks, subtasks, loading: tasksLoading } = useTaskStore();
  const { getEvaluationsByStudentId } = useEvaluationStore();
  
  const [selectedCapital, setSelectedCapital] = useState<1 | 2 | 3 | 4>(1);
  const { user } = useAuth();
  
  const student = getStudentById(id);
  const studentEvaluations = getEvaluationsByStudentId(id);
  
  const filteredTasks = tasks.filter(task => task.capital === selectedCapital);
  
  const taskCompletionPercentages = useMemo(() => {
    const percentages: Record<string, number> = {};
    
    filteredTasks.forEach(task => {
      const taskSubtasks = subtasks.filter(subtask => subtask.taskId === task.id);
      if (taskSubtasks.length === 0) {
        percentages[task.id] = 0;
        return;
      }
      
      let totalStars = 0;
      let totalPossibleStars = taskSubtasks.length * 5;
      
      taskSubtasks.forEach(subtask => {
        const foundEvaluation = studentEvaluations.find(
          item => item.taskId === task.id && item.subtaskId === subtask.id
        );
        totalStars += foundEvaluation ? foundEvaluation.rating : 0;
      });
      
      const percentage = totalPossibleStars > 0 ? (totalStars / totalPossibleStars) * 100 : 0;
      percentages[task.id] = Math.round(percentage);
    });
    
    return percentages;
  }, [filteredTasks, subtasks, studentEvaluations]);

  const capitalPercentages = useMemo(() => {
    const percentages: Record<1 | 2 | 3 | 4, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    
    [1, 2, 3, 4].forEach(capital => {
      const capitalTasks = tasks.filter(task => task.capital === capital);
      if (capitalTasks.length === 0) {
        percentages[capital as 1 | 2 | 3 | 4] = 0;
        return;
      }
      
      let totalStars = 0;
      let totalPossibleStars = 0;
      
      capitalTasks.forEach(task => {
        const taskSubtasks = subtasks.filter(subtask => subtask.taskId === task.id);
        totalPossibleStars += taskSubtasks.length * 5;
        
        taskSubtasks.forEach(subtask => {
          const foundEvaluation = studentEvaluations.find(
            item => item.taskId === task.id && item.subtaskId === subtask.id
          );
          totalStars += foundEvaluation ? foundEvaluation.rating : 0;
        });
      });
      
      const percentage = totalPossibleStars > 0 ? (totalStars / totalPossibleStars) * 100 : 0;
      percentages[capital as 1 | 2 | 3 | 4] = Math.round(percentage * 10) / 10;
    });
    
    return percentages;
  }, [tasks, subtasks, studentEvaluations]);

  const overallPercentage = useMemo(() => {
    const values = Object.values(capitalPercentages);
    return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
  }, [capitalPercentages]);

  const handleViewEvaluations = () => {
    router.push(`/evaluations/${id}`);
  };

  const circleAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    circleAnim.stopAnimation();
    Animated.timing(circleAnim, {
      toValue: overallPercentage,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [overallPercentage]);

  if (!student) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Student not found</Text>
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
    <>
      <Stack.Screen 
        options={{
          title: "Student Details",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                // Always go back to the students list (tabs)
                router.push('/(tabs)');
              }}
              style={{ marginLeft: -8, padding: 8 }}
            >
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }} 
      />
      <View style={styles.container}>
      <View style={styles.studentInfoCard}>
        <View style={styles.avatarContainer}>
          <User size={24} color={Colors.light.primary} />
        </View>
        <View style={styles.studentDetails}>
          <View style={styles.studentHeaderRow}>
            <View style={styles.studentHeaderLeft}>
              <Text style={styles.studentName}>{student.name}</Text>
              {student.email ? (
                <Text style={styles.contactInfo}>{student.email}</Text>
              ) : null}
              <Text style={styles.trainerInfo}>Instructor: {user?.role === 'trainer' ? (user?.name ?? 'You') : 'Assigned Instructor'}</Text>
            </View>
            <View style={styles.studentHeaderRight}>
              <View style={styles.circularWrapper}>
                <CircularProgress percent={overallPercentage} animatedValue={circleAnim} size={88} strokeWidth={8} />
                <View style={styles.circularCenter} pointerEvents="none">
                  <Text style={styles.circularPercentText}>{overallPercentage}%</Text>
                </View>
              </View>
            </View>
          </View>


        </View>
      </View>

      <View style={styles.actionSection} testID="student-action-section">
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => router.push(`/chat?studentId=${id}`)}
          testID="student-chat-button"
        >
          <View style={styles.actionCardIcon}>
            <MessageSquare size={20} color={Colors.light.primary} />
            <NotificationBadge 
              studentId={id} 
              type="message" 
              size="small" 
              style={{ top: -6, right: -6 }}
            />
          </View>
          <Text style={styles.actionCardLabel} numberOfLines={1}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={handleViewEvaluations}
          testID="student-evaluations-button"
        >
          <View style={styles.actionCardIcon}>
            <ClipboardList size={20} color={Colors.light.primary} />
            <NotificationBadge 
              studentId={id} 
              type="evaluation" 
              size="small" 
              style={{ top: -6, right: -6 }}
            />
          </View>
          <Text style={styles.actionCardLabel} numberOfLines={1}>Evaluation</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => router.push(`/students/${id}/schedule`)}
          testID="student-schedule-button"
        >
          <View style={styles.actionCardIcon}>
            <Calendar size={20} color={Colors.light.primary} />
            <NotificationBadge 
              studentId={id} 
              type="schedule" 
              size="small" 
              style={{ top: -6, right: -6 }}
            />
          </View>
          <Text style={styles.actionCardLabel} numberOfLines={1}>Schedule</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.capitalSelector}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.capitalScrollContent}
        >
          {[1, 2, 3, 4].map((capital) => (
            <TouchableOpacity
              key={capital}
              style={[
                styles.capitalButton,
                selectedCapital === capital && styles.capitalButtonActive
              ]}
              onPress={() => setSelectedCapital(capital as 1 | 2 | 3 | 4)}
            >
              <Text style={[
                styles.capitalButtonText,
                selectedCapital === capital && styles.capitalButtonTextActive
              ]}
              >
                Section {capital}
              </Text>
              <Text style={[
                styles.capitalPercentage,
                selectedCapital === capital && styles.capitalPercentageActive
              ]}
              >
                {capitalPercentages[capital as 1 | 2 | 3 | 4]}%
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.taskItem}
            onPress={() => {
              console.log('Task press', { userRole: user?.role, studentId: id, taskId: item.id });
              if (user?.role === 'trainer') {
                router.push(`/evaluate/${id}/${item.id}`);
              }
            }}
            disabled={user?.role !== 'trainer'}
            testID={`student-task-${item.id}`}
          >
            <View style={styles.taskIconContainer}>
              <ClipboardList size={20} color={Colors.light.primary} />
            </View>
            <View style={styles.taskInfo}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskName}>{item.name}</Text>
                <Text style={styles.taskCompletion}>
                  {taskCompletionPercentages[item.id]}%
                </Text>
              </View>
              <Text style={styles.taskCapital}>Section {item.capital}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tasks assigned to Section {selectedCapital}</Text>
            <Text style={styles.emptySubtext}>
              Tasks need to be assigned to this section first
            </Text>
          </View>
        }
      />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: 16,
    paddingTop: 12,
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
  studentInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentDetails: {
    flex: 1,
  },
  studentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  studentHeaderLeft: {
    flex: 1,
  },
  studentHeaderRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  overallCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overallCircleText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  contactInfo: {
    fontSize: 14,
    color: Colors.light.textLight,
  },
  trainerInfo: {
    fontSize: 12,
    color: Colors.light.textLight,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  actionCircle: {
    borderRadius: 16,
  },
  actionSquare: {
    borderRadius: 8,
  },
  actionText: {
    color: Colors.light.primary,
    fontWeight: '700',
  },
  capitalSelector: {
    marginBottom: 16,
    marginTop: 4,
  },
  capitalScrollContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  capitalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    minWidth: 80,
  },
  capitalButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  capitalButtonText: {
    fontSize: 12,
    color: Colors.light.textLight,
    fontWeight: '500',
  },
  capitalButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  capitalPercentage: {
    fontSize: 10,
    color: Colors.light.textLight,
    fontWeight: '500',
    marginTop: 2,
  },
  capitalPercentageActive: {
    color: '#fff',
    fontWeight: '600',
  },
  circularWrapper: {
    width: 88,
    height: 88,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circularCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularPercentText: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.light.primary,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  taskIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
  },
  taskCompletion: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
    backgroundColor: Colors.light.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  taskCapital: {
    fontSize: 12,
    color: Colors.light.textLight,
    fontWeight: '500',
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
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.textLight,
    textAlign: 'center',
  },
  actionSection: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    overflow: 'hidden',
  },
  actionCard: {
    flex: 1,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionCardIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    position: 'relative',
  },
  actionCardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.primary,
    flexShrink: 1,
  },
  actionCardDescription: {
    display: 'none',
    fontSize: 10,
    color: Colors.light.textLight,
  },
  actionCardContent: {
    display: 'none',
  },
  actionCardRight: {
    justifyContent: 'center',
    alignItems: 'center',
  }
});

function CircularProgress({ percent, animatedValue, size, strokeWidth }: { percent: number; animatedValue: Animated.Value; size: number; strokeWidth: number; }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));

  if (Platform.OS === 'web') {
    const dashOffsetStatic = circumference - (circumference * clamped) / 100;
    return (
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.light.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.light.primary}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffsetStatic}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    );
  }

  const dashOffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, circumference - (circumference * clamped) / 100],
    extrapolate: 'clamp',
  });

  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={Colors.light.border}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={Colors.light.primary}
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={dashOffset as unknown as number}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}