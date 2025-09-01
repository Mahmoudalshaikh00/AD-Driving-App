import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNotificationStore } from '@/hooks/useNotificationStore';


interface NotificationBadgeProps {
  size?: 'small' | 'medium' | 'large';
  showZero?: boolean;
  maxCount?: number;
  style?: any;
  count?: number;
  studentId?: string;
  type?: 'message' | 'booking' | 'schedule' | 'evaluation';
}

export function NotificationBadge({ 
  size = 'medium', 
  showZero = false, 
  maxCount = 99,
  style,
  count,
  studentId,
  type
}: NotificationBadgeProps) {
  const { notifications } = useNotificationStore();

  let displayCount = count;
  
  if (displayCount === undefined) {
    if (studentId && type) {
      // Count notifications for specific student and type
      displayCount = notifications.filter(n => 
        !n.read && 
        n.sender_id === studentId &&
        (
          (type === 'message' && n.type === 'message') ||
          (type === 'booking' && (n.type === 'booking_request' || n.type === 'booking_approved' || n.type === 'booking_rejected')) ||
          (type === 'schedule' && (n.type === 'availability_added' || n.type === 'lesson_reminder')) ||
          (type === 'evaluation' && n.type === 'evaluation_completed')
        )
      ).length;
    } else if (studentId) {
      // Count all notifications for specific student
      displayCount = notifications.filter(n => 
        !n.read && n.sender_id === studentId
      ).length;
    } else {
      // Count all unread notifications
      displayCount = notifications.filter(n => !n.read).length;
    }
  }

  if (!showZero && displayCount === 0) {
    return null;
  }

  const displayText = displayCount > maxCount ? `${maxCount}+` : displayCount.toString();

  const sizeStyles = {
    small: { width: 16, height: 16, fontSize: 10 },
    medium: { width: 20, height: 20, fontSize: 12 },
    large: { width: 24, height: 24, fontSize: 14 },
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={[
      styles.badge,
      {
        width: currentSize.width,
        height: currentSize.height,
        borderRadius: currentSize.width / 2,
      },
      style
    ]}>
      <Text style={[
        styles.badgeText,
        { fontSize: currentSize.fontSize }
      ]}>
        {displayText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#FF4444',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 1,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },
});