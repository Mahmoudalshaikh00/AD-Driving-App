import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { ChevronLeft, Plus, Clock } from 'lucide-react-native';
import { format } from 'date-fns';
import Colors from '@/constants/colors';
import { useScheduleStore } from '@/hooks/useScheduleStore';
import { useAuth } from '@/hooks/useAuthStore';
import { useStudentStore } from '@/hooks/useStudentStore';
import { useNotificationStore } from '@/hooks/useNotificationStore';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WeeklyCalendar from '@/components/WeeklyCalendar';
import AppointmentModal from '@/components/AppointmentModal';
import AvailabilityModal from '@/components/AvailabilityModal';

export default function ScheduleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { students } = useStudentStore();
  const { markAsReadByStudentAndType } = useNotificationStore();
  const scheduleStore = useScheduleStore();
  const {
    requestBooking,
    updateBookingStatus,
    addAvailability,
    removeAvailability,
    studentOfTrainer,
    studentColor,
    myBookings,
    myTrainerAvailability,
    trainerAvailability,
    updateBooking,
    updateAvailabilitySlot,
    isLoaded,
  } = scheduleStore;

  const [showAppointmentModal, setShowAppointmentModal] = useState<boolean>(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState<boolean>(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [editingAvailability, setEditingAvailability] = useState<string | null>(null);

  const isTrainer = user?.role === 'trainer';
  const pendingBookings = myBookings.filter(b => b.status === 'pending');
  
  // Mark schedule notifications as read when entering this screen
  React.useEffect(() => {
    if (isTrainer) {
      // For trainers, mark all schedule notifications as read
      students.forEach(student => {
        markAsReadByStudentAndType(student.id, 'schedule');
      });
    } else if (user?.trainer_id) {
      // For students, mark trainer's schedule notifications as read
      markAsReadByStudentAndType(user.trainer_id, 'schedule');
    }
  }, [isTrainer, students, user?.trainer_id, markAsReadByStudentAndType]);


  const handleAppointmentCreate = (studentId: string, date: Date, startHour: number, startMinute: number, endHour: number, endMinute: number) => {
    console.log('Creating/updating appointment:', { studentId, date, startHour, startMinute, endHour, endMinute, editingAppointment });
    try {
      const startTime = new Date(date);
      startTime.setHours(startHour, startMinute, 0, 0);
      const endTime = new Date(date);
      endTime.setHours(endHour, endMinute, 0, 0);
      
      if (endTime <= startTime) {
        Alert.alert('Error', 'End time must be after start time');
        return;
      }
      
      // For students, use their own ID as studentId
      const finalStudentId = isTrainer ? studentId : (user?.id || '');
      
      let result;
      if (editingAppointment) {
        // Update existing appointment
        result = updateBooking?.(editingAppointment.id, finalStudentId, startTime.toISOString(), endTime.toISOString()) || { success: false, error: 'Update not available' };
      } else {
        // Create new appointment
        result = requestBooking(finalStudentId, startTime.toISOString(), endTime.toISOString());
      }
      
      console.log('Appointment result:', result);
      if (result.success) {
        setShowAppointmentModal(false);
        setEditingAppointment(null);
        const successMessage = isTrainer 
          ? (editingAppointment ? 'Appointment updated successfully!' : 'Appointment created successfully!')
          : (editingAppointment ? 'Appointment request updated!' : 'Appointment request sent!');
        Alert.alert('Success', successMessage);
      } else {
        Alert.alert('Error', result.error || 'Failed to save appointment');
      }
    } catch (error) {
      console.error('Error saving appointment:', error);
      Alert.alert('Error', 'Failed to save appointment');
    }
  };

  const handleAvailabilitySet = (date: Date, startHour: number, startMinute: number, endHour: number, endMinute: number) => {
    console.log('Setting/updating availability:', { date, startHour, startMinute, endHour, endMinute, editingAvailability });
    try {
      const startTime = new Date(date);
      startTime.setHours(startHour, startMinute, 0, 0);
      const endTime = new Date(date);
      endTime.setHours(endHour, endMinute, 0, 0);
      
      if (endTime <= startTime) {
        Alert.alert('Error', 'End time must be after start time');
        return;
      }
      
      let result;
      if (editingAvailability) {
        // Update existing availability
        result = updateAvailabilitySlot?.(editingAvailability, startTime.toISOString(), endTime.toISOString()) || { success: false, error: 'Update not available' };
      } else {
        // Create new availability
        result = addAvailability(startTime.toISOString(), endTime.toISOString());
      }
      
      console.log('Availability result:', result);
      if (result.success) {
        setShowAvailabilityModal(false);
        setEditingAvailability(null);
        Alert.alert('Success', editingAvailability ? 'Availability updated successfully!' : 'Availability set successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to save availability');
      }
    } catch (error) {
      console.error('Error saving availability:', error);
      Alert.alert('Error', 'Failed to save availability');
    }
  };

  // Remove automatic booking creation - buttons will handle this

  const renderActionButtons = () => {
    return (
      <View style={styles.actionButtons}>
        {isTrainer ? (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                console.log('Add Appointment button pressed');
                setEditingAppointment(null);
                setShowAppointmentModal(true);
              }}
              testID="create-appointment-button"
            >
              <Plus size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Add Appointment</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.availabilityButton]}
              onPress={() => {
                console.log('Set Availability button pressed');
                setEditingAvailability(null);
                setShowAvailabilityModal(true);
              }}
              testID="set-availability-button"
            >
              <Clock size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Set Availability</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              console.log('Request Appointment button pressed');
              setEditingAppointment(null);
              setShowAppointmentModal(true);
            }}
            testID="request-appointment-button"
          >
            <Plus size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Request Appointment</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderPendingRequests = () => {
    if (pendingBookings.length === 0) return null;

    const title = isTrainer ? 'Pending Requests' : 'Pending Appointments';
    const showActions = isTrainer;

    return (
      <View style={styles.pendingContainer}>
        <Text style={styles.pendingTitle}>{title} ({pendingBookings.length})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {pendingBookings.map(booking => {
            const startDate = new Date(booking.start);
            const endDate = new Date(booking.end);
            const student = studentOfTrainer(booking.student_id);
            
            return (
              <View key={booking.id} style={styles.pendingCard}>
                <View style={styles.pendingHeader}>
                  <View style={[styles.colorDot, { backgroundColor: studentColor(booking.student_id) }]} />
                  <Text style={styles.pendingStudentName}>
                    {isTrainer ? (student?.name || 'Student') : 'Your Appointment'}
                  </Text>
                </View>
                <Text style={styles.pendingTime}>
                  {format(startDate, 'MMM d, HH:mm')} - {format(endDate, 'HH:mm')}
                </Text>
                {showActions && (
                  <View style={styles.pendingActions}>
                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={() => {
                        updateBookingStatus(booking.id, 'approved');
                        Alert.alert('Success', 'Booking approved!');
                      }}
                      testID={`approve-${booking.id}`}
                    >
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => {
                        updateBookingStatus(booking.id, 'rejected');
                        Alert.alert('Success', 'Booking rejected');
                      }}
                      testID={`reject-${booking.id}`}
                    >
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {!showActions && (
                  <Text style={styles.pendingStatusText}>Waiting for approval</Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderAvailabilitySlots = () => {
    const availabilitySlots = isTrainer ? trainerAvailability() : myTrainerAvailability;
    if (availabilitySlots.length === 0) return null;

    const title = isTrainer ? 'Your Availability' : 'Trainer Availability';

    return (
      <View style={styles.availabilityContainer}>
        <Text style={styles.availabilityTitle}>{title} ({availabilitySlots.length})</Text>
        <View style={styles.availabilityGrid}>
          {availabilitySlots.map(slot => {
            const startDate = new Date(slot.start);
            const endDate = new Date(slot.end);
            
            return (
              <View key={slot.id} style={styles.availabilitySlot}>
                <View style={styles.availabilityInfo}>
                  <Text style={styles.availabilityDate}>
                    {format(startDate, 'EEE, MMM d')}
                  </Text>
                  <Text style={styles.availabilityTime}>
                    {format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}
                  </Text>
                </View>
                {isTrainer && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => {
                      Alert.alert(
                        'Remove Availability',
                        'Are you sure you want to remove this availability slot?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Remove',
                            style: 'destructive',
                            onPress: () => removeAvailability(slot.id)
                          }
                        ]
                      );
                    }}
                    testID={`remove-availability-${slot.id}`}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <View style={[styles.topHeader, { paddingTop: Math.max(10, insets.top + 6) }]} testID="schedule-header">
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} testID="schedule-back" accessibilityLabel="Back">
            <ChevronLeft size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Schedule</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading schedule...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.topHeader, { paddingTop: Math.max(10, insets.top + 6) }]} testID="schedule-header">
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} testID="schedule-back" accessibilityLabel="Back">
          <ChevronLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule</Text>
        <View style={{ width: 36 }} />
      </View>

      {renderActionButtons()}
      {renderPendingRequests()}
      {renderAvailabilitySlots()}
      
      <WeeklyCalendar 
        onEditAppointment={(booking) => {
          setEditingAppointment(booking);
          setShowAppointmentModal(true);
        }}
        onEditAvailability={(slotId) => {
          setEditingAvailability(slotId);
          setShowAvailabilityModal(true);
        }}
      />
      
      <AppointmentModal
        visible={showAppointmentModal}
        onClose={() => {
          setShowAppointmentModal(false);
          setEditingAppointment(null);
        }}
        onConfirm={handleAppointmentCreate}
        students={isTrainer ? students : []}
        studentColor={studentColor}
        editingAppointment={editingAppointment}
        isStudentView={!isTrainer}
        currentUserId={user?.id}
      />
      
      <AvailabilityModal
        visible={showAvailabilityModal}
        onClose={() => {
          setShowAvailabilityModal(false);
          setEditingAvailability(null);
        }}
        onConfirm={handleAvailabilitySet}
        editingAvailabilityId={editingAvailability}
        trainerAvailability={trainerAvailability}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  pendingContainer: {
    backgroundColor: Colors.light.cardBackground,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  pendingCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pendingStudentName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  pendingTime: {
    fontSize: 12,
    color: Colors.light.textLight,
    marginBottom: 12,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#e7f9ee',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#14b86a',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#fde8ea',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e53935',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  availabilityButton: {
    backgroundColor: '#28a745',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  availabilityContainer: {
    backgroundColor: Colors.light.cardBackground,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    maxHeight: 200,
  },
  availabilityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  availabilityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  availabilitySlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
    minWidth: '48%',
    maxWidth: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  availabilityInfo: {
    flex: 1,
  },
  availabilityDate: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  availabilityTime: {
    fontSize: 12,
    color: Colors.light.textLight,
  },
  removeButton: {
    backgroundColor: '#fde8ea',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e53935',
  },
  pendingStatusText: {
    fontSize: 12,
    color: Colors.light.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.textLight,
  },
});