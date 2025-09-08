import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, ActivityIndicator, TouchableOpacity, Alert, Platform, Animated, Easing } from 'react-native';
import { Plus, Search, LogOut, User, CalendarDays, MessageSquare, ClipboardList, ChevronDown, ChevronUp, Shield, Users, AlertTriangle, Settings, CheckCircle, XCircle, Clock, TrendingUp, Tag } from 'lucide-react-native';
import { useStudentStore } from '@/hooks/useStudentStore';
import { useTaskStore } from '@/hooks/useTaskStore';
import { useEvaluationStore } from '@/hooks/useEvaluationStore';
import { useAuth } from '@/hooks/useAuthStore';
import { useNotificationStore } from '@/hooks/useNotificationStore';
import StudentCard from '@/components/StudentCard';
import Colors from '@/constants/colors';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import RatingInput from '@/components/RatingInput';

export default function StudentsScreen() {
  // All hooks must be called at the top level, before any conditional returns
  const { signOut, user } = useAuth();
  const { students, loading, createStudent, refreshStudents } = useStudentStore();
  const taskStore = useTaskStore();
  const evalStore = useEvaluationStore();
  const { createTestNotifications } = useNotificationStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedCapital, setSelectedCapital] = useState<1 | 2 | 3 | 4>(1);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [circleAnim] = useState(new Animated.Value(0));
  const [trainerName, setTrainerName] = useState<string>('');

  // Prepare data for student view (must be done before conditional returns)
  const tasks = taskStore?.tasks || [];
  const subtasks = taskStore?.subtasks || [];
  const evaluations = evalStore?.evaluations || [];
  const getEvaluationNotes = evalStore?.getEvaluationNotes || (() => null);
  
  const currentStudent = user?.role === 'student' ? {
    ...user,
    instructor_id: user.instructor_id || null
  } : null;
  
  const myEvaluations = user?.role === 'student' ? evaluations.filter((e: any) => e.studentId === user.id) : [];
  const capitalTasks = tasks.filter((t: any) => t.capital === selectedCapital);
  
  const taskCompletion: Record<string, number> = useMemo(() => {
    if (user?.role !== 'student') return {};
    const map: Record<string, number> = {};
    capitalTasks.forEach((task: any) => {
      const taskSubs = subtasks.filter((s: any) => s.taskId === task.id);
      const possible = taskSubs.length * 5;
      const earned = taskSubs.reduce((sum: number, s: any) => {
        const found = myEvaluations.find((ev: any) => ev.taskId === task.id && ev.subtaskId === s.id);
        return sum + (found?.rating ?? 0);
      }, 0);
      map[task.id] = possible > 0 ? Math.round((earned / possible) * 100) : 0;
    });
    return map;
  }, [capitalTasks, subtasks, myEvaluations, user]);

  const capitalPercentages: Record<1 | 2 | 3 | 4, number> = useMemo(() => {
    if (user?.role !== 'student') return { 1: 0, 2: 0, 3: 0, 4: 0 };
    const result: Record<1 | 2 | 3 | 4, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    ([1, 2, 3, 4] as Array<1 | 2 | 3 | 4>).forEach((c) => {
      const tasksInCapital = tasks.filter((t: any) => t.capital === c);
      const subs = subtasks.filter((s: any) => tasksInCapital.some((t: any) => t.id === s.taskId));
      const possible = subs.length * 5;
      const earned = subs.reduce((sum: number, s: any) => {
        const ev = myEvaluations.find((e: any) => e.subtaskId === s.id);
        return sum + (ev?.rating ?? 0);
      }, 0);
      result[c] = possible > 0 ? Math.round((earned / possible) * 100) : 0;
    });
    return result;
  }, [tasks, subtasks, myEvaluations, user]);

  const overallPercent = useMemo(() => {
    if (user?.role !== 'student') return 0;
    const allSubs = subtasks.filter((s: any) => tasks.some((t: any) => t.id === s.taskId));
    const possible = allSubs.length * 5;
    const earned = allSubs.reduce((sum: number, s: any) => {
      const ev = myEvaluations.find((e: any) => e.subtaskId === s.id);
      return sum + (ev?.rating ?? 0);
    }, 0);
    return possible > 0 ? Math.round((earned / possible) * 100) : 0;
  }, [subtasks, tasks, myEvaluations, user]);

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const { supabase } = await import('@/lib/supabase');
        const result = await new Promise<any>((resolve) => {
          supabase
            .from('users')
            .select('*')
            .order('role')
            .order('name')
            .then(resolve);
        });
        
        const { data, error } = result;
        
        if (error) {
          console.error('Error fetching users:', error);
        } else {
          // Filter to only show students that belong to this instructor
          if (user?.role === 'instructor') {
            const instructorStudents = (data || []).filter((u: any) => 
              u.role === 'student' && u.instructor_id === user.id
            );
            setAllUsers(instructorStudents);
          } else {
            setAllUsers(data || []);
          }
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    if (user?.role === 'instructor') {
      fetchAllUsers();
      // Also refresh the students from the store
      refreshStudents();
    } else {
      setLoadingUsers(false);
    }
  }, [user, refreshStudents]);

  const studentsOnly = allUsers;

  const filteredStudents = studentsOnly.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddStudent = async () => {
    if (newStudentName.trim() && newStudentEmail.trim() && newStudentPassword.trim()) {
      setIsCreating(true);
      try {
        const result = await createStudent(newStudentEmail.trim(), newStudentPassword.trim(), newStudentName.trim());
        
        if (result.success) {
          setNewStudentName('');
          setNewStudentEmail('');
          setNewStudentPassword('');
          setIsAddingStudent(false);
          Alert.alert('Success', 'Student account created successfully!');
          
          // Refresh both the local state and the store
          const { supabase } = await import('@/lib/supabase');
          const freshResult = await new Promise<any>((resolve) => {
            supabase
              .from('users')
              .select('*')
              .eq('role', 'student')
              .eq('instructor_id', user?.id)
              .order('name')
              .then(resolve);
          });
          
          if (!freshResult.error && freshResult.data) {
            setAllUsers(freshResult.data);
          }
        } else {
          Alert.alert('Error', result.error || 'Failed to create student account');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to create student account');
      } finally {
        setIsCreating(false);
      }
    } else {
      Alert.alert('Error', 'Please fill in all required fields');
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      (async () => {
        const res = await signOut();
        if (!res.success) {
          Alert.alert('Error', res.error || 'Failed to logout');
        }
      })();
      return;
    }
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            const res = await signOut();
            if (!res.success) {
              Alert.alert('Error', res.error || 'Failed to logout');
            }
          },
        },
      ]
    );
  };



  // Animation effect for student progress circle
  useEffect(() => {
    if (user?.role === 'student') {
      circleAnim.stopAnimation();
      Animated.timing(circleAnim, { toValue: overallPercent, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    }
  }, [overallPercent, user, circleAnim]);

  // Fetch trainer name for student
  useEffect(() => {
    let mounted = true;
    if (user?.role === 'student' && currentStudent) {
      (async () => {
        try {
          if (!currentStudent?.instructor_id) { if (mounted) setTrainerName(''); return; }
          const { supabase } = await import('@/lib/supabase');
          const { data, error } = await supabase.from('users').select('*').eq('id', currentStudent.instructor_id).single();
          if (!mounted) return;
          if (error || !data) setTrainerName(''); else setTrainerName((data as any)?.name ?? '');
        } catch {
          if (mounted) setTrainerName('');
        }
      })();
    }
    return () => { mounted = false; };
  }, [currentStudent, user]);

  const onToggleTask = (taskId: string, isOpen: boolean) => {
    setExpandedTaskId(isOpen ? null : taskId);
  };

  if (loading || loadingUsers) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  // Admin Dashboard
  if (user?.role === 'admin') {
    const QuickAction = ({ icon, title, onPress, color = Colors.light.primary }: {
      icon: React.ReactNode;
      title: string;
      onPress: () => void;
      color?: string;
    }) => (
      <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
        <View style={[styles.quickActionIcon, { backgroundColor: color + '15' }]}>
          {icon}
        </View>
        <Text style={styles.quickActionTitle}>{title}</Text>
      </TouchableOpacity>
    );

    return (
      <View style={styles.container}>
        <View style={[styles.topHeader, { paddingTop: Math.max(10, insets.top + 6) }]} testID="admin-header">
          <View style={styles.backBtn} />
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutHeaderBtn}
            testID="logout-button"
          >
            <LogOut size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.adminHeader}>
          <View style={styles.adminHeaderInfo}>
            <View style={styles.adminIcon}>
              <Shield size={24} color={Colors.light.primary} />
            </View>
            <View>
              <Text style={styles.adminTitle}>Admin Dashboard</Text>
              <Text style={styles.adminSubtitle}>System Overview & Management</Text>
            </View>
          </View>
        </View>

        <FlatList
          data={[
            { key: 'actions' },
            { key: 'recent' }
          ]}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => {
            if (item.key === 'actions') {
              return (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Quick Actions</Text>
                  <View style={styles.quickActionsGrid}>
                    <QuickAction
                      icon={<Users size={24} color={Colors.light.primary} />}
                      title="Manage Users"
                      onPress={() => router.push('/admin/users')}
                    />
                    <QuickAction
                      icon={<AlertTriangle size={24} color="#f97316" />}
                      title="View Reports"
                      onPress={() => router.push('/admin/reports')}
                      color="#f97316"
                    />
                    <QuickAction
                      icon={<TrendingUp size={24} color="#8b5cf6" />}
                      title="Analytics"
                      onPress={() => router.push('/admin/analytics')}
                      color="#8b5cf6"
                    />
                    <QuickAction
                      icon={<Settings size={24} color="#6b7280" />}
                      title="Settings"
                      onPress={() => router.push('/admin/settings')}
                      color="#6b7280"
                    />
                    <QuickAction
                      icon={<Tag size={24} color="#f59e0b" />}
                      title="Discount Codes"
                      onPress={() => router.push('/admin/discount-codes')}
                      color="#f59e0b"
                    />
                    <QuickAction
                      icon={<ClipboardList size={24} color="#ec4899" />}
                      title="Manage Tasks"
                      onPress={() => router.push('/admin/tasks')}
                      color="#ec4899"
                    />
                  </View>
                </View>
              );
            }

            if (item.key === 'recent') {
              return (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Recent Activity</Text>
                  <View style={styles.activityList}>
                    <View style={styles.activityItem}>
                      <View style={[styles.activityIcon, { backgroundColor: '#10b981' + '15' }]}>
                        <CheckCircle size={16} color="#10b981" />
                      </View>
                      <View style={styles.activityContent}>
                        <Text style={styles.activityTitle}>Auto-approval system activated</Text>
                        <Text style={styles.activityTime}>System update</Text>
                      </View>
                    </View>
                    <View style={styles.activityItem}>
                      <View style={[styles.activityIcon, { backgroundColor: Colors.light.primary + '15' }]}>
                        <Users size={16} color={Colors.light.primary} />
                      </View>
                      <View style={styles.activityContent}>
                        <Text style={styles.activityTitle}>{students.length} students active</Text>
                        <Text style={styles.activityTime}>All approved automatically</Text>
                      </View>
                    </View>
                    <View style={styles.activityItem}>
                      <View style={[styles.activityIcon, { backgroundColor: '#3b82f6' + '15' }]}>
                        <Shield size={16} color="#3b82f6" />
                      </View>
                      <View style={styles.activityContent}>
                        <Text style={styles.activityTitle}>Admin dashboard active</Text>
                        <Text style={styles.activityTime}>Full control enabled</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            }

            return null;
          }}
          contentContainerStyle={styles.listContent}
        />
      </View>
    );
  }



  if (user?.role === 'student') {

    return (
      <View style={styles.container}>
        <View style={[styles.topHeader, { paddingTop: Math.max(10, insets.top + 6) }]} testID="student-header">
          <View style={styles.backBtn} />
          <Text style={styles.headerTitle}>Student Dashboard</Text>
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutHeaderBtn}
            testID="logout-button"
          >
            <LogOut size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerCard}>
          <View style={styles.headerInfo}>
            <View style={styles.profileIcon}>
              <User size={24} color={Colors.light.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.studentHeaderName} numberOfLines={1}>{user.name}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
              {trainerName ? <Text style={styles.trainerSubtitle} numberOfLines={1}>Instructor: {trainerName}</Text> : null}
            </View>
          </View>
          <View style={styles.circularWrapper}>
            <CircularProgress percent={overallPercent} animatedValue={circleAnim} size={88} strokeWidth={8} />
            <View style={styles.circularCenter} pointerEvents="none">
              <Text style={styles.circularPercentText}>{overallPercent}%</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionSection} testID="student-self-actions">
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/chat')} testID="student-action-chat">
            <View style={styles.actionCardIcon}><MessageSquare size={20} color={Colors.light.primary} /></View>
            <Text style={styles.actionCardLabel} numberOfLines={1}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/evaluations')} testID="student-action-evaluation">
            <View style={styles.actionCardIcon}><ClipboardList size={20} color={Colors.light.primary} /></View>
            <Text style={styles.actionCardLabel} numberOfLines={1}>Evaluation</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/schedule')} testID="student-action-schedule">
            <View style={styles.actionCardIcon}><CalendarDays size={20} color={Colors.light.primary} /></View>
            <Text style={styles.actionCardLabel} numberOfLines={1}>Schedule</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.capitalSelector}>
          <FlatList
            data={[1,2,3,4] as Array<1|2|3|4>}
            keyExtractor={(i) => String(i)}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.capitalScrollContent}
            renderItem={({ item: c }) => (
              <TouchableOpacity
                onPress={() => setSelectedCapital(c)}
                style={[styles.capitalButton, selectedCapital === c && styles.capitalButtonActive]}
                testID={`student-capital-${c}`}
              >
                <Text style={[styles.capitalButtonText, selectedCapital === c && styles.capitalButtonTextActive]}>Section {c}</Text>
                <Text style={[styles.capitalPercentage, selectedCapital === c && styles.capitalPercentageActive]}>{capitalPercentages[c]}%</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        <FlatList
          data={capitalTasks}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }) => {
            const isOpen = expandedTaskId === item.id;
            const taskSubs = subtasks.filter((s: any) => s.taskId === item.id);
            const notes = getEvaluationNotes(user.id, item.id);
            return (
              <View style={styles.taskCard}>
                <TouchableOpacity onPress={() => onToggleTask(item.id, isOpen)} style={styles.taskHeaderRow} testID={`student-self-task-${item.id}`}>
                  <View style={styles.taskIcon}><ClipboardList size={20} color={Colors.light.primary} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.taskName}>{item.name}</Text>
                    <Text style={styles.taskMeta}>Section {item.capital}</Text>
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
                    {taskSubs.map((st: any) => {
                      const ev = myEvaluations.find((e: any) => e.taskId === item.id && e.subtaskId === st.id);
                      const val = ev?.rating ?? 0;
                      return (
                        <View key={st.id} style={styles.SubTaskRow}>
                          <Text style={styles.SubTaskName}>{st.name}</Text>
                          <View pointerEvents="none">
                            <RatingInput value={val} onChange={() => {}} disabled size="small" />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          }}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>No tasks in this capital yet</Text></View>}
        />

      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.topHeader, { paddingTop: Math.max(10, insets.top + 6) }]} testID="instructor-header">
        <View style={styles.backBtn} />
        <Text style={styles.headerTitle}>Students</Text>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutHeaderBtn}
          testID="logout-button"
        >
          <LogOut size={16} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.contentWrapper}>
      <View style={styles.topSection}>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => {
            setShowSearchInput(!showSearchInput);
            if (showSearchInput) {
              setSearchQuery('');
            }
          }}
        >
          <Search size={20} color={Colors.light.textLight} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.addStudentButton} 
          onPress={() => setIsAddingStudent(true)}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Student</Text>
        </TouchableOpacity>
      </View>

      {showSearchInput && (
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search students..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.light.textLight}
            autoFocus
          />
        </View>
      )}

      {isAddingStudent ? (
        <View style={styles.addStudentForm}>
          <TextInput
            style={styles.input}
            placeholder="Student Name"
            value={newStudentName}
            onChangeText={setNewStudentName}
            placeholderTextColor={Colors.light.textLight}
            autoFocus
          />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            value={newStudentEmail}
            onChangeText={setNewStudentEmail}
            placeholderTextColor={Colors.light.textLight}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={newStudentPassword}
            onChangeText={setNewStudentPassword}
            placeholderTextColor={Colors.light.textLight}
            secureTextEntry
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={() => {
                setIsAddingStudent(false);
                setNewStudentName('');
                setNewStudentEmail('');
                setNewStudentPassword('');
              }}
              disabled={isCreating}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.saveButton, isCreating && styles.disabledButton]} 
              onPress={handleAddStudent}
              disabled={isCreating}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <StudentCard student={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No students found</Text>
          </View>
        }
      />
      </View>
    </View>
  );
}

