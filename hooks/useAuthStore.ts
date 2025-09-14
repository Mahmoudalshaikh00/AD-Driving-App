import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { User, AuthState } from '@/types';
import createContextHook from '@nkzw/create-context-hook';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      console.log('👤 Fetching user profile for ID:', userId);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching user profile:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      console.log('✅ User profile fetched successfully:', data);
      setAuthState({
        user: data as User,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('🚨 Error in fetchUserProfile:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

  const signUp = useCallback(async (email: string, password: string, name: string, role: 'instructor' | 'student' | 'admin', instructorId?: string) => {
    try {
      console.log('🔐 Auth store: Starting sign up process for:', email, 'role:', role);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('🚨 Auth store: Sign up auth error:', error);
        throw error;
      }

      if (data.user) {
        console.log('✅ Auth store: Auth user created, creating profile...');
        // Create user profile
        // Auto-approve all new users by default
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            name,
            email,
            role,
            instructor_id: instructorId || null,
          })
          .select();

        if (profileError) {
          console.error('🚨 Auth store: Profile creation error:', profileError);
          throw profileError;
        }
        console.log('✅ Auth store: User profile created successfully with auto-approval');
      }

      return { success: true, error: null };
    } catch (error: any) {
      console.error('🚨 Auth store: Sign up error:', error);
      
      // Provide more helpful error messages
      if (error.message?.includes('Network request failed')) {
        return { 
          success: false, 
          error: 'Unable to connect to server. Please check your internet connection and Supabase configuration.' 
        };
      }
      
      return { success: false, error: error.message || 'Sign up failed' };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      console.log('🔑 Auth store: Starting sign in process for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('🚨 Auth store: Sign in error:', error);
        throw error;
      }

      console.log('✅ Auth store: Sign in successful, data:', data);
      return { success: true, error: null };
    } catch (error: any) {
      console.error('🚨 Auth store: Sign in error:', error);
      
      // Provide more helpful error messages
      if (error.message?.includes('Network request failed')) {
        return { 
          success: false, 
          error: 'Unable to connect to server. Please check your internet connection and Supabase configuration.' 
        };
      }
      
      return { success: false, error: error.message || 'Sign in failed' };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const createStudentAccount = useCallback(async (email: string, password: string, name: string) => {
    if (!authState.user) {
      return { success: false, error: 'You must be logged in to create student accounts' };
    }
    
    if (authState.user.role !== 'instructor') {
      return { success: false, error: 'Only instructors are allowed to create student accounts.' };
    }

    console.log('👨‍🎓 Auth store: Creating student account for:', email);
    const result = await signUp(email, password, name, 'student', authState.user.id);
    console.log('👨‍🎓 Auth store: Student account creation result:', result);
    return result;
  }, [authState.user, signUp]);

  return useMemo(() => ({
    ...authState,
    signUp,
    signIn,
    signOut,
    createStudentAccount,
  }), [authState, signUp, signIn, signOut, createStudentAccount]);
});