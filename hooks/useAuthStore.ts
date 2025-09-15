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
        .select('id,name,email,role,instructor_id,created_at')
        .eq('id', userId)
        .single();

      if (error) {
        const safeError = {
          message: (error as any)?.message ?? String(error ?? ''),
          code: (error as any)?.code,
          details: (error as any)?.details,
          hint: (error as any)?.hint,
        };
        try {
          console.error('❌ Error fetching user profile:', JSON.stringify(safeError));
        } catch {
          console.error('❌ Error fetching user profile:', safeError);
        }

        const sessionRes = await supabase.auth.getUser();
        const authUser = sessionRes.data.user;
        const metaRole = ((authUser?.app_metadata as any)?.role ?? (authUser?.user_metadata as any)?.role) as User['role'] | undefined;
        const inferredRole: User['role'] = metaRole === 'student' || metaRole === 'admin' || metaRole === 'instructor' ? metaRole : 'student';
        const inferredInstructorId = (authUser?.user_metadata as any)?.instructor_id as string | undefined;

        if ((safeError.code === 'PGRST116') || (safeError.message?.toLowerCase?.().includes('no rows'))) {
          console.log('ℹ️ No profile found. Creating a new minimal profile row for user:', userId);
          if (!authUser) {
            console.warn('⚠️ No auth user available to seed profile. Aborting profile creation.');
            setAuthState({ user: null, isAuthenticated: false, isLoading: false });
            return;
          }
          const minimal: Partial<User> & { id: string; email: string; role: User['role'] } = {
            id: authUser.id,
            email: authUser.email ?? '',
            name: (authUser.user_metadata as any)?.name ?? authUser.email ?? 'New User',
            role: inferredRole,
            status: 'active',
            is_approved: true,
            is_restricted: false,
            ...(inferredRole === 'student' && inferredInstructorId ? { instructor_id: inferredInstructorId } : {}),
          } as const;
          
          console.log('🔧 Creating profile with data:', minimal);
          const { data: inserted, error: insertErr } = await supabase
            .from('users')
            .upsert(minimal, { onConflict: 'id' })
            .select('id,name,email,role,instructor_id,created_at')
            .single();
          if (insertErr) {
            console.error('🚨 Failed to auto-create user profile:', {
              message: (insertErr as any)?.message,
              code: (insertErr as any)?.code,
              details: (insertErr as any)?.details,
              hint: (insertErr as any)?.hint,
            });
            setAuthState({ user: { id: authUser.id, name: (minimal.name ?? authUser.email ?? 'User'), email: minimal.email ?? '', role: inferredRole, instructor_id: inferredInstructorId }, isAuthenticated: true, isLoading: false });
            return;
          }
          console.log('✅ Auto-created user profile:', inserted);
          setAuthState({ user: inserted as unknown as User, isAuthenticated: true, isLoading: false });
          return;
        }

        if (safeError.code === 'PGRST204') {
          console.warn('⚠️ Schema cache issue detected. Proceeding without extra columns.');
          setAuthState({ user: { id: userId, name: authUser?.email ?? 'User', email: authUser?.email ?? '', role: inferredRole, instructor_id: inferredInstructorId }, isAuthenticated: true, isLoading: false });
          return;
        }

        if (authUser) {
          console.warn('⚠️ Proceeding with minimal auth user due to profile fetch error');
          setAuthState({ user: { id: authUser.id, name: (authUser.user_metadata as any)?.name ?? authUser.email ?? 'User', email: authUser.email ?? '', role: inferredRole, instructor_id: inferredInstructorId }, isAuthenticated: true, isLoading: false });
          return;
        }

        setAuthState({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      try { console.log('✅ User profile fetched successfully:', JSON.stringify(data)); } catch { console.log('✅ User profile fetched successfully'); }
      setAuthState({
        user: data as User,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      const safe = {
        message: error?.message || 'Unknown error',
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      };
      try { console.error('🚨 Error in fetchUserProfile:', JSON.stringify(safe)); } catch { console.error('🚨 Error in fetchUserProfile:', safe); }
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
        options: { emailRedirectTo: undefined, data: { name, role, instructor_id: instructorId } }
      });

      if (error) {
        console.error('🚨 Auth store: Sign up auth error:', error);
        throw error;
      }

      if (data.user) {
        console.log('✅ Auth store: Auth user created, creating profile...');
        // Create user profile with minimal columns to avoid DB schema mismatch errors
        const basePayload = {
          id: data.user.id,
          name,
          email,
          role,
          instructor_id: instructorId || null,
          status: 'active',
          is_approved: true,
          is_restricted: false,
        } as const;
        
        console.log('🔧 Creating profile during signup with data:', basePayload);

        let profileError: any = null;
        try {
          const { error: insertErr } = await supabase
            .from('users')
            .insert(basePayload)
            .select();
          profileError = insertErr ?? null;
        } catch (e: any) {
          profileError = e;
        }

        // If it still fails for some other reason, surface a friendly error
        if (profileError) {
          console.error('🚨 Auth store: Profile creation error:', {
            message: profileError?.message ?? String(profileError ?? ''),
            code: profileError?.code,
            details: profileError?.details,
            hint: profileError?.hint,
          });
          throw new Error(
            profileError?.message || 'Profile creation failed. Please try again.'
          );
        }
        console.log('✅ Auth store: User profile created successfully');
      }

      return { success: true, error: null };
    } catch (error: any) {
      console.error('🚨 Auth store: Sign up error:', error);
      
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