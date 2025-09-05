import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Student } from '@/types';
import { useAuth } from './useAuthStore';
import createContextHook from '@nkzw/create-context-hook';

export const [StudentProvider, useStudentStore] = createContextHook(() => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { user } = useAuth();

  const fetchStudents = useCallback(async () => {
    if (!user || user.role !== 'trainer') return;

    setLoading(true);
    try {
      const result = supabase
        .from('users')
        .select('*')
        .eq('role', 'student')
        .eq('trainer_id', user.id)
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
    if (user?.role === 'trainer') {
      fetchStudents();
    } else if (user?.role === 'student') {
      // For students, set themselves as the only "student" in the list
      setStudents([user as Student]);
    }
  }, [user, fetchStudents]);

  const createStudent = useCallback(async (email: string, password: string, name: string) => {
    console.log('👨‍🏫 createStudent called', { hasUser: !!user, userId: user?.id, userRole: user?.role, email });
    if (!user) {
      return { success: false, error: 'You must be logged in to create students' };
    }

    let isTrainer = user.role === 'trainer';
    if (!isTrainer) {
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
          isTrainer = (freshProfile as any)?.role === 'trainer';
        }
      } catch (e) {
        console.log('⚠️ Role verification failed:', e);
      }
    }

    if (!isTrainer) {
      return { success: false, error: 'Only trainers are allowed to create student accounts.' };
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
            trainer_id: user.id,
            password, // Include password for mock database
            is_approved: true, // Auto-approve by default
            is_restricted: false, // Not restricted by default
            status: 'active', // Set as active by default
          });

        const profileResult = await new Promise((resolve) => {
          (profileQuery as any).then(resolve);
        });
        const profileError = (profileResult as any).error;

        if (profileError) {
          console.error('🚨 Student store: Profile creation error:', profileError);
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
    if (!user || user.role !== 'trainer') {
      return { success: false, error: 'Only trainers can update students' };
    }

    try {
      const query = supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .eq('trainer_id', user.id);

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
    if (!user || user.role !== 'trainer') {
      return { success: false, error: 'Only trainers can delete students' };
    }

    try {
      // For mock implementation, we only need to delete from users table
      // In real Supabase, you would also delete from auth using admin.deleteUser
      const query = supabase
        .from('users')
        .delete()
        .eq('id', id)
        .eq('trainer_id', user.id);

      const result = await new Promise((resolve) => {
        query.then(resolve);
      });
      if ((result as any).error) throw (result as any).error;

      // Update local state
      setStudents(prev => prev.filter(student => student.id !== id));

      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error deleting student:', error);
      return { success: false, error: error.message };
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