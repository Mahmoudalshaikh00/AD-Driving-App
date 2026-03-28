import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useAuth } from '@/hooks/useAuthStore';
import { useSubscription } from '@/hooks/useSubscriptionStore';
import { User, Edit3, CreditCard, Gift, Crown, Calendar, DollarSign, Settings, Mail, Phone, MapPin } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user } = useAuth();
  const { getUserSubscription, SUBSCRIPTION_PLANS } = useSubscription();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedName, setEditedName] = useState<string>(user?.name || '');
  const [editedEmail, setEditedEmail] = useState<string>(user?.email || '');

  const subscription = user ? getUserSubscription(user.id) : null;
  const currentPlan = subscription ? SUBSCRIPTION_PLANS[subscription.plan] : SUBSCRIPTION_PLANS.free;

  const handleSaveProfile = () => {
    // In a real app, this would update the user profile
    Alert.alert('Success', 'Profile updated successfully!');
    setIsEditing(false);
  };

  const handleUpgradeSubscription = () => {
    router.push('/subscription');
  };

  const handleManagePayment = () => {
    Alert.alert('Payment Methods', 'Payment management feature coming soon!');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return Colors.light.success;
      case 'expired': return Colors.light.error;
      case 'cancelled': return Colors.light.warning;
      default: return Colors.light.tabIconDefault;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <User size={40} color={Colors.light.primary} />
          </View>
          <View style={styles.headerInfo}>
            {isEditing ? (
              <TextInput
                style={styles.nameInput}
                value={editedName}
                onChangeText={setEditedName}
                placeholder="Full Name"
                placeholderTextColor={Colors.light.tabIconDefault}
              />
            ) : (
              <Text style={styles.name}>{user?.name}</Text>
            )}
            <Text style={styles.role}>Driving Instructor</Text>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              if (isEditing) {
                handleSaveProfile();
              } else {
                setIsEditing(true);
              }
            }}
          >
            <Edit3 size={20} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.infoItem}>
            <Mail size={20} color={Colors.light.tabIconDefault} />
            {isEditing ? (
              <TextInput
                style={styles.infoInput}
                value={editedEmail}
                onChangeText={setEditedEmail}
                placeholder="Email"
                placeholderTextColor={Colors.light.tabIconDefault}
                keyboardType="email-address"
              />
            ) : (
              <Text style={styles.infoText}>{user?.email}</Text>
            )}
          </View>

          <View style={styles.infoItem}>
            <Phone size={20} color={Colors.light.tabIconDefault} />
            <Text style={styles.infoText}>+1 (555) 123-4567</Text>
          </View>

          <View style={styles.infoItem}>
            <MapPin size={20} color={Colors.light.tabIconDefault} />
            <Text style={styles.infoText}>New York, NY</Text>
          </View>
        </View>

        {/* Subscription Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Subscription</Text>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={handleUpgradeSubscription}
            >
              <Crown size={16} color={Colors.light.primary} />
              <Text style={styles.upgradeText}>Upgrade</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.subscriptionCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>{currentPlan.name} Plan</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(subscription?.status || 'free') }]}>
                <Text style={styles.statusText}>
                  {subscription?.status?.toUpperCase() || 'FREE'}
                </Text>
              </View>
            </View>

            <Text style={styles.planPrice}>
              ${currentPlan.price}/month
            </Text>

            {subscription && (
              <View style={styles.subscriptionDetails}>
                <View style={styles.detailRow}>
                  <Calendar size={16} color={Colors.light.tabIconDefault} />
                  <Text style={styles.detailText}>
                    Started: {formatDate(subscription.start_date)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Calendar size={16} color={Colors.light.tabIconDefault} />
                  <Text style={styles.detailText}>
                    Renews: {formatDate(subscription.end_date)}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>Features included:</Text>
              {currentPlan.features.map((feature, index) => (
                <Text key={index} style={styles.featureItem}>• {feature}</Text>
              ))}
            </View>
          </View>
        </View>

        {/* Payment & Billing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment & Billing</Text>
          
          <TouchableOpacity style={styles.actionItem} onPress={handleManagePayment}>
            <CreditCard size={20} color={Colors.light.tabIconDefault} />
            <Text style={styles.actionText}>Payment Methods</Text>
            <Text style={styles.actionSubtext}>Manage cards and billing</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <DollarSign size={20} color={Colors.light.tabIconDefault} />
            <Text style={styles.actionText}>Billing History</Text>
            <Text style={styles.actionSubtext}>View past transactions</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <Gift size={20} color={Colors.light.tabIconDefault} />
            <Text style={styles.actionText}>Discount Codes</Text>
            <Text style={styles.actionSubtext}>Apply promo codes</Text>
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.actionItem}>
            <Settings size={20} color={Colors.light.tabIconDefault} />
            <Text style={styles.actionText}>App Preferences</Text>
            <Text style={styles.actionSubtext}>Notifications, privacy</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.light.cardBackground,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  nameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingBottom: 4,
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
  editButton: {
    padding: 8,
  },
  section: {
    backgroundColor: Colors.light.cardBackground,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  upgradeText: {
    color: Colors.light.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    color: Colors.light.text,
    flex: 1,
  },
  infoInput: {
    fontSize: 16,
    color: Colors.light.text,
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingBottom: 4,
  },
  subscriptionCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 16,
  },
  subscriptionDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  featuresContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 16,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  featureItem: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginBottom: 4,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    gap: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    flex: 1,
  },
  actionSubtext: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  bottomSpacing: {
    height: 40,
  },
});