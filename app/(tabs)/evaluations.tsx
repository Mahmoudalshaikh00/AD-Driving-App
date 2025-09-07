import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Shield, CheckCircle, XCircle, AlertTriangle, Mail, Phone, Calendar } from 'lucide-react-native';
import { useStudentStore } from '@/hooks/useStudentStore';
import { useEvaluationStore } from '@/hooks/useEvaluationStore';
import { useTaskStore } from '@/hooks/useTaskStore';
import { useAuth } from '@/hooks/useAuthStore';
import { BarChart3, Star, ClipboardList, ChevronDown, ChevronUp, User as UserIcon } from 'lucide-react-native';
import RatingInput from '@/components/RatingInput';
import Colors from '@/constants/colors';

type StudentViewProps = {
  userId: string;
  tasks: Array<{ id: string; name: string; capital: 1 | 2 | 3 | 4 }>;
  subtasks: Array<{ id: string; name: string; taskId: string }>;
  evaluations: Array<{ id: string; studentId: string; taskId: string; subtaskId: string; rating: number; timestamp: string; notes?: string }>;
  getEvaluationNotes: (studentId: string, taskId: string) => { studentId: string; taskId: string; notes: string; timestamp: string } | null;
  currentStudent?: { id: string; name: string; trainer_id?: string };
};

