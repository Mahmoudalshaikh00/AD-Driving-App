import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { useSubscription } from '@/hooks/useSubscriptionStore';
import { DiscountCode, SubscriptionPlan } from '@/types';
import { Plus, Edit3, Trash2, Tag, Calendar, Percent, DollarSign, Users, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DiscountCodesScreen() {
  const { discountCodes, createDiscountCode, updateDiscountCode, deleteDiscountCode, SUBSCRIPTION_PLANS } = useSubscription();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    max_uses: '',
    valid_from: '',
    valid_until: '',
    applicable_plans: [] as SubscriptionPlan[],
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      max_uses: '',
      valid_from: '',
      valid_until: '',
      applicable_plans: [],
      is_active: true,
    });
  };

  const handleCreateCode = async () => {
    if (!formData.code.trim() || !formData.discount_value || !formData.max_uses) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const validFrom = formData.valid_from || new Date().toISOString();
    const validUntil = formData.valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const result = await createDiscountCode({
      code: formData.code.toUpperCase(),
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      max_uses: parseInt(formData.max_uses),
      valid_from: validFrom,
      valid_until: validUntil,
      applicable_plans: formData.applicable_plans.length > 0 ? formData.applicable_plans : ['basic', 'premium', 'enterprise'],
      is_active: formData.is_active,
      created_by: 'admin-001',
    });

    if (result.success) {
      Alert.alert('Success', 'Discount code created successfully!');
      setShowCreateModal(false);
      resetForm();
    } else {
      Alert.alert('Error', result.error || 'Failed to create discount code');
    }
  };

  const handleEditCode = (code: DiscountCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      discount_type: code.discount_type,
      discount_value: code.discount_value.toString(),
      max_uses: code.max_uses.toString(),
      valid_from: code.valid_from,
      valid_until: code.valid_until,
      applicable_plans: code.applicable_plans,
      is_active: code.is_active,
    });
    setShowCreateModal(true);
  };

  const handleUpdateCode = async () => {
    if (!editingCode) return;

    const result = await updateDiscountCode(editingCode.id, {
      code: formData.code.toUpperCase(),
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      max_uses: parseInt(formData.max_uses),
      valid_from: formData.valid_from,
      valid_until: formData.valid_until,
      applicable_plans: formData.applicable_plans.length > 0 ? formData.applicable_plans : ['basic', 'premium', 'enterprise'],
      is_active: formData.is_active,
    });

    if (result.success) {
      Alert.alert('Success', 'Discount code updated successfully!');
      setShowCreateModal(false);
      setEditingCode(null);
      resetForm();
    } else {
      Alert.alert('Error', result.error || 'Failed to update discount code');
    }
  };

  const handleDeleteCode = (code: DiscountCode) => {
    Alert.alert(
      'Delete Discount Code',
      `Are you sure you want to delete the discount code "${code.code}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteDiscountCode(code.id);
            if (result.success) {
              Alert.alert('Success', 'Discount code deleted successfully!');
            } else {
              Alert.alert('Error', result.error || 'Failed to delete discount code');
            }
          }
        }
      ]
    );
  };

  const togglePlan = (plan: SubscriptionPlan) => {
    setFormData(prev => ({
      ...prev,
      applicable_plans: prev.applicable_plans.includes(plan)
        ? prev.applicable_plans.filter(p => p !== plan)
        : [...prev.applicable_plans, plan]
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpired = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  const DiscountCodeCard = ({ code }: { code: DiscountCode }) => (
    <View style={[styles.codeCard, !code.is_active && styles.inactiveCard]}>
      <View style={styles.codeHeader}>
        <View style={styles.codeInfo}>
          <Text style={styles.codeText}>{code.code}</Text>
          <View style={styles.discountBadge}>
            {code.discount_type === 'percentage' ? (
              <>
                <Percent size={12} color="#fff" />
                <Text style={styles.discountText}>{code.discount_value}% OFF</Text>
              </>
            ) : (
              <>
                <DollarSign size={12} color="#fff" />
                <Text style={styles.discountText}>${code.discount_value} OFF</Text>
              </>
            )}
          </View>
        </View>
        <View style={styles.codeActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditCode(code)}
          >
            <Edit3 size={16} color={Colors.light.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteCode(code)}
          >
            <Trash2 size={16} color={Colors.light.error} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.codeDetails}>
        <View style={styles.detailRow}>
          <Users size={14} color={Colors.light.tabIconDefault} />
          <Text style={styles.detailText}>
            {code.current_uses}/{code.max_uses} uses
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Calendar size={14} color={Colors.light.tabIconDefault} />
          <Text style={[styles.detailText, isExpired(code.valid_until) && styles.expiredText]}>
            Expires: {formatDate(code.valid_until)}
          </Text>
        </View>
      </View>

      <View style={styles.plansContainer}>
        <Text style={styles.plansLabel}>Applicable plans:</Text>
        <View style={styles.planTags}>
          {code.applicable_plans.map(plan => (
            <View key={plan} style={styles.planTag}>
              <Text style={styles.planTagText}>{SUBSCRIPTION_PLANS[plan].name}</Text>
            </View>
          ))}
        </View>
      </View>

      {!code.is_active && (
        <View style={styles.inactiveBadge}>
          <Text style={styles.inactiveBadgeText}>INACTIVE</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Discount Codes</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setEditingCode(null);
            setShowCreateModal(true);
          }}
        >
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {discountCodes.length === 0 ? (
          <View style={styles.emptyState}>
            <Tag size={48} color={Colors.light.tabIconDefault} />
            <Text style={styles.emptyTitle}>No Discount Codes</Text>
            <Text style={styles.emptySubtitle}>
              Create your first discount code to offer promotions to users
            </Text>
          </View>
        ) : (
          discountCodes.map(code => (
            <DiscountCodeCard key={code.id} code={code} />
          ))
        )}
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingCode ? 'Edit Discount Code' : 'Create Discount Code'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowCreateModal(false);
                setEditingCode(null);
                resetForm();
              }}
            >
              <X size={24} color={Colors.light.tabIconDefault} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Code *</Text>
              <TextInput
                style={styles.input}
                value={formData.code}
                onChangeText={(text) => setFormData(prev => ({ ...prev, code: text.toUpperCase() }))}
                placeholder="e.g., SAVE20"
                autoCapitalize="characters"
                placeholderTextColor={Colors.light.tabIconDefault}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Discount Type</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    formData.discount_type === 'percentage' && styles.selectedType
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, discount_type: 'percentage' }))}
                >
                  <Percent size={16} color={formData.discount_type === 'percentage' ? '#fff' : Colors.light.primary} />
                  <Text style={[
                    styles.typeText,
                    formData.discount_type === 'percentage' && styles.selectedTypeText
                  ]}>Percentage</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    formData.discount_type === 'fixed' && styles.selectedType
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, discount_type: 'fixed' }))}
                >
                  <DollarSign size={16} color={formData.discount_type === 'fixed' ? '#fff' : Colors.light.primary} />
                  <Text style={[
                    styles.typeText,
                    formData.discount_type === 'fixed' && styles.selectedTypeText
                  ]}>Fixed Amount</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Discount Value * ({formData.discount_type === 'percentage' ? '%' : '$'})
              </Text>
              <TextInput
                style={styles.input}
                value={formData.discount_value}
                onChangeText={(text) => setFormData(prev => ({ ...prev, discount_value: text }))}
                placeholder={formData.discount_type === 'percentage' ? '20' : '5.00'}
                keyboardType="numeric"
                placeholderTextColor={Colors.light.tabIconDefault}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Maximum Uses *</Text>
              <TextInput
                style={styles.input}
                value={formData.max_uses}
                onChangeText={(text) => setFormData(prev => ({ ...prev, max_uses: text }))}
                placeholder="100"
                keyboardType="numeric"
                placeholderTextColor={Colors.light.tabIconDefault}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Applicable Plans</Text>
              <View style={styles.planSelector}>
                {Object.entries(SUBSCRIPTION_PLANS).filter(([key]) => key !== 'free').map(([key, plan]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.planOption,
                      formData.applicable_plans.includes(key as SubscriptionPlan) && styles.selectedPlan
                    ]}
                    onPress={() => togglePlan(key as SubscriptionPlan)}
                  >
                    <Text style={[
                      styles.planOptionText,
                      formData.applicable_plans.includes(key as SubscriptionPlan) && styles.selectedPlanText
                    ]}>
                      {plan.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.helperText}>
                Leave empty to apply to all paid plans
              </Text>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Active</Text>
                <Switch
                  value={formData.is_active}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value }))}
                  trackColor={{ false: Colors.light.border, true: Colors.light.primary + '40' }}
                  thumbColor={formData.is_active ? Colors.light.primary : Colors.light.textLight}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={editingCode ? handleUpdateCode : handleCreateCode}
            >
              <Text style={styles.saveButtonText}>
                {editingCode ? 'Update Code' : 'Create Code'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: Colors.light.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  codeCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  inactiveCard: {
    opacity: 0.6,
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  codeInfo: {
    flex: 1,
  },
  codeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  codeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  codeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  expiredText: {
    color: Colors.light.error,
  },
  plansContainer: {
    marginBottom: 8,
  },
  plansLabel: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    marginBottom: 4,
  },
  planTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  planTag: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  planTagText: {
    fontSize: 10,
    color: Colors.light.text,
  },
  inactiveBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.light.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  inactiveBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 8,
  },
  selectedType: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  selectedTypeText: {
    color: '#fff',
  },
  planSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  planOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  selectedPlan: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  planOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.text,
  },
  selectedPlanText: {
    color: '#fff',
  },
  helperText: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});