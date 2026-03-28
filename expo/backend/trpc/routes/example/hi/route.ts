import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabaseAdmin } from '@/lib/supabase';

export const hiProcedure = publicProcedure
  .input(z.object({ name: z.string() }))
  .mutation(({ input }: { input: { name: string } }) => {
    return {
      hello: input.name,
      date: new Date(),
    };
  });

export const deleteUserProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
    requesterId: z.string(),
  }))
  .mutation(async ({ input }) => {
    const { userId, requesterId } = input;
    
    try {
      console.log('🗑️ Starting atomic user deletion for:', userId, 'by:', requesterId);
      
      // Verify requester is admin or instructor
      const { data: requester, error: requesterError } = await supabaseAdmin
        .from('users')
        .select('role, id')
        .eq('id', requesterId)
        .single();
        
      if (requesterError || !requester) {
        throw new Error('Unauthorized: Invalid requester');
      }
      
      if (requester.role !== 'admin' && requester.role !== 'instructor') {
        throw new Error('Unauthorized: Only admins and instructors can delete users');
      }
      
      // Get user to delete
      const { data: userToDelete, error: userError } = await supabaseAdmin
        .from('users')
        .select('role, instructor_id')
        .eq('id', userId)
        .single();
        
      if (userError || !userToDelete) {
        throw new Error('User not found');
      }
      
      // If requester is instructor, they can only delete their own students
      if (requester.role === 'instructor' && 
          (userToDelete.role !== 'student' || userToDelete.instructor_id !== requesterId)) {
        throw new Error('Unauthorized: Instructors can only delete their own students');
      }
      
      // Delete from auth.users (this will cascade to related tables via RLS)
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (authError) {
        console.error('❌ Auth deletion failed:', authError);
        throw new Error(`Failed to delete user from auth: ${authError.message}`);
      }
      
      // Delete from users table
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId);
        
      if (dbError) {
        console.error('❌ DB deletion failed:', dbError);
        throw new Error(`Failed to delete user from database: ${dbError.message}`);
      }
      
      console.log('✅ User deleted successfully:', userId);
      return { success: true, message: 'User deleted successfully' };
      
    } catch (error: any) {
      console.error('🚨 User deletion error:', error);
      throw new Error(error.message || 'Failed to delete user');
    }
  });

export const createAdminUserProcedure = publicProcedure
  .input(z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string(),
  }))
  .mutation(async ({ input }) => {
    const { email, password, name } = input;
    
    try {
      console.log('👑 Creating admin user:', email);
      
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
        app_metadata: { role: 'admin' },
      });
      
      if (authError || !authData.user) {
        throw new Error(`Failed to create auth user: ${authError?.message}`);
      }
      
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          name,
          email,
          role: 'admin',
          is_approved: true,
          is_restricted: false,
          status: 'active',
        });
        
      if (profileError) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw new Error(`Failed to create user profile: ${profileError.message}`);
      }
      
      console.log('✅ Admin user created successfully:', authData.user.id);
      return { 
        success: true, 
        message: 'Admin user created successfully',
        userId: authData.user.id 
      };
      
    } catch (error: any) {
      console.error('🚨 Admin user creation error:', error);
      throw new Error(error.message || 'Failed to create admin user');
    }
  });

export const createStudentForInstructorProcedure = publicProcedure
  .input(z.object({
    instructorId: z.string(),
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string(),
  }))
  .mutation(async ({ input }) => {
    const { instructorId, email, password, name } = input;

    try {
      console.log('🎓 Creating student for instructor:', instructorId, email);

      // We'll check instructor existence and role later, after creating the auth user

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, instructor_id: instructorId },
        app_metadata: { role: 'student' },
      });

      if (authError || !authData.user) {
        throw new Error(`Failed to create auth user: ${authError?.message}`);
      }

      // First check if instructor exists in users table, create if missing
      console.log('🔍 tRPC: Checking if instructor exists in users table:', instructorId);
      const { data: instructorExists, error: checkError } = await supabaseAdmin
        .from('users')
        .select('id, role')
        .eq('id', instructorId)
        .single();

      console.log('🔍 tRPC: Instructor check result:', { instructorExists, checkError });
      
      if (checkError || !instructorExists) {
        // Instructor profile doesn't exist, let's create it
        console.log('🔧 tRPC: Instructor profile missing, creating it now...');
        
        // Get instructor auth data
        const { data: instructorAuth } = await supabaseAdmin.auth.admin.getUserById(instructorId);
        if (!instructorAuth.user) {
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          throw new Error('Instructor auth user not found. Please contact support.');
        }
        
        // Create instructor profile
        const instructorProfile = {
          id: instructorId,
          name: (instructorAuth.user.user_metadata as any)?.name || instructorAuth.user.email || 'Instructor',
          email: instructorAuth.user.email || '',
          role: 'instructor' as const,
          status: 'active',
          is_approved: true,
          is_restricted: false,
        };
        
        const { error: createInstructorError } = await supabaseAdmin
          .from('users')
          .insert(instructorProfile);
          
        if (createInstructorError) {
          console.error('🚨 tRPC: Failed to create instructor profile:', createInstructorError);
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          throw new Error(`Failed to create instructor profile: ${createInstructorError.message}`);
        }
        
        console.log('✅ tRPC: Instructor profile created successfully');
      } else if (instructorExists.role !== 'instructor' && instructorExists.role !== 'admin') {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw new Error(`Invalid instructor role: ${instructorExists.role}. Only instructors and admins can create students.`);
      }

      const { error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          name,
          email,
          role: 'student',
          instructor_id: instructorId,
          status: 'active',
          is_approved: true,
          is_restricted: false,
        });

      if (profileError) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw new Error(`Failed to create student profile: ${profileError.message}`);
      }

      console.log('✅ Student created successfully:', authData.user.id);
      return { success: true, userId: authData.user.id };
    } catch (error: any) {
      console.error('🚨 createStudentForInstructor error:', error);
      throw new Error(error.message || 'Failed to create student');
    }
  });

export default hiProcedure;