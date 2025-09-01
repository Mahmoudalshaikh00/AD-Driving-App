# Supabase Setup Guide

## 🚀 Quick Setup

The network errors you're seeing are because the app needs to be connected to a real Supabase project. Here's how to fix it:

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Sign in
3. Click "New Project"
4. Choose your organization and create a project
5. Wait for the project to be ready (takes ~2 minutes)

### 2. Get Your Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** (looks like: `https://abcdefghijk.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### 3. Update Your App

Open `lib/supabase.ts` and replace the placeholder values:

```typescript
// Replace these lines:
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseAnonKey = 'your-anon-key';

// With your actual values:
const supabaseUrl = 'https://your-actual-project-id.supabase.co';
const supabaseAnonKey = 'your-actual-anon-key-here';
```

### 4. Set Up Database Tables

In your Supabase dashboard, go to **SQL Editor** and run this script:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create users table
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('instructor', 'student')),
  instructor_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create evaluations table
CREATE TABLE public.evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  instructor_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  feedback TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reports table
CREATE TABLE public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  instructor_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security policies
-- Users can only see their own data or data they're authorized to see
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Instructors can view their students" ON public.users
  FOR SELECT USING (
    auth.uid() = instructor_id OR 
    (auth.uid() IN (SELECT id FROM public.users WHERE role = 'instructor'))
  );

-- Instructors can create student accounts
CREATE POLICY "Instructors can create students" ON public.users
  FOR INSERT WITH CHECK (
    role = 'student' AND 
    instructor_id = auth.uid() AND
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'instructor')
  );

-- Evaluation policies
CREATE POLICY "Users can view relevant evaluations" ON public.evaluations
  FOR SELECT USING (
    auth.uid() = student_id OR 
    auth.uid() = instructor_id
  );

CREATE POLICY "Instructors can create evaluations" ON public.evaluations
  FOR INSERT WITH CHECK (auth.uid() = instructor_id);

CREATE POLICY "Instructors can update their evaluations" ON public.evaluations
  FOR UPDATE USING (auth.uid() = instructor_id);

-- Report policies
CREATE POLICY "Users can view relevant reports" ON public.reports
  FOR SELECT USING (
    auth.uid() = student_id OR 
    auth.uid() = instructor_id
  );

CREATE POLICY "Instructors can create reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = instructor_id);

CREATE POLICY "Instructors can update their reports" ON public.reports
  FOR UPDATE USING (auth.uid() = instructor_id);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
```

### 5. Test the Connection

After updating the credentials, restart your app. The network errors should be resolved and you should be able to:

- Create instructor accounts
- Sign in/out
- Create student accounts (as an instructor)
- Add evaluations and reports

## 🔧 Environment Variables (Optional)

For better security, you can use environment variables instead of hardcoding credentials:

1. Create a `.env` file in your project root:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

2. The app will automatically use these values if they're set.

## 🎯 How to Use the App

### Demo Accounts (Available Immediately)

The app comes with pre-configured demo accounts you can use right away:

**Trainer Accounts:**
- Email: `trainer1@example.com` | Password: `password123`
- Email: `trainer2@example.com` | Password: `password123`

**Student Accounts:**
- Email: `student1@example.com` | Password: `password123` (belongs to Trainer 1)
- Email: `student2@example.com` | Password: `password123` (belongs to Trainer 2)

### Testing the Multi-Trainer System

1. **Login as Trainer 1:**
   - Use `trainer1@example.com` / `password123`
   - You'll see the trainer dashboard with student management
   - Click "Add Student" to create new student accounts
   - Only students you create will be visible to you

2. **Login as Student:**
   - Use `student1@example.com` / `password123`
   - You'll see the student profile view (read-only)
   - Students cannot create accounts or manage other users

3. **Test Separation:**
   - Login as Trainer 2 (`trainer2@example.com` / `password123`)
   - You'll only see students created by Trainer 2
   - Trainer 1's students are completely hidden

### Creating Student Accounts

**✅ Correct Process:**
1. Login as a trainer account
2. Go to the Students tab
3. Click "Add Student" button
4. Fill in student details and click "Create Account"
5. The student can now login with their credentials

**❌ What Won't Work:**
- Students cannot create accounts (they'll get an error)
- Only trainers can create student accounts
- Students are strictly separated by trainer

## 🆘 Still Having Issues?

- Make sure your internet connection is working
- Verify the Supabase project URL and key are correct
- Check the browser console for more detailed error messages
- Ensure the database tables were created successfully
- Try using the demo accounts listed above first