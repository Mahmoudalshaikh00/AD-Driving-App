# Supabase Database Setup - URGENT FIX

## 🚨 IMMEDIATE ACTION REQUIRED

**The `is_approved` column error needs to be fixed immediately. Follow these steps:**

### 1. Add Missing Columns to Users Table

**Go to Supabase Dashboard → SQL Editor and run this SQL:**

```sql
-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_restricted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Update existing users to have the new columns
UPDATE users 
SET 
  is_approved = true,
  is_restricted = false,
  status = 'active'
WHERE is_approved IS NULL OR is_restricted IS NULL OR status IS NULL;
```

### 2. Disable Email Confirmation (REQUIRED)

**Go to Supabase Dashboard → Authentication → Settings:**

1. **UNCHECK "Enable email confirmations"** ✅
2. **Set "Site URL"** to: `https://ad-driving-app.vercel.app`
3. **Add redirect URLs** (if needed): `https://ad-driving-app.vercel.app/**`

### 3. Complete Database Schema

**Run this SQL to ensure all tables exist with correct structure:**

```sql
-- Create users table with all required columns
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('instructor', 'student', 'admin')),
  instructor_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_approved BOOLEAN DEFAULT true,
  is_restricted BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active'
);

-- Create evaluations table
CREATE TABLE IF NOT EXISTS public.evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  instructor_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  feedback TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  instructor_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Instructors can view their students" ON public.users;
DROP POLICY IF EXISTS "Instructors can create students" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Instructors can view their students" ON public.users
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'instructor'
    ) AND instructor_id = auth.uid()
  );

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Instructors can create student accounts" ON public.users
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'instructor'
    ) AND role = 'student'
  );

CREATE POLICY "Admins can manage all users" ON public.users
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Allow public signup for instructors (no auth required for first instructor)
CREATE POLICY "Allow instructor signup" ON public.users
  FOR INSERT WITH CHECK (role = 'instructor');

-- Evaluations policies
CREATE POLICY "Users can view their own evaluations" ON public.evaluations
  FOR SELECT USING (
    auth.uid() = student_id OR auth.uid() = instructor_id
  );

CREATE POLICY "Instructors can create evaluations for their students" ON public.evaluations
  FOR INSERT WITH CHECK (
    auth.uid() = instructor_id AND
    student_id IN (
      SELECT id FROM public.users WHERE instructor_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can update their evaluations" ON public.evaluations
  FOR UPDATE USING (auth.uid() = instructor_id);

CREATE POLICY "Admins can manage all evaluations" ON public.evaluations
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Reports policies
CREATE POLICY "Users can view their own reports" ON public.reports
  FOR SELECT USING (
    auth.uid() = student_id OR auth.uid() = instructor_id
  );

CREATE POLICY "Instructors can create reports for their students" ON public.reports
  FOR INSERT WITH CHECK (
    auth.uid() = instructor_id AND
    student_id IN (
      SELECT id FROM public.users WHERE instructor_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can update their reports" ON public.reports
  FOR UPDATE USING (auth.uid() = instructor_id);

CREATE POLICY "Admins can manage all reports" ON public.reports
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );
```

### 4. Create Admin User (Optional)

**Run this SQL to create an admin user:**

```sql
-- Create admin user in auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@drivingschool.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Create admin profile in users table
INSERT INTO public.users (id, name, email, role, is_approved, is_restricted, status)
SELECT 
  id,
  'Admin User',
  'admin@drivingschool.com',
  'admin',
  true,
  false,
  'active'
FROM auth.users 
WHERE email = 'admin@drivingschool.com';
```

## ✅ Verification Checklist

After running the SQL scripts above:

1. ✅ **Check users table has new columns:**
   - `is_approved` (boolean, default true)
   - `is_restricted` (boolean, default false) 
   - `status` (text, default 'active')

2. ✅ **Disable email confirmation in Supabase Auth Settings**

3. ✅ **Test user registration:**
   - Should work without email confirmation
   - No more `is_approved` column errors

4. ✅ **Test admin login (if created):**
   - Email: `admin@drivingschool.com`
   - Password: `admin123`

## 🚀 Environment Variables

**Verify these are set in Vercel:**

```
EXPO_PUBLIC_RORK_API_BASE_URL=ad-driving-app.vercel.app
EXPO_PUBLIC_SUPABASE_URL=https://odhzoecsqvusjgftyusc.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kaHpvZWNzcXZ1c2pnZnR5dXNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NDAzMDMsImV4cCI6MjA3MDQxNjMwM30.PGFdB-k7qeXuhNt7oBG3SdNGxeDui2TnF1YmxNsUpdo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kaHpvZWNzcXZ1c2pnZnR5dXNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDg0MDMwMywiZXhwIjoyMDcwNDE2MzAzfQ.7Kr86172TTI9_MtHhEZiCm6HKnAiVUy_82hc1pjV2fo
```

## 🎯 After Fix - App Should Work

- ✅ Instructors can create accounts without email confirmation
- ✅ Students can be created by instructors
- ✅ Multi-device login works
- ✅ Admin changes sync across all users
- ✅ No more `is_approved` column errors

## 🆘 If Still Having Issues

1. **Check Supabase logs** in Dashboard → Logs
2. **Verify RLS policies** are active
3. **Confirm email confirmation is disabled**
4. **Test with a fresh browser/incognito mode**