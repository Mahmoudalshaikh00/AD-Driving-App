import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { AppNotification, NotificationSettings, NotificationType, NotificationPriority } from '@/types';
import { useAuth } from './useAuthStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const NOTIFICATIONS_KEY = 'app_notifications';
const NOTIFICATION_SETTINGS_KEY = 'notification_settings';

export const [NotificationProvider, useNotificationStore] = createContextHook(() => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  // Initialize push notifications
  useEffect(() => {
    const initializePushNotifications = async () => {
      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return;
      }

      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.log('Push notification permission denied');
          return;
        }

        if (Platform.OS !== 'web') {
          try {
            // Try to get push token without explicit projectId first
            // This will use the projectId from app.json/app.config.js
            const token = (await Notifications.getExpoPushTokenAsync()).data;
            console.log('Expo push token:', token);
            setExpoPushToken(token);
          } catch (tokenError) {
            console.warn('Could not get push token:', tokenError);
            // Continue without push token - local notifications will still work
          }
        }
      } catch (error) {
        console.error('Error initializing push notifications:', error);
      }
    };

    initializePushNotifications();
  }, []);

  // Load data from AsyncStorage
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        console.log('Loading notification data from storage...');
        const [storedNotifications, storedSettings] = await Promise.all([
          AsyncStorage.getItem(`${NOTIFICATIONS_KEY}_${user.id}`),
          AsyncStorage.getItem(`${NOTIFICATION_SETTINGS_KEY}_${user.id}`)
        ]);
        
        if (storedNotifications) {
          const parsedNotifications = JSON.parse(storedNotifications);
          // Filter out expired notifications
          const validNotifications = parsedNotifications.filter((n: AppNotification) => 
            !n.expires_at || new Date(n.expires_at) > new Date()
          );
          console.log('Loaded notifications:', validNotifications.length);
          setNotifications(validNotifications);
        }
        
        if (storedSettings) {
          const parsedSettings = JSON.parse(storedSettings);
          console.log('Loaded notification settings');
          setSettings(parsedSettings);
        } else {
          // Create default settings
          const defaultSettings: NotificationSettings = {
            id: uid(),
            user_id: user.id,
            messages: true,
            bookings: true,
            reminders: true,
            evaluations: true,
            push_enabled: true,
            sound_enabled: true,
            vibration_enabled: true,
          };
          setSettings(defaultSettings);
        }
        
        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading notification data:', error);
        setIsLoaded(true);
      }
    };
    
    loadData();
  }, [user]);

  // Save notifications to AsyncStorage
  useEffect(() => {
    if (isLoaded && user) {
      const saveNotifications = async () => {
        try {
          await AsyncStorage.setItem(
            `${NOTIFICATIONS_KEY}_${user.id}`, 
            JSON.stringify(notifications)
          );
        } catch (error) {
          console.error('Error saving notifications:', error);
        }
      };
      saveNotifications();
    }
  }, [notifications, isLoaded, user]);

  // Save settings to AsyncStorage
  useEffect(() => {
    if (isLoaded && user && settings) {
      const saveSettings = async () => {
        try {
          await AsyncStorage.setItem(
            `${NOTIFICATION_SETTINGS_KEY}_${user.id}`, 
            JSON.stringify(settings)
          );
        } catch (error) {
          console.error('Error saving notification settings:', error);
        }
      };
      saveSettings();
    }
  }, [settings, isLoaded, user]);

  // Check if notifications should be sent based on quiet hours
  const isQuietTime = useCallback(() => {
    if (!settings?.quiet_hours_start || !settings?.quiet_hours_end) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = settings.quiet_hours_start.split(':').map(Number);
    const [endHour, endMin] = settings.quiet_hours_end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }, [settings]);

  // Send local notification
  const sendLocalNotification = useCallback(async (notification: AppNotification) => {
    if (!settings?.push_enabled || isQuietTime()) return;
    
    try {
      if (Platform.OS !== 'web') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: notification.title,
            body: notification.body,
            data: notification.data,
            sound: settings.sound_enabled ? 'default' : undefined,
          },
          trigger: null,
        });
      } else {
        // Web notification fallback
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.body,
            icon: '/assets/images/icon.png',
          });
        } else {
          console.log('Web notification:', notification.title, notification.body);
        }
      }
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }, [settings, isQuietTime]);

  // Create and send notification
  const createNotification = useCallback(async (
    type: NotificationType,
    priority: NotificationPriority,
    title: string,
    body: string,
    recipientId: string,
    senderId?: string,
    data?: Record<string, any>,
    actionUrl?: string,
    expiresInHours?: number
  ) => {
    const notification: AppNotification = {
      id: uid(),
      type,
      priority,
      title,
      body,
      data,
      recipient_id: recipientId,
      sender_id: senderId,
      read: false,
      created_at: new Date().toISOString(),
      expires_at: expiresInHours ? 
        new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString() : 
        undefined,
      action_url: actionUrl,
    };

    console.log('Creating notification:', notification);
    
    // Add to local state if it's for current user
    if (user && recipientId === user.id) {
      setNotifications(prev => [notification, ...prev]);
      
      // Send local notification based on settings
      const shouldNotify = (
        (type === 'message' && settings?.messages) ||
        (type.includes('booking') && settings?.bookings) ||
        (type === 'lesson_reminder' && settings?.reminders) ||
        (type === 'evaluation_completed' && settings?.evaluations)
      );
      
      if (shouldNotify) {
        await sendLocalNotification(notification);
      }
    }
    
    return notification;
  }, [user, settings, sendLocalNotification]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Mark notifications as read by student and type
  const markAsReadByStudentAndType = useCallback((studentId: string, type?: 'message' | 'booking' | 'schedule' | 'evaluation') => {
    console.log('📖 Marking notifications as read:', { studentId, type });
    
    setNotifications(prev => {
      const updated = prev.map(n => {
        if (n.sender_id === studentId && !n.read) {
          if (!type) {
            console.log('📖 Marking all notifications as read for student:', studentId);
            return { ...n, read: true };
          }
          const shouldMark = (
            (type === 'message' && n.type === 'message') ||
            (type === 'booking' && (n.type === 'booking_request' || n.type === 'booking_approved' || n.type === 'booking_rejected')) ||
            (type === 'schedule' && (n.type === 'availability_added' || n.type === 'lesson_reminder')) ||
            (type === 'evaluation' && n.type === 'evaluation_completed')
          );
          if (shouldMark) {
            console.log('📖 Marking notification as read:', { id: n.id, type: n.type, studentId });
            return { ...n, read: true };
          }
        }
        return n;
      });
      
      const markedCount = updated.filter(n => n.read).length - prev.filter(n => n.read).length;
      if (markedCount > 0) {
        console.log('📖 Successfully marked', markedCount, 'notifications as read');
      } else {
        console.log('📖 No notifications found to mark as read for:', { studentId, type });
      }
      
      return updated;
    });
  }, []);

  // Delete notification
  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Update notification settings
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => prev ? { ...prev, ...newSettings } : null);
  }, []);

  // Get notifications by type
  const getNotificationsByType = useCallback((type: NotificationType) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  // Get unread notifications
  const unreadNotifications = useMemo(() => {
    return notifications.filter(n => !n.read);
  }, [notifications]);

  // Get unread count
  const unreadCount = useMemo(() => {
    return unreadNotifications.length;
  }, [unreadNotifications]);

  // Get unread count by student
  const getUnreadCountByStudent = useCallback((studentId: string, type?: 'message' | 'booking' | 'schedule' | 'evaluation') => {
    return unreadNotifications.filter(n => {
      if (n.sender_id !== studentId) return false;
      if (!type) return true;
      
      return (
        (type === 'message' && n.type === 'message') ||
        (type === 'booking' && (n.type === 'booking_request' || n.type === 'booking_approved' || n.type === 'booking_rejected')) ||
        (type === 'schedule' && (n.type === 'availability_added' || n.type === 'lesson_reminder')) ||
        (type === 'evaluation' && n.type === 'evaluation_completed')
      );
    }).length;
  }, [unreadNotifications]);

  // Get unread message count by student
  const getUnreadMessageCountByStudent = useCallback((studentId: string) => {
    return getUnreadCountByStudent(studentId, 'message');
  }, [getUnreadCountByStudent]);

  // Get total unread message count
  const getTotalUnreadMessageCount = useCallback(() => {
    return unreadNotifications.filter(n => n.type === 'message').length;
  }, [unreadNotifications]);

  // Get notifications by priority
  const getNotificationsByPriority = useCallback((priority: NotificationPriority) => {
    return notifications.filter(n => n.priority === priority);
  }, [notifications]);

  // Create test notifications for demonstration
  const createTestNotifications = useCallback(async (students?: any[]) => {
    if (!user) return;
    
    console.log('🧪 Creating test notifications for user:', user.id);
    
    // If we have students, create notifications from them
    if (students && students.length > 0) {
      const student1 = students[0];
      const student2 = students[1] || students[0];
      
      // Create test message notifications from actual students
      await createNotification(
        'message',
        'normal',
        `New message from ${student1.name}`,
        'Hey, I have a question about today\'s lesson!',
        user.id,
        student1.id,
        { senderName: student1.name, messagePreview: 'Hey, I have a question about today\'s lesson!' },
        `/chat/${student1.id}`,
        24
      );
      
      if (student2.id !== student1.id) {
        await createNotification(
          'message',
          'normal',
          `New message from ${student2.name}`,
          'Thank you for the feedback on my performance!',
          user.id,
          student2.id,
          { senderName: student2.name, messagePreview: 'Thank you for the feedback on my performance!' },
          `/chat/${student2.id}`,
          24
        );
      }
      
      // Create additional message from first student
      await createNotification(
        'message',
        'normal',
        `New message from ${student1.name}`,
        'Can we schedule an extra session this week?',
        user.id,
        student1.id,
        { senderName: student1.name, messagePreview: 'Can we schedule an extra session this week?' },
        `/chat/${student1.id}`,
        24
      );
    } else {
      // Fallback to generic test notifications
      await createNotification(
        'message',
        'normal',
        'New message from John Doe',
        'Hey, how are you doing with the exercises?',
        user.id,
        'test-sender-1',
        { senderName: 'John Doe', messagePreview: 'Hey, how are you doing with the exercises?' },
        '/chat/test-sender-1',
        24
      );
    }
    
    console.log('✅ Test notifications created');
  }, [createNotification, user]);

  // Helper functions for specific notification types
  const sendMessageNotification = useCallback(async (
    recipientId: string, 
    senderName: string, 
    messagePreview: string,
    chatUrl?: string,
    senderId?: string
  ) => {
    return createNotification(
      'message',
      'normal',
      `New message from ${senderName}`,
      messagePreview,
      recipientId,
      senderId || user?.id,
      { senderName, messagePreview },
      chatUrl,
      24 // Expire in 24 hours
    );
  }, [createNotification, user]);

  const sendBookingRequestNotification = useCallback(async (
    recipientId: string,
    studentName: string,
    lessonTime: string
  ) => {
    return createNotification(
      'booking_request',
      'high',
      'New lesson request',
      `${studentName} requested a lesson for ${lessonTime}`,
      recipientId,
      user?.id,
      { studentName, lessonTime },
      '/schedule',
      72 // Expire in 72 hours
    );
  }, [createNotification, user]);

  const sendBookingApprovedNotification = useCallback(async (
    recipientId: string,
    trainerName: string,
    lessonTime: string
  ) => {
    return createNotification(
      'booking_approved',
      'high',
      'Lesson approved!',
      `${trainerName} approved your lesson for ${lessonTime}`,
      recipientId,
      user?.id,
      { trainerName, lessonTime },
      '/schedule',
      168 // Expire in 1 week
    );
  }, [createNotification, user]);

  const sendBookingRejectedNotification = useCallback(async (
    recipientId: string,
    trainerName: string,
    lessonTime: string
  ) => {
    return createNotification(
      'booking_rejected',
      'normal',
      'Lesson request declined',
      `${trainerName} declined your lesson request for ${lessonTime}`,
      recipientId,
      user?.id,
      { trainerName, lessonTime },
      '/schedule',
      48 // Expire in 48 hours
    );
  }, [createNotification, user]);

  const sendAvailabilityAddedNotification = useCallback(async (
    recipientId: string,
    trainerName: string,
    timeSlot: string
  ) => {
    return createNotification(
      'availability_added',
      'low',
      'New availability',
      `${trainerName} added new availability: ${timeSlot}`,
      recipientId,
      user?.id,
      { trainerName, timeSlot },
      '/schedule',
      168 // Expire in 1 week
    );
  }, [createNotification, user]);

  const sendLessonReminderNotification = useCallback(async (
    recipientId: string,
    lessonTime: string,
    partnerName: string
  ) => {
    return createNotification(
      'lesson_reminder',
      'urgent',
      'Lesson reminder',
      `Your lesson with ${partnerName} starts in 30 minutes (${lessonTime})`,
      recipientId,
      undefined,
      { lessonTime, partnerName },
      '/schedule',
      2 // Expire in 2 hours
    );
  }, [createNotification]);

  const sendEvaluationCompletedNotification = useCallback(async (
    recipientId: string,
    trainerName: string,
    score: number
  ) => {
    return createNotification(
      'evaluation_completed',
      'normal',
      'New evaluation',
      `${trainerName} completed your evaluation. Score: ${score}/10`,
      recipientId,
      user?.id,
      { trainerName, score },
      '/evaluations',
      168 // Expire in 1 week
    );
  }, [createNotification, user]);

  return useMemo(() => ({
    notifications,
    settings,
    unreadNotifications,
    unreadCount,
    isLoaded,
    expoPushToken,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    updateSettings,
    getNotificationsByType,
    getNotificationsByPriority,
    sendMessageNotification,
    sendBookingRequestNotification,
    sendBookingApprovedNotification,
    sendBookingRejectedNotification,
    sendAvailabilityAddedNotification,
    sendLessonReminderNotification,
    sendEvaluationCompletedNotification,
    markAsReadByStudentAndType,
    createTestNotifications,
    getUnreadCountByStudent,
    getUnreadMessageCountByStudent,
    getTotalUnreadMessageCount,
  }), [
    notifications,
    settings,
    unreadNotifications,
    unreadCount,
    isLoaded,
    expoPushToken,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    updateSettings,
    getNotificationsByType,
    getNotificationsByPriority,
    sendMessageNotification,
    sendBookingRequestNotification,
    sendBookingApprovedNotification,
    sendBookingRejectedNotification,
    sendAvailabilityAddedNotification,
    sendLessonReminderNotification,
    sendEvaluationCompletedNotification,
    markAsReadByStudentAndType,
    createTestNotifications,
    getUnreadCountByStudent,
    getUnreadMessageCountByStudent,
    getTotalUnreadMessageCount,
  ]);
});