const StudentView = React.memo(function StudentView({ userId, tasks, subtasks, evaluations, getEvaluationNotes, currentStudent }: StudentViewProps) {
  const [selectedCapital, setSelectedCapital] = useState<1 | 2 | 3 | 4>(1);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [trainerName, setTrainerName] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    async function loadTrainer() {
      try {
        if (!currentStudent?.trainer_id) {
          setTrainerName('');
          return;
        }
        const { supabase } = await import('@/lib/supabase');
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentStudent.trainer_id)
          .single();
        if (!isMounted) return;
        if (error || !data) {
          setTrainerName('');
        } else {
          const name = (data as any)?.name ?? '';
          setTrainerName(name);
        }
      } catch {
        if (isMounted) setTrainerName('');
      }
    }
    loadTrainer();
    return () => {
      isMounted = false;
    };
  }, [currentStudent?.trainer_id]);

  const myEvaluations = useMemo(() => evaluations.filter(e => e.studentId === userId), [evaluations, userId]);
  const capitalTasks = useMemo(() => tasks.filter(t => t.capital === selectedCapital), [tasks, selectedCapital]);

  const taskCompletion: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = {};
    capitalTasks.forEach(task => {
      const taskSubs = subtasks.filter(s => s.taskId === task.id);
      const possible = taskSubs.length * 5;
      const earned = taskSubs.reduce((sum, s) => {
        const found = myEvaluations.find(ev => ev.taskId === task.id && ev.subtaskId === s.id);
        return sum + (found?.rating ?? 0);
      }, 0);
      map[task.id] = possible > 0 ? Math.round((earned / possible) * 100) : 0;
    });
    return map;
  }, [capitalTasks, subtasks, myEvaluations]);

  const capitalPercentages: Record<1 | 2 | 3 | 4, number> = useMemo(() => {
    const result: Record<1 | 2 | 3 | 4, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    ([1, 2, 3, 4] as Array<1 | 2 | 3 | 4>).forEach((c) => {
      const tasksInCapital = tasks.filter(t => t.capital === c);
      const subs = subtasks.filter(s => tasksInCapital.some(t => t.id === s.taskId));
      const possible = subs.length * 5;
      const earned = subs.reduce((sum, s) => {
        const ev = myEvaluations.find(e => e.subtaskId === s.id);
        return sum + (ev?.rating ?? 0);
      }, 0);
      result[c] = possible > 0 ? Math.round((earned / possible) * 100) : 0;
    });
    return result;
  }, [tasks, subtasks, myEvaluations]);

  const overallPercent = useMemo(() => {
    const allSubs = subtasks.filter(s => tasks.some(t => t.id === s.taskId));
    const possible = allSubs.length * 5;
    const earned = allSubs.reduce((sum, s) => {
      const ev = myEvaluations.find(e => e.subtaskId === s.id);
      return sum + (ev?.rating ?? 0);
    }, 0);
    return possible > 0 ? Math.round((earned / possible) * 100) : 0;
  }, [subtasks, tasks, myEvaluations]);

  const onToggleTask = useCallback((taskId: string, isOpen: boolean) => {
    setExpandedTaskId(isOpen ? null : taskId);
  }, []);

  return (
    <View style={styles.container}>
      {myEvaluations.length > 0 ? (
        <>
          <View style={styles.headerCard}>
            <View style={styles.headerInfo}>
              <View style={styles.avatar}><UserIcon size={18} color={Colors.light.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.studentTitle} numberOfLines={1}>
                  {currentStudent?.name ?? 'Student'}
                </Text>
                {trainerName ? (
                  <Text style={styles.trainerSubtitle} numberOfLines={1}>
                    Instructor: {trainerName}
                  </Text>
                ) : null}
              </View>
            </View>
            <View style={styles.avgSquare} testID="avg-rating-square">
              <Star size={18} color={Colors.light.primary} />
              <Text style={styles.avgSquareNumber}>
                {myEvaluations.length > 0
                  ? Math.round((myEvaluations.reduce((s, e) => s + (e.rating ?? 0), 0) / myEvaluations.length) * 10) / 10
                  : 0}
              </Text>
              <Text style={styles.avgSquareLabel}>Avg</Text>
            </View>
          </View>

          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>Overall</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${overallPercent}%` }]} />
            </View>
            <Text style={styles.progressValue}>{overallPercent}% complete</Text>
          </View>

          <View>
            <FlatList
              data={[1, 2, 3, 4] as Array<1 | 2 | 3 | 4>}
              keyExtractor={(item) => String(item)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.capitalRow}
              renderItem={({ item: c }) => (
                <TouchableOpacity
                  onPress={() => setSelectedCapital(c)}
                  style={[styles.capitalPill, selectedCapital === c && styles.capitalPillActive]}
                  testID={`capital-pill-${c}`}
                >
                  <View style={styles.capitalPillInner}>
                    <Text style={[styles.capitalPillText, selectedCapital === c && styles.capitalPillTextActive]}>Capital {c}</Text>
                    <Text style={[styles.capitalPillPercent, selectedCapital === c && styles.capitalPillPercentActive]}>{capitalPercentages[c]}%</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>

          <FlatList
            data={capitalTasks}
            keyExtractor={item => item.id}
            renderItem={({ item }) => {
              const isOpen = expandedTaskId === item.id;
              const taskSubs = subtasks.filter(s => s.taskId === item.id);
              const notes = getEvaluationNotes(userId, item.id);
              return (
                <View style={styles.taskCard}>
                  <TouchableOpacity
                    onPress={() => onToggleTask(item.id, isOpen)}
                    style={styles.taskHeaderRow}
                    testID={`student-task-${item.id}`}
                  >
                    <View style={styles.taskIcon}><ClipboardList size={20} color={Colors.light.primary} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.taskName}>{item.name}</Text>
                      <Text style={styles.taskMeta}>Capital {item.capital}</Text>
                    </View>
                    <View style={styles.badge}><Text style={styles.badgeText}>{taskCompletion[item.id]}%</Text></View>
                    {isOpen ? <ChevronUp size={20} color={Colors.light.textLight} /> : <ChevronDown size={20} color={Colors.light.textLight} />}
                  </TouchableOpacity>

                  {isOpen && (
                    <View style={styles.taskBody}>
                      {notes?.notes ? (
                        <View style={styles.notesBox}>
                          <Text style={styles.notesTitle}>Instructor Notes</Text>
                          <Text style={styles.notesText}>{notes.notes}</Text>
                        </View>
                      ) : null}

                      {taskSubs.map(st => {
                        const ev = myEvaluations.find(e => e.taskId === item.id && e.subtaskId === st.id);
                        const val = ev?.rating ?? 0;
                        return (
                          <View key={st.id} style={styles.SubTaskRow}>
                            <Text style={styles.SubTaskName}>{st.name}</Text>
                            <RatingInput value={val} onChange={() => {}} disabled size="small" />
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            }}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No tasks in this capital yet</Text>
              </View>
            }
          />
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <BarChart3 size={64} color={Colors.light.textLight} />
          <Text style={styles.emptyText}>No evaluations yet</Text>
          <Text style={styles.emptySubtext}>Your instructor will add evaluations and notes.</Text>
        </View>
      )}
    </View>
  );
});

export default function EvaluationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { students, loading: studentsLoading } = useStudentStore();
  const { evaluations, getEvaluationNotes, loading: evaluationsLoading } = useEvaluationStore();
  const { tasks, subtasks, loading: tasksLoading } = useTaskStore();
  const { user } = useAuth();
  
  // Admin state
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (user?.role === 'student' && user.id) {
      router.replace(`/evaluations/${user.id}`);
    }
  }, [user?.role, user?.id]);
  
  // Load all users for admin
  useEffect(() => {
    if (user?.role === 'admin') {
      loadAllUsers();
    }
  }, [user?.role]);
  
  const loadAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      const queryBuilder = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Convert thenable to Promise
      const result = await new Promise<any>((resolve) => {
        queryBuilder.then(resolve);
      });
      
      const { data, error } = result;
      
      if (!error && data) {
        // Add mock instructors for demo
        const mockInstructors = [
          { id: 'mock-instructor-1', name: 'John Smith', email: 'john@example.com', role: 'instructor', created_at: '2024-01-15', is_approved: true, is_restricted: false },
          { id: 'mock-instructor-2', name: 'Sarah Johnson', email: 'sarah@example.com', role: 'instructor', created_at: '2024-01-20', is_approved: true, is_restricted: false },
          { id: 'mock-instructor-3', name: 'Mike Wilson', email: 'mike@example.com', role: 'instructor', created_at: '2024-02-01', is_approved: false, is_restricted: false },
          { id: 'mock-instructor-4', name: 'Lisa Brown', email: 'lisa@example.com', role: 'instructor', created_at: '2024-02-10', is_approved: true, is_restricted: true },
        ];
        setAllUsers([...data, ...mockInstructors]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };
  
  const handleUserAction = async (userId: string, action: 'approve' | 'restrict' | 'unrestrict') => {
    // Mock implementation - in real app, this would call API
    setAllUsers(prev => prev.map(user => {
      if (user.id === userId) {
        switch (action) {
          case 'approve':
            return { ...user, is_approved: true };
          case 'restrict':
            return { ...user, is_restricted: true };
          case 'unrestrict':
            return { ...user, is_restricted: false };
          default:
            return user;
        }
      }
      return user;
    }));
  };

  const studentEvaluationCounts = useMemo(() => {
    return students
      .map(student => ({
        student,
        count: evaluations.filter(e => e.studentId === student.id).length,
      }))
      .filter(item => item.count > 0);
  }, [students, evaluations]);

  const handleStudentPress = (studentId: string) => {
    router.push(`/evaluations/${studentId}`);
  };

  if (studentsLoading || evaluationsLoading || tasksLoading || loadingUsers) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (user?.role === 'student' && user?.id) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  // Admin view - User Management
  if (user?.role === 'admin') {
    const UserCard = ({ user: userData }: { user: any }) => {
      const getStatusColor = () => {
        if (userData.is_restricted) return '#ef4444';
        if (!userData.is_approved && userData.role === 'trainer') return '#f59e0b';
        return '#10b981';
      };
      
      const getStatusText = () => {
        if (userData.is_restricted) return 'Restricted';
        if (!userData.is_approved && userData.role === 'instructor') return 'Pending';
        return 'Active';
      };
      
      return (
        <View style={styles.userCard}>
          <View style={styles.userHeader}>
            <View style={styles.userInfo}>
              <View style={styles.userAvatar}>
                <UserIcon size={20} color={Colors.light.primary} />
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{userData.name}</Text>
                <Text style={styles.userEmail}>{userData.email}</Text>
                <Text style={styles.userRole}>{userData.role.toUpperCase()}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '15' }]}>
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>
          </View>
          
          <View style={styles.userActions}>
            {userData.role === 'instructor' && !userData.is_approved && (
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleUserAction(userData.id, 'approve')}
              >
                <CheckCircle size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Approve</Text>
              </TouchableOpacity>
            )}
            
            {!userData.is_restricted ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.restrictButton]}
                onPress={() => handleUserAction(userData.id, 'restrict')}
              >
                <XCircle size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Restrict</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.unrestrictButton]}
                onPress={() => handleUserAction(userData.id, 'unrestrict')}
              >
                <CheckCircle size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Unrestrict</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    };
    
    return (
      <View style={styles.container}>
        <View style={styles.adminHeader}>
          <View style={styles.adminHeaderInfo}>
            <View style={styles.adminIcon}>
              <Shield size={24} color={Colors.light.primary} />
            </View>
            <View>
              <Text style={styles.adminTitle}>User Management</Text>
              <Text style={styles.adminSubtitle}>Manage instructors and students</Text>
            </View>
          </View>
        </View>
        
        <FlatList
          data={allUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <UserCard user={item} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      </View>
    );
  }

  // Trainer view
  return (
    <View style={styles.container}>
      <View style={[styles.topHeader, { paddingTop: Math.max(10, insets.top + 6) }]} testID="evaluations-header">
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} testID="evaluations-back" accessibilityLabel="Back">
          <ChevronLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Evaluations</Text>
        <View style={{ width: 36 }} />
      </View>
      
      <View style={styles.contentCard} testID="evaluations-content-card">
        <Text style={styles.title}>Student Evaluations</Text>
        <FlatList
          data={studentEvaluationCounts}
          keyExtractor={(item) => item.student.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.studentItem}
              onPress={() => handleStudentPress(item.student.id)}
            >
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{item.student.name}</Text>
                <Text style={styles.contactInfo}>{item.student.email}</Text>
              </View>
              <View style={styles.countContainer}>
                <Text style={styles.countText}>{item.count}</Text>
                <Text style={styles.countLabel}>evaluations</Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No evaluations found</Text>
              <Text style={styles.emptySubtext}>Select a student and task to start evaluating</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.light.text,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  contactInfo: {
    fontSize: 14,
    color: Colors.light.textLight,
  },
  countContainer: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  countText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  countLabel: {
    fontSize: 12,
    color: '#fff',
  },
  listContent: {
    paddingBottom: 20,
  },
  topHeader: { 
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
  backBtn: { 
    width: 40, 
    height: 40, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitle: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 18 
  },
  contentCard: { 
    margin: 16, 
    backgroundColor: Colors.light.cardBackground, 
    borderRadius: 12, 
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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

  headerCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  trainerSubtitle: {
    fontSize: 12,
    color: Colors.light.textLight,
    marginTop: 2,
  },
  avgSquare: {
    width: 84,
    height: 84,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  avgSquareNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.text,
    marginTop: 4,
  },
  avgSquareLabel: {
    fontSize: 12,
    color: Colors.light.textLight,
    marginTop: 2,
  },
  progressCard: {
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
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.light.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 3,
  },
  progressValue: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.light.textLight,
  },
  capitalRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  capitalPill: {
    paddingHorizontal: 12,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.light.background,
    borderWidth: 2,
    borderColor: Colors.light.border,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  capitalPillActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  capitalPillInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  capitalPillText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  capitalPillPercent: {
    fontSize: 12,
    color: Colors.light.textLight,
    fontWeight: '600',
    marginTop: 2,
  },
  capitalPillPercentActive: {
    color: '#fff',
  },
  capitalPillTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  taskCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  taskHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  taskIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  taskMeta: {
    fontSize: 12,
    color: Colors.light.textLight,
  },
  badge: {
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  taskBody: {
    marginTop: 10,
    gap: 8,
  },
  notesBox: {
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.primary,
  },
  notesTitle: {
    fontSize: 12,
    color: Colors.light.textLight,
    fontWeight: '600',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  SubTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  SubTaskName: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
    marginRight: 8,
  },
  // Admin styles
  adminHeader: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  adminHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adminIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  adminSubtitle: {
    fontSize: 14,
    color: Colors.light.textLight,
    marginTop: 2,
  },
  userCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.light.textLight,
    marginTop: 2,
  },
  userRole: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  restrictButton: {
    backgroundColor: '#ef4444',
  },
  unrestrictButton: {
    backgroundColor: '#10b981',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
