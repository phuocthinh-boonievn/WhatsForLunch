import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Head>
          <title>Trưa nay ăn gì?</title>
          <meta name="description" content="Mở hòm CS:GO, nhận món ăn trưa." />
        </Head>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#27323b' } }} />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

