import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Student } from '@/types';
import { useAuth } from './useAuthStore';
import createContextHook from '@nkzw/create-context-hook';
import { trpcClient } from '@/lib/trpc';

export const [StudentProvider, useStudentStore] = createContextHook(() => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { user } = useAuth();

  const fetchStudents = useCallback(async () => {
    if (!user || user.role !== 'instructor') return;

    setLoading(true);
    try {
      const result = supabase
        .from('users')
        .select('*')
        .eq('role', 'student')
        .eq('instructor_id', user.id)
        .order('name');

      result.then(({ data, error }: any) => {
        if (error) {
          console.error('Error fetching students:', error);
        } else {
          setStudents(data as Student[]);
        }
        setLoading(false);
      });
    } catch (error) {
      console.error('Error fetching students:', error);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'instructor') {
      fetchStudents();
      
      // Set up realtime subscription for students
      console.log('📡 Setting up realtime subscription for students');
      const subscription = supabase
        .channel('students-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'users',
            filter: `instructor_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('📡 Realtime student change:', payload);
            
            if (payload.eventType === 'INSERT') {
              const newStudent = payload.new as Student;
              if (newStudent.role === 'student') {
                setStudents(prev => [...prev, newStudent]);
              }
            } else if (payload.eventType === 'UPDATE') {
              const updatedStudent = payload.new as Student;
              if (updatedStudent.role === 'student') {
                setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
              }
            } else if (payload.eventType === 'DELETE') {
              const deletedStudent = payload.old as Student;
              setStudents(prev => prev.filter(s => s.id !== deletedStudent.id));
            }
          }
        )
        .subscribe();
        
      return () => {
        console.log('📡 Cleaning up realtime subscription for students');
        subscription.unsubscribe();
      };
    } else if (user?.role === 'student') {
      // For students, set themselves as the only "student" in the list
      setStudents([user as Student]);
      setLoading(false);
    } else {
      // For other roles (admin), just set loading to false
      setLoading(false);
    }
  }, [user, fetchStudents]);

  const createStudent = useCallback(async (email: string, password: string, name: string) => {
    console.log('👨‍🏫 createStudent called', { hasUser: !!user, userId: user?.id, userRole: user?.role, email });
    if (!user) {
      return { success: false, error: 'You must be logged in to create students' };
    }

    let isInstructor = user.role === 'instructor';
    if (!isInstructor) {
      try {
        console.log('🔎 Verifying role from profile for user', user.id);
        const { data: freshProfile, error: profileErr } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        if (profileErr) {
          console.log('⚠️ Could not verify role from profile:', profileErr);
        } else {
          console.log('📄 Fresh profile role:', (freshProfile as any)?.role);
          isInstructor = (freshProfile as any)?.role === 'instructor';
        }
      } catch (e) {
        console.log('⚠️ Role verification failed:', e);
      }
    }

    if (!isInstructor) {
      return { success: false, error: 'Only instructors are allowed to create student accounts.' };
    }

    try {
      console.log('👨‍🎓 Student store: Creating student account for:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('🚨 Student store: Auth signup error:', error);
        throw error;
      }

      if (data?.user) {
        console.log('✅ Student store: Auth user created, creating profile...');
        const profileQuery = supabase
          .from('users')
          .insert({
            id: (data as any).user.id,
            name,
            email,
            role: 'student',
            instructor_id: user.id,
          });

        const profileResult = await new Promise((resolve) => {
          (profileQuery as any).then(resolve);
        });
        const profileError = (profileResult as any).error;

        if (profileError) {
          console.error('🚨 Student store: Profile creation error:', {
            message: (profileError as any)?.message ?? String(profileError ?? ''),
            code: (profileError as any)?.code,
            details: (profileError as any)?.details,
            hint: (profileError as any)?.hint,
          });
          throw profileError;
        }
        console.log('✅ Student store: Student profile created successfully');

        await fetchStudents();
      }

      return { success: true, error: null };
    } catch (error: any) {
      console.error('🚨 Student store: Error creating student:', error);
      return { success: false, error: error?.message ?? 'Failed to create student' };
    }
  }, [user, fetchStudents]);

  const getStudentById = useCallback((id: string) => {
    return students.find(student => student.id === id);
  }, [students]);

  const updateStudent = useCallback(async (id: string, updates: Partial<Student>) => {
    if (!user || user.role !== 'instructor') {
      return { success: false, error: 'Only instructors can update students' };
    }

    try {
      const query = supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .eq('instructor_id', user.id);

      const result = await new Promise((resolve) => {
        query.then(resolve);
      });
      if ((result as any).error) throw (result as any).error;

      // Update local state
      setStudents(prev => prev.map(student => 
        student.id === id ? { ...student, ...updates } : student
      ));

      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error updating student:', error);
      return { success: false, error: error.message };
    }
  }, [user]);

  const deleteStudent = useCallback(async (id: string) => {
    if (!user || user.role !== 'instructor') {
      return { success: false, error: 'Only instructors can delete students' };
    }

    try {
      console.log('🗑️ Student store: Using tRPC to atomically delete student:', id);
      
      // Use tRPC procedure for atomic deletion (auth + database)
      const result = await trpcClient.admin.deleteUser.mutate({
        userId: id,
        requesterId: user.id,
      });
      
      console.log('✅ Student deleted successfully via tRPC:', result);
      
      // Local state will be updated via realtime subscription
      // But we can also update it immediately for better UX
      setStudents(prev => prev.filter(student => student.id !== id));

      return { success: true, error: null };
    } catch (error: any) {
      console.error('🚨 Error deleting student via tRPC:', error);
      return { success: false, error: error.message || 'Failed to delete student' };
    }
  }, [user]);

  return useMemo(() => ({
    students,
    loading,
    createStudent,
    getStudentById,
    updateStudent,
    deleteStudent,
    refreshStudents: fetchStudents,
  }), [students, loading, createStudent, getStudentById, updateStudent, deleteStudent, fetchStudents]);
});