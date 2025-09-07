import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';
import { Task, Subtask } from '@/types';

// Initial mock data with correct capitals and task names
const initialTasks: Task[] = [
  // Capital 1
  { id: '1', name: 'Move off safely', capital: 1 },
  { id: '2', name: 'Pulling up on the left', capital: 1 },
  { id: '3', name: 'Move off angle', capital: 1 },
  { id: '4', name: 'Follow sign', capital: 1 },
  { id: '5', name: 'Turn left into the side road', capital: 1 },
  { id: '6', name: 'Turn left into main road', capital: 1 },
  { id: '7', name: 'Turn left at normal cross road', capital: 1 },
  { id: '8', name: 'Turn left at unmarked cross road', capital: 1 },
  
  // Capital 2
  { id: '9', name: 'Turn right into the side road', capital: 2 },
  { id: '10', name: 'Turn right into main road', capital: 2 },
  { id: '11', name: 'Turn right at normal cross road', capital: 2 },
  { id: '12', name: 'Turn right at unmarked cross road', capital: 2 },
  { id: '13', name: 'Turn right at traffic light', capital: 2 },
  { id: '14', name: 'Dual carriageway', capital: 2 },
  { id: '15', name: 'Central reservation', capital: 2 },
  { id: '16', name: 'Meeting traffic', capital: 2 },
  { id: '17', name: 'One way street', capital: 2 },
  
  // Capital 3
  { id: '18', name: 'Roundabout - left', capital: 3 },
  { id: '19', name: 'Roundabout - ahead', capital: 3 },
  { id: '20', name: 'Roundabout - right', capital: 3 },
  { id: '21', name: 'Mini roundabouts', capital: 3 },
  { id: '22', name: 'Mini roundabout - left', capital: 3 },
  { id: '23', name: 'Mini roundabout - ahead', capital: 3 },
  { id: '24', name: 'Mini roundabout - right', capital: 3 },
  { id: '25', name: 'Double roundabout 1 to 1', capital: 3 },
  { id: '26', name: 'Double roundabout 1 to 2 + 2 to 1', capital: 3 },
  { id: '27', name: 'Double roundabout 2 to 2', capital: 3 },
  
  // Capital 4
  { id: '28', name: 'Keep space following traffic', capital: 4 },
  { id: '29', name: 'Lane discipline/position', capital: 4 },
  { id: '30', name: 'Sat nav', capital: 4 },
  { id: '31', name: 'Pedesterian crossing', capital: 4 },
  { id: '32', name: 'Emergency stop', capital: 4 },
  { id: '33', name: 'Reverse bay park', capital: 4 },
  { id: '34', name: 'Forward bay park', capital: 4 },
  { id: '35', name: 'Pull up on the right and reverse', capital: 4 },
  { id: '36', name: 'Parallel park', capital: 4 },
];

