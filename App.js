import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';

// Screens
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import KayitOlScreen from './screens/KayitOlScreen';

import GardiropScreen from './screens/GardiropScreen';
import FotografEkleScreen from './screens/FotografEkleScreen';
import KombinOnerScreen from './screens/KombinOnerScreen';
import KombinTuvaliScreen from './screens/KombinTuvaliScreen';
import TakvimScreen from './screens/TakvimScreen';
import AyarlarScreen from './screens/AyarlarScreen';

// Stack extra screens
import IstatistikScreen from './screens/IstatistikScreen';
import RenkCarkiScreen from './screens/RenkCarkiScreen';
import SanalKabinScreen from './screens/SanalKabinScreen';
import GorselAramaScreen from './screens/GorselAramaScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const COLORS = {
  background: '#070A12',
  backgroundSoft: '#0B1020',
  tabBar: '#0D1224',
  border: 'rgba(255,255,255,0.14)',
  active: '#C4B5FD',
  activeBg: 'rgba(139,92,246,0.24)',
  inactive: '#7F7895',
  glow: '#8B5CF6',
};

function TabIcon({ name, color, focused }) {
  return (
    <View
      style={{
        width: 42,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? COLORS.activeBg : 'transparent',
        borderWidth: focused ? 1 : 0,
        borderColor: focused ? 'rgba(196,181,253,0.24)' : 'transparent',
      }}
    >
      <Feather name={name} size={21} color={color} />
    </View>
  );
}

function AnaUygulamaSekmeleri() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,

        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,

        tabBarActiveTintColor: COLORS.active,
        tabBarInactiveTintColor: COLORS.inactive,

        sceneContainerStyle: {
          backgroundColor: COLORS.background,
        },

        tabBarStyle: {
          position: 'absolute',
          bottom: 14,
          left: 14,
          right: 14,

          height: 78,
          backgroundColor: COLORS.tabBar,

          borderTopWidth: 1,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 30,

          paddingTop: 8,
          paddingBottom: 10,
          paddingHorizontal: 6,

          shadowColor: COLORS.glow,
          shadowOpacity: 0.35,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 10 },
          elevation: 24,
        },

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '900',
          marginTop: 1,
        },

        tabBarItemStyle: {
          borderRadius: 22,
        },
      }}
    >
      <Tab.Screen
        name="Gardirop"
        component={GardiropScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="grid" color={color} focused={focused} />
          ),
        }}
      />

      <Tab.Screen
        name="Ekle"
        component={FotografEkleScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="plus-circle" color={color} focused={focused} />
          ),
        }}
      />

      <Tab.Screen
        name="Kombin"
        component={KombinOnerScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="zap" color={color} focused={focused} />
          ),
        }}
      />

      <Tab.Screen
        name="Tuval"
        component={KombinTuvaliScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="layers" color={color} focused={focused} />
          ),
        }}
      />

      <Tab.Screen
        name="Takvim"
        component={TakvimScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="calendar" color={color} focused={focused} />
          ),
        }}
      />

      <Tab.Screen
        name="Ayarlar"
        component={AyarlarScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="settings" color={color} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: COLORS.background,
          },
        }}
      >
        {/* Auth */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="KayitOl" component={KayitOlScreen} />

        {/* Main App */}
        <Stack.Screen name="AnaUygulama" component={AnaUygulamaSekmeleri} />

        {/* Extra screens */}
        <Stack.Screen name="Istatistik" component={IstatistikScreen} />
        <Stack.Screen name="RenkCarki" component={RenkCarkiScreen} />
        <Stack.Screen name="SanalKabin" component={SanalKabinScreen} />

        {/* Visual Search Screen */}
        <Stack.Screen name="GorselArama" component={GorselAramaScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}