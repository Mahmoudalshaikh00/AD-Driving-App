import { useCallback, useMemo, useState, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { AvailabilitySlot, Booking, BookingStatus, Student } from '@/types';
import { useAuth } from './useAuthStore';
import { useStudentStore } from './useStudentStore';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function notifyLocal(title: string, body: string) {
  try {
    if (Platform.OS !== 'web') {
      await Notifications.scheduleNotificationAsync({
        content: { title, body },
        trigger: null,
      });
    } else {
      console.log('Web notification:', title, body);
    }
  } catch (e) {
    console.log('Notification error', e);
  }
}

export const [ScheduleProvider, useScheduleStore] = createContextHook(() => {
  const { user } = useAuth();
  const { students } = useStudentStore();

  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load data from AsyncStorage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading schedule data from storage...');
        const [storedAvailability, storedBookings] = await Promise.all([
          AsyncStorage.getItem('schedule_availability'),
          AsyncStorage.getItem('schedule_bookings')
        ]);
        
        if (storedAvailability) {
          const parsedAvailability = JSON.parse(storedAvailability);
          console.log('Loaded availability:', parsedAvailability.length, 'slots');
          setAvailability(parsedAvailability);
        }
        
        if (storedBookings) {
          const parsedBookings = JSON.parse(storedBookings);
          console.log('Loaded bookings:', parsedBookings.length, 'bookings');
          setBookings(parsedBookings);
        }
        
        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading schedule data:', error);
        setIsLoaded(true);
      }
    };
    
    loadData();
  }, []);

  // Save availability to AsyncStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      const saveAvailability = async () => {
        try {
          console.log('Saving availability to storage:', availability.length, 'slots');
          await AsyncStorage.setItem('schedule_availability', JSON.stringify(availability));
        } catch (error) {
          console.error('Error saving availability:', error);
        }
      };
      saveAvailability();
    }
  }, [availability, isLoaded]);

  // Save bookings to AsyncStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      const saveBookings = async () => {
        try {
          console.log('Saving bookings to storage:', bookings.length, 'bookings');
          await AsyncStorage.setItem('schedule_bookings', JSON.stringify(bookings));
        } catch (error) {
          console.error('Error saving bookings:', error);
        }
      };
      saveBookings();
    }
  }, [bookings, isLoaded]);

  const studentOfTrainer = useCallback((studentId: string): Student | undefined => {
    return students.find(s => s.id === studentId);
  }, [students]);

  const addAvailability = useCallback((startISO: string, endISO: string) => {
    if (!user || user.role !== 'trainer') return { success: false, error: 'Only trainers can add availability' } as const;
    const slot: AvailabilitySlot = {
      id: uid(),
      trainer_id: user.id,
      start: startISO,
      end: endISO,
    };
    console.log('Adding availability slot:', slot);
    setAvailability(prev => {
      const updated = [...prev, slot];
      console.log('Updated availability count:', updated.length);
      return updated;
    });
    return { success: true } as const;
  }, [user]);

  const removeAvailability = useCallback((slotId: string) => {
    if (!user || user.role !== 'trainer') return { success: false, error: 'Only trainers can remove availability' } as const;
    setAvailability(prev => prev.filter(slot => slot.id !== slotId));
    return { success: true } as const;
  }, [user]);

  const requestBooking = useCallback((studentId: string, startISO: string, endISO: string) => {
    if (!user) return { success: false, error: 'Not authenticated' } as const;
    const trainerId = user.role === 'student' ? (user.trainer_id ?? '') : user.id;
    if (!trainerId) return { success: false, error: 'Trainer not found' } as const;
    const createdBy: 'trainer' | 'student' = user.role === 'trainer' ? 'trainer' : 'student';
    const status: BookingStatus = createdBy === 'trainer' ? 'approved' : 'pending';
    const booking: Booking = {
      id: uid(),
      student_id: studentId,
      trainer_id: trainerId,
      start: startISO,
      end: endISO,
      status,
      created_at: new Date().toISOString(),
      created_by: createdBy,
    };
    console.log('Creating booking:', booking);
    setBookings(prev => {
      const updated = [booking, ...prev];
      console.log('Updated bookings count:', updated.length);
      return updated;
    });
    if (createdBy === 'student') {
      notifyLocal('New booking request', 'A student sent a booking request');
    } else {
      notifyLocal('New lesson booked', 'A trainer scheduled a lesson');
    }
    return { success: true, booking } as const;
  }, [user]);

  const createBookingFromSlot = useCallback((studentId: string, date: Date, hour: number, minute: number, durationMinutes: number = 60) => {
    const startTime = new Date(date);
    startTime.setHours(hour, minute, 0, 0);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
    
    return requestBooking(studentId, startTime.toISOString(), endTime.toISOString());
  }, [requestBooking]);

  const updateBookingStatus = useCallback((bookingId: string, status: BookingStatus) => {
    console.log('Updating booking status:', bookingId, 'to', status);
    setBookings(prev => {
      if (status === 'rejected') {
        // Remove rejected bookings completely
        const updated = prev.filter(b => b.id !== bookingId);
        console.log('Removed booking, total bookings:', updated.length);
        return updated;
      } else {
        const updated = prev.map(b => b.id === bookingId ? { ...b, status } : b);
        console.log('Updated booking status, total bookings:', updated.length);
        return updated;
      }
    });
    if (status === 'approved') notifyLocal('Booking approved', 'Your lesson was approved');
    if (status === 'rejected') notifyLocal('Booking deleted', 'The appointment was deleted');
  }, []);

  const updateBooking = useCallback((bookingId: string, studentId: string, startISO: string, endISO: string) => {
    if (!user || user.role !== 'trainer') return { success: false, error: 'Only trainers can update bookings' } as const;
    setBookings(prev => prev.map(b => 
      b.id === bookingId 
        ? { ...b, student_id: studentId, start: startISO, end: endISO }
        : b
    ));
    return { success: true } as const;
  }, [user]);

  const updateAvailabilitySlot = useCallback((slotId: string, startISO: string, endISO: string) => {
    if (!user || user.role !== 'trainer') return { success: false, error: 'Only trainers can update availability' } as const;
    setAvailability(prev => prev.map(slot => 
      slot.id === slotId 
        ? { ...slot, start: startISO, end: endISO }
        : slot
    ));
    return { success: true } as const;
  }, [user]);

  const myBookings = useMemo(() => {
    if (!user) return [] as Booking[];
    if (user.role === 'trainer') return bookings.filter(b => b.trainer_id === user.id && b.status !== 'rejected');
    return bookings.filter(b => b.student_id === user.id && b.status !== 'rejected');
  }, [bookings, user]);

  const studentBookings = useCallback((studentId: string) => {
    return bookings.filter(b => b.student_id === studentId && b.status !== 'rejected');
  }, [bookings]);

  const trainerBookings = useCallback((trainerId?: string) => {
    const targetTrainerId = trainerId || (user?.role === 'trainer' ? user.id : user?.trainer_id);
    if (!targetTrainerId) return [];
    return bookings.filter(b => b.trainer_id === targetTrainerId && b.status !== 'rejected');
  }, [bookings, user]);

  const myTrainerAvailability = useMemo(() => {
    if (!user) return [] as AvailabilitySlot[];
    if (user.role === 'trainer') return availability.filter(a => a.trainer_id === user.id);
    // For students, show their trainer's availability
    return availability.filter(a => a.trainer_id === user.trainer_id);
  }, [availability, user]);

  const trainerAvailability = useCallback((trainerId?: string) => {
    if (trainerId) {
      return availability.filter(a => a.trainer_id === trainerId);
    }
    if (!user) return [];
    if (user.role === 'trainer') {
      return availability.filter(a => a.trainer_id === user.id);
    }
    // For students, return their trainer's availability
    return availability.filter(a => a.trainer_id === user.trainer_id);
  }, [availability, user]);

  const studentColor = useCallback((studentId: string) => {
    const palette = ['#FF6B6B', '#6BCB77', '#4D96FF', '#FFD93D', '#B088F9', '#FF8FAB', '#20C997'];
    let hash = 0;
    for (let i = 0; i < studentId.length; i++) hash = (hash * 31 + studentId.charCodeAt(i)) | 0;
    const idx = Math.abs(hash) % palette.length;
    return palette[idx] as string;
  }, []);

  return useMemo(() => ({
    availability,
    bookings,
    myBookings,
    myTrainerAvailability,
    studentBookings,
    trainerBookings,
    addAvailability,
    removeAvailability,
    requestBooking,
    createBookingFromSlot,
    updateBookingStatus,
    updateBooking,
    updateAvailabilitySlot,
    trainerAvailability,
    studentOfTrainer,
    studentColor,
    isLoaded,
  }), [
    availability,
    bookings,
    myBookings,
    myTrainerAvailability,
    studentBookings,
    trainerBookings,
    addAvailability,
    removeAvailability,
    requestBooking,
    createBookingFromSlot,
    updateBookingStatus,
    updateBooking,
    updateAvailabilitySlot,
    trainerAvailability,
    studentOfTrainer,
    studentColor,
    isLoaded,
  ]);
});
