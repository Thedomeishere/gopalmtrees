import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from "react-native";
import { Stack } from "expo-router";
import { doc, updateDoc, arrayUnion, arrayRemove } from "@react-native-firebase/firestore";
import { db } from "@/services/firebase";
import { useAuth } from "@/hooks/useAuth";
import { colors, spacing, borderRadius, fontSize } from "@/theme";
import { generateId, type Address } from "@palmtree/shared";
import { Ionicons } from "@expo/vector-icons";

export default function AddressesScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [street, setStreet] = useState("");
  const [unit, setUnit] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");

  const addresses = profile?.addresses || [];

  const resetForm = () => {
    setLabel("");
    setStreet("");
    setUnit("");
    setCity("");
    setState("");
    setZip("");
    setShowForm(false);
  };

  const handleAdd = async () => {
    if (!user || !street || !city || !state || !zip) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }
    const newAddress: Address = {
      id: generateId(),
      label: label || "Home",
      street,
      unit: unit || undefined,
      city,
      state: state.toUpperCase(),
      zip,
      isDefault: addresses.length === 0,
    };
    try {
      await updateDoc(doc(db, "users", user.uid), {
        addresses: arrayUnion(newAddress),
      });
      await refreshProfile();
      resetForm();
    } catch (error) {
      console.error("Error adding address:", error);
      Alert.alert("Error", "Failed to add address.");
    }
  };

  const handleDelete = async (address: Address) => {
    if (!user) return;
    Alert.alert("Delete Address", `Remove "${address.label}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await updateDoc(doc(db, "users", user.uid), {
              addresses: arrayRemove(address),
            });
            await refreshProfile();
          } catch (error) {
            console.error("Error deleting address:", error);
          }
        },
      },
    ]);
  };

  const setDefault = async (address: Address) => {
    if (!user) return;
    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.id === address.id,
    }));
    try {
      await updateDoc(doc(db, "users", user.uid), { addresses: updated });
      await refreshProfile();
    } catch (error) {
      console.error("Error setting default:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Address Book" }} />
      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          showForm ? (
            <View style={styles.form}>
              <Text style={styles.formTitle}>New Address</Text>
              <TextInput style={styles.input} value={label} onChangeText={setLabel} placeholder="Label (e.g. Home, Office)" placeholderTextColor={colors.neutral[400]} />
              <TextInput style={styles.input} value={street} onChangeText={setStreet} placeholder="Street Address *" placeholderTextColor={colors.neutral[400]} />
              <TextInput style={styles.input} value={unit} onChangeText={setUnit} placeholder="Apt/Unit (optional)" placeholderTextColor={colors.neutral[400]} />
              <View style={styles.row}>
                <TextInput style={[styles.input, { flex: 2 }]} value={city} onChangeText={setCity} placeholder="City *" placeholderTextColor={colors.neutral[400]} />
                <TextInput style={[styles.input, { flex: 1 }]} value={state} onChangeText={setState} placeholder="State *" placeholderTextColor={colors.neutral[400]} autoCapitalize="characters" maxLength={2} />
                <TextInput style={[styles.input, { flex: 1 }]} value={zip} onChangeText={setZip} placeholder="ZIP *" placeholderTextColor={colors.neutral[400]} keyboardType="number-pad" maxLength={5} />
              </View>
              <View style={styles.formButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleAdd}>
                  <Text style={styles.saveText}>Save Address</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
              <Ionicons name="add-circle" size={20} color={colors.primary[700]} />
              <Text style={styles.addText}>Add New Address</Text>
            </TouchableOpacity>
          )
        }
        ListEmptyComponent={
          !showForm ? (
            <View style={styles.emptyState}>
              <Ionicons name="location-outline" size={48} color={colors.neutral[300]} />
              <Text style={styles.emptyText}>No addresses saved yet</Text>
            </View>
          ) : null
        }
        renderItem={({ item: addr }) => (
          <View style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <View style={styles.addressLabelRow}>
                <Text style={styles.addressLabel}>{addr.label}</Text>
                {addr.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Default</Text>
                  </View>
                )}
              </View>
              <View style={styles.addressActions}>
                {!addr.isDefault && (
                  <TouchableOpacity onPress={() => setDefault(addr)}>
                    <Text style={styles.setDefaultText}>Set Default</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => handleDelete(addr)}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.addressText}>
              {addr.street}{addr.unit ? `, ${addr.unit}` : ""}
            </Text>
            <Text style={styles.addressText}>
              {addr.city}, {addr.state} {addr.zip}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary[200],
    borderStyle: "dashed",
  },
  addText: { fontSize: fontSize.md, fontWeight: "600", color: colors.primary[700] },
  form: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  formTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.textPrimary, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  row: { flexDirection: "row", gap: spacing.sm },
  formButtons: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  cancelButton: { flex: 1, padding: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  cancelText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: "600" },
  saveButton: { flex: 1, padding: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.primary[700], alignItems: "center" },
  saveText: { fontSize: fontSize.sm, color: colors.white, fontWeight: "600" },
  emptyState: { alignItems: "center", padding: spacing.xl },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.sm },
  addressCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  addressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs },
  addressLabelRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  addressLabel: { fontSize: fontSize.md, fontWeight: "700", color: colors.textPrimary },
  defaultBadge: { backgroundColor: colors.primary[100], paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  defaultText: { fontSize: fontSize.xs, color: colors.primary[700], fontWeight: "600" },
  addressActions: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  setDefaultText: { fontSize: fontSize.xs, color: colors.primary[700], fontWeight: "600" },
  addressText: { fontSize: fontSize.sm, color: colors.textSecondary },
});
