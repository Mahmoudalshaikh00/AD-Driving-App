import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { ChevronLeft, Plus, Clock } from 'lucide-react-native';
import { format } from 'date-fns';
import Colors from '@/constants/colors';
import { useScheduleStore } from '@/hooks/useScheduleStore';
import { useAuth } from '@/hooks/useAuthStore';
import { useStudentStore } from '@/hooks/useStudentStore';
import { useNotificationStore } from '@/hooks/useNotificationStore';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WeeklyCalendar from '@/components/WeeklyCalendar';
import AppointmentModal from '@/components/AppointmentModal';
import AvailabilityModal from '@/components/AvailabilityModal';

export default function StudentScheduleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getStudentById } = useStudentStore();
  const { markAsReadByStudentAndType } = useNotificationStore();
  const scheduleStore = useScheduleStore();
  const {
    requestBooking,
    updateBookingStatus,
    addAvailability,
    removeAvailability,
    studentColor,
    studentBookings,
    trainerAvailability,
    updateBooking,
    updateAvailabilitySlot,
    isLoaded,
  } = scheduleStore;

  const [showAppointmentModal, setShowAppointmentModal] = useState<boolean>(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState<boolean>(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [editingAvailability, setEditingAvailability] = useState<string | null>(null);

  const student = getStudentById(id);
  const isTrainer = user?.role === 'trainer';
  
  // Mark schedule notifications as read when entering this screen
  React.useEffect(() => {
    if (id && isTrainer) {
      markAsReadByStudentAndType(id, 'schedule');
    } else if (user?.trainer_id) {
      markAsReadByStudentAndType(user.trainer_id, 'schedule');
    }
  }, [id, isTrainer, user?.trainer_id, markAsReadByStudentAndType]);
  
  // Get bookings for this specific student
  const studentAppointments = studentBookings(id);
  
  // Get trainer availability for this student's trainer
  const trainerAvailabilitySlots = student?.trainer_id ? trainerAvailability(student.trainer_id) : [];

  const handleAppointmentCreate = (studentId: string, date: Date, startHour: number, startMinute: number, endHour: number, endMinute: number) => {
    console.log('Creating/updating appointment for student:', { studentId, date, startHour, startMinute, endHour, endMinute, editingAppointment });
    try {
      const startTime = new Date(date);
      startTime.setHours(startHour, startMinute, 0, 0);
      const endTime = new Date(date);
      endTime.setHours(endHour, endMinute, 0, 0);
      
      if (endTime <= startTime) {
        Alert.alert('Error', 'End time must be after start time');
        return;
      }
      
      // Use the student ID from the route
      const finalStudentId = id;
      
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

  const renderActionButtons = () => {
    return (
      <View style={styles.actionButtons}>
        {isTrainer ? (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                console.log('Add Appointment button pressed for student:', id);
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
              console.log('Request Appointment button pressed for student:', id);
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

  const renderStudentAppointments = () => {
    if (studentAppointments.length === 0) return null;

    const title = isTrainer ? `${student?.name}'s Appointments` : 'Your Appointments';

    return (
      <View style={styles.appointmentsContainer}>
        <Text style={styles.appointmentsTitle}>{title} ({studentAppointments.length})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {studentAppointments.map(booking => {
            const startDate = new Date(booking.start);
            const endDate = new Date(booking.end);
            
            return (
              <View key={booking.id} style={[
                styles.appointmentCard,
                booking.status === 'approved' && styles.approvedCard,
                booking.status === 'pending' && styles.pendingCard,
                booking.status === 'rejected' && styles.rejectedCard,
              ]}>
                <View style={styles.appointmentHeader}>
                  <View style={[styles.colorDot, { backgroundColor: studentColor(booking.student_id) }]} />
                  <Text style={styles.appointmentStudentName}>
                    {isTrainer ? (student?.name || 'Student') : 'Your Appointment'}
                  </Text>
                </View>
                <Text style={styles.appointmentTime}>
                  {format(startDate, 'MMM d, HH:mm')} - {format(endDate, 'HH:mm')}
                </Text>
                <View style={styles.appointmentStatus}>
                  <Text style={[
                    styles.statusText,
                    booking.status === 'approved' && styles.approvedText,
                    booking.status === 'pending' && styles.pendingText,
                    booking.status === 'rejected' && styles.rejectedText,
                  ]}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Text>
                </View>
                {isTrainer && booking.status === 'pending' && (
                  <View style={styles.appointmentActions}>
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
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderTrainerAvailability = () => {
    if (trainerAvailabilitySlots.length === 0) return null;

    const title = isTrainer ? 'Your Availability' : 'Trainer Availability';

    return (
      <View style={styles.availabilityContainer}>
        <Text style={styles.availabilityTitle}>{title} ({trainerAvailabilitySlots.length})</Text>
        <View style={styles.availabilityGrid}>
          {trainerAvailabilitySlots.map(slot => {
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
                  {!isTrainer && (
                    <Text style={styles.availabilityLabel}>Available</Text>
                  )}
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
        <View style={[styles.topHeader, { paddingTop: Math.max(10, insets.top + 6) }]} testID="student-schedule-header">
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} testID="student-schedule-back" accessibilityLabel="Back">
            <ChevronLeft size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading schedule...</Text>
        </View>
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Student not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.topHeader, { paddingTop: Math.max(10, insets.top + 6) }]} testID="student-schedule-header">
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} testID="student-schedule-back" accessibilityLabel="Back">
          <ChevronLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isTrainer ? `${student.name} Schedule` : 'Your Schedule'}</Text>
        <View style={{ width: 36 }} />
      </View>

      {renderActionButtons()}
      {renderStudentAppointments()}
      {renderTrainerAvailability()}
      
      <WeeklyCalendar 
        studentId={id} // Pass the student ID to filter bookings
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
        students={[student]} // Only show this specific student
        studentColor={studentColor}
        editingAppointment={editingAppointment}
        isStudentView={!isTrainer}
        currentUserId={id} // Use the student ID from the route
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  errorText: {
    fontSize: 18,
    color: Colors.light.danger,
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
    fontSize: 16,
    flex: 1,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  availabilityButton: {
    backgroundColor: '#28a745',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  appointmentsContainer: {
    backgroundColor: Colors.light.cardBackground,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    maxHeight: 80,
  },
  appointmentsTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  appointmentCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 6,
    padding: 6,
    marginRight: 6,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  approvedCard: {
    borderColor: '#28a745',
    backgroundColor: '#f8fff9',
  },
  pendingCard: {
    borderColor: '#ffc107',
    backgroundColor: '#fffdf0',
  },
  rejectedCard: {
    borderColor: '#dc3545',
    backgroundColor: '#fff5f5',
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentStudentName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
  },
  appointmentTime: {
    fontSize: 11,
    color: Colors.light.textLight,
    marginBottom: 6,
  },
  appointmentStatus: {
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  approvedText: {
    color: '#28a745',
    backgroundColor: '#e7f9ee',
  },
  pendingText: {
    color: '#856404',
    backgroundColor: '#fff3cd',
  },
  rejectedText: {
    color: '#dc3545',
    backgroundColor: '#fde8ea',
  },
  appointmentActions: {
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
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  availabilityContainer: {
    backgroundColor: Colors.light.cardBackground,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    maxHeight: 80,
  },
  availabilityTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
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
    backgroundColor: '#f0f8ff',
    borderRadius: 6,
    padding: 6,
    minWidth: '48%',
    maxWidth: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#28a745',
  },
  availabilityInfo: {
    flex: 1,
  },
  availabilityDate: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  availabilityTime: {
    fontSize: 11,
    color: Colors.light.textLight,
  },
  availabilityLabel: {
    fontSize: 10,
    color: '#28a745',
    fontWeight: '600',
    marginTop: 2,
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