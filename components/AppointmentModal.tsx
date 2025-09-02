import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { format } from 'date-fns';
import { X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Student } from '@/types';
import DateTimePicker from '@/components/DateTimePicker';

interface AppointmentModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (studentId: string, date: Date, startHour: number, startMinute: number, endHour: number, endMinute: number) => void;
  students: Student[];
  studentColor: (studentId: string) => string;
  editingAppointment?: any;
  isStudentView?: boolean;
  currentUserId?: string;
}

export default function AppointmentModal({
  visible,
  onClose,
  onConfirm,
  students,
  studentColor,
  editingAppointment,
  isStudentView = false,
  currentUserId,
}: AppointmentModalProps) {
  // Always call all hooks in the same order
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startHour, setStartHour] = useState<number>(9);
  const [startMinute, setStartMinute] = useState<number>(0);
  const [endHour, setEndHour] = useState<number>(10);
  const [endMinute, setEndMinute] = useState<number>(0);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);


  // Always call useCallback hooks
  const handleConfirm = React.useCallback(() => {
    console.log('AppointmentModal handleConfirm called', { selectedStudent, selectedDate, startHour, startMinute, endHour, endMinute, isStudentView });
    
    const finalStudentId = isStudentView ? (currentUserId || '') : selectedStudent;
    
    if (!finalStudentId) {
      console.log('No student ID available');
      return;
    }
    
    console.log('Calling onConfirm with:', finalStudentId, selectedDate, startHour, startMinute, endHour, endMinute);
    onConfirm(finalStudentId, selectedDate, startHour, startMinute, endHour, endMinute);
  }, [selectedStudent, selectedDate, startHour, startMinute, endHour, endMinute, isStudentView, currentUserId, onConfirm]);

  const handleClose = React.useCallback(() => {
    setSelectedStudent(isStudentView ? (currentUserId || null) : null);
    setSelectedDate(new Date());
    setStartHour(9);
    setStartMinute(0);
    setEndHour(10);
    setEndMinute(0);
    setShowDatePicker(false);
    onClose();
  }, [isStudentView, currentUserId, onClose]);

  // Reset form when modal becomes visible or when editing changes
  React.useEffect(() => {
    if (visible) {
      if (editingAppointment) {
        // Pre-fill with existing appointment data
        const startDate = new Date(editingAppointment.start);
        const endDate = new Date(editingAppointment.end);
        setSelectedStudent(editingAppointment.student_id);
        setSelectedDate(startDate);
        setStartHour(startDate.getHours());
        setStartMinute(startDate.getMinutes());
        setEndHour(endDate.getHours());
        setEndMinute(endDate.getMinutes());
      } else {
        // Reset to defaults for new appointment
        // For students, auto-select themselves
        setSelectedStudent(isStudentView ? (currentUserId || null) : null);
        setSelectedDate(new Date());
        setStartHour(9);
        setStartMinute(0);
        setEndHour(10);
        setEndMinute(0);
      }
      setShowDatePicker(false);
    }
  }, [visible, editingAppointment, isStudentView, currentUserId]);

  // Always call useCallback hooks
  const handleDateSelect = React.useCallback((date: Date, hour: number, minute: number) => {
    console.log('Date and start time selected:', { date, hour, minute });
    setSelectedDate(date);
    setStartHour(hour);
    setStartMinute(minute);
    setShowDatePicker(false);
  }, []);

  const handleEndTimeSelect = React.useCallback((date: Date, hour: number, minute: number) => {
    console.log('End time selected:', { hour, minute });
    setEndHour(hour);
    setEndMinute(minute);
  }, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {editingAppointment 
                ? (isStudentView ? 'Edit Request' : 'Edit Appointment')
                : (isStudentView ? 'Request Appointment' : 'Create Appointment')
              }
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={Colors.light.textLight} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Unified Date & Time Selection */}
            <View style={styles.quickSection}>
              <Text style={styles.sectionTitle}>When do you want to meet?</Text>
              
              <TouchableOpacity
                style={styles.unifiedPickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <View style={styles.selectionPreview}>
                  <Text style={styles.datePreviewText}>
                    {format(selectedDate, 'EEE, MMM d')}
                  </Text>
                  <Text style={styles.timePreviewText}>
                    {(() => {
                      const formatTime = (hour: number, minute: number) => {
                        const period = hour >= 12 ? 'PM' : 'AM';
                        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                        return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
                      };
                      return `${formatTime(startHour, startMinute)} - ${formatTime(endHour, endMinute)}`;
                    })()}
                  </Text>
                </View>
                <Text style={styles.tapToEditText}>Tap to edit date and time</Text>
              </TouchableOpacity>
            </View>

            {/* Student Selection - Only show for trainers */}
            {!isStudentView && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Who is this appointment with?</Text>
                <View style={styles.studentList}>
                  {students.map(student => (
                    <TouchableOpacity
                      key={student.id}
                      style={[
                        styles.studentOption,
                        selectedStudent === student.id && styles.selectedStudent,
                      ]}
                      onPress={() => setSelectedStudent(student.id)}
                    >
                      <View style={[styles.colorDot, { backgroundColor: studentColor(student.id) }]} />
                      <Text style={[
                        styles.studentName,
                        selectedStudent === student.id && styles.selectedStudentText,
                      ]}>
                        {student.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            
            {/* Info Box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                {isStudentView 
                  ? 'Your instructor will be notified about this appointment request.'
                  : 'The student will be notified about this appointment.'
                }
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                (!selectedStudent && !isStudentView) && styles.disabledButton,
              ]}
              onPress={handleConfirm}
              disabled={!selectedStudent && !isStudentView}
            >
              <Text style={[
                styles.confirmButtonText,
                (!selectedStudent && !isStudentView) && { color: '#999' }
              ]}>
                {editingAppointment 
                  ? (isStudentView ? 'Update Request' : 'Update Appointment')
                  : (isStudentView ? 'Request Appointment' : 'Create Appointment')
                }
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <DateTimePicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onConfirm={handleDateSelect}
        onEndTimeConfirm={handleEndTimeSelect}
        initialDate={selectedDate}
        initialHour={startHour}
        initialMinute={startMinute}
        initialEndHour={endHour}
        initialEndMinute={endMinute}
        title={isStudentView ? 'Request Appointment Time' : 'Schedule Appointment'}
        showEndTime={true}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxHeight: 400,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  quickSection: {
    marginBottom: 24,
  },
  unifiedPickerButton: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: 'center',
    marginBottom: 16,
  },
  selectionPreview: {
    alignItems: 'center',
    marginBottom: 8,
  },
  datePreviewText: {
    fontSize: 20,
    color: Colors.light.text,
    fontWeight: '700',
    marginBottom: 4,
  },
  timePreviewText: {
    fontSize: 24,
    color: Colors.light.primary,
    fontWeight: '700',
  },
  tapToEditText: {
    fontSize: 14,
    color: Colors.light.textLight,
    fontWeight: '500',
  },
  timeSelectionContainer: {
    flexDirection: 'column',
  },
  timeSection: {
    flex: 1,
  },
  timeSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  timeRow: {
    alignItems: 'center',
  },
  quickTimeButton: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    minWidth: 80,
  },
  quickTimeLabel: {
    fontSize: 12,
    color: Colors.light.textLight,
    fontWeight: '500',
    marginBottom: 4,
  },
  quickTimeText: {
    fontSize: 24,
    color: Colors.light.text,
    fontWeight: '700',
  },
  timeToggleButton: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: 'center',
    marginBottom: 16,
  },
  timeToggleText: {
    fontSize: 24,
    color: Colors.light.text,
    fontWeight: '700',
    marginBottom: 4,
  },
  timeToggleSubtext: {
    fontSize: 14,
    color: Colors.light.textLight,
    fontWeight: '500',
  },
  inlineTimePickersContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  timePickerSection: {
    marginBottom: 24,
  },
  timePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  wheelPickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  wheelPickerContainer: {
    alignItems: 'center',
  },
  wheelPickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textLight,
    marginBottom: 8,
  },
  quickTimeSeparator: {
    fontSize: 20,
    color: Colors.light.textLight,
    fontWeight: '300',
    paddingHorizontal: 16,
  },
  studentList: {
    gap: 8,
  },
  studentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedStudent: {
    borderColor: Colors.light.primary,
    backgroundColor: '#f0f8ff',
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
  },
  selectedStudentText: {
    fontWeight: '600',
    color: Colors.light.primary,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textLight,
  },
  confirmButton: {
    flex: 2,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: Colors.light.border,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  infoBox: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.textLight,
    lineHeight: 20,
  },
});