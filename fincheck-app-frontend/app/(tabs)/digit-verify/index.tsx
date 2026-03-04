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

  type ViewShotHandle = {
    capture: () => Promise<string>;
  };

  const viewShotRef = useRef<ViewShotHandle | null>(null);

  const openDrawer = () => setDrawerVisible(true);
  const closeDrawer = () => setDrawerVisible(false);

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

      // Give the ViewShot time to fully render the updated text
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => setTimeout(r, 100));

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
            Text Based OCR
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

        {/*
          ── Hidden ViewShot capture area ──────────────────────────────
          Rendered off-screen at 3× pixel ratio with:
          • Pure white background (#ffffff) for maximum contrast
          • Black text (#000000) — no theming, always high contrast
          • Large font (96px) so each character is tall and unambiguous
          • Courier New / monospace so every character has equal width
            and visually distinct forms (0 vs O, 1 vs l vs I, etc.)
          • Wide letter-spacing so characters never touch or merge
          • Each character in its own box for clean per-char segmentation
        */}
        <View pointerEvents="none" style={styles.captureWrapper}>
          <ViewShot
            ref={(ref) => {
              if (ref) {
                viewShotRef.current = ref as unknown as ViewShotHandle;
              }
            }}
            options={{
              format: 'png',
              quality: 1,
              result: 'tmpfile',
            }}
          >
            <View style={styles.captureBox}>
              <View style={styles.captureCharsRow}>
                {typedText.split('').map((char, i) => (
                  <View key={i} style={styles.captureCharCell}>
                    <ThemedText style={styles.captureChar}>{char}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          </ViewShot>
        </View>
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

  // ── Hidden capture area ─────────────────────────────────
  captureWrapper: {
    position: 'absolute',
    top: -99999,
    left: -99999,
    opacity: 0,
  },
  captureBox: {
    backgroundColor: '#ffffff',
    paddingVertical: 60,
    paddingHorizontal: 48,
    // Very wide canvas — characters never wrap
    width: 2400,
    minHeight: 400,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  captureCharsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  captureCharCell: {
    // Wide fixed cell per character — no crowding or touching
    width: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureChar: {
    // Very large font so strokes are thick and unambiguous
    fontSize: 160,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Courier New',
    lineHeight: 200,
    textTransform: 'none',
    includeFontPadding: false,
  },
});