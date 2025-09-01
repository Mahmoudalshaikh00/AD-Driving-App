export interface User {
  id: string;
  name: string;
  email: string;
  role: 'trainer' | 'student';
  trainer_id?: string;
  created_at: string;
}

export interface Student extends User {
  role: 'student';
  trainer_id: string;
}

export interface Trainer extends User {
  role: 'trainer';
}

export interface Task {
  id: string;
  name: string;
  studentId?: string;
  capital: 1 | 2 | 3 | 4;
}

export interface Subtask {
  id: string;
  name: string;
  taskId: string;
}

export interface Evaluation {
  id: string;
  student_id: string;
  trainer_id: string;
  date: string;
  score: number;
  feedback: string;
  created_at: string;
}

export interface Report {
  id: string;
  student_id: string;
  trainer_id: string;
  title: string;
  content: string;
  created_at: string;
}

export interface SubtaskEvaluation {
  id: string;
  studentId: string;
  taskId: string;
  subtaskId: string;
  rating: number;
  timestamp: string;
  notes?: string;
}

export interface EvaluationWithNotes {
  studentId: string;
  taskId: string;
  notes: string;
  timestamp: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export type BookingStatus = 'pending' | 'approved' | 'rejected';

export interface AvailabilitySlot {
  id: string;
  trainer_id: string;
  start: string; // ISO
  end: string;   // ISO
}

export interface Booking {
  id: string;
  student_id: string;
  trainer_id: string;
  start: string; // ISO
  end: string;   // ISO
  status: BookingStatus;
  created_at: string;
  created_by: 'trainer' | 'student';
}

export interface TimeSlot {
  hour: number;
  minute: number;
  isAvailable?: boolean;
  booking?: Booking;
  isSelected?: boolean;
}

export interface DaySchedule {
  date: Date;
  dayName: string;
  dayNumber: number;
  timeSlots: TimeSlot[];
}

export interface WeekSchedule {
  weekStart: Date;
  weekEnd: Date;
  days: DaySchedule[];
}

export type AttachmentType = 'image' | 'file';

export interface MessageAttachment {
  id: string;
  type: AttachmentType;
  url: string;
  name?: string;
}

export interface ChatMessage {
  id: string;
  student_id: string;
  trainer_id: string;
  sender_id: string;
  text?: string;
  attachments?: MessageAttachment[];
  created_at: string;
  isReport?: boolean;
  reportTitle?: string;
}

export type NotificationType = 'message' | 'booking_request' | 'booking_approved' | 'booking_rejected' | 'availability_added' | 'lesson_reminder' | 'evaluation_completed';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface AppNotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  data?: Record<string, any>;
  recipient_id: string;
  sender_id?: string;
  read: boolean;
  created_at: string;
  expires_at?: string;
  action_url?: string;
}

export interface NotificationSettings {
  id: string;
  user_id: string;
  messages: boolean;
  bookings: boolean;
  reminders: boolean;
  evaluations: boolean;
  push_enabled: boolean;
  sound_enabled: boolean;
  vibration_enabled: boolean;
  quiet_hours_start?: string; // HH:MM format
  quiet_hours_end?: string; // HH:MM format
}
