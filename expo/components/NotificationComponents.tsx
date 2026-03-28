import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { AppNotification, NotificationPriority } from '@/types';
import { useNotificationStore } from '@/hooks/useNotificationStore';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { 
  Bell, 
  MessageSquare, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  BookOpen,
  AlertTriangle,
  Info,
  Trash2,
  ChartArea
} from 'lucide-react-native';

interface NotificationItemProps {
  notification: AppNotification;
  onPress?: () => void;
  onMarkAsRead?: () => void;
  onDelete?: () => void;
}

const getNotificationIcon = (type: string, priority: NotificationPriority) => {
  const iconSize = 20;
  const getColor = () => {
    switch (priority) {
      case 'urgent': return '#FF4444';
      case 'high': return '#FF8800';
      case 'normal': return Colors.light.primary;
      case 'low': return Colors.light.textLight;
      default: return Colors.light.primary;
    }
  };

  const color = getColor();

  switch (type) {
    case 'message':
      return <MessageSquare size={iconSize} color={color} />;
    case 'booking_request':
      return <Calendar size={iconSize} color={color} />;
    case 'booking_approved':
      return <CheckCircle size={iconSize} color={color} />;
    case 'booking_rejected':
      return <XCircle size={iconSize} color={color} />;
    case 'availability_added':
      return <Clock size={iconSize} color={color} />;
    case 'lesson_reminder':
      return <AlertTriangle size={iconSize} color={color} />;
    case 'evaluation_completed':
      return <BookOpen size={iconSize} color={color} />;
    default:
      return <Info size={iconSize} color={color} />;
  }
};

const getPriorityColor = (priority: NotificationPriority) => {
  switch (priority) {
    case 'urgent': return '#FF4444';
    case 'high': return '#FF8800';
    case 'normal': return Colors.light.primary;
    case 'low': return Colors.light.textLight;
    default: return Colors.light.primary;
  }
};

const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return date.toLocaleDateString();
};

export function NotificationItem({ 
  notification, 
  onPress, 
  onMarkAsRead, 
  onDelete 
}: NotificationItemProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (notification.action_url) {
      router.push(notification.action_url as any);
    }
    
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead();
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.notificationItem,
        !notification.read && styles.unreadItem,
        { borderLeftColor: getPriorityColor(notification.priority) }
      ]}
      onPress={handlePress}
      testID={`notification-${notification.id}`}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={styles.iconContainer}>
            {getNotificationIcon(notification.type, notification.priority)}
          </View>
          <View style={styles.headerText}>
            <Text style={[
              styles.notificationTitle,
              !notification.read && styles.unreadTitle
            ]}>
              {notification.title}
            </Text>
            <Text style={styles.notificationTime}>
              {formatTimeAgo(notification.created_at)}
            </Text>
          </View>
          <View style={styles.actions}>
            {!notification.read && onMarkAsRead && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={(e) => {
                  e.stopPropagation();
                  onMarkAsRead();
                }}
                testID={`mark-read-${notification.id}`}
              >
                <ChartArea size={16} color={Colors.light.textLight} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                testID={`delete-${notification.id}`}
              >
                <Trash2 size={16} color={Colors.light.textLight} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Text style={[
          styles.notificationBody,
          !notification.read && styles.unreadBody
        ]}>
          {notification.body}
        </Text>
        {!notification.read && <View style={styles.unreadIndicator} />}
      </View>
    </TouchableOpacity>
  );
}

interface NotificationListProps {
  notifications?: AppNotification[];
  showActions?: boolean;
  emptyMessage?: string;
  onNotificationPress?: (notification: AppNotification) => void;
}

export function NotificationList({ 
  notifications: propNotifications,
  showActions = true,
  emptyMessage = 'No notifications',
  onNotificationPress
}: NotificationListProps) {
  const { 
    notifications: storeNotifications, 
    markAsRead, 
    deleteNotification 
  } = useNotificationStore();

  const notifications = propNotifications || storeNotifications;

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => {
      // Sort by priority first (urgent > high > normal > low)
      const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by read status (unread first)
      if (a.read !== b.read) return a.read ? 1 : -1;
      
      // Finally by creation time (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [notifications]);

  const renderNotification = ({ item }: { item: AppNotification }) => (
    <NotificationItem
      notification={item}
      onPress={() => onNotificationPress?.(item)}
      onMarkAsRead={showActions ? () => markAsRead(item.id) : undefined}
      onDelete={showActions ? () => deleteNotification(item.id) : undefined}
    />
  );

  if (notifications.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Bell size={48} color={Colors.light.textLight} />
        <Text style={styles.emptyText}>{emptyMessage}</Text>
        <Text style={styles.emptySubtext}>
          You&apos;ll see notifications here when they arrive
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={sortedNotifications}
      keyExtractor={(item) => item.id}
      renderItem={renderNotification}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContainer}
      testID="notification-list"
    />
  );
}

const styles = StyleSheet.create({
  notificationItem: {
    backgroundColor: Colors.light.cardBackground,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  unreadItem: {
    backgroundColor: '#f8f9ff',
    shadowOpacity: 0.15,
    elevation: 2,
  },
  notificationContent: {
    padding: 16,
    position: 'relative',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  unreadTitle: {
    fontWeight: '700',
    color: '#1a1a1a',
  },
  notificationTime: {
    fontSize: 12,
    color: Colors.light.textLight,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBody: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.textLight,
  },
  unreadBody: {
    color: Colors.light.text,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textLight,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContainer: {
    paddingVertical: 8,
  },
});