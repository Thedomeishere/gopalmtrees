import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";
import { AuthProvider } from "@/providers/AuthProvider";
import { CartProvider } from "@/providers/CartProvider";
import { colors } from "@/theme";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <AuthProvider>
          <CartProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: colors.primary[900] },
                headerTintColor: colors.white,
                headerTitleStyle: { fontWeight: "600" },
                contentStyle: { backgroundColor: colors.background },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen
                name="product/[id]"
                options={{ title: "Product Details" }}
              />
              <Stack.Screen name="checkout" options={{ title: "Checkout" }} />
              <Stack.Screen
                name="order/[id]"
                options={{ title: "Order Details" }}
              />
              <Stack.Screen
                name="quote/new"
                options={{ title: "Request a Quote" }}
              />
              <Stack.Screen
                name="quote/[id]"
                options={{ title: "Quote Details" }}
              />
            </Stack>
          </CartProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
