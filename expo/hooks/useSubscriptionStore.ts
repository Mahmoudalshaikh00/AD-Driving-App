import { useState, useEffect, useCallback, useMemo } from 'react';
import { Subscription, DiscountCode, PaymentMethod, Transaction, SubscriptionPlan, SubscriptionStatus } from '@/types';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUBSCRIPTION_PLANS = {
  free: { name: 'Free', price: 0, features: ['Up to 5 students', 'Basic evaluations', 'Email support'] },
  basic: { name: 'Basic', price: 9.99, features: ['Up to 20 students', 'Advanced evaluations', 'Chat support', 'Basic analytics'] },
  premium: { name: 'Premium', price: 19.99, features: ['Up to 50 students', 'All evaluation features', 'Priority support', 'Advanced analytics', 'Custom reports'] },
  enterprise: { name: 'Enterprise', price: 39.99, features: ['Unlimited students', 'All features', '24/7 support', 'Custom integrations', 'White-label options'] }
};

export const [SubscriptionProvider, useSubscription] = createContextHook(() => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Load data from AsyncStorage
  const loadData = useCallback(async () => {
    try {
      const [subsData, codesData, methodsData, transData] = await Promise.all([
        AsyncStorage.getItem('subscriptions'),
        AsyncStorage.getItem('discountCodes'),
        AsyncStorage.getItem('paymentMethods'),
        AsyncStorage.getItem('transactions')
      ]);

      if (subsData) setSubscriptions(JSON.parse(subsData));
      if (codesData) setDiscountCodes(JSON.parse(codesData));
      if (methodsData) setPaymentMethods(JSON.parse(methodsData));
      if (transData) setTransactions(JSON.parse(transData));
    } catch (error) {
      console.error('Error loading subscription data:', error);
    }
  }, []);

  // Save data to AsyncStorage
  const saveData = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem('subscriptions', JSON.stringify(subscriptions)),
        AsyncStorage.setItem('discountCodes', JSON.stringify(discountCodes)),
        AsyncStorage.setItem('paymentMethods', JSON.stringify(paymentMethods)),
        AsyncStorage.setItem('transactions', JSON.stringify(transactions))
      ]);
    } catch (error) {
      console.error('Error saving subscription data:', error);
    }
  }, [subscriptions, discountCodes, paymentMethods, transactions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    saveData();
  }, [saveData]);

  // Get user's current subscription
  const getUserSubscription = useCallback((userId: string): Subscription | null => {
    return subscriptions.find(sub => sub.user_id === userId && sub.status === 'active') || null;
  }, [subscriptions]);

  // Create or update subscription
  const createSubscription = useCallback(async (
    userId: string,
    plan: SubscriptionPlan,
    paymentMethodId: string,
    discountCodeId?: string
  ): Promise<{ success: boolean; error?: string; subscription?: Subscription }> => {
    try {
      setLoading(true);
      
      const planDetails = SUBSCRIPTION_PLANS[plan];
      let finalPrice = planDetails.price;
      let discountAmount = 0;

      // Apply discount code if provided
      if (discountCodeId) {
        const discountCode = discountCodes.find(code => code.id === discountCodeId);
        if (discountCode && discountCode.is_active && discountCode.current_uses < discountCode.max_uses) {
          const now = new Date();
          const validFrom = new Date(discountCode.valid_from);
          const validUntil = new Date(discountCode.valid_until);
          
          if (now >= validFrom && now <= validUntil && discountCode.applicable_plans.includes(plan)) {
            if (discountCode.discount_type === 'percentage') {
              discountAmount = (finalPrice * discountCode.discount_value) / 100;
            } else {
              discountAmount = discountCode.discount_value;
            }
            finalPrice = Math.max(0, finalPrice - discountAmount);
            
            // Update discount code usage
            setDiscountCodes(prev => prev.map(code => 
              code.id === discountCodeId 
                ? { ...code, current_uses: code.current_uses + 1 }
                : code
            ));
          }
        }
      }

      // Cancel existing subscription
      setSubscriptions(prev => prev.map(sub => 
        sub.user_id === userId && sub.status === 'active'
          ? { ...sub, status: 'cancelled' as SubscriptionStatus }
          : sub
      ));

      // Create new subscription
      const newSubscription: Subscription = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        plan,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        auto_renew: true,
        price: finalPrice,
        currency: 'USD',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Create transaction
      const transaction: Transaction = {
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        subscription_id: newSubscription.id,
        amount: finalPrice,
        currency: 'USD',
        status: 'completed',
        payment_method_id: paymentMethodId,
        discount_code_id: discountCodeId,
        discount_amount: discountAmount,
        created_at: new Date().toISOString()
      };

      setSubscriptions(prev => [...prev, newSubscription]);
      setTransactions(prev => [...prev, transaction]);

      return { success: true, subscription: newSubscription };
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      return { success: false, error: error.message || 'Failed to create subscription' };
    } finally {
      setLoading(false);
    }
  }, [discountCodes]);

  // Cancel subscription
  const cancelSubscription = useCallback(async (subscriptionId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      setSubscriptions(prev => prev.map(sub => 
        sub.id === subscriptionId
          ? { ...sub, status: 'cancelled' as SubscriptionStatus, auto_renew: false, updated_at: new Date().toISOString() }
          : sub
      ));

      return { success: true };
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      return { success: false, error: error.message || 'Failed to cancel subscription' };
    } finally {
      setLoading(false);
    }
  }, []);

  // Validate discount code
  const validateDiscountCode = useCallback((code: string, plan: SubscriptionPlan): DiscountCode | null => {
    const discountCode = discountCodes.find(dc => dc.code.toLowerCase() === code.toLowerCase());
    
    if (!discountCode || !discountCode.is_active) return null;
    if (discountCode.current_uses >= discountCode.max_uses) return null;
    if (!discountCode.applicable_plans.includes(plan)) return null;
    
    const now = new Date();
    const validFrom = new Date(discountCode.valid_from);
    const validUntil = new Date(discountCode.valid_until);
    
    if (now < validFrom || now > validUntil) return null;
    
    return discountCode;
  }, [discountCodes]);

  // Admin functions
  const createDiscountCode = useCallback(async (codeData: Omit<DiscountCode, 'id' | 'current_uses' | 'created_at'>): Promise<{ success: boolean; error?: string; code?: DiscountCode }> => {
    try {
      const newCode: DiscountCode = {
        ...codeData,
        id: `dc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        current_uses: 0,
        created_at: new Date().toISOString()
      };

      setDiscountCodes(prev => [...prev, newCode]);
      return { success: true, code: newCode };
    } catch (error: any) {
      console.error('Error creating discount code:', error);
      return { success: false, error: error.message || 'Failed to create discount code' };
    }
  }, []);

  const updateDiscountCode = useCallback(async (codeId: string, updates: Partial<DiscountCode>): Promise<{ success: boolean; error?: string }> => {
    try {
      setDiscountCodes(prev => prev.map(code => 
        code.id === codeId ? { ...code, ...updates } : code
      ));
      return { success: true };
    } catch (error: any) {
      console.error('Error updating discount code:', error);
      return { success: false, error: error.message || 'Failed to update discount code' };
    }
  }, []);

  const deleteDiscountCode = useCallback(async (codeId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setDiscountCodes(prev => prev.filter(code => code.id !== codeId));
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting discount code:', error);
      return { success: false, error: error.message || 'Failed to delete discount code' };
    }
  }, []);

  // Add payment method
  const addPaymentMethod = useCallback(async (userId: string, methodData: Omit<PaymentMethod, 'id' | 'user_id' | 'created_at'>): Promise<{ success: boolean; error?: string; method?: PaymentMethod }> => {
    try {
      const newMethod: PaymentMethod = {
        ...methodData,
        id: `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        created_at: new Date().toISOString()
      };

      // If this is the first payment method or marked as default, make it default
      const userMethods = paymentMethods.filter(pm => pm.user_id === userId);
      if (userMethods.length === 0 || newMethod.is_default) {
        // Set all other methods as non-default
        setPaymentMethods(prev => prev.map(pm => 
          pm.user_id === userId ? { ...pm, is_default: false } : pm
        ));
        newMethod.is_default = true;
      }

      setPaymentMethods(prev => [...prev, newMethod]);
      return { success: true, method: newMethod };
    } catch (error: any) {
      console.error('Error adding payment method:', error);
      return { success: false, error: error.message || 'Failed to add payment method' };
    }
  }, [paymentMethods]);

  return useMemo(() => ({
    subscriptions,
    discountCodes,
    paymentMethods,
    transactions,
    loading,
    SUBSCRIPTION_PLANS,
    getUserSubscription,
    createSubscription,
    cancelSubscription,
    validateDiscountCode,
    createDiscountCode,
    updateDiscountCode,
    deleteDiscountCode,
    addPaymentMethod
  }), [
    subscriptions,
    discountCodes,
    paymentMethods,
    transactions,
    loading,
    getUserSubscription,
    createSubscription,
    cancelSubscription,
    validateDiscountCode,
    createDiscountCode,
    updateDiscountCode,
    deleteDiscountCode,
    addPaymentMethod
  ]);
});