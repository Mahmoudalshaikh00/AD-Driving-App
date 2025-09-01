import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';
import { SubtaskEvaluation, EvaluationWithNotes } from '@/types';

const STORAGE_KEY = 'driving-app-evaluations';
const NOTES_STORAGE_KEY = 'driving-app-evaluation-notes';

export const [EvaluationProvider, useEvaluationStore] = createContextHook(() => {
  const [evaluations, setEvaluations] = useState<SubtaskEvaluation[]>([]);
  const [evaluationNotes, setEvaluationNotes] = useState<EvaluationWithNotes[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load evaluations and notes from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedEvaluations = await AsyncStorage.getItem(STORAGE_KEY);
        const storedNotes = await AsyncStorage.getItem(NOTES_STORAGE_KEY);
        
        if (storedEvaluations) {
          const parsed: unknown = JSON.parse(storedEvaluations);
          setEvaluations(Array.isArray(parsed) ? (parsed as SubtaskEvaluation[]) : []);
        }
        
        if (storedNotes) {
          setEvaluationNotes(JSON.parse(storedNotes));
        }
      } catch (error) {
        console.error('Failed to load evaluations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Save evaluations and notes to storage whenever they change
  useEffect(() => {
    if (!loading) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(evaluations))
        .catch(error => console.error('Failed to save evaluations:', error));
    }
  }, [evaluations, loading]);

  useEffect(() => {
    if (!loading) {
      AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(evaluationNotes))
        .catch(error => console.error('Failed to save evaluation notes:', error));
    }
  }, [evaluationNotes, loading]);

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