const initialSubtasks: Subtask[] = [
  // move off safely (Task 1)
  { id: '1', name: 'Mirror', taskId: '1' },
  { id: '2', name: 'Signal', taskId: '1' },
  { id: '3', name: 'Position', taskId: '1' },
  { id: '4', name: 'Speed', taskId: '1' },
  { id: '5', name: 'Look', taskId: '1' },
  
  // pulling up on the left (Task 2)
  { id: '6', name: 'Mirror', taskId: '2' },
  { id: '7', name: 'Signal', taskId: '2' },
  { id: '8', name: 'Position', taskId: '2' },
  { id: '9', name: 'Speed', taskId: '2' },
  { id: '10', name: 'Look', taskId: '2' },
  
  // move off angle (Task 3)
  { id: '11', name: 'Mirror', taskId: '3' },
  { id: '12', name: 'Signal', taskId: '3' },
  { id: '13', name: 'Position', taskId: '3' },
  { id: '14', name: 'Speed', taskId: '3' },
  { id: '15', name: 'Look', taskId: '3' },
  
  // follow sign (Task 4)
  { id: '16', name: 'Road_sign', taskId: '4' },
  { id: '17', name: 'Speed', taskId: '4' },
  { id: '18', name: 'Road_marking', taskId: '4' },
  
  // turn left into the side road (Task 5)
  { id: '19', name: 'Mirror', taskId: '5' },
  { id: '20', name: 'Signal', taskId: '5' },
  { id: '21', name: 'Position', taskId: '5' },
  { id: '22', name: 'Speed', taskId: '5' },
  { id: '23', name: 'Look', taskId: '5' },
  { id: '24', name: 'A,B', taskId: '5' },
  
  // turn left into main road (Task 6)
  { id: '25', name: 'Mirror', taskId: '6' },
  { id: '26', name: 'Signal', taskId: '6' },
  { id: '27', name: 'Position', taskId: '6' },
  { id: '28', name: 'Speed', taskId: '6' },
  { id: '29', name: 'Look', taskId: '6' },
  { id: '30', name: 'B_to_B', taskId: '6' },
  
  // turn left at normal cross road (Task 7)
  { id: '31', name: 'Mirror', taskId: '7' },
  { id: '32', name: 'Signal', taskId: '7' },
  { id: '33', name: 'Position', taskId: '7' },
  { id: '34', name: 'Speed', taskId: '7' },
  { id: '35', name: 'Look', taskId: '7' },
  { id: '36', name: 'B,A,B', taskId: '7' },
  
  // turn left at unmarked cross road (Task 8)
  { id: '37', name: 'Mirror', taskId: '8' },
  { id: '38', name: 'Signal', taskId: '8' },
  { id: '39', name: 'Position', taskId: '8' },
  { id: '40', name: 'Speed', taskId: '8' },
  { id: '41', name: 'Look', taskId: '8' },
  { id: '42', name: 'B,A,B', taskId: '8' },
  
  // turn right into the side road (Task 9)
  { id: '43', name: 'Mirror', taskId: '9' },
  { id: '44', name: 'Signal', taskId: '9' },
  { id: '45', name: 'Position', taskId: '9' },
  { id: '46', name: 'Speed', taskId: '9' },
  { id: '47', name: 'Look', taskId: '9' },
  { id: '48', name: '1,2,3', taskId: '9' },
  
  // turn right into main road (Task 10)
  { id: '49', name: 'Mirror', taskId: '10' },
  { id: '50', name: 'Signal', taskId: '10' },
  { id: '51', name: 'Position', taskId: '10' },
  { id: '52', name: 'Speed', taskId: '10' },
  { id: '53', name: 'Look', taskId: '10' },
  { id: '54', name: 'B_to_B', taskId: '10' },
  
  // turn right at normal cross road (Task 11)
  { id: '55', name: 'Mirror', taskId: '11' },
  { id: '56', name: 'Signal', taskId: '11' },
  { id: '57', name: 'Position', taskId: '11' },
  { id: '58', name: 'Look', taskId: '11' },
  { id: '59', name: 'Speed', taskId: '11' },
  { id: '60', name: 'B,A,B', taskId: '11' },
  
  // turn right at unmarked cross road (Task 12)
  { id: '61', name: 'Mirror', taskId: '12' },
  { id: '62', name: 'Position', taskId: '12' },
  { id: '63', name: 'Signal', taskId: '12' },
  { id: '64', name: 'Look', taskId: '12' },
  { id: '65', name: 'Speed', taskId: '12' },
  { id: '66', name: 'B,A,B', taskId: '12' },
  
  // turn right at traffic light (Task 13)
  { id: '67', name: 'Mirror', taskId: '13' },
  { id: '68', name: 'Position', taskId: '13' },
  { id: '69', name: 'Signal', taskId: '13' },
  { id: '70', name: 'Look', taskId: '13' },
  { id: '71', name: 'Speed', taskId: '13' },
  { id: '72', name: 'Light', taskId: '13' },
  { id: '73', name: 'Space', taskId: '13' },
  { id: '74', name: 'Exit', taskId: '13' },
  { id: '75', name: 'Green_arrow', taskId: '13' },
  
  // dual carriageway (Task 14)
  { id: '76', name: 'Left_lane', taskId: '14' },
  { id: '77', name: 'Right_lane', taskId: '14' },
  { id: '78', name: 'Position', taskId: '14' },
  { id: '79', name: 'Over_the_lane', taskId: '14' },
  { id: '80', name: 'Half_to_half', taskId: '14' },
  { id: '81', name: 'Fully_on_the_right_lane', taskId: '14' },
  { id: '82', name: 'Overtaking', taskId: '14' },
  { id: '83', name: 'Mirror', taskId: '14' },
  { id: '84', name: 'Speed', taskId: '14' },
  { id: '85', name: 'Space', taskId: '14' },
  
  // central reservation (Task 15)
  { id: '86', name: 'Left', taskId: '15' },
  { id: '87', name: 'Straight', taskId: '15' },
  { id: '88', name: 'Right', taskId: '15' },
  { id: '89', name: 'A,B,B,A', taskId: '15' },
  
  // meeting traffic (Task 16)
  { id: '90', name: 'Space', taskId: '16' },
  { id: '91', name: 'Mirror', taskId: '16' },
  { id: '92', name: 'Speed', taskId: '16' },
  { id: '93', name: 'Gap_in_the_left', taskId: '16' },
  { id: '94', name: 'Gap_in_the_right', taskId: '16' },
  
  // one way street (Task 17)
  { id: '95', name: 'Road_sign', taskId: '17' },
  { id: '96', name: 'Road_parking', taskId: '17' },
  { id: '97', name: 'Position', taskId: '17' },
  
  // roundabout - left (Task 18)
  { id: '98', name: 'Mirror', taskId: '18' },
  { id: '99', name: 'Signal', taskId: '18' },
  { id: '100', name: 'Position', taskId: '18' },
  { id: '101', name: 'Speed', taskId: '18' },
  { id: '102', name: 'Look', taskId: '18' },
  
  // roundabout - ahead (Task 19)
  { id: '103', name: 'Mirror', taskId: '19' },
  { id: '104', name: 'Signal', taskId: '19' },
  { id: '105', name: 'Look', taskId: '19' },
  { id: '106', name: 'Speed', taskId: '19' },
  { id: '107', name: 'Position', taskId: '19' },
  
  // roundabout - right (Task 20)
  { id: '108', name: 'Mirror', taskId: '20' },
  { id: '109', name: 'Signal', taskId: '20' },
  { id: '110', name: 'Position', taskId: '20' },
  { id: '111', name: 'Speed', taskId: '20' },
  { id: '112', name: 'Look', taskId: '20' },
  
  // mini roundabouts (Task 21)
  { id: '113', name: 'Mirror', taskId: '21' },
  { id: '114', name: 'Position', taskId: '21' },
  { id: '115', name: 'Look', taskId: '21' },
  { id: '116', name: 'Speed', taskId: '21' },
  
  // mini roundabout - left (Task 22)
  { id: '117', name: 'Mirror', taskId: '22' },
  { id: '118', name: 'Signal', taskId: '22' },
  { id: '119', name: 'Position', taskId: '22' },
  { id: '120', name: 'Speed', taskId: '22' },
  { id: '121', name: 'Look', taskId: '22' },
  
  // mini roundabout - ahead (Task 23)
  { id: '122', name: 'Mirror', taskId: '23' },
  { id: '123', name: 'Signal', taskId: '23' },
  { id: '124', name: 'Speed', taskId: '23' },
  { id: '125', name: 'Position', taskId: '23' },
  { id: '126', name: 'Look', taskId: '23' },
  
  // mini roundabout - right (Task 24)
  { id: '127', name: 'Mirror', taskId: '24' },
  { id: '128', name: 'Signal', taskId: '24' },
  { id: '129', name: 'Speed', taskId: '24' },
  { id: '130', name: 'Position', taskId: '24' },
  { id: '131', name: 'Look', taskId: '24' },
  
  // double roundabout 1 to 1 (Task 25)
  { id: '132', name: 'Mirror', taskId: '25' },
  { id: '133', name: 'Signal', taskId: '25' },
  { id: '134', name: 'Speed', taskId: '25' },
  { id: '135', name: 'Position', taskId: '25' },
  { id: '136', name: 'Look', taskId: '25' },
  
  // double roundabout 1 to 2 + 2 to 1 (Task 26)
  { id: '137', name: 'Mirror', taskId: '26' },
  { id: '138', name: 'Signal', taskId: '26' },
  { id: '139', name: 'Position', taskId: '26' },
  { id: '140', name: 'Speed', taskId: '26' },
  { id: '141', name: 'Look', taskId: '26' },
  
  // double roundabout 2 to 2 (Task 27)
  { id: '142', name: 'Mirror', taskId: '27' },
  { id: '143', name: 'Signal', taskId: '27' },
  { id: '144', name: 'Position', taskId: '27' },
  { id: '145', name: 'Speed', taskId: '27' },
  { id: '146', name: 'Look', taskId: '27' },
  
  // keep space following traffic (Task 28)
  { id: '147', name: 'Score', taskId: '28' },
  
  // lane discipline/position (Task 29)
  { id: '148', name: 'Score', taskId: '29' },
  
  // sat nav (Task 30)
  { id: '149', name: 'Score', taskId: '30' },
  
  // pedesterian crossing (Task 31)
  { id: '150', name: 'Score', taskId: '31' },
  
  // emergency stop (Task 32)
  { id: '151', name: 'Score', taskId: '32' },
  
  // reverse bay park (Task 33)
  { id: '152', name: 'Position', taskId: '33' },
  { id: '153', name: 'Reference_point', taskId: '33' },
  { id: '154', name: 'Steering', taskId: '33' },
  { id: '155', name: 'Observation', taskId: '33' },
  { id: '156', name: 'Mirror', taskId: '33' },
  { id: '157', name: 'Fix', taskId: '33' },
  
  // forward bay park (Task 34)
  { id: '158', name: 'Position', taskId: '34' },
  { id: '159', name: 'Reference_point', taskId: '34' },
  { id: '160', name: 'Steering', taskId: '34' },
  { id: '161', name: 'Observation', taskId: '34' },
  { id: '162', name: 'Mirror', taskId: '34' },
  { id: '163', name: 'Fix', taskId: '34' },
  
  // pull up on the right and reverse (Task 35)
  { id: '164', name: 'Position', taskId: '35' },
  { id: '165', name: 'Steering', taskId: '35' },
  { id: '166', name: 'Observation', taskId: '35' },
  { id: '167', name: 'Awareness', taskId: '35' },
  
  // parallel park (Task 36)
  { id: '168', name: 'Position', taskId: '36' },
  { id: '169', name: 'Signal', taskId: '36' },
  { id: '170', name: 'Gear', taskId: '36' },
  { id: '171', name: 'Steering', taskId: '36' },
  { id: '172', name: 'Observation', taskId: '36' },
  { id: '173', name: 'Fix', taskId: '36' },
  { id: '174', name: 'Awareness', taskId: '36' },
];

