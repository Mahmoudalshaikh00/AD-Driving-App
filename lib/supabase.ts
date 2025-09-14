import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!url || !anonKey) {
  console.error('Supabase env vars missing. Ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set.');
}

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: 'instructor' | 'student' | 'admin';
          instructor_id: string | null;
          created_at: string;
          is_approved?: boolean;
          is_restricted?: boolean;
          status?: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          role: 'instructor' | 'student' | 'admin';
          instructor_id?: string | null;
          created_at?: string;
          is_approved?: boolean;
          is_restricted?: boolean;
          status?: string;
        };
        Update: Partial<Database['public']['Tables']['users']['Row']>;
      };
      evaluations: {
        Row: {
          id: string;
          student_id: string;
          instructor_id: string;
          date: string;
          score: number;
          feedback: string;
          created_at: string;
        };
        Insert: Partial<Omit<Database['public']['Tables']['evaluations']['Row'], 'id'>> & { id?: string };
        Update: Partial<Database['public']['Tables']['evaluations']['Row']>;
      };
      reports: {
        Row: {
          id: string;
          student_id: string;
          instructor_id: string;
          title: string;
          content: string;
          created_at: string;
        };
        Insert: Partial<Omit<Database['public']['Tables']['reports']['Row'], 'id'>> & { id?: string };
        Update: Partial<Database['public']['Tables']['reports']['Row']>;
      };
    };
  };
};