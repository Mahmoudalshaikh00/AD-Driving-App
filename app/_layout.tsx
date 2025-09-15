import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StudentProvider } from "@/hooks/useStudentStore";
import { TaskProvider } from "@/hooks/useTaskStore";
import { EvaluationProvider } from "@/hooks/useEvaluationStore";
import { ScheduleProvider } from "@/hooks/useScheduleStore";
import { AuthProvider, useAuth } from "@/hooks/useAuthStore";
import { NotificationProvider } from "@/hooks/useNotificationStore";
import { SubscriptionProvider } from "@/hooks/useSubscriptionStore";
import LoginScreen from "@/components/LoginScreen";
import Colors from "@/constants/colors";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ 
      headerBackTitle: "Back",
      headerStyle: {
        backgroundColor: '#3498db',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="students/[id]" options={{ title: "Student Details" }} />
      <Stack.Screen name="students/[id]/schedule" options={{ headerShown: false }} />
      <Stack.Screen name="tasks/[id]" options={{ title: "Task Details" }} />
      <Stack.Screen name="evaluate/[studentId]/[taskId]" options={{ title: "Evaluate Student" }} />
      <Stack.Screen name="evaluations/[studentId]" options={{ headerShown: false }} />
      <Stack.Screen name="evaluations" options={{ title: "Evaluations" }} />
      <Stack.Screen name="schedule/[userId]" options={{ title: "Schedule" }} />
      <Stack.Screen name="chat/[studentId]" options={{ headerShown: false }} />
      <Stack.Screen name="admin/users" options={{ title: "Manage Users" }} />
      <Stack.Screen name="admin/reports" options={{ title: "Reports" }} />
      <Stack.Screen name="admin/settings" options={{ title: "Admin Settings" }} />
      <Stack.Screen name="admin/approvals" options={{ title: "Approvals" }} />
      <Stack.Screen name="admin/tasks" options={{ title: "Task Manage" }} />
      <Stack.Screen name="admin/discount-codes" options={{ title: "Discount Codes" }} />
      <Stack.Screen name="subscription" options={{ title: "Subscription Plans" }} />
      <Stack.Screen name="+not-found" options={{ title: "Oops!" }} />
    </Stack>
  );
}

function AuthenticatedApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = React.useState(false);

  // Add a timeout for loading state to prevent infinite loading
  React.useEffect(() => {
    if (isLoading) {
      console.log('⏳ App: Authentication is loading...');
      const timer = setTimeout(() => {
        console.warn('⚠️ App: Authentication loading timeout reached');
        setLoadingTimeout(true);
      }, 15000); // 15 second timeout
      
      return () => clearTimeout(timer);
    } else {
      console.log('✅ App: Authentication loading completed');
      setLoadingTimeout(false);
    }
  }, [isLoading]);

  if (isLoading && !loadingTimeout) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (loadingTimeout) {
    console.error('🚨 App: Loading timeout - forcing login screen');
    return <LoginScreen />;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <SubscriptionProvider>
      <NotificationProvider>
        <StudentProvider>
          <TaskProvider>
            <EvaluationProvider>
              <ScheduleProvider>
                <RootLayoutNav />
              </ScheduleProvider>
            </EvaluationProvider>
          </TaskProvider>
        </StudentProvider>
      </NotificationProvider>
    </SubscriptionProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={styles.container}>
          <AuthProvider>
            <AuthenticatedApp />
          </AuthProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
  },
});