import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedText } from '@/components/ui/ThemedText';
import { Header } from '@/components/layout/Header';
import { Drawer } from '@/components/layout/Drawer';
import Slider from '@/components/ui/Slider';
import { useTheme } from '@/hooks/useTheme';
import { verifyDigitOnly } from '@/lib/api';

type Verdict = 'VALID' | 'INVALID' | 'AMBIGUOUS' | null;
type DigitStatus = 'VALID' | 'AMBIGUOUS' | 'INVALID';

interface DigitAnalysis {
  position: number;
  status: DigitStatus;
  confidence: number;
  possible_values?: string[];
}

interface VerificationResult {
  verdict: Verdict;
  digits: string;
  preview?: {
    original: string;
    cropped: string;
    normalized: string;
  };
  analysis?: DigitAnalysis[];
}

export default function DigitVerifyScreen() {
  const { colors, toggleTheme } = useTheme();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const [file, setFile] = useState<any>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [threshold, setThreshold] = useState(70);

  const openDrawer = () => setDrawerVisible(true);
  const closeDrawer = () => setDrawerVisible(false);

  /* ================= STATUS COLOR ================= */
  function getStatusColor(status?: DigitStatus) {
    if (!status) return colors.text;
    if (status === 'VALID') return '#16a34a'; // green-600
    if (status === 'AMBIGUOUS') return '#ca8a04'; // yellow-600
    return '#dc2626'; // red-600
  }

  /* ================= VERDICT COLOR ================= */
  function getVerdictColor(verdict?: Verdict) {
    if (!verdict) return colors.text;
    if (verdict === 'VALID') return '#16a34a'; // green-600
    if (verdict === 'AMBIGUOUS') return '#ca8a04'; // yellow-600
    return '#dc2626'; // red-600
  }

  /* ================= CONFIDENCE COLOR ================= */
  function getConfidenceColor(conf?: number) {
    if (conf === undefined) return colors.text;
    
    if (conf >= threshold + 5) return '#166534'; // green-800
    if (conf >= threshold) return '#16a34a'; // green-600
    if (conf >= threshold - 5) return '#ca8a04'; // yellow-600
    return '#dc2626'; // red-600
  }

  function getConfidenceWeight(conf?: number) {
    if (conf === undefined) return 'normal';
    if (conf >= threshold + 5) return '700';
    return '400';
  }

  /* ================= IMAGE PICKER ================= */
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setFile(result.assets[0]);
      setResult(null);
    }
  };

  async function verify() {
    if (!file) {
      Alert.alert('Error', 'Please upload an image');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const data = await verifyDigitOnly({
        image: {
          uri: file.uri,
          name: 'cheque_digit.jpg',
          type: 'image/jpeg',
        },
        confidenceThreshold: threshold / 100,
      });

      setResult(data);
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.message ?? 'Verification failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  /* ================= IMAGE HELPER ================= */
  function getBase64Image(b64?: string) {
    if (!b64) return '';
    return `data:image/png;base64,${b64}`;
  }

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
        {/* Title */}
        <View style={styles.section}>
          <ThemedText style={styles.title}>Cheque Digit Validation</ThemedText>
        </View>

        {/* Upload Section */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Upload Image</ThemedText>
          <TouchableOpacity
            style={[
              styles.uploadBox,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
            onPress={pickImage}
            activeOpacity={0.7}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
            ) : (
              <ThemedText style={styles.uploadText}>
                Tap to Upload Cheque Image
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>

        {/* Confidence Threshold Slider */}
        <View
          style={[
            styles.thresholdSection,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
        >
          <ThemedText style={styles.sectionTitle}>
            Minimum Confidence to Accept
          </ThemedText>

          <Slider
            label="Confidence Threshold"
            value={threshold}
            setValue={setThreshold}
            min={50}
            max={100}
            step={1}
          />

          <ThemedText style={[styles.helperText, { opacity: 0.6 }]}>
            {threshold}% Threshold
          </ThemedText>

          <ThemedText style={[styles.helperTextSmall, { opacity: 0.5 }]}>
            Ambiguous zone: {threshold - 5}% – {threshold}%
          </ThemedText>
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[
            styles.verifyButton,
            {
              backgroundColor: loading || !file ? colors.border : '#1f2937',
            },
          ]}
          onPress={verify}
          disabled={!file || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <ThemedText style={styles.verifyButtonText}>
              Verify Image
            </ThemedText>
          )}
        </TouchableOpacity>

        {/* ================= RESULT ================= */}
        {result && (
          <View style={styles.resultContainer}>
            {/* Main Verdict */}
            <View
              style={[
                styles.verdictCard,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.verdictRow}>
                <ThemedText style={styles.boldText}>Verdict:</ThemedText>
                <ThemedText
                  style={[
                    styles.verdictText,
                    { color: getVerdictColor(result.verdict) },
                  ]}
                >
                  {result.verdict}
                </ThemedText>
              </View>

              <View style={styles.verdictRow}>
                <ThemedText style={styles.boldText}>Digits:</ThemedText>
                <ThemedText style={styles.regularText}>
                  {result.digits || '???'}
                </ThemedText>
              </View>
            </View>

            {/* Image Previews */}
            {result.preview && (
              <View style={styles.previewSection}>
                <ThemedText style={styles.sectionTitle}>
                  Processing Steps
                </ThemedText>

                <View style={styles.previewGrid}>
                  <View
                    style={[
                      styles.previewCard,
                      {
                        backgroundColor: colors.cardBackground,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <ThemedText style={styles.previewLabel}>Original</ThemedText>
                    <Image
                      source={{ uri: getBase64Image(result.preview.original) }}
                      style={styles.previewImage}
                      resizeMode="contain"
                    />
                  </View>

                  <View
                    style={[
                      styles.previewCard,
                      {
                        backgroundColor: colors.cardBackground,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <ThemedText style={styles.previewLabel}>Cropped</ThemedText>
                    <Image
                      source={{ uri: getBase64Image(result.preview.cropped) }}
                      style={styles.previewImage}
                      resizeMode="contain"
                    />
                  </View>

                  <View
                    style={[
                      styles.previewCard,
                      {
                        backgroundColor: colors.cardBackground,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <ThemedText style={styles.previewLabel}>
                      Normalized 28×28
                    </ThemedText>
                    <Image
                      source={{ uri: getBase64Image(result.preview.normalized) }}
                      style={styles.previewImage}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Per-Digit Analysis */}
            {result.analysis && result.analysis.length > 0 && (
              <View style={styles.analysisSection}>
                <ThemedText style={styles.sectionTitle}>
                  Digit Analysis
                </ThemedText>

                {result.analysis.map((item) => (
                  <View
                    key={item.position}
                    style={[
                      styles.digitCard,
                      {
                        backgroundColor: colors.cardBackground,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <ThemedText style={styles.digitPosition}>
                      Position {item.position}
                    </ThemedText>

                    <View style={styles.digitInfo}>
                      <ThemedText
                        style={[
                          styles.digitStatus,
                          { color: getStatusColor(item.status) },
                        ]}
                      >
                        Status: {item.status}
                      </ThemedText>

                      <ThemedText
                        style={[
                          styles.digitConfidence,
                          {
                            color: getConfidenceColor(item.confidence),
                            fontWeight: getConfidenceWeight(item.confidence) as any,
                          },
                        ]}
                      >
                        Confidence: {item.confidence}%
                      </ThemedText>

                      {item.possible_values && item.possible_values.length > 0 && (
                        <ThemedText style={[styles.possibleValues, { opacity: 0.7 }]}>
                          Possible: {item.possible_values.join(', ')}
                        </ThemedText>
                      )}
                    </View>
                  </View>
                ))}
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  uploadBox: {
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  uploadText: {
    fontSize: 16,
    opacity: 0.6,
  },
  uploadedImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  thresholdSection: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  helperText: {
    fontSize: 14,
    marginTop: 8,
  },
  helperTextSmall: {
    fontSize: 12,
    marginTop: 4,
  },
  verifyButton: {
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginBottom: 24,
  },
  verifyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    gap: 24,
  },
  verdictCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
  },
  verdictRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  boldText: {
    fontSize: 16,
    fontWeight: '700',
  },
  verdictText: {
    fontSize: 16,
    fontWeight: '600',
  },
  regularText: {
    fontSize: 16,
  },
  previewSection: {
    marginTop: 16,
  },
  previewGrid: {
    gap: 16,
  },
  previewCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: 150,
  },
  analysisSection: {
    marginTop: 16,
  },
  digitCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  digitPosition: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  digitInfo: {
    gap: 4,
  },
  digitStatus: {
    fontSize: 14,
  },
  digitConfidence: {
    fontSize: 14,
  },
  possibleValues: {
    fontSize: 13,
    marginTop: 4,
  },
});