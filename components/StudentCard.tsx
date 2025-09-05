import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { User, Edit2, Trash2, Save, X, MoreVertical } from 'lucide-react-native';
import { Student } from '@/types';
import Colors from '@/constants/colors';
import { useStudentStore } from '@/hooks/useStudentStore';
import { NotificationBadge } from './NotificationBadge';

interface StudentCardProps {
  student: Student;
}

export default function StudentCard({ student }: StudentCardProps) {
  const router = useRouter();
  const { updateStudent, deleteStudent } = useStudentStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(student.name);
  const [editEmail, setEditEmail] = useState(student.email);
  const [showMenu, setShowMenu] = useState(false);

  const handlePress = () => {
    if (!isEditing) {
      router.push(`/students/${student.id}`);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditName(student.name);
    setEditEmail(student.email);
  };

  const handleSave = async () => {
    if (editName.trim() && editEmail.trim()) {
      const result = await updateStudent(student.id, {
        name: editName.trim(),
        email: editEmail.trim(),
      });
      if (result.success) {
        setIsEditing(false);
      } else {
        Alert.alert('Error', result.error || 'Failed to update student');
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditName(student.name);
    setEditEmail(student.email);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Student',
      `Are you sure you want to delete ${student.name}? This will also delete all their evaluations.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteStudent(student.id);
            if (!result.success) {
              Alert.alert('Error', result.error || 'Failed to delete student');
            }
          },
        },
      ]
    );
  };

  if (isEditing) {
    return (
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <User size={24} color={Colors.light.primary} />
        </View>
        <View style={styles.infoContainer}>
          <TextInput
            style={styles.editInput}
            value={editName}
            onChangeText={setEditName}
            placeholder="Student Name"
            placeholderTextColor={Colors.light.textLight}
          />
          <TextInput
            style={styles.editInput}
            value={editEmail}
            onChangeText={setEditEmail}
            placeholder="Email Address"
            placeholderTextColor={Colors.light.textLight}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
            <Save size={18} color={Colors.light.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleCancel}>
            <X size={18} color={Colors.light.textLight} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity 
        style={styles.container} 
        onPress={handlePress}
        testID={`student-card-${student.id}`}
      >
        <View style={styles.iconContainer}>
          <User size={24} color={Colors.light.primary} />
          <NotificationBadge 
            studentId={student.id} 
            type="message"
            size="small" 
            style={{ top: -4, right: -4 }}
          />
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{student.name}</Text>
          <Text style={styles.contactInfo}>{student.email}</Text>
        </View>
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => setShowMenu(true)}
            testID={`student-menu-${student.id}`}
          >
            <MoreVertical size={18} color={Colors.light.textLight} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
      
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                handleEdit();
              }}
            >
              <Edit2 size={18} color={Colors.light.primary} />
              <Text style={styles.menuItemText}>Edit Student</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.menuItem, styles.menuItemDanger]}
              onPress={() => {
                setShowMenu(false);
                handleDelete();
              }}
            >
              <Trash2 size={18} color={Colors.light.danger} />
              <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Delete Student</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  contactInfo: {
    fontSize: 14,
    color: Colors.light.textLight,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
  },
  editInput: {
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  menuItemDanger: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  menuItemText: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },
  menuItemTextDanger: {
    color: Colors.light.danger,
  },
});