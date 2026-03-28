import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import Colors from '@/constants/colors';

interface WheelPickerItem {
  label: string;
  value: any;
}

interface WheelPickerProps {
  data: WheelPickerItem[];
  selectedIndex: number;
  onValueChange: (item: WheelPickerItem) => void;
  itemHeight: number;
  wrapperHeight: number;
  wrapperColor?: string;
  itemTextColor?: string;
  selectedItemTextColor?: string;
  itemTextSize?: number;
}

export default function WheelPicker({
  data,
  selectedIndex,
  onValueChange,
  itemHeight,
  wrapperHeight,
  wrapperColor = Colors.light.cardBackground,
  itemTextColor = Colors.light.text,
  selectedItemTextColor = Colors.light.primary,
  itemTextSize = 20,
}: WheelPickerProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(selectedIndex);

  useEffect(() => {
    // Scroll to initial position
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: selectedIndex * itemHeight,
        animated: false,
      });
    }, 100);
  }, [selectedIndex, itemHeight]);

  const handleScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / itemHeight);
    
    if (index !== currentIndex && index >= 0 && index < data.length) {
      setCurrentIndex(index);
      onValueChange(data[index]);
    }
  };

  const handleScrollEnd = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / itemHeight);
    
    // Snap to the nearest item
    scrollViewRef.current?.scrollTo({
      y: index * itemHeight,
      animated: true,
    });
  };

  const renderItem = (item: WheelPickerItem, index: number) => {
    const isSelected = index === currentIndex;
    
    return (
      <View key={index} style={[styles.item, { height: itemHeight }]}>
        <Text
          style={[
            styles.itemText,
            {
              fontSize: itemTextSize,
              color: isSelected ? selectedItemTextColor : itemTextColor,
              fontWeight: isSelected ? '600' : '400',
            },
          ]}
        >
          {item.label}
        </Text>
      </View>
    );
  };

  const paddingVertical = (wrapperHeight - itemHeight) / 2;

  return (
    <View style={[styles.container, { height: wrapperHeight, backgroundColor: wrapperColor }]}>
      <View style={styles.selectedIndicator} />
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        contentContainerStyle={{
          paddingVertical,
        }}
      >
        {data.map((item, index) => renderItem(item, index))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  selectedIndicator: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0, 123, 255, 0.3)',
    zIndex: 1,
    transform: [{ translateY: -30 }],
  },
  item: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    textAlign: 'center',
  },
});