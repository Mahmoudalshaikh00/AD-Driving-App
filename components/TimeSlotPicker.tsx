import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Clock, X } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface TimeSlotPickerProps {
  visible: boolean;
  onClose: () => void;
  onTimeSelect: (hour: number, minute: number) => void;
  selectedDate?: Date;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const SUGGESTED_MINUTES = [0, 30]; // Most common times
const ALL_MINUTES = [0, 15, 30, 45]; // All available times

export default function TimeSlotPicker({ visible, onClose, onTimeSelect, selectedDate }: TimeSlotPickerProps) {
  const [selectedHour, setSelectedHour] = useState<number>(9);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);
  const [showAllMinutes, setShowAllMinutes] = useState<boolean>(false);

  const handleConfirm = () => {
    onTimeSelect(selectedHour, selectedMinute);
    onClose();
  };

  const formatTime = (hour: number, minute: number) => {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Time</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} testID="close-time-picker">
              <X size={24} color={Colors.light.textLight} />
            </TouchableOpacity>
          </View>

          {selectedDate && (
            <Text style={styles.dateText}>
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          )}

          <View style={styles.timeDisplay}>
            <Clock size={24} color={Colors.light.primary} />
            <Text style={styles.selectedTime}>
              {formatTime(selectedHour, selectedMinute)}
            </Text>
          </View>

          <View style={styles.pickerContainer}>
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Hour</Text>
              <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
                {HOURS.map(hour => (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      styles.pickerItem,
                      selectedHour === hour && styles.selectedPickerItem,
                    ]}
                    onPress={() => setSelectedHour(hour)}
                    testID={`hour-${hour}`}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        selectedHour === hour && styles.selectedPickerItemText,
                      ]}
                    >
                      {String(hour).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.pickerColumn}>
              <View style={styles.minuteHeader}>
                <Text style={styles.pickerLabel}>Minute</Text>
                <TouchableOpacity
                  style={styles.moreOptionsButton}
                  onPress={() => setShowAllMinutes(!showAllMinutes)}
                  testID="toggle-minute-options"
                >
                  <Text style={styles.moreOptionsText}>
                    {showAllMinutes ? 'Less' : 'More'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.minuteContainer}>
                {/* Suggested times (00, 30) */}
                <View style={styles.suggestedTimes}>
                  {SUGGESTED_MINUTES.map(minute => (
                    <TouchableOpacity
                      key={`suggested-${minute}`}
                      style={[
                        styles.suggestedTimeButton,
                        selectedMinute === minute && styles.selectedSuggestedTime,
                      ]}
                      onPress={() => setSelectedMinute(minute)}
                      testID={`suggested-minute-${minute}`}
                    >
                      <Text
                        style={[
                          styles.suggestedTimeText,
                          selectedMinute === minute && styles.selectedSuggestedTimeText,
                        ]}
                      >
                        :{String(minute).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {/* All minute options when expanded */}
                {showAllMinutes && (
                  <ScrollView style={styles.allMinutesPicker} showsVerticalScrollIndicator={false}>
                    {ALL_MINUTES.map(minute => (
                      <TouchableOpacity
                        key={`all-${minute}`}
                        style={[
                          styles.pickerItem,
                          selectedMinute === minute && styles.selectedPickerItem,
                        ]}
                        onPress={() => setSelectedMinute(minute)}
                        testID={`minute-${minute}`}
                      >
                        <Text
                          style={[
                            styles.pickerItemText,
                            selectedMinute === minute && styles.selectedPickerItemText,
                          ]}
                        >
                          {String(minute).padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              testID="cancel-time-selection"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              testID="confirm-time-selection"
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  closeButton: {
    padding: 4,
  },
  dateText: {
    fontSize: 14,
    color: Colors.light.textLight,
    textAlign: 'center',
    marginBottom: 20,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
  },
  selectedTime: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.light.primary,
    marginLeft: 12,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: 8,
  },
  minuteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  moreOptionsButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: Colors.light.border,
  },
  moreOptionsText: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  minuteContainer: {
    minHeight: 100,
  },
  suggestedTimes: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  suggestedTimeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    borderWidth: 2,
    borderColor: Colors.light.border,
    minWidth: 60,
    alignItems: 'center',
  },
  selectedSuggestedTime: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  suggestedTimeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  selectedSuggestedTimeText: {
    color: '#fff',
  },
  allMinutesPicker: {
    maxHeight: 120,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  picker: {
    maxHeight: 200,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  selectedPickerItem: {
    backgroundColor: Colors.light.primary,
  },
  pickerItemText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  selectedPickerItemText: {
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: Colors.light.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textLight,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});