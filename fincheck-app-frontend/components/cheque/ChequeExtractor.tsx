import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedText } from '@/components/ui/ThemedText';
import { Header } from '@/components/layout/Header';
import { Drawer } from '@/components/layout/Drawer';
import { useTheme } from '@/hooks/useTheme';
import { extractChequeAmount } from '@/lib/api';

type ChequeResult = {
  amount_digits?: string | null;
  amount_words?: string | null;
  digits_value?: number | null;
  words_value?: number | null;
  verification_status?: 'MATCH' | 'MISMATCH' | 'UNVERIFIED';
  used_yolo_fallback?: boolean;
  raw_ocr_text?: string;
  digits_roi_ocr?: string;
};

export default function ChequeExtractor() {
  const { colors, toggleTheme } = useTheme();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ChequeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRawOcr, setShowRawOcr] = useState(false);
  const [showDigitsRoi, setShowDigitsRoi] = useState(false);

  const openDrawer = () => setDrawerVisible(true);
  const closeDrawer = () => setDrawerVisible(false);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Please grant camera and photo library permissions to use this feature.'
        );
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setResult(null);
        setError(null);
        setShowRawOcr(false);
        setShowDigitsRoi(false);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.6,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setResult(null);
        setError(null);
        setShowRawOcr(false);
        setShowDigitsRoi(false);
      }
    } catch (err) {
      console.error('Error taking photo:', err);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const submit = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await extractChequeAmount({
        uri: imageUri,
        name: 'cheque.jpg',
        type: 'image/jpeg',
      });
      setResult(data);
    } catch (e: any) {
      const errorMessage = e.message || 'Failed to process cheque';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImageUri(null);
    setResult(null);
    setError(null);
    setShowRawOcr(false);
    setShowDigitsRoi(false);
  };

  const getStatusConfig = () => {
    const status = result?.verification_status ?? 'UNVERIFIED';
    const configs = {
      MATCH: {
        bg: '#d4edda',
        textColor: '#155724',
        borderColor: '#c3e6cb',
        label: '✔ Amounts Match',
        hint: 'Digits and words agree — cheque is valid.',
      },
      MISMATCH: {
        bg: '#f8d7da',
        textColor: '#721c24',
        borderColor: '#f5c6cb',
        label: '✖ Amount Mismatch',
        hint: 'Digits and words do not match — cheque should be rejected.',
      },
      UNVERIFIED: {
        bg: '#fff3cd',
        textColor: '#856404',
        borderColor: '#ffeaa7',
        label: '⚠ Verification Required',
        hint: 'OCR confidence insufficient (handwriting / noise). Manual or ML review required.',
      },
    };
    return configs[status];
  };

  const statusConfig = result ? getStatusConfig() : null;

  return (
    <ThemedView style={styles.container}>
      <Header onMenuPress={openDrawer} />
      <Drawer
        visible={drawerVisible}
        onClose={closeDrawer}
        onThemeToggle={toggleTheme}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.section}>
          <ThemedText style={styles.title}>Cheque Amount Extractor</ThemedText>
          <ThemedText style={[styles.subtitle, { opacity: 0.7 }]}>
            Rule-based OCR with ML fallback (YOLOv8-nano)
          </ThemedText>
        </View>

        {/* Image Preview */}
        {imageUri && (
          <View style={styles.section}>
            <View
              style={[
                styles.imageContainer,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                },
              ]}
            >
              <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
            </View>
          </View>
        )}

        {/* Upload Buttons */}
        <View style={styles.section}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonHalf,
                { backgroundColor: colors.primary },
              ]}
              onPress={pickImage}
              disabled={loading}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.buttonText}>📁 Choose File</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonHalf,
                { backgroundColor: colors.primary },
              ]}
              onPress={takePhoto}
              disabled={loading}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.buttonText}>📷 Take Photo</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          {imageUri && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.buttonExpanded,
                  {
                    backgroundColor: loading ? colors.border : '#34C759',
                  },
                ]}
                onPress={submit}
                disabled={loading || !imageUri}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <ThemedText style={styles.buttonText}>Extract Amount</ThemedText>
                )}
              </TouchableOpacity>

              {!loading && (
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.buttonSecondary,
                    { borderColor: colors.primary },
                  ]}
                  onPress={reset}
                  activeOpacity={0.7}
                >
                  <ThemedText style={[styles.buttonTextSecondary, { color: colors.primary }]}>
                    Reset
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.section}>
            <View style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>❌ {error}</ThemedText>
            </View>
          </View>
        )}

        {/* Results Section */}
        {result && (
          <View style={styles.section}>
            {/* Results Card */}
            <View
              style={[
                styles.resultCard,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.resultRow}>
                <ThemedText style={styles.resultLabel}>Amount (Digits):</ThemedText>
                <ThemedText style={styles.resultValue}>
                  {result.amount_digits ?? 'Not detected'}
                </ThemedText>
              </View>

              <View style={[styles.resultRow, { borderTopColor: colors.border }]}>
                <ThemedText style={styles.resultLabel}>Amount (Words):</ThemedText>
                <ThemedText style={styles.resultValue}>
                  {result.amount_words ?? 'Not detected'}
                </ThemedText>
              </View>

              <View style={[styles.resultRow, { borderTopColor: colors.border }]}>
                <ThemedText style={styles.resultLabel}>Digits → Number:</ThemedText>
                <ThemedText style={[styles.resultValue, styles.resultValueBold]}>
                  {result.digits_value ?? '—'}
                </ThemedText>
              </View>

              <View style={[styles.resultRow, { borderTopColor: colors.border }]}>
                <ThemedText style={styles.resultLabel}>Words → Number:</ThemedText>
                <ThemedText style={[styles.resultValue, styles.resultValueBold]}>
                  {result.words_value ?? '—'}
                </ThemedText>
              </View>
            </View>

            {/* Status Card */}
            {statusConfig && (
              <View
                style={[
                  styles.statusContainer,
                  {
                    backgroundColor: statusConfig.bg,
                    borderColor: statusConfig.borderColor,
                  },
                ]}
              >
                <ThemedText style={[styles.statusLabel, { color: statusConfig.textColor }]}>
                  Status: {statusConfig.label}
                </ThemedText>
                <ThemedText style={[styles.statusHint, { color: statusConfig.textColor }]}>
                  {statusConfig.hint}
                </ThemedText>

                {result.used_yolo_fallback && (
                  <View style={styles.fallbackContainer}>
                    <ThemedText style={[styles.fallbackText, { color: statusConfig.textColor }]}>
                      🔍 ML fallback activated to re-locate handwritten amount text
                    </ThemedText>
                  </View>
                )}
              </View>
            )}

            {/* Collapsible Sections */}
            <TouchableOpacity
              style={[
                styles.collapsible,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setShowRawOcr(!showRawOcr)}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.collapsibleTitle}>
                {showRawOcr ? '▼' : '▶'} Raw OCR Output (Full Cheque)
              </ThemedText>
            </TouchableOpacity>
            {showRawOcr && result.raw_ocr_text && (
              <View
                style={[
                  styles.collapsibleContent,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <ThemedText style={styles.preText}>{result.raw_ocr_text}</ThemedText>
                </ScrollView>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.collapsible,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setShowDigitsRoi(!showDigitsRoi)}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.collapsibleTitle}>
                {showDigitsRoi ? '▼' : '▶'} Digits ROI OCR
              </ThemedText>
            </TouchableOpacity>
            {showDigitsRoi && result.digits_roi_ocr && (
              <View
                style={[
                  styles.collapsibleContent,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <ThemedText style={styles.preText}>{result.digits_roi_ocr}</ThemedText>
                </ScrollView>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  imageContainer: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  buttonHalf: {
    flex: 1,
  },
  buttonExpanded: {
    flex: 2,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    flex: 1,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    padding: 14,
    backgroundColor: '#f8d7da',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  errorText: {
    color: '#721c24',
    fontSize: 14,
    fontWeight: '500',
  },
  resultCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  resultLabel: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  resultValue: {
    fontSize: 15,
    flex: 1,
    textAlign: 'right',
  },
  resultValueBold: {
    fontWeight: '700',
    fontSize: 16,
  },
  statusContainer: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  statusHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  fallbackContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  fallbackText: {
    fontSize: 13,
    fontWeight: '500',
  },
  collapsible: {
    marginTop: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  collapsibleTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  collapsibleContent: {
    marginTop: 8,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  preText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
});