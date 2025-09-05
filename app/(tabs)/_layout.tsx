import { Tabs } from "expo-router";
import React from "react";
import { Users, ClipboardList, CalendarDays, User, LogOut, Shield, Settings, AlertTriangle, BarChart3 } from "lucide-react-native";
import { View, TouchableOpacity, Text } from "react-native";
import { useAuth } from "@/hooks/useAuthStore";

import Colors from "@/constants/colors";

function CircularIcon({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <View style={{
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: active ? Colors.light.primary : Colors.light.cardBackground,
    }}>
      {children}
    </View>
  );
}

export default function TabLayout() {
  const { user, signOut } = useAuth();

  // Admin tabs
  if (user?.role === 'admin') {
    return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.light.primary,
          tabBarInactiveTintColor: Colors.light.tabIconDefault,
          tabBarStyle: {
            backgroundColor: Colors.light.cardBackground,
            borderTopColor: Colors.light.border,
          },
          headerStyle: {
            backgroundColor: Colors.light.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => signOut()}
              style={{ marginRight: 12, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12 }}
              testID="logout-button"
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <LogOut size={16} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Logout</Text>
              </View>
            </TouchableOpacity>
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color, focused }) => (
              <CircularIcon active={focused}>
                <BarChart3 size={18} color={focused ? '#fff' : color} />
              </CircularIcon>
            ),
          }}
        />
        <Tabs.Screen
          name="evaluations"
          options={{
            title: "Users",
            tabBarIcon: ({ color }) => <Users size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            title: "Reports",
            tabBarIcon: ({ color }) => <AlertTriangle size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="schedule"
          options={{
            title: "Settings",
            tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
          }}
        />
        <Tabs.Screen name="chat" options={{ href: null, headerShown: false }} />
      </Tabs>
    );
  }

  if (user?.role === 'student') {
    return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.light.primary,
          tabBarInactiveTintColor: Colors.light.tabIconDefault,
          tabBarStyle: {
            backgroundColor: Colors.light.cardBackground,
            borderTopColor: Colors.light.border,
          },
          headerStyle: {
            backgroundColor: Colors.light.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => signOut()}
              style={{ marginRight: 12, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12 }}
              testID="logout-button"
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <LogOut size={16} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Logout</Text>
              </View>
            </TouchableOpacity>
          ),
          
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Student",
            tabBarIcon: ({ color, focused }) => (
              <CircularIcon active={focused}>
                <User size={18} color={focused ? '#fff' : color} />
              </CircularIcon>
            ),
          }}
        />
        <Tabs.Screen
          name="schedule"
          options={{
            title: "Schedule",
            headerShown: false,
            tabBarIcon: ({ color }) => <CalendarDays size={24} color={color} />,
          }}
        />

        <Tabs.Screen name="tasks" options={{ href: null }} />
        <Tabs.Screen name="chat" options={{ href: null, headerShown: false }} />
        <Tabs.Screen name="evaluations" options={{ href: null, headerShown: false }} />
      </Tabs>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: Colors.light.tabIconDefault,
        tabBarStyle: {
          backgroundColor: Colors.light.cardBackground,
          borderTopColor: Colors.light.border,
        },
        headerStyle: {
          backgroundColor: Colors.light.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: () => (
          <TouchableOpacity
            onPress={() => signOut()}
            style={{ marginRight: 12, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12 }}
            testID="logout-button"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <LogOut size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Logout</Text>
            </View>
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Students",
          tabBarIcon: ({ color, focused }) => (
            <CircularIcon active={focused}>
              <Users size={18} color={focused ? '#fff' : color} />
            </CircularIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          headerShown: false,
          tabBarIcon: ({ color }) => <CalendarDays size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
          tabBarIcon: ({ color }) => <ClipboardList size={24} color={color} />,
        }}
      />

      <Tabs.Screen name="chat" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="evaluations" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