const TASKS_STORAGE_KEY = 'driving-app-tasks';
const SUBTASKS_STORAGE_KEY = 'driving-app-subtasks';
const HIDDEN_TASKS_STORAGE_KEY = 'driving-app-hidden-tasks';

export const [TaskProvider, useTaskStore] = createContextHook(() => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [hiddenTasksByInstructor, setHiddenTasksByInstructor] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  // Load tasks and subtasks from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedTasks = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
        const storedSubtasks = await AsyncStorage.getItem(SUBTASKS_STORAGE_KEY);
        const storedHiddenTasks = await AsyncStorage.getItem(HIDDEN_TASKS_STORAGE_KEY);
        
        if (storedTasks) {
          setTasks(JSON.parse(storedTasks));
        } else {
          setTasks(initialTasks);
          await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(initialTasks));
        }
        
        if (storedSubtasks) {
          setSubtasks(JSON.parse(storedSubtasks));
        } else {
          setSubtasks(initialSubtasks);
          await AsyncStorage.setItem(SUBTASKS_STORAGE_KEY, JSON.stringify(initialSubtasks));
        }
        
        if (storedHiddenTasks) {
          setHiddenTasksByInstructor(JSON.parse(storedHiddenTasks));
        }
      } catch (error) {
        console.error('Failed to load tasks/subtasks:', error);
        setTasks(initialTasks);
        setSubtasks(initialSubtasks);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Save tasks and subtasks to storage whenever they change
  useEffect(() => {
    if (!loading) {
      AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks))
        .catch(error => console.error('Failed to save tasks:', error));
    }
  }, [tasks, loading]);

  useEffect(() => {
    if (!loading) {
      AsyncStorage.setItem(SUBTASKS_STORAGE_KEY, JSON.stringify(subtasks))
        .catch(error => console.error('Failed to save subtasks:', error));
    }
  }, [subtasks, loading]);

  useEffect(() => {
    if (!loading) {
      AsyncStorage.setItem(HIDDEN_TASKS_STORAGE_KEY, JSON.stringify(hiddenTasksByInstructor))
        .catch(error => console.error('Failed to save hidden tasks:', error));
    }
  }, [hiddenTasksByInstructor, loading]);

  const addTask = async (task: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
    };
    
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    return newTask;
  };

  const getTasksByInstructor = (instructorId: string) => {
    return tasks.filter(task => task.instructor_id === instructorId);
  };

  const getDefaultTasks = () => {
    return tasks.filter(task => !task.instructor_id);
  };

  const updateTask = async (updatedTask: Task) => {
    const updatedTasks = tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    );
    setTasks(updatedTasks);
    return updatedTask;
  };

  const deleteTask = async (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    
    // Also delete associated subtasks
    const updatedSubtasks = subtasks.filter(subtask => subtask.taskId !== taskId);
    setSubtasks(updatedSubtasks);
    
    // Note: Related evaluations should be cleaned up by the evaluation store
    // when it detects that a task or subtask no longer exists
  };

  const addSubtask = async (subtask: Omit<Subtask, 'id'>) => {
    const newSubtask: Subtask = {
      ...subtask,
      id: Date.now().toString(),
    };
    
    const updatedSubtasks = [...subtasks, newSubtask];
    setSubtasks(updatedSubtasks);
    return newSubtask;
  };

  const updateSubtask = async (updatedSubtask: Subtask) => {
    const updatedSubtasks = subtasks.map(subtask => 
      subtask.id === updatedSubtask.id ? updatedSubtask : subtask
    );
    setSubtasks(updatedSubtasks);
    return updatedSubtask;
  };

  const deleteSubtask = async (subtaskId: string) => {
    const updatedSubtasks = subtasks.filter(subtask => subtask.id !== subtaskId);
    setSubtasks(updatedSubtasks);
    
    // Note: Related evaluations should be cleaned up by the evaluation store
    // when it detects that a subtask no longer exists
  };

  const getTaskById = (taskId: string) => {
    return tasks.find(task => task.id === taskId);
  };

  const getSubtasksByTaskId = (taskId: string) => {
    return subtasks.filter(subtask => subtask.taskId === taskId);
  };

  const toggleHideTask = (instructorId: string, taskId: string) => {
    setHiddenTasksByInstructor(prev => {
      const instructorHiddenTasks = prev[instructorId] || [];
      const isHidden = instructorHiddenTasks.includes(taskId);
      
      if (isHidden) {
        // Unhide the task
        return {
          ...prev,
          [instructorId]: instructorHiddenTasks.filter(id => id !== taskId)
        };
      } else {
        // Hide the task
        return {
          ...prev,
          [instructorId]: [...instructorHiddenTasks, taskId]
        };
      }
    });
  };

  const isTaskHidden = (instructorId: string, taskId: string) => {
    return hiddenTasksByInstructor[instructorId]?.includes(taskId) || false;
  };

  const getVisibleTasksForInstructor = (instructorId: string) => {
    const instructorTasks = tasks.filter(task => task.instructor_id === instructorId);
    const defaultTasks = tasks.filter(task => !task.instructor_id);
    const hiddenTasks = hiddenTasksByInstructor[instructorId] || [];
    
    // Filter out hidden default tasks for this instructor
    const visibleDefaultTasks = defaultTasks.filter(task => !hiddenTasks.includes(task.id));
    
    return [...visibleDefaultTasks, ...instructorTasks];
  };

  return {
    tasks,
    subtasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    getTaskById,
    getSubtasksByTaskId,
    getTasksByInstructor,
    getDefaultTasks,
    toggleHideTask,
    isTaskHidden,
    getVisibleTasksForInstructor,
  };
});