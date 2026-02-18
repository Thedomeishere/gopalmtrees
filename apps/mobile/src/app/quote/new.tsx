import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { colors, spacing, borderRadius, fontSize } from "@/theme";
import { SERVICE_TYPE_LABELS, type ServiceType } from "@palmtree/shared";
import { Ionicons } from "@expo/vector-icons";

const serviceTypes = Object.entries(SERVICE_TYPE_LABELS) as [ServiceType, string][];
const contactPrefs = [
  { value: "email" as const, label: "Email", icon: "mail" as const },
  { value: "phone" as const, label: "Phone", icon: "call" as const },
  { value: "either" as const, label: "Either", icon: "chatbubbles" as const },
];

export default function NewQuoteScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [serviceType, setServiceType] = useState<ServiceType>("consultation");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [contactPreference, setContactPreference] = useState<"email" | "phone" | "either">("email");
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5 - photos.length,
    });

    if (!result.canceled) {
      setPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 5));
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to submit a quote request.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Description Required", "Please describe what you need.");
      return;
    }

    setLoading(true);
    try {
      // Upload photos first if any
      let photoURLs: string[] = [];
      if (photos.length > 0) {
        const formData = new FormData();
        for (const uri of photos) {
          const filename = uri.split("/").pop() || "photo.jpg";
          formData.append("files", {
            uri,
            name: filename,
            type: "image/jpeg",
          } as any);
        }
        const uploadResult = await api.upload<{ urls: string[] }>("/upload", formData);
        photoURLs = uploadResult.urls;
      }

      await api.post("/quotes", {
        serviceType,
        description: description.trim(),
        photos: photoURLs,
        contactPreference,
        phone: phone.trim() || null,
      });

      Alert.alert(
        "Quote Submitted!",
        "We'll review your request and get back to you soon.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error("Error submitting quote:", error);
      Alert.alert("Error", "Failed to submit quote. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Service Type */}
      <View style={styles.section}>
        <Text style={styles.label}>Service Type</Text>
        <View style={styles.chipGrid}>
          {serviceTypes.map(([value, label]) => (
            <TouchableOpacity
              key={value}
              style={[styles.chip, serviceType === value && styles.chipActive]}
              onPress={() => setServiceType(value)}
            >
              <Text
                style={[
                  styles.chipText,
                  serviceType === value && styles.chipTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.textArea}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe what you're looking for, your space, and any preferences..."
          placeholderTextColor={colors.neutral[400]}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
      </View>

      {/* Photos */}
      <View style={styles.section}>
        <Text style={styles.label}>Photos (optional, up to 5)</Text>
        <View style={styles.photoGrid}>
          {photos.map((uri, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image source={{ uri }} style={styles.photo} contentFit="cover" />
              <TouchableOpacity
                style={styles.removePhoto}
                onPress={() => removePhoto(index)}
              >
                <Ionicons name="close-circle" size={24} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          {photos.length < 5 && (
            <TouchableOpacity style={styles.addPhoto} onPress={pickImage}>
              <Ionicons name="camera" size={28} color={colors.primary[700]} />
              <Text style={styles.addPhotoText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Contact Preference */}
      <View style={styles.section}>
        <Text style={styles.label}>Preferred Contact Method</Text>
        <View style={styles.contactRow}>
          {contactPrefs.map((pref) => (
            <TouchableOpacity
              key={pref.value}
              style={[
                styles.contactChip,
                contactPreference === pref.value && styles.contactChipActive,
              ]}
              onPress={() => setContactPreference(pref.value)}
            >
              <Ionicons
                name={pref.icon}
                size={18}
                color={
                  contactPreference === pref.value
                    ? colors.primary[700]
                    : colors.neutral[500]
                }
              />
              <Text
                style={[
                  styles.contactChipText,
                  contactPreference === pref.value && styles.contactChipTextActive,
                ]}
              >
                {pref.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Phone */}
      {(contactPreference === "phone" || contactPreference === "either") && (
        <View style={styles.section}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="(555) 123-4567"
            placeholderTextColor={colors.neutral[400]}
            keyboardType="phone-pad"
          />
        </View>
      )}

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.submitButtonText}>Submit Quote Request</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  section: { marginBottom: spacing.lg },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipActive: {
    borderColor: colors.primary[700],
    backgroundColor: colors.primary[50],
  },
  chipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: "500" },
  chipTextActive: { color: colors.primary[700], fontWeight: "600" },
  textArea: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    minHeight: 120,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  photoContainer: { position: "relative" },
  photo: { width: 80, height: 80, borderRadius: borderRadius.md },
  removePhoto: { position: "absolute", top: -8, right: -8 },
  addPhoto: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
  },
  addPhotoText: { fontSize: fontSize.xs, color: colors.primary[700], marginTop: 2 },
  contactRow: { flexDirection: "row", gap: spacing.sm },
  contactChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  contactChipActive: {
    borderColor: colors.primary[700],
    backgroundColor: colors.primary[50],
  },
  contactChipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: "500" },
  contactChipTextActive: { color: colors.primary[700], fontWeight: "600" },
  submitButton: {
    backgroundColor: colors.primary[700],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  buttonDisabled: { opacity: 0.7 },
  submitButtonText: { color: colors.white, fontSize: fontSize.md, fontWeight: "700" },
});
