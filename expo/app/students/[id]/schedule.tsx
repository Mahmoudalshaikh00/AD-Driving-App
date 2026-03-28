import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
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
  const [showAppointmentDetails, setShowAppointmentDetails] = useState<boolean>(false);

  const student = getStudentById(id);
  const isInstructor = user?.role === 'instructor';
  
  // Mark schedule notifications as read when entering this screen
  React.useEffect(() => {
    if (id && isInstructor) {
      markAsReadByStudentAndType(id, 'schedule');
    } else if (user?.instructor_id) {
      markAsReadByStudentAndType(user.instructor_id, 'schedule');
    }
  }, [id, isInstructor, user?.instructor_id, markAsReadByStudentAndType]);
  
  // Get bookings for this specific student
  const studentAppointments = studentBookings(id);
  
  // Get instructor availability for this student's instructor
  const instructorAvailabilitySlots = student?.instructor_id ? trainerAvailability(student.instructor_id) : [];

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
        const successMessage = isInstructor 
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
        {isInstructor ? (
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

    const title = isInstructor ? `${student?.name}'s Appointments` : 'Your Appointments';

    return (
      <View style={styles.appointmentsContainer}>
        <TouchableOpacity 
          style={styles.appointmentButton}
          onPress={() => setShowAppointmentDetails(!showAppointmentDetails)}
        >
          <Text style={styles.appointmentButtonText}>{title}</Text>
          <View style={styles.appointmentBadge}>
            <Text style={styles.appointmentBadgeText}>{studentAppointments.length}</Text>
          </View>
        </TouchableOpacity>
        
        {showAppointmentDetails && (
          <View style={styles.appointmentsList}>
            {studentAppointments.map(appointment => {
              const startDate = new Date(appointment.start);
              const endDate = new Date(appointment.end);
              
              return (
                <View key={appointment.id} style={styles.appointmentItem}>
                  <View style={styles.appointmentInfo}>
                    <Text style={styles.appointmentDate}>
                      {format(startDate, 'EEE, MMM d')}
                    </Text>
                    <Text style={styles.appointmentTime}>
                      {format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}
                    </Text>
                    <Text style={[styles.appointmentStatus, 
                      appointment.status === 'approved' && styles.statusApproved,
                      appointment.status === 'pending' && styles.statusPending,
                      appointment.status === 'rejected' && styles.statusRejected
                    ]}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </Text>
                  </View>
                  {isInstructor && (
                    <View style={styles.appointmentActions}>
                      {appointment.status === 'pending' ? (
                        <>
                          <TouchableOpacity
                            style={[styles.appointmentActionButton, styles.approveButton]}
                            onPress={() => updateBookingStatus(appointment.id, 'approved')}
                          >
                            <Text style={styles.approveButtonText}>Approve</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.appointmentActionButton, styles.rejectButton]}
                            onPress={() => updateBookingStatus(appointment.id, 'rejected')}
                          >
                            <Text style={styles.rejectButtonText}>Reject</Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <TouchableOpacity
                          style={styles.editAppointmentButton}
                          onPress={() => {
                            setEditingAppointment(appointment);
                            setShowAppointmentModal(true);
                          }}
                        >
                          <Text style={styles.editButtonText}>Edit</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const renderInstructorAvailability = () => {
    if (instructorAvailabilitySlots.length === 0) return null;

    const title = isInstructor ? 'Your Availability' : 'Instructor Availability';

    return (
      <View style={styles.availabilityContainer}>
        <Text style={styles.availabilityTitle}>{title} ({instructorAvailabilitySlots.length})</Text>
        <View style={styles.availabilityGrid}>
          {instructorAvailabilitySlots.map(slot => {
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
                  {!isInstructor && (
                    <Text style={styles.availabilityLabel}>Available</Text>
                  )}
                </View>
                {isInstructor && (
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
        <Text style={styles.headerTitle}>{isInstructor ? `${student.name} Schedule` : 'Your Schedule'}</Text>
        <View style={{ width: 36 }} />
      </View>

      {renderActionButtons()}
      {renderStudentAppointments()}
      
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
        isStudentView={!isInstructor}
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
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  appointmentsList: {
    marginTop: 8,
    gap: 8,
  },
  appointmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentDate: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  appointmentTime: {
    fontSize: 12,
    color: Colors.light.textLight,
    marginBottom: 4,
  },
  appointmentStatus: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusApproved: {
    color: '#28a745',
  },
  statusPending: {
    color: '#ffc107',
  },
  statusRejected: {
    color: '#dc3545',
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  appointmentActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#28a745',
  },
  rejectButton: {
    backgroundColor: '#dc3545',
  },
  editAppointmentButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  appointmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  appointmentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  appointmentBadge: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  appointmentBadgeText: {
    color: '#fff',
    fontSize: 12,
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