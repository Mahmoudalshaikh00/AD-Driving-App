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
import { SubscriptionPlan } from '@/types';
import { Crown, Check, X, Tag } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRouter } from 'expo-router';

export default function SubscriptionScreen() {
  const { user } = useAuth();
  const { 
    getUserSubscription, 
    SUBSCRIPTION_PLANS, 
    createSubscription, 
    validateDiscountCode,
    addPaymentMethod,
    loading 
  } = useSubscription();
  const router = useRouter();
  
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('basic');
  const [discountCode, setDiscountCode] = useState<string>('');
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [showDiscountInput, setShowDiscountInput] = useState<boolean>(false);

  const currentSubscription = user ? getUserSubscription(user.id) : null;

  const handleApplyDiscount = () => {
    if (!discountCode.trim()) return;
    
    const discount = validateDiscountCode(discountCode, selectedPlan);
    if (discount) {
      setAppliedDiscount(discount);
      Alert.alert('Success', 'Discount code applied successfully!');
    } else {
      Alert.alert('Invalid Code', 'This discount code is not valid or has expired.');
    }
  };

  const calculatePrice = (plan: SubscriptionPlan) => {
    const basePrice = SUBSCRIPTION_PLANS[plan].price;
    if (!appliedDiscount) return basePrice;

    if (appliedDiscount.discount_type === 'percentage') {
      return basePrice - (basePrice * appliedDiscount.discount_value) / 100;
    } else {
      return Math.max(0, basePrice - appliedDiscount.discount_value);
    }
  };

  const handleSubscribe = async () => {
    if (!user) return;

    // First add a mock payment method
    const paymentResult = await addPaymentMethod(user.id, {
      type: 'card',
      last_four: '4242',
      brand: 'Visa',
      is_default: true
    });

    if (!paymentResult.success || !paymentResult.method) {
      Alert.alert('Error', 'Failed to add payment method');
      return;
    }

    // Create subscription
    const result = await createSubscription(
      user.id,
      selectedPlan,
      paymentResult.method.id,
      appliedDiscount?.id
    );

    if (result.success) {
      Alert.alert(
        'Success!', 
        `You have successfully subscribed to the ${SUBSCRIPTION_PLANS[selectedPlan].name} plan!`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to create subscription');
    }
  };

  const PlanCard = ({ plan, planKey }: { plan: any; planKey: SubscriptionPlan }) => {
    const isSelected = selectedPlan === planKey;
    const isCurrentPlan = currentSubscription?.plan === planKey;
    const price = calculatePrice(planKey);
    const originalPrice = SUBSCRIPTION_PLANS[planKey].price;
    const hasDiscount = appliedDiscount && price < originalPrice;

    return (
      <TouchableOpacity
        style={[
          styles.planCard,
          isSelected && styles.selectedPlan,
          isCurrentPlan && styles.currentPlan
        ]}
        onPress={() => setSelectedPlan(planKey)}
        disabled={isCurrentPlan}
      >
        <View style={styles.planHeader}>
          <Text style={[styles.planName, isSelected && styles.selectedText]}>
            {plan.name}
          </Text>
          {isCurrentPlan && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>CURRENT</Text>
            </View>
          )}
          {isSelected && !isCurrentPlan && (
            <Crown size={20} color={Colors.light.primary} />
          )}
        </View>

        <View style={styles.priceContainer}>
          {hasDiscount && (
            <Text style={styles.originalPrice}>${originalPrice.toFixed(2)}</Text>
          )}
          <Text style={[styles.planPrice, isSelected && styles.selectedText]}>
            ${price.toFixed(2)}/month
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          {plan.features.map((feature: string, index: number) => (
            <View key={index} style={styles.featureRow}>
              <Check size={16} color={Colors.light.success} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Plan</Text>
          <Text style={styles.subtitle}>
            Upgrade your account to unlock premium features
          </Text>
        </View>

        {/* Discount Code Section */}
        <View style={styles.discountSection}>
          {!showDiscountInput ? (
            <TouchableOpacity
              style={styles.discountButton}
              onPress={() => setShowDiscountInput(true)}
            >
              <Tag size={16} color={Colors.light.primary} />
              <Text style={styles.discountButtonText}>Have a discount code?</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.discountInputContainer}>
              <TextInput
                style={styles.discountInput}
                value={discountCode}
                onChangeText={setDiscountCode}
                placeholder="Enter discount code"
                placeholderTextColor={Colors.light.tabIconDefault}
              />
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleApplyDiscount}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowDiscountInput(false);
                  setDiscountCode('');
                  setAppliedDiscount(null);
                }}
              >
                <X size={16} color={Colors.light.tabIconDefault} />
              </TouchableOpacity>
            </View>
          )}

          {appliedDiscount && (
            <View style={styles.appliedDiscountContainer}>
              <Text style={styles.appliedDiscountText}>
                ✅ Discount applied: {appliedDiscount.discount_type === 'percentage' 
                  ? `${appliedDiscount.discount_value}% off`
                  : `$${appliedDiscount.discount_value} off`
                }
              </Text>
            </View>
          )}
        </View>

        {/* Plans */}
        <View style={styles.plansContainer}>
          {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => (
            <PlanCard 
              key={key} 
              plan={plan} 
              planKey={key as SubscriptionPlan} 
            />
          ))}
        </View>

        {/* Subscribe Button */}
        {selectedPlan !== 'free' && selectedPlan !== currentSubscription?.plan && (
          <TouchableOpacity
            style={[styles.subscribeButton, loading && styles.disabledButton]}
            onPress={handleSubscribe}
            disabled={loading}
          >
            <Text style={styles.subscribeButtonText}>
              {loading ? 'Processing...' : `Subscribe to ${SUBSCRIPTION_PLANS[selectedPlan].name}`}
            </Text>
          </TouchableOpacity>
        )}

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
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
  },
  discountSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  discountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
    gap: 8,
  },
  discountButtonText: {
    color: Colors.light.primary,
    fontWeight: '500',
  },
  discountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  discountInput: {
    flex: 1,
    padding: 12,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    color: Colors.light.text,
  },
  applyButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  cancelButton: {
    padding: 12,
  },
  appliedDiscountContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: Colors.light.success + '20',
    borderRadius: 6,
  },
  appliedDiscountText: {
    color: Colors.light.success,
    fontSize: 14,
    fontWeight: '500',
  },
  plansContainer: {
    paddingHorizontal: 20,
  },
  planCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  selectedPlan: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + '05',
  },
  currentPlan: {
    borderColor: Colors.light.success,
    backgroundColor: Colors.light.success + '05',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  selectedText: {
    color: Colors.light.primary,
  },
  currentBadge: {
    backgroundColor: Colors.light.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  priceContainer: {
    marginBottom: 16,
  },
  originalPrice: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  featuresContainer: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  subscribeButton: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 40,
  },
});