import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedText } from '@/components/ui/ThemedText';
import { Header } from '@/components/layout/Header';
import { Drawer } from '@/components/layout/Drawer';
import { useTheme } from '@/hooks/useTheme';

type Verdict = 'VALID_TYPED_TEXT' | 'INVALID_OR_AMBIGUOUS' | null;

interface CharacterError {
  position: number;
  typed: string;
  interpreted: string;
}

interface OCRVerificationResult {
  verdict: Verdict;
  final_output: string;
  character_errors?: CharacterError[];
  explanation?: string;
}

export default function BankingDemoScreen() {
  const { colors, toggleTheme } = useTheme();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const [typedText, setTypedText] = useState('');
  const [result, setResult] = useState<OCRVerificationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const openDrawer = () => setDrawerVisible(true);
  const closeDrawer = () => setDrawerVisible(false);

  /* ================= VERIFY TYPED TEXT ================= */
  async function verifyTypedText() {
    if (!typedText.trim()) {
      Alert.alert('Error', 'Please enter text to verify');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/verify-typed-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          typed_text: typedText,
        }),
      });

      if (!response.ok) {
        throw new Error('Verification failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      Alert.alert('Error', 'Verification failed. Please try again.');
      console.error('Verification error:', error);
    } finally {
      setLoading(false);
    }
  }

  /* ================= VERDICT COLOR ================= */
  function getVerdictColor(verdict?: Verdict) {
    if (!verdict) return colors.text;
    if (verdict === 'VALID_TYPED_TEXT') return '#16a34a'; // green-600
    return '#dc2626'; // red-600
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
          <ThemedText style={styles.title}>
            Banking OCR – Character Error Detection
          </ThemedText>
        </View>

        {/* Input Section */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Enter Text to Verify</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={typedText}
            onChangeText={setTypedText}
            placeholder="e.g., 703, 713"
            placeholderTextColor={colors.text + '80'}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[
            styles.verifyButton,
            {
              backgroundColor: loading || !typedText ? colors.border : '#1f2937',
            },
          ]}
          onPress={verifyTypedText}
          disabled={!typedText || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <ThemedText style={styles.verifyButtonText}>
              Verify Typed Text
            </ThemedText>
          )}
        </TouchableOpacity>

        {/* ================= RESULT ================= */}
        {result && (
          <View style={styles.resultContainer}>
            {/* Main Result Card */}
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
                <ThemedText style={styles.boldText}>Verdict:</ThemedText>
                <ThemedText
                  style={[
                    styles.verdictText,
                    { color: getVerdictColor(result.verdict) },
                  ]}
                >
                  {result.verdict?.replace(/_/g, ' ')}
                </ThemedText>
              </View>

              <View style={styles.resultRow}>
                <ThemedText style={styles.boldText}>Final Output:</ThemedText>
                <ThemedText style={styles.regularText}>
                  {result.final_output}
                </ThemedText>
              </View>

              {/* Character Errors */}
              {result.character_errors && result.character_errors.length > 0 && (
                <View
                  style={[
                    styles.errorBox,
                    {
                      backgroundColor: '#fef2f2',
                      borderColor: '#fecaca',
                    },
                  ]}
                >
                  <ThemedText style={[styles.errorTitle, { color: '#dc2626' }]}>
                    Character Errors Detected
                  </ThemedText>

                  {result.character_errors.map((error, index) => (
                    <View key={index} style={styles.errorItem}>
                      <ThemedText style={[styles.errorText, { color: '#991b1b' }]}>
                        • Position {error.position}: typed{' '}
                        <ThemedText style={styles.errorHighlight}>
                          {error.typed}
                        </ThemedText>
                        , interpreted as{' '}
                        <ThemedText style={styles.errorHighlight}>
                          {error.interpreted}
                        </ThemedText>
                      </ThemedText>
                    </View>
                  ))}
                </View>
              )}

              {/* Explanation */}
              {result.explanation && (
                <View style={styles.explanationBox}>
                  <ThemedText style={styles.explanationLabel}>
                    Explanation:
                  </ThemedText>
                  <ThemedText style={[styles.explanationText, { opacity: 0.8 }]}>
                    {result.explanation}
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Info Message */}
            <View
              style={[
                styles.infoBox,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                },
              ]}
            >
              <ThemedText style={[styles.infoText, { opacity: 0.7 }]}>
                This tool simulates OCR character recognition and detects common
                character confusion errors (e.g., &apos;o&apos; vs &apos;0&apos;, &apos;1&apos; vs &apos;l&apos;).
              </ThemedText>
            </View>
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
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
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
    gap: 16,
  },
  resultCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
  },
  resultRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
    flexWrap: 'wrap',
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
  errorBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  errorItem: {
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorHighlight: {
    fontWeight: '700',
  },
  explanationBox: {
    marginTop: 16,
  },
  explanationLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
  },
});