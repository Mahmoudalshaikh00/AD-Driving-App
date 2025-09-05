import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { BarChart3, TrendingUp, Users, Calendar, MessageSquare, Star, Activity, Clock, Award, AlertTriangle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useStudentStore } from '@/hooks/useStudentStore';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AnalyticsData {
  userGrowth: { month: string; users: number; instructors: number; students: number }[];
  platformActivity: {
    totalLessons: number;
    completedEvaluations: number;
    averageRating: number;
    activeChats: number;
    scheduledLessons: number;
    cancelledLessons: number;
  };
  userEngagement: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    averageSessionTime: string;
  };
  performance: {
    systemUptime: string;
    responseTime: string;
    errorRate: string;
    dataUsage: string;
  };
}

export default function AdminAnalyticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { students } = useStudentStore();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    // Generate mock analytics data
    const mockAnalytics: AnalyticsData = {
      userGrowth: [
        { month: 'Oct', users: 45, instructors: 12, students: 33 },
        { month: 'Nov', users: 62, instructors: 18, students: 44 },
        { month: 'Dec', users: 78, instructors: 22, students: 56 },
        { month: 'Jan', users: 95, instructors: 28, students: 67 },
        { month: 'Feb', users: 112, instructors: 32, students: 80 },
        { month: 'Mar', users: 128, instructors: 38, students: 90 }
      ],
      platformActivity: {
        totalLessons: 1247,
        completedEvaluations: 892,
        averageRating: 4.7,
        activeChats: 34,
        scheduledLessons: 156,
        cancelledLessons: 23
      },
      userEngagement: {
        dailyActiveUsers: 67,
        weeklyActiveUsers: 145,
        monthlyActiveUsers: 298,
        averageSessionTime: '24m 15s'
      },
      performance: {
        systemUptime: '99.8%',
        responseTime: '245ms',
        errorRate: '0.12%',
        dataUsage: '2.4 GB'
      }
    };
    setAnalytics(mockAnalytics);
  }, []);

  const MetricCard = ({ 
    icon, 
    title, 
    value, 
    subtitle, 
    color = Colors.light.primary,
    trend,
    size = 'normal'
  }: {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    subtitle?: string;
    color?: string;
    trend?: 'up' | 'down' | 'stable';
    size?: 'normal' | 'large';
  }) => (
    <View style={[
      styles.metricCard,
      size === 'large' && styles.largeMetricCard,
      { borderLeftColor: color }
    ]}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, { backgroundColor: color + '15' }]}>
          {icon}
        </View>
        <View style={styles.metricInfo}>
          <Text style={[styles.metricValue, size === 'large' && styles.largeMetricValue]}>
            {value}
          </Text>
          <Text style={styles.metricTitle}>{title}</Text>
          {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
        </View>
        {trend && (
          <View style={[styles.trendIndicator, { backgroundColor: trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280' }]}>
            <TrendingUp size={12} color="#fff" />
          </View>
        )}
      </View>
    </View>
  );

  const TimeframeButton = ({ timeframe, label }: { timeframe: '7d' | '30d' | '90d' | '1y'; label: string }) => (
    <TouchableOpacity
      style={[styles.timeframeButton, selectedTimeframe === timeframe && styles.timeframeButtonActive]}
      onPress={() => setSelectedTimeframe(timeframe)}
    >
      <Text style={[styles.timeframeButtonText, selectedTimeframe === timeframe && styles.timeframeButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (!analytics) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Analytics</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Activity size={48} color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Platform Analytics</Text>
      </View>

      <View style={styles.timeframeSelector}>
        <TimeframeButton timeframe="7d" label="7 Days" />
        <TimeframeButton timeframe="30d" label="30 Days" />
        <TimeframeButton timeframe="90d" label="90 Days" />
        <TimeframeButton timeframe="1y" label="1 Year" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Overview</Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              icon={<Users size={24} color={Colors.light.primary} />}
              title="Total Users"
              value={analytics.userGrowth[analytics.userGrowth.length - 1]?.users || 0}
              subtitle="Active accounts"
              trend="up"
              size="large"
            />
            <MetricCard
              icon={<Calendar size={20} color="#10b981" />}
              title="Total Lessons"
              value={analytics.platformActivity.totalLessons}
              color="#10b981"
              trend="up"
            />
            <MetricCard
              icon={<Star size={20} color="#f59e0b" />}
              title="Avg Rating"
              value={analytics.platformActivity.averageRating}
              subtitle="Out of 5.0"
              color="#f59e0b"
              trend="up"
            />
            <MetricCard
              icon={<MessageSquare size={20} color="#3b82f6" />}
              title="Active Chats"
              value={analytics.platformActivity.activeChats}
              color="#3b82f6"
              trend="stable"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Engagement</Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              icon={<Activity size={20} color="#8b5cf6" />}
              title="Daily Active"
              value={analytics.userEngagement.dailyActiveUsers}
              subtitle="Users today"
              color="#8b5cf6"
              trend="up"
            />
            <MetricCard
              icon={<Users size={20} color="#06b6d4" />}
              title="Weekly Active"
              value={analytics.userEngagement.weeklyActiveUsers}
              subtitle="Users this week"
              color="#06b6d4"
              trend="up"
            />
            <MetricCard
              icon={<Clock size={20} color="#f97316" />}
              title="Session Time"
              value={analytics.userEngagement.averageSessionTime}
              subtitle="Average duration"
              color="#f97316"
              trend="stable"
            />
            <MetricCard
              icon={<TrendingUp size={20} color="#10b981" />}
              title="Monthly Active"
              value={analytics.userEngagement.monthlyActiveUsers}
              subtitle="Users this month"
              color="#10b981"
              trend="up"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning Progress</Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              icon={<Award size={20} color="#10b981" />}
              title="Evaluations"
              value={analytics.platformActivity.completedEvaluations}
              subtitle="Completed"
              color="#10b981"
              trend="up"
            />
            <MetricCard
              icon={<Calendar size={20} color="#3b82f6" />}
              title="Scheduled"
              value={analytics.platformActivity.scheduledLessons}
              subtitle="Upcoming lessons"
              color="#3b82f6"
              trend="stable"
            />
            <MetricCard
              icon={<AlertTriangle size={20} color="#f59e0b" />}
              title="Cancelled"
              value={analytics.platformActivity.cancelledLessons}
              subtitle="This month"
              color="#f59e0b"
              trend="down"
            />
            <MetricCard
              icon={<Star size={20} color="#8b5cf6" />}
              title="Success Rate"
              value="87%"
              subtitle="Pass rate"
              color="#8b5cf6"
              trend="up"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Performance</Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              icon={<Activity size={20} color="#10b981" />}
              title="Uptime"
              value={analytics.performance.systemUptime}
              subtitle="Last 30 days"
              color="#10b981"
              trend="stable"
            />
            <MetricCard
              icon={<Clock size={20} color="#3b82f6" />}
              title="Response Time"
              value={analytics.performance.responseTime}
              subtitle="Average"
              color="#3b82f6"
              trend="stable"
            />
            <MetricCard
              icon={<AlertTriangle size={20} color="#f59e0b" />}
              title="Error Rate"
              value={analytics.performance.errorRate}
              subtitle="Last 24h"
              color="#f59e0b"
              trend="down"
            />
            <MetricCard
              icon={<BarChart3 size={20} color="#8b5cf6" />}
              title="Data Usage"
              value={analytics.performance.dataUsage}
              subtitle="This month"
              color="#8b5cf6"
              trend="up"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Growth Trends</Text>
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>User Growth Over Time</Text>
            <View style={styles.chartPlaceholder}>
              <BarChart3 size={48} color={Colors.light.textLight} />
              <Text style={styles.chartPlaceholderText}>
                Chart showing {analytics.userGrowth.length} months of growth data
              </Text>
              <Text style={styles.chartDetails}>
                Latest: {analytics.userGrowth[analytics.userGrowth.length - 1]?.users} total users
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Insights</Text>
          <View style={styles.insightsList}>
            <View style={styles.insightItem}>
              <View style={[styles.insightIcon, { backgroundColor: '#10b981' + '15' }]}>
                <TrendingUp size={16} color="#10b981" />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>User growth is accelerating</Text>
                <Text style={styles.insightDescription}>
                  {((analytics.userGrowth[analytics.userGrowth.length - 1]?.users || 0) - (analytics.userGrowth[analytics.userGrowth.length - 2]?.users || 0))} new users this month
                </Text>
              </View>
            </View>
            
            <View style={styles.insightItem}>
              <View style={[styles.insightIcon, { backgroundColor: '#f59e0b' + '15' }]}>
                <Star size={16} color="#f59e0b" />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>High satisfaction rate</Text>
                <Text style={styles.insightDescription}>
                  Average rating of {analytics.platformActivity.averageRating}/5.0 across all instructors
                </Text>
              </View>
            </View>
            
            <View style={styles.insightItem}>
              <View style={[styles.insightIcon, { backgroundColor: '#3b82f6' + '15' }]}>
                <MessageSquare size={16} color="#3b82f6" />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Active communication</Text>
                <Text style={styles.insightDescription}>
                  {analytics.platformActivity.activeChats} ongoing conversations between users
                </Text>
              </View>
            </View>
            
            <View style={styles.insightItem}>
              <View style={[styles.insightIcon, { backgroundColor: '#8b5cf6' + '15' }]}>
                <Calendar size={16} color="#8b5cf6" />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Strong booking activity</Text>
                <Text style={styles.insightDescription}>
                  {analytics.platformActivity.scheduledLessons} lessons scheduled for the coming week
                </Text>
              </View>
            </View>
          </View>
        </View>
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
  timeframeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    gap: 4,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeframeButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  timeframeButtonText: {
    fontSize: 14,
    color: Colors.light.textLight,
    fontWeight: '500',
  },
  timeframeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    width: '48%',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  largeMetricCard: {
    width: '100%',
    padding: 20,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricInfo: {
    flex: 1,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  largeMetricValue: {
    fontSize: 28,
  },
  metricTitle: {
    fontSize: 12,
    color: Colors.light.textLight,
    fontWeight: '600',
  },
  metricSubtitle: {
    fontSize: 10,
    color: Colors.light.textLight,
    marginTop: 2,
  },
  trendIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartContainer: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
  },
  chartPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
  },
  chartPlaceholderText: {
    fontSize: 14,
    color: Colors.light.textLight,
    marginTop: 12,
    textAlign: 'center',
  },
  chartDetails: {
    fontSize: 12,
    color: Colors.light.textLight,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  insightsList: {
    gap: 12,
  },
  insightItem: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  insightDescription: {
    fontSize: 12,
    color: Colors.light.textLight,
    lineHeight: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.textLight,
  },
});