import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, TextInput, Switch } from 'react-native';
import { Settings, Mail, Lock, Bell, Shield, Database, Trash2, Download, Upload, Eye, EyeOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuthStore';
import Colors from '@/constants/colors';

export default function AdminSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [adminEmail, setAdminEmail] = useState(user?.email || 'mahmoud200276@gmail.com');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // System settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoApproveInstructors, setAutoApproveInstructors] = useState(false);
  const [allowPublicRegistration, setAllowPublicRegistration] = useState(true);

  const handleUpdateEmail = async () => {
    if (!adminEmail.trim()) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    setIsUpdating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Admin email updated successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to update email. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters long.');
      return;
    }

    setIsUpdating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Password updated successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to update password. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'This will export all platform data including users, reports, and analytics. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            Alert.alert('Success', 'Data export initiated. You will receive an email when ready.');
          }
        }
      ]
    );
  };

  const handleImportData = () => {
    Alert.alert(
      'Import Data',
      'This will import data from a backup file. This action cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Info', 'Please select a backup file to import.');
          }
        }
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete ALL platform data including users, reports, and analytics. This action CANNOT be undone. Are you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'DELETE ALL DATA',
          style: 'destructive',
          onPress: () => {
            Alert.prompt(
              'Confirm Deletion',
              'Type "DELETE ALL DATA" to confirm:',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: (text) => {
                    if (text === 'DELETE ALL DATA') {
                      Alert.alert('Success', 'All data has been cleared.');
                    } else {
                      Alert.alert('Error', 'Confirmation text does not match.');
                    }
                  }
                }
              ],
              'plain-text'
            );
          }
        }
      ]
    );
  };

  const SettingCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.settingCard}>
      <Text style={styles.settingTitle}>{title}</Text>
      {children}
    </View>
  );

  const SettingRow = ({ 
    icon, 
    title, 
    description, 
    value, 
    onToggle, 
    type = 'switch' 
  }: { 
    icon: React.ReactNode; 
    title: string; 
    description?: string; 
    value?: boolean; 
    onToggle?: (value: boolean) => void;
    type?: 'switch' | 'button';
  }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingRowTitle}>{title}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      {type === 'switch' && (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: Colors.light.border, true: Colors.light.primary + '40' }}
          thumbColor={value ? Colors.light.primary : Colors.light.textLight}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Admin Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SettingCard title="Account Settings">
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Admin Email</Text>
            <TextInput
              style={styles.textInput}
              value={adminEmail}
              onChangeText={setAdminEmail}
              placeholder="Enter admin email"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={Colors.light.textLight}
            />
            <TouchableOpacity
              style={[styles.updateButton, isUpdating && styles.disabledButton]}
              onPress={handleUpdateEmail}
              disabled={isUpdating}
            >
              <Mail size={16} color="#fff" />
              <Text style={styles.updateButtonText}>Update Email</Text>
            </TouchableOpacity>
          </View>
        </SettingCard>

        <SettingCard title="Change Password">
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Current Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                secureTextEntry={!showCurrentPassword}
                placeholderTextColor={Colors.light.textLight}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff size={20} color={Colors.light.textLight} /> : <Eye size={20} color={Colors.light.textLight} />}
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>New Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                secureTextEntry={!showNewPassword}
                placeholderTextColor={Colors.light.textLight}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff size={20} color={Colors.light.textLight} /> : <Eye size={20} color={Colors.light.textLight} />}
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                secureTextEntry={!showConfirmPassword}
                placeholderTextColor={Colors.light.textLight}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} color={Colors.light.textLight} /> : <Eye size={20} color={Colors.light.textLight} />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.updateButton, isUpdating && styles.disabledButton]}
              onPress={handleUpdatePassword}
              disabled={isUpdating}
            >
              <Lock size={16} color="#fff" />
              <Text style={styles.updateButtonText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        </SettingCard>

        <SettingCard title="Notification Settings">
          <SettingRow
            icon={<Mail size={20} color={Colors.light.primary} />}
            title="Email Notifications"
            description="Receive admin alerts via email"
            value={emailNotifications}
            onToggle={setEmailNotifications}
          />
          <SettingRow
            icon={<Bell size={20} color={Colors.light.primary} />}
            title="Push Notifications"
            description="Receive push notifications for urgent matters"
            value={pushNotifications}
            onToggle={setPushNotifications}
          />
        </SettingCard>

        <SettingCard title="System Settings">
          <SettingRow
            icon={<Shield size={20} color={Colors.light.primary} />}
            title="Maintenance Mode"
            description="Temporarily disable platform access"
            value={maintenanceMode}
            onToggle={setMaintenanceMode}
          />
          <SettingRow
            icon={<Shield size={20} color={Colors.light.primary} />}
            title="Auto-approve Instructors"
            description="Automatically approve new instructor registrations"
            value={autoApproveInstructors}
            onToggle={setAutoApproveInstructors}
          />
          <SettingRow
            icon={<Shield size={20} color={Colors.light.primary} />}
            title="Public Registration"
            description="Allow public user registration"
            value={allowPublicRegistration}
            onToggle={setAllowPublicRegistration}
          />
        </SettingCard>

        <SettingCard title="Data Management">
          <TouchableOpacity style={styles.actionButton} onPress={handleExportData}>
            <Download size={20} color="#10b981" />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Export Data</Text>
              <Text style={styles.actionDescription}>Download all platform data as backup</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleImportData}>
            <Upload size={20} color="#3b82f6" />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Import Data</Text>
              <Text style={styles.actionDescription}>Restore data from backup file</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleClearData}>
            <Trash2 size={20} color="#ef4444" />
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: '#ef4444' }]}>Clear All Data</Text>
              <Text style={styles.actionDescription}>Permanently delete all platform data</Text>
            </View>
          </TouchableOpacity>
        </SettingCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  settingCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
  },
  inputGroup: {
    gap: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  eyeButton: {
    padding: 12,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingRowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  settingDescription: {
    fontSize: 12,
    color: Colors.light.textLight,
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  actionContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  actionDescription: {
    fontSize: 12,
    color: Colors.light.textLight,
    marginTop: 2,
  },
});