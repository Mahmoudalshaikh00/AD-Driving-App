import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const WHEEL_PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

interface ModernTimePickerProps {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  onStartTimeChange: (hour: number, minute: number) => void;
  onEndTimeChange: (hour: number, minute: number) => void;
  title?: string;
}

export default function ModernTimePicker({
  startHour,
  startMinute,
  endHour,
  endMinute,
  onStartTimeChange,
  onEndTimeChange,
  title = "Select Time"
}: ModernTimePickerProps) {
  const formatTime = (hour: number, minute: number) => {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };

  const hours = Array.from({ length: 19 }, (_, i) => i + 6); // 6 to 24
  const minutes = [0, 15, 30, 45]; // Only quarter hours

  const WheelPicker = ({ 
    data, 
    selectedValue, 
    onValueChange 
  }: { 
    data: number[], 
    selectedValue: number, 
    onValueChange: (value: number) => void
  }) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const selectedIndex = data.indexOf(selectedValue);
    const [isScrolling, setIsScrolling] = useState(false);

    const handleScrollBegin = () => {
      setIsScrolling(true);
    };

    const handleScroll = (event: any) => {
      const y = event.nativeEvent.contentOffset.y;
      const index = Math.round(y / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
      
      if (data[clampedIndex] !== selectedValue && !isScrolling) {
        onValueChange(data[clampedIndex]);
      }
    };

    const handleMomentumScrollEnd = (event: any) => {
      const y = event.nativeEvent.contentOffset.y;
      const index = Math.round(y / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
      
      setIsScrolling(false);
      onValueChange(data[clampedIndex]);
      
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
      <View style={styles.wheelPickerContainer}>
        <View style={styles.wheelOverlay}>
          <View style={styles.wheelOverlayTop} />
          <View style={styles.wheelSelectedItem} />
          <View style={styles.wheelOverlayBottom} />
        </View>
        <ScrollView
          ref={scrollViewRef}
          style={styles.wheelScrollView}
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
            const isSelected = item === selectedValue;
            const distance = Math.abs(index - selectedIndex);
            const opacity = Math.max(0.9, 1 - (distance * 0.05));
            const fontSize = isSelected ? 28 : Math.max(20, 26 - (distance * 1.2));
            
            return (
              <TouchableOpacity
                key={item}
                style={styles.wheelItem}
                onPress={() => {
                  onValueChange(item);
                  scrollViewRef.current?.scrollTo({
                    y: index * ITEM_HEIGHT,
                    animated: true
                  });
                }}
              >
                <Text style={[
                  styles.wheelItemText,
                  isSelected && styles.wheelItemTextSelected,
                  {
                    opacity,
                    fontSize
                  }
                ]}>
                  {String(item).padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };



  const TimePickerSection = ({ 
    type, 
    hour, 
    minute 
  }: { 
    type: 'start' | 'end', 
    hour: number, 
    minute: number 
  }) => {
    return (
      <View style={styles.timePickerSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {type === 'start' ? 'Start Time' : 'End Time'}
          </Text>
        </View>
        
        <View style={styles.timeDisplay}>
          <Text style={styles.timeText}>
            {formatTime(hour, minute)}
          </Text>
        </View>
        
        <View style={styles.wheelPickersContainer}>
          <WheelPicker
            data={hours}
            selectedValue={hour}
            onValueChange={(value) => {
              if (type === 'start') {
                onStartTimeChange(value, minute);
              } else {
                onEndTimeChange(value, minute);
              }
            }}
          />
          
          <Text style={styles.colonSeparator}>:</Text>
          
          <WheelPicker
            data={minutes}
            selectedValue={minute}
            onValueChange={(value) => {
              if (type === 'start') {
                onStartTimeChange(hour, value);
              } else {
                onEndTimeChange(hour, value);
              }
            }}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>
      
      <View style={styles.timeSelectors}>
        <TimePickerSection 
          type="start" 
          hour={startHour} 
          minute={startMinute} 
        />
        
        <View style={styles.timeSeparator}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>to</Text>
          <View style={styles.separatorLine} />
        </View>
        
        <TimePickerSection 
          type="end" 
          hour={endHour} 
          minute={endMinute} 
        />
      </View>
      
      <View style={styles.durationDisplay}>
        <Text style={styles.durationLabel}>Duration:</Text>
        <Text style={styles.durationText}>
          {(() => {
            const startMinutes = startHour * 60 + startMinute;
            const endMinutes = endHour * 60 + endMinute;
            const duration = endMinutes - startMinutes;
            const hours = Math.floor(duration / 60);
            const mins = duration % 60;
            return `${hours}h ${mins}m`;
          })()}
        </Text>
      </View>
      
      <TouchableOpacity style={styles.okButton}>
        <Text style={styles.okButtonText}>OK</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  timeSelectors: {
    gap: 20,
  },
  timePickerSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  timeDisplay: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
  },
  wheelPickersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    height: WHEEL_PICKER_HEIGHT,
  },
  colonSeparator: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: -10,
  },
  wheelPickerContainer: {
    position: 'relative',
    height: WHEEL_PICKER_HEIGHT,
    width: 70,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  wheelOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    pointerEvents: 'none',
  },
  wheelOverlayTop: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  wheelSelectedItem: {
    height: ITEM_HEIGHT,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#007AFF',
  },
  wheelOverlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  wheelScrollView: {
    flex: 1,
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelItemText: {
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  wheelItemTextSelected: {
    fontWeight: '900',
    color: '#007AFF',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  timeSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  separatorText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
  },
  durationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  durationLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginRight: 8,
  },
  durationText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#34C759',
  },
  okButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 20,
    alignSelf: 'center',
  },
  okButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});