import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: 'none', // Hide the tab bar since we're using sidebar navigation
        },
      }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="transactions" />
      <Tabs.Screen name="inventory" />
      <Tabs.Screen name="customers" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}