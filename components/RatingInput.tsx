import React, { useRef } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Star } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface RatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

export default function RatingInput({ 
  value, 
  onChange, 
  size = 'medium',
  disabled = false
}: RatingInputProps) {
  const maxRating = 5;
  const lastTapRef = useRef<{ starIndex: number; time: number } | null>(null);
  
  const getStarSize = () => {
    switch (size) {
      case 'small': return 20;
      case 'large': return 32;
      default: return 22;
    }
  };
  
  const starSize = getStarSize();
  
  const handleStarPress = (starIndex: number) => {
    if (disabled) return;
    
    const now = Date.now();
    const rating = starIndex + 1;
    
    // Check for double tap on first star to reset to 0
    if (starIndex === 0 && value > 0) {
      const lastTap = lastTapRef.current;
      if (lastTap && lastTap.starIndex === 0 && now - lastTap.time < 300) {
        // Double tap detected - reset to 0
        onChange(0);
        lastTapRef.current = null;
        return;
      }
    }
    
    // Allow setting any rating at any time (except 0, which requires double-tap)
    onChange(rating);
    
    lastTapRef.current = { starIndex, time: now };
  };
  
  return (
    <View style={styles.container} testID="rating-input">
      {Array.from({ length: maxRating }).map((_, index) => {
        const starFilled = index < value;
        return (
          <TouchableOpacity
            key={index}
            onPress={() => handleStarPress(index)}
            disabled={disabled}
            style={[
              styles.starContainer,
              { opacity: disabled ? 0.6 : 1 }
            ]}
            testID={`star-${index + 1}`}
          >
            <Star
              size={starSize}
              color={starFilled ? Colors.light.accent : Colors.light.border}
              fill={starFilled ? Colors.light.accent : 'transparent'}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starContainer: {
    padding: 6,
  },
});