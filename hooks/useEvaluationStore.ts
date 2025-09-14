import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useCallback } from 'react';
import { SubtaskEvaluation, EvaluationWithNotes } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuthStore';

export const [EvaluationProvider, useEvaluationStore] = createContextHook(() => {
  const [evaluations, setEvaluations] = useState<SubtaskEvaluation[]>([]);
  const [evaluationNotes, setEvaluationNotes] = useState<EvaluationWithNotes[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();

  const fetchEvaluations = useCallback(async () => {
    if (!user) return;
    
    try {
      console.log('📊 Fetching evaluations for user:', user.id, 'role:', user.role);
      
      let query = supabase.from('evaluations').select('*');
      
      // Filter based on user role
      if (user.role === 'instructor') {
        query = query.eq('instructor_id', user.id);
      } else if (user.role === 'student') {
        query = query.eq('student_id', user.id);
      }
      // Admin can see all evaluations
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching evaluations:', error);
        return;
      }
      
      console.log('✅ Evaluations fetched successfully:', data?.length || 0);
      // Transform Supabase evaluations to match our SubtaskEvaluation type
      const transformedEvaluations: SubtaskEvaluation[] = (data || []).map(evaluation => ({
        id: evaluation.id,
        studentId: evaluation.student_id,
        taskId: 'task-1', // Default task ID since we don't have tasks table yet
        subtaskId: 'subtask-1', // Default subtask ID
        rating: evaluation.score,
        notes: evaluation.feedback,
        timestamp: evaluation.created_at,
      }));
      
      setEvaluations(transformedEvaluations);
    } catch (error) {
      console.error('🚨 Error in fetchEvaluations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load evaluations from Supabase and set up realtime subscriptions
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    fetchEvaluations();
    
    // Set up realtime subscription for evaluations
    console.log('📡 Setting up realtime subscription for evaluations');
    const subscription = supabase
      .channel('evaluations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'evaluations',
        },
        (payload) => {
          console.log('📡 Realtime evaluation change:', payload);
          
          // Check if this change is relevant to the current user
          const evaluation = payload.new || payload.old;
          const isRelevant = user.role === 'admin' || 
                           (user.role === 'instructor' && (evaluation as any)?.instructor_id === user.id) ||
                           (user.role === 'student' && (evaluation as any)?.student_id === user.id);
          
          if (!isRelevant) return;
          
          if (payload.eventType === 'INSERT') {
            const newEval = payload.new as any;
            const transformedEval: SubtaskEvaluation = {
              id: newEval.id,
              studentId: newEval.student_id,
              taskId: 'task-1',
              subtaskId: 'subtask-1',
              rating: newEval.score,
              notes: newEval.feedback,
              timestamp: newEval.created_at,
            };
            setEvaluations(prev => [transformedEval, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedEval = payload.new as any;
            const transformedEval: SubtaskEvaluation = {
              id: updatedEval.id,
              studentId: updatedEval.student_id,
              taskId: 'task-1',
              subtaskId: 'subtask-1',
              rating: updatedEval.score,
              notes: updatedEval.feedback,
              timestamp: updatedEval.created_at,
            };
            setEvaluations(prev => prev.map(e => e.id === updatedEval.id ? transformedEval : e));
          } else if (payload.eventType === 'DELETE') {
            const deletedEval = payload.old as any;
            setEvaluations(prev => prev.filter(e => e.id !== deletedEval.id));
          }
        }
      )
      .subscribe();
      
    return () => {
      console.log('📡 Cleaning up realtime subscription for evaluations');
      subscription.unsubscribe();
    };
  }, [user, fetchEvaluations]);

  const addEvaluation = async (evaluation: Omit<SubtaskEvaluation, 'id' | 'timestamp'>) => {
    // Check if evaluation already exists for this student/task/subtask combination
    const existingIndex = evaluations.findIndex(
      e => e.studentId === evaluation.studentId && 
           e.taskId === evaluation.taskId && 
           e.subtaskId === evaluation.subtaskId
    );
    
    const newEvaluation: SubtaskEvaluation = {
      ...evaluation,
      id: existingIndex >= 0 ? evaluations[existingIndex].id : Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    
    let updatedEvaluations: SubtaskEvaluation[];
    if (existingIndex >= 0) {
      // Update existing evaluation
      updatedEvaluations = [...evaluations];
      updatedEvaluations[existingIndex] = newEvaluation;
    } else {
      // Add new evaluation
      updatedEvaluations = [...evaluations, newEvaluation];
    }
    
    setEvaluations(updatedEvaluations);
    return newEvaluation;
  };

  const updateEvaluation = async (updatedEvaluation: SubtaskEvaluation) => {
    const next = evaluations.map(evaluation => 
      evaluation.id === updatedEvaluation.id ? updatedEvaluation : evaluation
    );
    setEvaluations(next);
    return updatedEvaluation;
  };

  const deleteEvaluation = async (evaluationId: string) => {
    const next = evaluations.filter(evaluation => evaluation.id !== evaluationId);
    setEvaluations(next);
  };

  const deleteEvaluationsByStudentId = async (studentId: string) => {
    const next = evaluations.filter(evaluation => evaluation.studentId !== studentId);
    setEvaluations(next);
  };

  const deleteEvaluationsByTaskId = async (taskId: string) => {
    const next = evaluations.filter(evaluation => evaluation.taskId !== taskId);
    setEvaluations(next);
  };

  const deleteEvaluationsBySubtaskId = async (subtaskId: string) => {
    const next = evaluations.filter(evaluation => evaluation.subtaskId !== subtaskId);
    setEvaluations(next);
  };

  const getEvaluationsByStudentId = (studentId: string): SubtaskEvaluation[] => {
    return evaluations.filter(evaluation => evaluation.studentId === studentId);
  };

  const getEvaluationsByTaskId = (taskId: string): SubtaskEvaluation[] => {
    return evaluations.filter(evaluation => evaluation.taskId === taskId);
  };

  const getEvaluationsByStudentAndTask = (studentId: string, taskId: string): SubtaskEvaluation[] => {
    return evaluations.filter(
      evaluation => evaluation.studentId === studentId && evaluation.taskId === taskId
    );
  };

  const getLatestEvaluation = (studentId: string, taskId: string, subtaskId: string): SubtaskEvaluation | null => {
    return evaluations.find(
      evaluation => 
        evaluation.studentId === studentId && 
        evaluation.taskId === taskId &&
        evaluation.subtaskId === subtaskId
    ) ?? null;
  };

  const addEvaluationNotes = async (notes: Omit<EvaluationWithNotes, 'timestamp'>) => {
    // Check if notes already exist for this student/task combination
    const existingIndex = evaluationNotes.findIndex(
      n => n.studentId === notes.studentId && n.taskId === notes.taskId
    );
    
    const newNotes: EvaluationWithNotes = {
      ...notes,
      timestamp: new Date().toISOString(),
    };
    
    let updatedNotes: EvaluationWithNotes[];
    if (existingIndex >= 0) {
      // Update existing notes
      updatedNotes = [...evaluationNotes];
      updatedNotes[existingIndex] = newNotes;
    } else {
      // Add new notes
      updatedNotes = [...evaluationNotes, newNotes];
    }
    
    setEvaluationNotes(updatedNotes);
    return newNotes;
  };

  const getEvaluationNotes = (studentId: string, taskId: string) => {
    return evaluationNotes.find(
      notes => notes.studentId === studentId && notes.taskId === taskId
    ) || null;
  };

  return {
    evaluations,
    evaluationNotes,
    loading,
    addEvaluation,
    updateEvaluation,
    deleteEvaluation,
    deleteEvaluationsByStudentId,
    deleteEvaluationsByTaskId,
    deleteEvaluationsBySubtaskId,
    getEvaluationsByStudentId,
    getEvaluationsByTaskId,
    getEvaluationsByStudentAndTask,
    getLatestEvaluation,
    addEvaluationNotes,
    getEvaluationNotes,
  };
});