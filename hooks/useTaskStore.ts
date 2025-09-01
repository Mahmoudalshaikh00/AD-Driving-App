import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';
import { Task, Subtask } from '@/types';

// Initial mock data with correct capitals and task names
const initialTasks: Task[] = [
  // Capital 1
  { id: '1', name: 'move off safely', capital: 1 },
  { id: '2', name: 'pulling up on the left', capital: 1 },
  { id: '3', name: 'move off angle', capital: 1 },
  { id: '4', name: 'follow sign', capital: 1 },
  { id: '5', name: 'turn left into the side road', capital: 1 },
  { id: '6', name: 'turn left into main road', capital: 1 },
  { id: '7', name: 'turn left at normal cross road', capital: 1 },
  { id: '8', name: 'turn left at unmarked cross road', capital: 1 },
  
  // Capital 2
  { id: '9', name: 'turn right into the side road', capital: 2 },
  { id: '10', name: 'turn right into main road', capital: 2 },
  { id: '11', name: 'turn right at normal cross road', capital: 2 },
  { id: '12', name: 'turn right at unmarked cross road', capital: 2 },
  { id: '13', name: 'turn right at traffic light', capital: 2 },
  { id: '14', name: 'dual carriageway', capital: 2 },
  { id: '15', name: 'central reservation', capital: 2 },
  { id: '16', name: 'meeting traffic', capital: 2 },
  { id: '17', name: 'one way street', capital: 2 },
  
  // Capital 3
  { id: '18', name: 'roundabout - left', capital: 3 },
  { id: '19', name: 'roundabout - ahead', capital: 3 },
  { id: '20', name: 'roundabout - right', capital: 3 },
  { id: '21', name: 'mini roundabouts', capital: 3 },
  { id: '22', name: 'mini roundabout - left', capital: 3 },
  { id: '23', name: 'mini roundabout - ahead', capital: 3 },
  { id: '24', name: 'mini roundabout - right', capital: 3 },
  { id: '25', name: 'double roundabout 1 to 1', capital: 3 },
  { id: '26', name: 'double roundabout 1 to 2 + 2 to 1', capital: 3 },
  { id: '27', name: 'double roundabout 2 to 2', capital: 3 },
  
  // Capital 4
  { id: '28', name: 'keep space following traffic', capital: 4 },
  { id: '29', name: 'lane discipline/position', capital: 4 },
  { id: '30', name: 'sat nav', capital: 4 },
  { id: '31', name: 'pedesterian crossing', capital: 4 },
  { id: '32', name: 'emergency stop', capital: 4 },
  { id: '33', name: 'reverse bay park', capital: 4 },
  { id: '34', name: 'forward bay park', capital: 4 },
  { id: '35', name: 'pull up on the right and reverse', capital: 4 },
  { id: '36', name: 'parallel park', capital: 4 },
];

