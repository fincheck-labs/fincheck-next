import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle, Line, Rect, G, Defs, ClipPath } from 'react-native-svg';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedText } from '@/components/ui/ThemedText';
import { Header } from '@/components/layout/Header';
import { Drawer } from '@/components/layout/Drawer';
import EvaluationModeSelector from '@/components/ui/EvaluationModeSelector';
import Dropdown from '@/components/ui/Dropdown';
import Slider from '@/components/ui/Slider';
import { useTheme } from '@/hooks/useTheme';
import { PREBUILT_DATASETS } from '@/lib/dataset';
import { runSingleInference, runDatasetEvaluation } from '@/lib/api';

type Mode = 'SINGLE' | 'DATASET';

/* ─────────────────────────────────────────────
   ICON SYSTEM — all sourced from the same
   24×24 stroke-based design language (Lucide).
   Stroke: white, width: 2, linecap/join: round
───────────────────────────────────────────── */
const ICON_SIZE = 16;
const ICON_STROKE = '#ffffff';
const ICON_SW = 2;

function IconBlur({ size = ICON_SIZE }: { size?: number }) {
  // Layers / blur symbol — concentric softening circles
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={ICON_STROKE} strokeWidth={ICON_SW} />
      <Circle cx="12" cy="12" r="6" stroke={ICON_STROKE} strokeWidth={ICON_SW} strokeOpacity={0.6} strokeDasharray="2 2" />
      <Circle cx="12" cy="12" r="9.5" stroke={ICON_STROKE} strokeWidth={ICON_SW} strokeOpacity={0.3} strokeDasharray="2 3" />
    </Svg>
  );
}

