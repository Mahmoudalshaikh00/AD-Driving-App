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
      
      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      
      if (authError || !authData.user) {
        throw new Error(`Failed to create auth user: ${authError?.message}`);
      }
      
      // Create user profile
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
        // Cleanup auth user if profile creation fails
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

export default hiProcedure;