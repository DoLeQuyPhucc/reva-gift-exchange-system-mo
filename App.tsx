import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import Navigation from "@/src/layouts/Navigation";
import fonts from "@/src/config/fonts";
import Toast from "react-native-toast-message";
import { StripeProvider } from "@stripe/stripe-react-native";
import { useNotificationStore } from "@/src/stores/notificationStore";
import { useAuthStore } from "@/src/stores/authStore";

const STRIPE_KEY =
  'pk_test_51QG1BCFZYtuiwMkRanQqBx1ybBgNqkztXRBPBda7ETS0kE5o5rJmnzxx94u3EZg8GMlLOXMBZK7K23P9zlZKDVXo00gWFlfPc0';

export default function App() {
  let [fontsLoaded] = useFonts(fonts);
  const { initializeConnection, disconnectSignalR } = useNotificationStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      initializeConnection();
    }
    return () => {
      disconnectSignalR();
    };
  }, [isAuthenticated]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <StripeProvider publishableKey={STRIPE_KEY}>
      <Navigation />
      <Toast />
    </StripeProvider>
  );
}