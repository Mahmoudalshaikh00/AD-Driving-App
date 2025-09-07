export interface User {
  id: string;
  name: string;
  email: string;
  role: 'instructor' | 'student' | 'admin';
  instructor_id?: string;
  created_at: string;
  is_approved?: boolean;
  is_restricted?: boolean;
}

export interface Student extends User {
  role: 'student';
  instructor_id: string;
}

export interface Instructor extends User {
  role: 'instructor';
}

export interface Admin extends User {
  role: 'admin';
}

export interface Task {
  id: string;
  name: string;
  studentId?: string;
  capital: 1 | 2 | 3 | 4;
  instructor_id?: string; // Track who created the task
}

export interface Subtask {
  id: string;
  name: string;
  taskId: string;
}

export interface Evaluation {
  id: string;
  student_id: string;
  instructor_id: string;
  date: string;
  score: number;
  feedback: string;
  created_at: string;
}

export interface Report {
  id: string;
  student_id: string;
  instructor_id: string;
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
  instructor_id: string;
  start: string; // ISO
  end: string;   // ISO
}

export interface Booking {
  id: string;
  student_id: string;
  instructor_id: string;
  start: string; // ISO
  end: string;   // ISO
  status: BookingStatus;
  created_at: string;
  created_by: 'instructor' | 'student';
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
  instructor_id: string;
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

export interface AdminStats {
  totalUsers: number;
  totalInstructors: number;
  totalStudents: number;
  pendingApprovals: number;
  restrictedUsers: number;
  totalReports: number;
  activeBookings: number;
  totalEvaluations: number;
}

export interface UserReport {
  id: string;
  reported_user_id: string;
  reporter_id: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved';
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
}

export type SubscriptionPlan = 'free' | 'basic' | 'premium' | 'enterprise';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  price: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number;
  current_uses: number;
  valid_from: string;
  valid_until: string;
  applicable_plans: SubscriptionPlan[];
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  last_four?: string;
  brand?: string;
  is_default: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method_id: string;
  discount_code_id?: string;
  discount_amount?: number;
  created_at: string;
}