function CircularProgress({ percent, animatedValue, size, strokeWidth }: { percent: number; animatedValue: Animated.Value; size: number; strokeWidth: number; }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  // Fixed calculation: when percent is 0, offset should be circumference (no line)
  // when percent is 100, offset should be 0 (full line)
  const dashOffsetStatic = circumference * (1 - clamped / 100);
  
  if (Platform.OS === 'web') {
    return (
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size/2} cy={size/2} r={radius} stroke={Colors.light.border} strokeWidth={strokeWidth} fill="none" />
        <Circle 
          cx={size/2} 
          cy={size/2} 
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
    outputRange: [circumference, circumference * (1 - clamped / 100)], 
    extrapolate: 'clamp' 
  });
  
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);
  
  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle cx={size/2} cy={size/2} r={radius} stroke={Colors.light.border} strokeWidth={strokeWidth} fill="none" />
      <AnimatedCircle 
        cx={size/2} 
        cy={size/2} 
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
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
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  logoutHeaderBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrapper: {
    flex: 1,
    padding: 16,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  searchButton: {
    width: 50,
    height: 50,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  addStudentButton: {
    flex: 1,
    height: 50,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInputContainer: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  logoutButton: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    height: 50,
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
  addStudentForm: {
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
  disabledButton: {
    opacity: 0.6,
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
  sectionHeader: {
    paddingHorizontal: 4,
    paddingVertical: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  studentProfileContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
  },
  headerCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 14,
    margin: 16,
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
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 12 },
  studentHeaderName: { fontSize: 18, fontWeight: '700', color: Colors.light.text },
  trainerSubtitle: { fontSize: 12, color: Colors.light.textLight, marginTop: 2 },
  circularWrapper: { width: 88, height: 88, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  circularCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  circularPercentText: { fontSize: 18, fontWeight: '800', color: Colors.light.primary },
  actionSection: { marginBottom: 16, marginHorizontal: 16, gap: 12, flexDirection: 'row', justifyContent: 'space-between' },
  actionCard: { flex: 1, height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.cardBackground, borderRadius: 14, borderWidth: 1, borderColor: Colors.light.border, paddingHorizontal: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  actionCardIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.light.background, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  actionCardLabel: { fontSize: 14, fontWeight: '700', color: Colors.light.primary, flexShrink: 1 },
  capitalSelector: { marginBottom: 16, marginHorizontal: 16 },
  capitalScrollContent: { paddingHorizontal: 4, gap: 8 },
  capitalButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.light.background, borderWidth: 1, borderColor: Colors.light.border, alignItems: 'center', minWidth: 80 },
  capitalButtonActive: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  capitalButtonText: { fontSize: 12, color: Colors.light.textLight, fontWeight: '500' },
  capitalButtonTextActive: { color: '#fff', fontWeight: '600' },
  capitalPercentage: { fontSize: 10, color: Colors.light.textLight, fontWeight: '500', marginTop: 2 },
  capitalPercentageActive: { color: '#fff', fontWeight: '600' },
  taskCard: { backgroundColor: Colors.light.cardBackground, borderRadius: 14, padding: 14, marginHorizontal: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 1 },
  taskHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  taskIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.light.background, alignItems: 'center', justifyContent: 'center' },
  taskName: { fontSize: 18, fontWeight: '700', color: Colors.light.text },
  taskMeta: { fontSize: 12, color: Colors.light.textLight },
  badge: { backgroundColor: Colors.light.primary, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, marginRight: 6 },
  badgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  taskBody: { marginTop: 10, gap: 8 },
  notesBox: { backgroundColor: Colors.light.background, borderRadius: 8, padding: 10, borderLeftWidth: 3, borderLeftColor: Colors.light.primary },
  notesTitle: { fontSize: 12, color: Colors.light.textLight, fontWeight: '600', marginBottom: 4 },
  notesText: { fontSize: 14, color: Colors.light.text, lineHeight: 20 },
  SubTaskRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.light.background, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  SubTaskName: { fontSize: 14, color: Colors.light.text, flex: 1, marginRight: 8 },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileIcon: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 50,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
  },
  profileEmail: {
    fontSize: 16,
    color: Colors.light.textLight,
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.light.cardBackground,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  quickButtonText: {
    color: Colors.light.primary,
    fontWeight: '700',
  },
  profileActions: {
    width: '100%',
    marginBottom: 32,
  },
  studentLogoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  logoutButtonText: {
    color: Colors.light.danger,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: Colors.light.textLight,
    lineHeight: 24,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    width: '48%',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  statTitle: {
    fontSize: 12,
    color: Colors.light.textLight,
    fontWeight: '600',
  },
  statSubtitle: {
    fontSize: 10,
    color: Colors.light.textLight,
    marginTop: 2,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.light.textLight,
    marginTop: 2,
  },
});