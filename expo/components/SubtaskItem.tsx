import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { Subtask } from '@/types';
import Colors from '@/constants/colors';
import RatingInput from './RatingInput';

interface SubTaskItemProps {
  subTask: Subtask;
  studentId: string;
  onRatingChange: (subTaskId: string, rating: number) => void;
  latestRating?: number;
}

export default function SubTaskItem({ 
  subTask, 
  studentId, 
  onRatingChange,
  latestRating
}: SubTaskItemProps) {
  const [rating, setRating] = useState<number>(latestRating || 0);
  
  useEffect(() => {
    setRating(latestRating || 0);
  }, [latestRating]);

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    onRatingChange(subTask.id, newRating);
  };

  return (
    <View 
      style={styles.container}
      testID={`SubTask-item-${subTask.id}`}
    >
      <View style={styles.infoContainer}>
        <View style={styles.nameContainer}>
          <View style={[
            styles.checkmarkContainer,
            { 
              backgroundColor: 'white',
              borderColor: rating > 0 ? Colors.light.secondary : Colors.light.textLight,
              borderWidth: 2
            }
          ]}>
            {rating === 5 ? (
              <View style={styles.doubleCheckContainer}>
                <Check 
                  size={10} 
                  color={Colors.light.secondary}
                  style={styles.firstCheck}
                />
                <Check 
                  size={10} 
                  color={Colors.light.secondary}
                  style={styles.secondCheck}
                />
              </View>
            ) : (
              <Check 
                size={12} 
                color={rating > 0 ? Colors.light.secondary : Colors.light.textLight} 
              />
            )}
          </View>
          <Text style={styles.name}>{subTask.name}</Text>
        </View>
        <RatingInput 
          value={rating} 
          onChange={handleRatingChange}
          size="medium"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoContainer: {
    gap: 8,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkmarkContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doubleCheckContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  firstCheck: {
    marginRight: -3,
  },
  secondCheck: {
    marginLeft: -3,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    flex: 1,
  },
});