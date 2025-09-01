import React, { useMemo, useState, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, setHours, setMinutes } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Booking } from '@/types';
import { useAuth } from '@/hooks/useAuthStore';
import { useScheduleStore } from '@/hooks/useScheduleStore';

const HOURS = Array.from({ length: 15 }, (_, i) => i + 6); // 6 AM to 8 PM (20:00)

interface WeeklyCalendarProps {
  onEditAppointment?: (booking: Booking) => void;
  onEditAvailability?: (slotId: string) => void;
  studentId?: string; // Optional: filter bookings for specific student
}

export default function WeeklyCalendar({ onEditAppointment, onEditAvailability, studentId }: WeeklyCalendarProps) {
  const { user } = useAuth();
  const scheduleStore = useScheduleStore();
  const { myBookings, myTrainerAvailability, studentColor, studentOfTrainer, trainerAvailability, removeAvailability, updateBookingStatus, studentBookings } = scheduleStore;
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());

  const isTrainer = user?.role === 'trainer';

  const weekStart = useMemo(() => startOfWeek(currentWeek, { weekStartsOn: 1 }), [currentWeek]);
  
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      return {
        date,
        dayName: format(date, 'EEE'),
        dayNumber: parseInt(format(date, 'd')),
        isToday: isSameDay(date, new Date()),
      };
    });
  }, [weekStart]);

  const availability = useMemo(() => {
    return isTrainer ? trainerAvailability() : myTrainerAvailability;
  }, [isTrainer, trainerAvailability, myTrainerAvailability]);

  const getBookingForSlot = useCallback((date: Date, hour: number, minute: number): Booking | undefined => {
    // If studentId is provided, show only that student's bookings
    const bookingsToCheck = studentId ? studentBookings(studentId) : myBookings;
    return bookingsToCheck.find(booking => {
      if (booking.status === 'rejected') return false;
      const bookingStart = new Date(booking.start);
      const bookingEnd = new Date(booking.end);
      const slotTime = setMinutes(setHours(date, hour), minute);
      return slotTime >= bookingStart && slotTime < bookingEnd;
    });
  }, [myBookings, studentId, studentBookings]);

  const getContinuousBooking = useCallback((date: Date, hour: number): { booking: Booking; startHour: number; endHour: number; isStart: boolean; isEnd: boolean } | null => {
    const booking = getBookingForSlot(date, hour, 0);
    if (!booking) return null;
    
    const bookingStart = new Date(booking.start);
    const bookingEnd = new Date(booking.end);
    const startHour = bookingStart.getHours();
    const endHour = bookingEnd.getHours();
    
    return {
      booking,
      startHour,
      endHour,
      isStart: hour === startHour,
      isEnd: hour === endHour - 1 || (hour === endHour && bookingEnd.getMinutes() === 0)
    };
  }, [getBookingForSlot]);

  const getAvailabilityForSlot = useCallback((date: Date, hour: number): { start: Date; end: Date } | null => {
    const slotTime = setMinutes(setHours(date, hour), 0);
    
    for (const slot of availability) {
      const startTime = new Date(slot.start);
      const endTime = new Date(slot.end);
      if (slotTime >= startTime && slotTime < endTime) {
        return { start: startTime, end: endTime };
      }
    }
    return null;
  }, [availability]);

  const handleSlotPress = useCallback((date: Date, hour: number) => {
    const continuousBooking = getContinuousBooking(date, hour);
    const availabilitySlot = getAvailabilityForSlot(date, hour);
    
    if (continuousBooking && isTrainer) {
      const { booking } = continuousBooking;
      // Show options for appointment
      Alert.alert(
        'Appointment Options',
        `${studentOfTrainer(booking.student_id)?.name || 'Student'}\n${format(new Date(booking.start), 'MMM d, HH:mm')} - ${format(new Date(booking.end), 'HH:mm')}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Edit',
            onPress: () => onEditAppointment?.(booking)
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                'Delete Appointment',
                'Are you sure you want to delete this appointment?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => updateBookingStatus(booking.id, 'rejected')
                  }
                ]
              );
            }
          }
        ]
      );
    } else if (availabilitySlot && isTrainer) {
      // Show options for availability (trainers only)
      const slot = availability.find(s => 
        new Date(s.start) <= setMinutes(setHours(date, hour), 0) && 
        new Date(s.end) > setMinutes(setHours(date, hour), 0)
      );
      
      if (slot) {
        Alert.alert(
          'Availability Options',
          `Available: ${format(new Date(slot.start), 'MMM d, HH:mm')} - ${format(new Date(slot.end), 'HH:mm')}`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Edit',
              onPress: () => onEditAvailability?.(slot.id)
            },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                Alert.alert(
                  'Delete Availability',
                  'Are you sure you want to delete this availability slot?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => removeAvailability(slot.id)
                    }
                  ]
                );
              }
            }
          ]
        );
      }
    } else if (availabilitySlot && !isTrainer) {
      // For students, show trainer availability info (read-only)
      Alert.alert(
        'Trainer Available',
        `Your trainer is available during this time slot.\n${format(availabilitySlot.start, 'MMM d, HH:mm')} - ${format(availabilitySlot.end, 'HH:mm')}`,
        [{ text: 'OK' }]
      );
    }
  }, [getContinuousBooking, getAvailabilityForSlot, isTrainer, studentOfTrainer, onEditAppointment, updateBookingStatus, availability, onEditAvailability, removeAvailability]);

  const renderTimeSlot = (date: Date, hour: number) => {
    const continuousBooking = getContinuousBooking(date, hour);
    const availabilitySlot = getAvailabilityForSlot(date, hour);
    const isPast = setMinutes(setHours(date, hour), 0) < new Date();
    
    let backgroundColor = Colors.light.background;
    let borderColor = Colors.light.border;
    let textColor = Colors.light.textLight;
    
    if (continuousBooking) {
      const { booking, isStart, isEnd } = continuousBooking;
      
      if (booking.status === 'approved') {
        backgroundColor = isTrainer ? studentColor(booking.student_id) : Colors.light.primary;
        textColor = '#fff';
        borderColor = backgroundColor;
      } else if (booking.status === 'pending') {
        backgroundColor = '#FFF3CD';
        borderColor = '#FFEAA7';
        textColor = '#856404';
      }
    } else if (isPast) {
      backgroundColor = '#f8f9fa';
      textColor = '#adb5bd';
    } else if (availabilitySlot) {
      // Show as available (green) when trainer has set availability
      backgroundColor = '#28a745';
      borderColor = '#28a745';
      textColor = '#fff';
    }

    return (
      <TouchableOpacity
        key={`${hour}`}
        style={[
          styles.timeSlot,
          {
            backgroundColor,
            borderColor,
            opacity: isPast ? 0.5 : 1,
            borderBottomWidth: 0, // Remove horizontal lines
          },
        ]}
        onPress={() => handleSlotPress(date, hour)}
        disabled={isPast}
        testID={`time-slot-${hour}`}
      >
        {continuousBooking ? (
          <View style={styles.bookingContent}>
            {continuousBooking.isStart && (
              <Text style={[styles.bookingStartTime, { color: textColor }]}>
                {format(new Date(continuousBooking.booking.start), 'HH:mm')}
              </Text>
            )}
            <View style={styles.bookingMiddle}>
              {isTrainer && (
                <Text style={[styles.studentName, { color: textColor }]} numberOfLines={1}>
                  {studentOfTrainer(continuousBooking.booking.student_id)?.name || 'Student'}
                </Text>
              )}
              {continuousBooking.booking.status === 'pending' && (
                <Text style={[styles.statusText, { color: textColor }]}>Pending</Text>
              )}
            </View>
            {continuousBooking.isEnd && (
              <Text style={[styles.bookingEndTime, { color: textColor }]}>
                {format(new Date(continuousBooking.booking.end), 'HH:mm')}
              </Text>
            )}
          </View>
        ) : availabilitySlot ? (
          <View style={styles.availabilityContent}>
            <Text style={[styles.availabilityStartTime, { color: textColor }]}>
              {format(availabilitySlot.start, 'HH:mm')}
            </Text>
            <Text style={[styles.availabilityLabel, { color: textColor }]}>Available</Text>
            <Text style={[styles.availabilityEndTime, { color: textColor }]}>
              {format(availabilitySlot.end, 'HH:mm')}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };



  return (
    <View style={styles.container}>
      {/* Week Navigation */}
      <View style={styles.weekHeader}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setCurrentWeek(subWeeks(currentWeek, 1))}
          testID="prev-week"
        >
          <ChevronLeft size={20} color={Colors.light.primary} />
        </TouchableOpacity>
        
        <Text style={styles.weekTitle}>
          {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
        </Text>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setCurrentWeek(addWeeks(currentWeek, 1))}
          testID="next-week"
        >
          <ChevronRight size={20} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarContainer}>
        {/* Fixed Day Headers */}
        <View style={styles.fixedDayHeaders}>
          <View style={styles.timeColumn} />
          {weekDays.map(day => (
            <View key={day.date.toISOString()} style={styles.dayHeader}>
              <Text style={[styles.dayName, day.isToday && styles.todayText]}>
                {day.dayName}
              </Text>
              <Text style={[styles.dayNumber, day.isToday && styles.todayText]}>
                {day.dayNumber}
              </Text>
            </View>
          ))}
        </View>

        {/* Scrollable Time Grid */}
        <ScrollView style={styles.scrollableContent} showsVerticalScrollIndicator={false}>
          <View style={styles.timeGridContainer}>
            <View style={styles.hoursColumn}>
              {HOURS.map(hour => (
                <View key={hour} style={styles.hourLabelContainer}>
                  <Text style={styles.hourLabel}>
                    {String(hour).padStart(2, '0')}:00
                  </Text>
                </View>
              ))}
            </View>
            
            <View style={styles.daysGrid}>
              {HOURS.map(hour => (
                <View key={hour} style={styles.hourRow}>
                  {weekDays.map(day => (
                    <View key={day.date.toISOString()} style={styles.dayColumn}>
                      {renderTimeSlot(day.date, hour)}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  calendarContainer: {
    flex: 1,
  },
  scrollableContent: {
    flex: 1,
  },
  fixedDayHeaders: {
    flexDirection: 'row',
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    zIndex: 10,
    elevation: 5,
  },
  timeColumn: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textLight,
    marginBottom: 2,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  todayText: {
    color: Colors.light.primary,
  },
  hourRow: {
    flexDirection: 'row',
    borderBottomWidth: 0, // Remove horizontal lines
  },
  hourLabel: {
    fontSize: 12,
    color: Colors.light.textLight,
    fontWeight: '500',
  },
  dayColumn: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: Colors.light.border,
  },
  timeSlot: {
    height: 60,
    borderBottomWidth: 0, // Remove horizontal lines
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 0,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  bookingContent: {
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
    paddingVertical: 2,
  },
  bookingStartTime: {
    fontSize: 9,
    fontWeight: '600',
  },
  bookingMiddle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingEndTime: {
    fontSize: 9,
    fontWeight: '600',
  },
  studentName: {
    fontSize: 9,
    fontWeight: '500',
    marginTop: 2,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '500',
    marginTop: 1,
  },
  timeGridContainer: {
    flexDirection: 'row',
  },
  hoursColumn: {
    width: 60,
    backgroundColor: Colors.light.cardBackground,
    borderRightWidth: 1,
    borderRightColor: Colors.light.border,
  },
  hourLabelContainer: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 0, // Remove horizontal lines
  },
  daysGrid: {
    flex: 1,
  },
  availabilityContent: {
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
    paddingVertical: 2,
  },
  availabilityStartTime: {
    fontSize: 9,
    fontWeight: '600',
  },
  availabilityEndTime: {
    fontSize: 9,
    fontWeight: '600',
  },
  availabilityLabel: {
    fontSize: 8,
    fontWeight: '500',
    marginTop: 1,
  },

});