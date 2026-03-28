import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Dimensions, ScrollView } from 'react-native';
import { format, addDays } from 'date-fns';
import { X } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface DateTimePickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: Date, hour: number, minute: number) => void;
  initialDate?: Date;
  initialHour?: number;
  initialMinute?: number;
  title?: string;
  dateOnly?: boolean;
  timeOnly?: boolean;
  showEndTime?: boolean;
  onEndTimeConfirm?: (date: Date, hour: number, minute: number) => void;
  initialEndHour?: number;
  initialEndMinute?: number;
}

const { width } = Dimensions.get('window');

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;
const WHEEL_PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

export default function DateTimePicker({
  visible,
  onClose,
  onConfirm,
  initialDate = new Date(),
  initialHour = new Date().getHours(),
  initialMinute = 0,
  title = 'Select Date & Time',
  dateOnly = false,
  timeOnly = false,
  showEndTime = false,
  onEndTimeConfirm,
  initialEndHour = new Date().getHours() + 1,
  initialEndMinute = 0,
}: DateTimePickerProps) {
  // Always call all hooks in the same order - no conditional hooks
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [selectedHour, setSelectedHour] = useState<number>(initialHour);
  const [selectedMinute, setSelectedMinute] = useState<number>(initialMinute);
  const [selectedEndHour, setSelectedEndHour] = useState<number>(initialEndHour);
  const [selectedEndMinute, setSelectedEndMinute] = useState<number>(initialEndMinute);
  const [isSelectingEndTime, setIsSelectingEndTime] = useState<boolean>(false);
  
  // Always call useEffect
  React.useEffect(() => {
    if (visible) {
      setSelectedDate(initialDate);
      setSelectedHour(initialHour);
      setSelectedMinute(initialMinute);
      setSelectedEndHour(initialEndHour);
      setSelectedEndMinute(initialEndMinute);
      setIsSelectingEndTime(false);
    }
  }, [initialDate, initialHour, initialMinute, initialEndHour, initialEndMinute, visible]);

  // Always generate all options - no conditional generation
  const dateOptions = React.useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = addDays(new Date(), i);
      return {
        label: format(date, 'EEE, MMM d'),
        value: date,
      };
    });
  }, []);

  const hourOptions = React.useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => ({
      label: String(i + 6).padStart(2, '0'),
      value: i + 6,
    }));
  }, []);

  const minuteOptions = React.useMemo(() => {
    return [0, 15, 30, 45].map(minute => ({
      label: String(minute).padStart(2, '0'),
      value: minute,
    }));
  }, []);

  const handleConfirm = React.useCallback(() => {
    console.log('DateTimePicker handleConfirm:', { selectedDate, selectedHour, selectedMinute, selectedEndHour, selectedEndMinute });
    if (showEndTime && onEndTimeConfirm) {
      onConfirm(selectedDate, selectedHour, selectedMinute);
      onEndTimeConfirm(selectedDate, selectedEndHour, selectedEndMinute);
    } else {
      onConfirm(selectedDate, selectedHour, selectedMinute);
    }
  }, [selectedDate, selectedHour, selectedMinute, selectedEndHour, selectedEndMinute, onConfirm, onEndTimeConfirm, showEndTime]);

  const handleClose = React.useCallback(() => {
    onClose();
  }, [onClose]);





  const WheelPicker = ({ 
    data, 
    selectedValue, 
    onValueChange,
    renderItem,
    label
  }: { 
    data: any[], 
    selectedValue: any, 
    onValueChange: (value: any) => void,
    renderItem: (item: any) => string,
    label: string
  }) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const selectedIndex = data.findIndex(item => item === selectedValue || (typeof item === 'object' && item.value === selectedValue));
    const [isScrolling, setIsScrolling] = useState(false);

    const handleScrollBegin = () => {
      setIsScrolling(true);
    };

    const handleScroll = (event: any) => {
      const y = event.nativeEvent.contentOffset.y;
      const index = Math.round(y / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
      
      if (!isScrolling) {
        const newValue = typeof data[clampedIndex] === 'object' ? data[clampedIndex].value : data[clampedIndex];
        const currentValue = typeof selectedValue === 'object' ? selectedValue.value : selectedValue;
        if (newValue !== currentValue) {
          onValueChange(newValue);
        }
      }
    };

    const handleMomentumScrollEnd = (event: any) => {
      const y = event.nativeEvent.contentOffset.y;
      const index = Math.round(y / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
      
      setIsScrolling(false);
      const newValue = typeof data[clampedIndex] === 'object' ? data[clampedIndex].value : data[clampedIndex];
      onValueChange(newValue);
      
      scrollViewRef.current?.scrollTo({
        y: clampedIndex * ITEM_HEIGHT,
        animated: true
      });
    };

    React.useEffect(() => {
      if (scrollViewRef.current && selectedIndex >= 0) {
        const timer = setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: selectedIndex * ITEM_HEIGHT,
            animated: false
          });
        }, 50);
        return () => clearTimeout(timer);
      }
    }, [selectedIndex]);

    return (
      <View style={styles.modernWheelPickerContainer}>
        <Text style={styles.modernWheelPickerLabel}>{label}</Text>
        <View style={styles.modernWheelPickerWrapper}>
          <View style={styles.modernWheelOverlay}>
            <View style={styles.modernWheelOverlayTop} />
            <View style={styles.modernWheelSelectedItem} />
            <View style={styles.modernWheelOverlayBottom} />
          </View>
          <ScrollView
            ref={scrollViewRef}
            style={styles.modernWheelScrollView}
            contentContainerStyle={{
              paddingVertical: ITEM_HEIGHT * 2
            }}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_HEIGHT}
            decelerationRate={0.988}
            onScrollBeginDrag={handleScrollBegin}
            onScroll={handleScroll}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            scrollEventThrottle={16}
            bounces={false}
            overScrollMode="never"
          >
            {data.map((item, index) => {
              const itemValue = typeof item === 'object' ? item.value : item;
              const currentValue = typeof selectedValue === 'object' ? selectedValue.value : selectedValue;
              const isSelected = itemValue === currentValue;
              const distance = Math.abs(index - selectedIndex);
              const opacity = Math.max(0.5, 1 - (distance * 0.12));
              const fontSize = isSelected ? 24 : Math.max(18, 22 - (distance * 1));
              
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.modernWheelItem}
                  onPress={() => {
                    onValueChange(itemValue);
                    scrollViewRef.current?.scrollTo({
                      y: index * ITEM_HEIGHT,
                      animated: true
                    });
                  }}
                >
                  <Text style={[
                    styles.modernWheelItemText,
                    isSelected && styles.modernWheelItemTextSelected,
                    {
                      opacity,
                      fontSize
                    }
                  ]}>
                    {renderItem(item)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderUnifiedPicker = () => {
    const currentHour = isSelectingEndTime ? selectedEndHour : selectedHour;
    const currentMinute = isSelectingEndTime ? selectedEndMinute : selectedMinute;
    const onHourChange = isSelectingEndTime ? setSelectedEndHour : setSelectedHour;
    const onMinuteChange = isSelectingEndTime ? setSelectedEndMinute : setSelectedMinute;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {timeOnly ? 'Select Time' : dateOnly ? 'Select Date' : 'Select Date & Time'}
        </Text>
        
        {showEndTime && !dateOnly && (
          <View style={styles.timeToggleContainer}>
            <TouchableOpacity
              style={[styles.timeToggleButton, !isSelectingEndTime && styles.activeTimeToggle]}
              onPress={() => setIsSelectingEndTime(false)}
            >
              <Text style={[styles.timeToggleText, !isSelectingEndTime && styles.activeTimeToggleText]}>Start Time</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timeToggleButton, isSelectingEndTime && styles.activeTimeToggle]}
              onPress={() => setIsSelectingEndTime(true)}
            >
              <Text style={[styles.timeToggleText, isSelectingEndTime && styles.activeTimeToggleText]}>End Time</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.modernWheelPickersContainer}>
          {!timeOnly && (
            <WheelPicker
              data={dateOptions.slice(0, 14)}
              selectedValue={selectedDate}
              onValueChange={setSelectedDate}
              renderItem={(item) => {
                const today = new Date();
                const isToday = item.value.toDateString() === today.toDateString();
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);
                const isTomorrow = item.value.toDateString() === tomorrow.toDateString();
                
                if (isToday) return 'Today';
                if (isTomorrow) return 'Tomorrow';
                return format(item.value, 'MMM d');
              }}
              label="Day"
            />
          )}
          
          {!dateOnly && (
            <>
              <WheelPicker
                data={hourOptions}
                selectedValue={currentHour}
                onValueChange={onHourChange}
                renderItem={(item) => item.label}
                label="Hour"
              />
              
              <WheelPicker
                data={minuteOptions}
                selectedValue={currentMinute}
                onValueChange={onMinuteChange}
                renderItem={(item) => item.label}
                label="Min"
              />
            </>
          )}
        </View>
      </View>
    );
  };



  const renderPreview = () => {
    if (dateOnly) {
      return (
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Selected Date:</Text>
          <Text style={styles.previewText}>
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </Text>
        </View>
      );
    }
    
    if (timeOnly) {
      if (showEndTime) {
        return (
          <View style={styles.preview}>
            <Text style={styles.previewLabel}>Selected Time Range:</Text>
            <Text style={styles.previewText}>
              {String(selectedHour).padStart(2, '0')}:{String(selectedMinute).padStart(2, '0')} - {String(selectedEndHour).padStart(2, '0')}:{String(selectedEndMinute).padStart(2, '0')}
            </Text>
          </View>
        );
      }
      return (
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Selected Time:</Text>
          <Text style={styles.previewText}>
            {String(selectedHour).padStart(2, '0')}:{String(selectedMinute).padStart(2, '0')}
          </Text>
        </View>
      );
    }
    
    if (showEndTime) {
      return (
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Selected Date & Time Range:</Text>
          <Text style={styles.previewText}>
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </Text>
          <Text style={styles.previewTimeText}>
            {String(selectedHour).padStart(2, '0')}:{String(selectedMinute).padStart(2, '0')} - {String(selectedEndHour).padStart(2, '0')}:{String(selectedEndMinute).padStart(2, '0')}
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles.preview}>
        <Text style={styles.previewLabel}>Selected Date & Time:</Text>
        <Text style={styles.previewText}>
          {format(selectedDate, 'EEEE, MMMM d, yyyy')} at {String(selectedHour).padStart(2, '0')}:{String(selectedMinute).padStart(2, '0')}
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={Colors.light.textLight} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {renderUnifiedPicker()}
            {renderPreview()}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.confirmButton} 
              onPress={handleConfirm}
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 20,
    width: width * 0.98,
    maxWidth: 500,
    maxHeight: '90%',
    minHeight: 600,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
    zIndex: 10000,
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
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  optionsScrollView: {
    maxHeight: 60,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  optionButton: {
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    minWidth: 60,
  },
  selectedOption: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    textAlign: 'center',
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  dateGridButton: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    width: '22%',
    alignItems: 'center',
  },
  selectedDateGrid: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  dateGridText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },
  dateGridDay: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.light.textLight,
    textAlign: 'center',
    marginTop: 2,
  },
  selectedDateGridText: {
    color: '#fff',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  timeGridButton: {
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    width: '22%',
    alignItems: 'center',
  },
  selectedTimeGrid: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  timeGridText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    textAlign: 'center',
  },
  selectedTimeGridText: {
    color: '#fff',
    fontWeight: '600',
  },
  preview: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.textLight,
    marginBottom: 4,
  },
  previewText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
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
    flex: 1,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  wheelPickerContainer: {
    flexDirection: 'row',
    gap: 24,
    height: 400,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 4,
  },
  wheelPickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  wheelPickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  wheelPicker: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 123, 255, 0.05)',
    borderRadius: 12,
    minWidth: 100,
  },
  wheelPickerContent: {
    paddingVertical: 120,
  },
  wheelPickerItem: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: 80,
    paddingHorizontal: 8,
  },
  selectedWheelItem: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  wheelPickerItemText: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.light.text,
  },
  selectedWheelItemText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 20,
  },
  modernWheelPickersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    backgroundColor: Colors.light.background,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 300,
  },
  modernWheelPickerContainer: {
    alignItems: 'center',
    flex: 1,
  },
  modernWheelPickerLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modernWheelPickerWrapper: {
    position: 'relative',
    height: WHEEL_PICKER_HEIGHT,
    width: 85,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modernWheelOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    pointerEvents: 'none',
  },
  modernWheelOverlayTop: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  modernWheelSelectedItem: {
    height: ITEM_HEIGHT,
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: Colors.light.primary,
  },
  modernWheelOverlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  modernWheelScrollView: {
    flex: 1,
  },
  modernWheelItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernWheelItemText: {
    fontWeight: '600',
    color: '#888',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  modernWheelItemTextSelected: {
    fontWeight: '900',
    color: Colors.light.primary,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  timeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.light.border,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  timeToggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTimeToggle: {
    backgroundColor: Colors.light.primary,
  },
  timeToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textLight,
  },
  activeTimeToggleText: {
    color: '#fff',
  },
  previewTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
    textAlign: 'center',
    marginTop: 4,
  },
});