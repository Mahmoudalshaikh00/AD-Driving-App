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
      console.log('📚 Fetching students for instructor:', user.id);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'student')
        .eq('instructor_id', user.id)
        .order('name');

      if (error) {
        console.error('❌ Error fetching students:', error);
      } else {
        console.log('✅ Fetched students:', data?.length || 0);
        setStudents(data as Student[] || []);
      }
    } catch (error) {
      console.error('🚨 Error fetching students:', error);
    } finally {
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

    let isInstructor = user.role === 'instructor' || user.role === 'admin';
    if (!isInstructor) {
      try {
        console.log('🔎 Verifying role from profile for user', user.id);
        const { data: freshProfile, error: profileErr } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profileErr) {
          console.log('⚠️ Could not verify role from profile:', profileErr);
        } else {
          console.log('📄 Fresh profile role:', (freshProfile as any)?.role);
          isInstructor = (freshProfile as any)?.role === 'instructor' || (freshProfile as any)?.role === 'admin';
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

      // Try tRPC first, fallback to direct Supabase if it fails
      try {
        const result = await trpcClient.admin.createStudentForInstructor.mutate({
          instructorId: user.id,
          email,
          password,
          name,
        });

        console.log('✅ Student created via tRPC:', result);
        await fetchStudents();
        return { success: true, error: null };
      } catch (trpcError: any) {
        console.log('⚠️ tRPC failed, trying direct Supabase approach:', trpcError.message);
        
        // Fallback to direct Supabase admin operations
        const { supabaseAdmin } = await import('@/lib/supabase');
        
        // Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name, instructor_id: user.id },
          app_metadata: { role: 'student' },
        });

        if (authError || !authData.user) {
          throw new Error(`Failed to create auth user: ${authError?.message}`);
        }

        // First verify instructor exists in users table
        const { data: instructorExists, error: checkError } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single();

        if (checkError || !instructorExists) {
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          throw new Error('Instructor not found in users table. Please ensure your account is properly set up.');
        }

        // Create profile in users table
        const { error: profileError } = await supabaseAdmin
          .from('users')
          .insert({
            id: authData.user.id,
            name,
            email,
            role: 'student',
            instructor_id: user.id,
            status: 'active',
            is_approved: true,
            is_restricted: false,
          });

        if (profileError) {
          // Cleanup auth user if profile creation fails
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          throw new Error(`Failed to create student profile: ${profileError.message}`);
        }

        console.log('✅ Student created via direct Supabase:', authData.user.id);
        await fetchStudents();
        return { success: true, error: null };
      }
    } catch (error: any) {
      console.error('🚨 Student store: Error creating student:', error);
      
      let errorMessage = 'Failed to create student';
      
      if (error?.message) {
        if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
          errorMessage = 'Network error: Please check your internet connection and try again';
        } else if (error.message.includes('JSON Parse error')) {
          errorMessage = 'Server error: Using fallback method';
        } else if (error.message.includes('HTTP 404')) {
          errorMessage = 'API endpoint not found: Using fallback method';
        } else if (error.message.includes('HTTP 500')) {
          errorMessage = 'Server error: Please try again later';
        } else if (error.message.includes('duplicate key value')) {
          errorMessage = 'A user with this email already exists';
        } else {
          errorMessage = error.message;
        }
      }
      
      return { success: false, error: errorMessage };
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