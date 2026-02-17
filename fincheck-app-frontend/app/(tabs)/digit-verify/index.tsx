import React, { useRef, useState } from 'react';
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
import { verifyTypedText as verifyTypedTextApi } from '@/lib/api';
import ViewShot from 'react-native-view-shot';

type Verdict = 'VALID_TYPED_TEXT' | 'INVALID_OR_AMBIGUOUS' | null;

interface CharacterError {
  position: number;
  typed_char: string;
  ocr_char: string;
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

  const viewShotRef = useRef<{ capture: () => Promise<string> } | null>(null);

  const openDrawer = () => setDrawerVisible(true);
  const closeDrawer = () => setDrawerVisible(false);

  /* ================= VERIFY TYPED TEXT ================= */
async function handleVerifyTypedText() {
  if (!typedText.trim()) {
    Alert.alert('Error', 'Please enter text to verify');
    return;
  }

  setLoading(true);
  setResult(null);

  try {
    if (!viewShotRef.current) {
      throw new Error('ViewShot not ready');
    }

    const uri = await viewShotRef.current.capture();

    const data = await verifyTypedTextApi({
      image: {
        uri,
        name: 'typed-text.png',
        type: 'image/png',
      },
      rawText: typedText,
    });

    setResult({
      verdict: data.verdict,
      final_output: data.final_output,
      character_errors: data.errors,
      explanation: data.why,
    });
  } catch (err: any) {
    Alert.alert('Error', err.message ?? 'Verification failed');
  } finally {
    setLoading(false);
  }
}


  /* ================= VERDICT COLOR ================= */
  function getVerdictColor(verdict?: Verdict) {
    if (!verdict) return colors.text;
    if (verdict === 'VALID_TYPED_TEXT') return '#16a34a';
    return '#dc2626';
  }

  return (
    <ThemedView style={styles.container}>
      <Header onMenuPress={openDrawer} />
      <Drawer
        visible={drawerVisible}
        onClose={closeDrawer}
        onThemeToggle={toggleTheme}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <ThemedText style={styles.title}>
            Banking OCR – Character Error Detection
          </ThemedText>
        </View>

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

        <TouchableOpacity
          style={[
            styles.verifyButton,
            {
              backgroundColor: loading || !typedText ? colors.border : '#1f2937',
            },
          ]}
          onPress={handleVerifyTypedText}
          disabled={!typedText || loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <ThemedText style={styles.verifyButtonText}>
              Verify Typed Text
            </ThemedText>
          )}
        </TouchableOpacity>

        {result && (
          <View style={styles.resultContainer}>
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

              {result.character_errors?.length ? (
                <View style={styles.errorBox}>
                  <ThemedText style={styles.errorTitle}>
                    Character Errors Detected
                  </ThemedText>

                  {result.character_errors.map((e, i) => (
                    <ThemedText key={i} style={styles.errorText}>
                      • Position {e.position}: typed &quot;{e.typed_char}&quot; → OCR &quot;{e.ocr_char}&quot;
                    </ThemedText>
                  ))}
                </View>
              ) : null}

              {result.explanation && (
                <View style={styles.explanationBox}>
                  <ThemedText style={styles.explanationLabel}>
                    Explanation:
                  </ThemedText>
                  <ThemedText style={styles.explanationText}>
                    {result.explanation}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        )}

        <ViewShot
          ref={(ref) => {
            if (ref) {
              viewShotRef.current = ref as unknown as {
                capture: () => Promise<string>;
              };
            }
          }}
          options={{ format: 'png', quality: 1 }}
          style={styles.hidden}
        >
          <View style={styles.captureBox}>
            <ThemedText style={styles.captureText}>
              {typedText}
            </ThemedText>
          </View>
        </ViewShot>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  section: { marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '700', lineHeight: 32 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
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
    minHeight: 52,
    marginBottom: 24,
  },
  verifyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  resultContainer: { gap: 16 },
  resultCard: { borderRadius: 12, borderWidth: 1, padding: 20 },
  resultRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  boldText: { fontSize: 16, fontWeight: '700' },
  verdictText: { fontSize: 16, fontWeight: '600' },
  regularText: { fontSize: 16 },
  errorBox: { marginTop: 8 },
  errorTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  errorText: { fontSize: 14, lineHeight: 20 },
  explanationBox: { marginTop: 16 },
  explanationLabel: { fontSize: 14, fontWeight: '600' },
  explanationText: { fontSize: 14, lineHeight: 20 },
  hidden: { position: 'absolute', left: -9999 },
  captureBox: { backgroundColor: '#fff', padding: 16 },
  captureText: { fontSize: 28, fontWeight: '600', color: '#000' },
});