function IconRotate({ size = ICON_SIZE }: { size?: number }) {
  // Rotate-CW arrow (Lucide RotateCw)
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 2v6h-6"
        stroke={ICON_STROKE}
        strokeWidth={ICON_SW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 13a9 9 0 1 1-3-7.7L21 8"
        stroke={ICON_STROKE}
        strokeWidth={ICON_SW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconNoise({ size = ICON_SIZE }: { size?: number }) {
  // Static/noise — scattered dots on a grid
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 3×3 dot grid with irregular opacity */}
      <Circle cx="5"  cy="5"  r="1.5" fill={ICON_STROKE} fillOpacity={0.9} />
      <Circle cx="12" cy="4"  r="1.5" fill={ICON_STROKE} fillOpacity={0.4} />
      <Circle cx="19" cy="6"  r="1.5" fill={ICON_STROKE} fillOpacity={0.8} />
      <Circle cx="4"  cy="12" r="1.5" fill={ICON_STROKE} fillOpacity={0.5} />
      <Circle cx="12" cy="12" r="1.5" fill={ICON_STROKE} fillOpacity={1.0} />
      <Circle cx="20" cy="12" r="1.5" fill={ICON_STROKE} fillOpacity={0.3} />
      <Circle cx="6"  cy="19" r="1.5" fill={ICON_STROKE} fillOpacity={0.7} />
      <Circle cx="13" cy="20" r="1.5" fill={ICON_STROKE} fillOpacity={0.4} />
      <Circle cx="19" cy="18" r="1.5" fill={ICON_STROKE} fillOpacity={0.9} />
    </Svg>
  );
}

function IconErase({ size = ICON_SIZE }: { size?: number }) {
  // Eraser (Lucide Eraser)
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"
        stroke={ICON_STROKE}
        strokeWidth={ICON_SW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22 21H7"
        stroke={ICON_STROKE}
        strokeWidth={ICON_SW}
        strokeLinecap="round"
      />
      <Path
        d="m11 6 5 5"
        stroke={ICON_STROKE}
        strokeWidth={ICON_SW}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IconUpload({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
        stroke="#94a3b8"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="m17 8-5-5-5 5"
        stroke="#94a3b8"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 3v12"
        stroke="#94a3b8"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/* ─────────────────────────────────────────────
   EFFECT BADGE — uniform pill with SVG icon
───────────────────────────────────────────── */
type BadgeVariant = 'blur' | 'rotate' | 'noise' | 'erase';

const BADGE_CONFIG: Record<
  BadgeVariant,
  { bg: string; border: string; label: string }
> = {
  blur:   { bg: '#3730a3', border: '#6366f1', label: 'Blur' },
  rotate: { bg: '#065f46', border: '#10b981', label: 'Rotate' },
  noise:  { bg: '#92400e', border: '#f59e0b', label: 'Noise' },
  erase:  { bg: '#7f1d1d', border: '#ef4444', label: 'Erase' },
};

function EffectBadge({
  variant,
  value,
}: {
  variant: BadgeVariant;
  value: string;
}) {
  const cfg = BADGE_CONFIG[variant];
  const Icon =
    variant === 'blur'   ? IconBlur   :
    variant === 'rotate' ? IconRotate :
    variant === 'noise'  ? IconNoise  :
                           IconErase;

  return (
    <View
      style={[
        badgeStyles.pill,
        { backgroundColor: cfg.bg, borderColor: cfg.border },
      ]}
    >
      <Icon size={14} />
      <ThemedText style={badgeStyles.label}>{cfg.label}</ThemedText>
      <View style={badgeStyles.divider} />
      <ThemedText style={badgeStyles.value}>{value}</ThemedText>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  value: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
    minWidth: 32,
    textAlign: 'right',
  },
});

/* ─────────────────────────────────────────────
   MAIN SCREEN
───────────────────────────────────────────── */
export default function UploadScreen() {
  const router = useRouter();
  const { colors, toggleTheme } = useTheme();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const [mode, setMode] = useState<Mode>('SINGLE');
  const [selectedDataset, setSelectedDataset] = useState<string>('MNIST_100');
  const [selectedDigit, setSelectedDigit] = useState<number>(0);

  const [file, setFile] = useState<any>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [blur, setBlur] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [noise, setNoise] = useState(0);
  const [erase, setErase] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openDrawer = () => setDrawerVisible(true);
  const closeDrawer = () => setDrawerVisible(false);

  const { width: screenWidth } = Dimensions.get('window');
  const PREVIEW_SIZE = Math.min(screenWidth * 0.8, 300);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setFile(result.assets[0]);
      setError(null);
    }
  };

  const pickZipFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/zip' });
      if (!result.canceled && result.assets[0]) {
        setFile(result.assets[0]);
        setError(null);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const runInference = async () => {
    setLoading(true);
    setError(null);
    try {
      if (mode === 'SINGLE') {
        if (!imageUri) { setError('Please upload an image'); setLoading(false); return; }
        const res = await runSingleInference({
          image: { uri: imageUri, name: 'digit.png', type: 'image/png' },
          expectedDigit: selectedDigit,
          blur, rotation, noise, erase,
        });
        router.push(`/results/${res.id}`);
        return;
      }
      if (mode === 'DATASET') {
        const res = await runDatasetEvaluation({
          datasetName: selectedDataset,
          blur, rotation, noise, erase,
        });
        router.push(`/results/${res.id}`);
        return;
      }
    } catch (err: any) {
      setError(err?.message ?? 'Inference failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const digitItems = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => ({
    label: String(d),
    value: d,
  }));
  const datasetItems = PREBUILT_DATASETS.map((d) => ({ label: d.label, value: d.id }));

  // Which badges are active
  const activeBadges: { variant: BadgeVariant; value: string }[] = [];
  if (blur > 0)              activeBadges.push({ variant: 'blur',   value: `${blur.toFixed(1)}px` });
  if (Math.abs(rotation) > 1) activeBadges.push({ variant: 'rotate', value: `${rotation > 0 ? '+' : ''}${rotation}°` });
  if (noise > 0)             activeBadges.push({ variant: 'noise',  value: noise.toFixed(2) });
  if (erase > 0)             activeBadges.push({ variant: 'erase',  value: `${Math.round(erase * 100)}%` });

  return (
    <ThemedView style={styles.container}>
      <Header onMenuPress={openDrawer} />
      <Drawer visible={drawerVisible} onClose={closeDrawer} onThemeToggle={toggleTheme} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Title */}
        <View style={styles.section}>
          <ThemedText style={styles.title}>Robustness Testing</ThemedText>
          <ThemedText style={styles.subtitle}>
            Real-time stress preview for single images and dataset samples
          </ThemedText>
        </View>

        {/* Mode Selector */}
        <View style={styles.section}>
          <EvaluationModeSelector mode={mode} setMode={setMode} />
        </View>

        {/* ── SINGLE MODE ── */}
        {mode === 'SINGLE' && (
          <View style={styles.section}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Expected Digit</ThemedText>
              <Dropdown
                value={selectedDigit}
                items={digitItems}
                onValueChange={(v) => setSelectedDigit(v as number)}
                placeholder="Select digit"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Live Stress Preview</ThemedText>

              <TouchableOpacity style={styles.imageContainer} onPress={pickImage} activeOpacity={0.9}>
                {imageUri ? (
                  <>
                    <Image
                      source={{ uri: imageUri }}
                      style={[
                        styles.stressImage,
                        {
                          width: PREVIEW_SIZE,
                          height: PREVIEW_SIZE,
                          opacity: Math.max(0.05, 1 - blur * 0.05),
                          transform: [{ rotate: `${rotation}deg` }],
                        },
                      ]}
                    />
                    {noise > 0 && (
                      <View
                        style={[
                          StyleSheet.absoluteFillObject,
                          {
                            borderRadius: 18,
                            backgroundColor: `rgba(100,100,100,${noise * 0.6})`,
                          },
                        ]}
                      />
                    )}
                    {erase > 0 && (
                      <View
                        style={{
                          position: 'absolute',
                          bottom: -2,
                          right: -2,
                          width: PREVIEW_SIZE * erase,
                          height: PREVIEW_SIZE * erase,
                          backgroundColor: 'black',
                          borderRadius: 16,
                        }}
                      />
                    )}
                  </>
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <IconUpload size={40} />
                    <ThemedText style={styles.uploadText}>Tap to upload image</ThemedText>
                  </View>
                )}
              </TouchableOpacity>

              {/* ── EFFECT BADGES ── */}
              {imageUri && activeBadges.length > 0 && (
                <View style={styles.badgeRow}>
                  {activeBadges.map((b) => (
                    <EffectBadge key={b.variant} variant={b.variant} value={b.value} />
                  ))}
                </View>
              )}

              {/* No-effect state hint */}
              {imageUri && activeBadges.length === 0 && (
                <ThemedText style={styles.noEffectHint}>
                  Adjust sliders below to apply stress effects
                </ThemedText>
              )}
            </View>
          </View>
        )}

        {/* ── DATASET MODE ── */}
        {mode === 'DATASET' && (
          <View style={styles.section}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Select Dataset</ThemedText>
              <Dropdown
                value={selectedDataset}
                items={datasetItems}
                onValueChange={(v) => setSelectedDataset(v as string)}
                placeholder="Select dataset"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Dataset Preview (6×6 Sample)</ThemedText>
              <View style={styles.datasetGrid}>
                {Array.from({ length: 36 }).map((_, i) => {
                  const digit = i % 10;
                  const randRot = (Math.random() - 0.5) * rotation * 0.8;
                  return (
                    <View
                      key={i}
                      style={[
                        styles.gridCell,
                        {
                          opacity: Math.max(0.2, 1 - blur * 0.03),
                          transform: [{ rotate: `${randRot}deg` }],
                          backgroundColor: noise > 0
                            ? `rgba(30,64,175,${0.9 - noise * 0.3})`
                            : '#1e40af',
                        },
                      ]}
                    >
                      <ThemedText style={styles.digitText}>{digit}</ThemedText>

                      {/* Per-cell erase — bottom-right black square, clipped by cell border-radius */}
                      {erase > 0 && (
                        <View
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: 44 * erase,
                            height: 44 * erase,
                            backgroundColor: '#000000',
                          }}
                        />
                      )}
                    </View>
                  );
                })}
              </View>

              {/* ── EFFECT BADGES ── */}
              {activeBadges.length > 0 && (
                <View style={styles.badgeRow}>
                  {activeBadges.map((b) => (
                    <EffectBadge key={b.variant} variant={b.variant} value={b.value} />
                  ))}
                </View>
              )}

              {/* No-effect state hint */}
              {activeBadges.length === 0 && (
                <ThemedText style={styles.noEffectHint}>
                  Adjust sliders below to apply stress effects
                </ThemedText>
              )}
            </View>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        )}

        {/* Stress Controls */}
        <View style={[styles.stressSection, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Robustness Controls</ThemedText>
          </View>
          <Slider label="Blur (px)"    value={blur}     setValue={setBlur}     min={0}   max={15}  step={0.5}  info="0–15px Gaussian blur" />
          <Slider label="Rotation (°)" value={rotation} setValue={setRotation} min={-30} max={30}  step={1}    info="±30° rotation" />
          <Slider label="Noise"        value={noise}    setValue={setNoise}    min={0}   max={1.5} step={0.05} info="0–1.5 intensity Gaussian noise" />
          <Slider label="Erase (%)"    value={erase}    setValue={setErase}    min={0}   max={0.6} step={0.05} info="0–60% bottom-right corner erase" />
        </View>

        {/* Run Button */}
        <TouchableOpacity
          style={[styles.runButton, { backgroundColor: loading ? colors.border : colors.primary }]}
          onPress={runInference}
          disabled={loading || (mode === 'SINGLE' && !imageUri)}
          activeOpacity={0.8}
        >
          {loading ? (
            <>
              <ActivityIndicator color="#ffffff" style={styles.spinner} />
              <ThemedText style={styles.runButtonText}>Running Test...</ThemedText>
            </>
          ) : (
            <ThemedText style={styles.runButtonText}>Run Robustness Test</ThemedText>
          )}
        </TouchableOpacity>

      </ScrollView>
    </ThemedView>
  );
}

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  section: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 16, opacity: 0.7, lineHeight: 22 },

  label: { fontSize: 15, fontWeight: '600', marginBottom: 12 },
  inputGroup: { marginBottom: 24 },

  // Image container
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(148,163,184,0.35)',
    borderStyle: 'dashed',
    padding: 24,
    backgroundColor: 'rgba(15,23,42,0.5)',
    minHeight: 200,
    overflow: 'hidden',
  },
  stressImage: {
    borderRadius: 14,
    resizeMode: 'contain',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },

  // Badge row
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 4,
  },
  noEffectHint: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },

  // Dataset grid
  datasetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#0f172a',
    borderRadius: 20,
  },
  gridCell: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 3,
    overflow: 'hidden',
  },
  digitText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },

  // Error
  errorBox: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  errorText: {
    color: '#ef4444',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Stress section
  stressSection: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    marginBottom: 28,
  },
  sectionHeader: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  // Run button
  runButton: {
    flexDirection: 'row',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    minHeight: 60,
  },
  runButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  spinner: { width: 24, height: 24 },
});