import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Try multiple sources for environment variables
const url = process.env.EXPO_PUBLIC_SUPABASE_URL || 
           Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || 
           'https://odhzoecsqvusjgftyusc.supabase.co';

const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
               Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
               'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kaHpvZWNzcXZ1c2pnZnR5dXNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NDAzMDMsImV4cCI6MjA3MDQxNjMwM30.PGFdB-k7qeXuhNt7oBG3SdNGxeDui2TnF1YmxNsUpdo';

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                      Constants.expoConfig?.extra?.SUPABASE_SERVICE_ROLE_KEY || 
                      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kaHpvZWNzcXZ1c2pnZnR5dXNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDg0MDMwMywiZXhwIjoyMDcwNDE2MzAzfQ.7Kr86172TTI9_MtHhEZiCm6HKnAiVUy_82hc1pjV2fo';

console.log('Supabase config:', {
  url: url ? 'SET' : 'MISSING',
  anonKey: anonKey ? 'SET' : 'MISSING',
  serviceRoleKey: serviceRoleKey ? 'SET' : 'MISSING'
});

if (!url || !anonKey) {
  console.error('Supabase env vars missing. Ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set.');
  console.error('Current values:', { url, anonKey: anonKey ? 'SET' : 'MISSING' });
}

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Admin client for backend operations
export const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
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