import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { format } from 'date-fns';
import { X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import DateTimePicker from '@/components/DateTimePicker';

interface AvailabilityModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: Date, startHour: number, startMinute: number, endHour: number, endMinute: number) => void;
  editingAvailabilityId?: string | null;
  trainerAvailability: () => any[];
}

export default function AvailabilityModal({
  visible,
  onClose,
  onConfirm,
  editingAvailabilityId,
  trainerAvailability,
}: AvailabilityModalProps) {
  // Always call all hooks in the same order
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startHour, setStartHour] = useState<number>(9);
  const [startMinute, setStartMinute] = useState<number>(0);
  const [endHour, setEndHour] = useState<number>(17);
  const [endMinute, setEndMinute] = useState<number>(0);
  const [showDateTimePicker, setShowDateTimePicker] = useState<boolean>(false);

  // Always call useCallback hooks
  const handleConfirm = React.useCallback(() => {
    console.log('AvailabilityModal handleConfirm:', { selectedDate, startHour, startMinute, endHour, endMinute });
    onConfirm(selectedDate, startHour, startMinute, endHour, endMinute);
  }, [selectedDate, startHour, startMinute, endHour, endMinute, onConfirm]);

  const handleClose = React.useCallback(() => {
    setSelectedDate(new Date());
    setStartHour(9);
    setStartMinute(0);
    setEndHour(17);
    setEndMinute(0);
    setShowDateTimePicker(false);
    onClose();
  }, [onClose]);

  // Reset form when modal becomes visible or when editing changes
  React.useEffect(() => {
    if (visible) {
      if (editingAvailabilityId) {
        // Pre-fill with existing availability data
        const slot = trainerAvailability().find(s => s.id === editingAvailabilityId);
        if (slot) {
          const startDate = new Date(slot.start);
          const endDate = new Date(slot.end);
          setSelectedDate(startDate);
          setStartHour(startDate.getHours());
          setStartMinute(startDate.getMinutes());
          setEndHour(endDate.getHours());
          setEndMinute(endDate.getMinutes());
        }
      } else {
        // Reset to defaults for new availability
        setSelectedDate(new Date());
        setStartHour(9);
        setStartMinute(0);
        setEndHour(17);
        setEndMinute(0);
      }
      setShowDateTimePicker(false);
    }
  }, [visible, editingAvailabilityId, trainerAvailability]);

  // Always call useCallback hooks
  const handleDateTimeSelect = React.useCallback((date: Date, hour: number, minute: number) => {
    console.log('Date and start time selected:', { date, hour, minute });
    setSelectedDate(date);
    setStartHour(hour);
    setStartMinute(minute);
    setShowDateTimePicker(false);
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
            <Text style={styles.title}>{editingAvailabilityId ? 'Edit Availability' : 'Set Availability'}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={Colors.light.textLight} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Unified Date & Time Selection */}
            <View style={styles.quickSection}>
              <Text style={styles.sectionTitle}>When are you available?</Text>
              
              <TouchableOpacity
                style={styles.unifiedPickerButton}
                onPress={() => setShowDateTimePicker(true)}
              >
                <View style={styles.selectionPreview}>
                  <Text style={styles.datePreviewText}>
                    {format(selectedDate, 'EEE, MMM d')}
                  </Text>
                  <Text style={styles.timePreviewText}>
                    {String(startHour).padStart(2, '0')}:{String(startMinute).padStart(2, '0')} - {String(endHour).padStart(2, '0')}:{String(endMinute).padStart(2, '0')}
                  </Text>
                </View>
                <Text style={styles.tapToEditText}>Tap to edit date and time</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Students will be able to request appointments during these hours.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.confirmButton} 
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>{editingAvailabilityId ? 'Update Availability' : 'Set Availability'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <DateTimePicker
        visible={showDateTimePicker}
        onClose={() => setShowDateTimePicker(false)}
        onConfirm={handleDateTimeSelect}
        onEndTimeConfirm={handleEndTimeSelect}
        initialDate={selectedDate}
        initialHour={startHour}
        initialMinute={startMinute}
        initialEndHour={endHour}
        initialEndMinute={endMinute}
        title="Set Your Availability"
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
  quickTimeSeparator: {
    fontSize: 20,
    color: Colors.light.textLight,
    fontWeight: '300',
    paddingHorizontal: 16,
  },
  infoBox: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.textLight,
    lineHeight: 20,
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
    backgroundColor: '#28a745',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});