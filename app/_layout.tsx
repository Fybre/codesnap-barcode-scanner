import { Stack } from "expo-router";
import { AppProvider } from "@/context/AppContext";

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: '#1C1C1E' },
          headerTintColor: '#FFFFFF',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="about"
          options={{
            headerShown: true,
            title: 'About',
          }}
        />
      </Stack>
    </AppProvider>
  );
}