const initialSubtasks: Subtask[] = [
  // move off safely (Task 1)
  { id: '1', name: 'mirror', taskId: '1' },
  { id: '2', name: 'signal', taskId: '1' },
  { id: '3', name: 'position', taskId: '1' },
  { id: '4', name: 'speed', taskId: '1' },
  { id: '5', name: 'look', taskId: '1' },
  
  // pulling up on the left (Task 2)
  { id: '6', name: 'mirror', taskId: '2' },
  { id: '7', name: 'signal', taskId: '2' },
  { id: '8', name: 'position', taskId: '2' },
  { id: '9', name: 'speed', taskId: '2' },
  { id: '10', name: 'look', taskId: '2' },
  
  // move off angle (Task 3)
  { id: '11', name: 'mirror', taskId: '3' },
  { id: '12', name: 'signal', taskId: '3' },
  { id: '13', name: 'position', taskId: '3' },
  { id: '14', name: 'speed', taskId: '3' },
  { id: '15', name: 'look', taskId: '3' },
  
  // follow sign (Task 4)
  { id: '16', name: 'road_sign', taskId: '4' },
  { id: '17', name: 'speed', taskId: '4' },
  { id: '18', name: 'road_marking', taskId: '4' },
  
  // turn left into the side road (Task 5)
  { id: '19', name: 'mirror', taskId: '5' },
  { id: '20', name: 'signal', taskId: '5' },
  { id: '21', name: 'position', taskId: '5' },
  { id: '22', name: 'speed', taskId: '5' },
  { id: '23', name: 'look', taskId: '5' },
  { id: '24', name: 'A,B', taskId: '5' },
  
  // turn left into main road (Task 6)
  { id: '25', name: 'mirror', taskId: '6' },
  { id: '26', name: 'signal', taskId: '6' },
  { id: '27', name: 'position', taskId: '6' },
  { id: '28', name: 'speed', taskId: '6' },
  { id: '29', name: 'look', taskId: '6' },
  { id: '30', name: 'B_to_B', taskId: '6' },
  
  // turn left at normal cross road (Task 7)
  { id: '31', name: 'mirror', taskId: '7' },
  { id: '32', name: 'signal', taskId: '7' },
  { id: '33', name: 'position', taskId: '7' },
  { id: '34', name: 'speed', taskId: '7' },
  { id: '35', name: 'look', taskId: '7' },
  { id: '36', name: 'B,A,B', taskId: '7' },
  
  // turn left at unmarked cross road (Task 8)
  { id: '37', name: 'mirror', taskId: '8' },
  { id: '38', name: 'signal', taskId: '8' },
  { id: '39', name: 'position', taskId: '8' },
  { id: '40', name: 'speed', taskId: '8' },
  { id: '41', name: 'look', taskId: '8' },
  { id: '42', name: 'B,A,B', taskId: '8' },
  
  // turn right into the side road (Task 9)
  { id: '43', name: 'mirror', taskId: '9' },
  { id: '44', name: 'signal', taskId: '9' },
  { id: '45', name: 'position', taskId: '9' },
  { id: '46', name: 'speed', taskId: '9' },
  { id: '47', name: 'look', taskId: '9' },
  { id: '48', name: '1,2,3', taskId: '9' },
  
  // turn right into main road (Task 10)
  { id: '49', name: 'mirror', taskId: '10' },
  { id: '50', name: 'signal', taskId: '10' },
  { id: '51', name: 'position', taskId: '10' },
  { id: '52', name: 'speed', taskId: '10' },
  { id: '53', name: 'look', taskId: '10' },
  { id: '54', name: 'B_to_B', taskId: '10' },
  
  // turn right at normal cross road (Task 11)
  { id: '55', name: 'mirror', taskId: '11' },
  { id: '56', name: 'signal', taskId: '11' },
  { id: '57', name: 'position', taskId: '11' },
  { id: '58', name: 'look', taskId: '11' },
  { id: '59', name: 'speed', taskId: '11' },
  { id: '60', name: 'B,A,B', taskId: '11' },
  
  // turn right at unmarked cross road (Task 12)
  { id: '61', name: 'mirror', taskId: '12' },
  { id: '62', name: 'position', taskId: '12' },
  { id: '63', name: 'signal', taskId: '12' },
  { id: '64', name: 'look', taskId: '12' },
  { id: '65', name: 'speed', taskId: '12' },
  { id: '66', name: 'B,A,B', taskId: '12' },
  
  // turn right at traffic light (Task 13)
  { id: '67', name: 'mirror', taskId: '13' },
  { id: '68', name: 'position', taskId: '13' },
  { id: '69', name: 'signal', taskId: '13' },
  { id: '70', name: 'look', taskId: '13' },
  { id: '71', name: 'speed', taskId: '13' },
  { id: '72', name: 'light', taskId: '13' },
  { id: '73', name: 'space', taskId: '13' },
  { id: '74', name: 'exit', taskId: '13' },
  { id: '75', name: 'green_arrow', taskId: '13' },
  
  // dual carriageway (Task 14)
  { id: '76', name: 'left_lane', taskId: '14' },
  { id: '77', name: 'right_lane', taskId: '14' },
  { id: '78', name: 'position', taskId: '14' },
  { id: '79', name: 'over_the_lane', taskId: '14' },
  { id: '80', name: 'half_to_half', taskId: '14' },
  { id: '81', name: 'fully_on_the_right_lane', taskId: '14' },
  { id: '82', name: 'overtaking', taskId: '14' },
  { id: '83', name: 'mirror', taskId: '14' },
  { id: '84', name: 'speed', taskId: '14' },
  { id: '85', name: 'space', taskId: '14' },
  
  // central reservation (Task 15)
  { id: '86', name: 'left', taskId: '15' },
  { id: '87', name: 'stright', taskId: '15' },
  { id: '88', name: 'right', taskId: '15' },
  { id: '89', name: 'A,B,B,A', taskId: '15' },
  
  // meeting traffic (Task 16)
  { id: '90', name: 'space', taskId: '16' },
  { id: '91', name: 'mirror', taskId: '16' },
  { id: '92', name: 'speed', taskId: '16' },
  { id: '93', name: 'gap_in_the_left', taskId: '16' },
  { id: '94', name: 'gap_in_the_right', taskId: '16' },
  
  // one way street (Task 17)
  { id: '95', name: 'road_sign', taskId: '17' },
  { id: '96', name: 'road_parking', taskId: '17' },
  { id: '97', name: 'position', taskId: '17' },
  
  // roundabout - left (Task 18)
  { id: '98', name: 'mirror', taskId: '18' },
  { id: '99', name: 'signal', taskId: '18' },
  { id: '100', name: 'position', taskId: '18' },
  { id: '101', name: 'speed', taskId: '18' },
  { id: '102', name: 'look', taskId: '18' },
  
  // roundabout - ahead (Task 19)
  { id: '103', name: 'mirror', taskId: '19' },
  { id: '104', name: 'signal', taskId: '19' },
  { id: '105', name: 'look', taskId: '19' },
  { id: '106', name: 'speed', taskId: '19' },
  { id: '107', name: 'position', taskId: '19' },
  
  // roundabout - right (Task 20)
  { id: '108', name: 'mirror', taskId: '20' },
  { id: '109', name: 'signal', taskId: '20' },
  { id: '110', name: 'position', taskId: '20' },
  { id: '111', name: 'speed', taskId: '20' },
  { id: '112', name: 'look', taskId: '20' },
  
  // mini roundabouts (Task 21)
  { id: '113', name: 'mirror', taskId: '21' },
  { id: '114', name: 'position', taskId: '21' },
  { id: '115', name: 'look', taskId: '21' },
  { id: '116', name: 'speed', taskId: '21' },
  
  // mini roundabout - left (Task 22)
  { id: '117', name: 'mirror', taskId: '22' },
  { id: '118', name: 'signal', taskId: '22' },
  { id: '119', name: 'position', taskId: '22' },
  { id: '120', name: 'speed', taskId: '22' },
  { id: '121', name: 'look', taskId: '22' },
  
  // mini roundabout - ahead (Task 23)
  { id: '122', name: 'mirror', taskId: '23' },
  { id: '123', name: 'signal', taskId: '23' },
  { id: '124', name: 'speed', taskId: '23' },
  { id: '125', name: 'position', taskId: '23' },
  { id: '126', name: 'look', taskId: '23' },
  
  // mini roundabout - right (Task 24)
  { id: '127', name: 'mirror', taskId: '24' },
  { id: '128', name: 'signal', taskId: '24' },
  { id: '129', name: 'speed', taskId: '24' },
  { id: '130', name: 'position', taskId: '24' },
  { id: '131', name: 'look', taskId: '24' },
  
  // double roundabout 1 to 1 (Task 25)
  { id: '132', name: 'mirror', taskId: '25' },
  { id: '133', name: 'signal', taskId: '25' },
  { id: '134', name: 'speed', taskId: '25' },
  { id: '135', name: 'position', taskId: '25' },
  { id: '136', name: 'look', taskId: '25' },
  
  // double roundabout 1 to 2 + 2 to 1 (Task 26)
  { id: '137', name: 'mirror', taskId: '26' },
  { id: '138', name: 'signal', taskId: '26' },
  { id: '139', name: 'position', taskId: '26' },
  { id: '140', name: 'speed', taskId: '26' },
  { id: '141', name: 'look', taskId: '26' },
  
  // double roundabout 2 to 2 (Task 27)
  { id: '142', name: 'mirror', taskId: '27' },
  { id: '143', name: 'signal', taskId: '27' },
  { id: '144', name: 'position', taskId: '27' },
  { id: '145', name: 'speed', taskId: '27' },
  { id: '146', name: 'look', taskId: '27' },
  
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
  { id: '152', name: 'position', taskId: '33' },
  { id: '153', name: 'reference_point', taskId: '33' },
  { id: '154', name: 'steering', taskId: '33' },
  { id: '155', name: 'observation', taskId: '33' },
  { id: '156', name: 'mirror', taskId: '33' },
  { id: '157', name: 'fix', taskId: '33' },
  
  // forward bay park (Task 34)
  { id: '158', name: 'position', taskId: '34' },
  { id: '159', name: 'reference_point', taskId: '34' },
  { id: '160', name: 'steering', taskId: '34' },
  { id: '161', name: 'observation', taskId: '34' },
  { id: '162', name: 'mirror', taskId: '34' },
  { id: '163', name: 'fix', taskId: '34' },
  
  // pull up on the right and reverse (Task 35)
  { id: '164', name: 'position', taskId: '35' },
  { id: '165', name: 'steering', taskId: '35' },
  { id: '166', name: 'observation', taskId: '35' },
  { id: '167', name: 'awareness', taskId: '35' },
  
  // parallel park (Task 36)
  { id: '168', name: 'position', taskId: '36' },
  { id: '169', name: 'signal', taskId: '36' },
  { id: '170', name: 'gear', taskId: '36' },
  { id: '171', name: 'Steering', taskId: '36' },
  { id: '172', name: 'observation', taskId: '36' },
  { id: '173', name: 'fix', taskId: '36' },
  { id: '174', name: 'awarness', taskId: '36' },
];

const TASKS_STORAGE_KEY = 'driving-app-tasks';
const SUBTASKS_STORAGE_KEY = 'driving-app-subtasks';

export const [TaskProvider, useTaskStore] = createContextHook(() => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loading, setLoading] = useState(true);

  // Load tasks and subtasks from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedTasks = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
        const storedSubtasks = await AsyncStorage.getItem(SUBTASKS_STORAGE_KEY);
        
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

  const addTask = async (task: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
    };
    
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    return newTask;
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
  };
});