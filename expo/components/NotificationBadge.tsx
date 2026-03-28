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
  const { getUnreadCountByStudent } = useNotificationStore();

  let displayCount = count;
  
  if (displayCount === undefined && studentId) {
    // Use the optimized function from the store
    displayCount = getUnreadCountByStudent(studentId, type);
  }

  if (!showZero && (!displayCount || displayCount === 0)) {
    return null;
  }

  const finalCount = displayCount || 0;
  const displayText = finalCount > maxCount ? `${maxCount}+` : finalCount.toString();

  const sizeStyles = {
    small: { width: 18, height: 18, fontSize: 10 },
    medium: { width: 22, height: 22, fontSize: 12 },
    large: { width: 26, height: 26, fontSize: 14 },
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
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: -6,
    right: -6,
    zIndex: 10,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '800',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});