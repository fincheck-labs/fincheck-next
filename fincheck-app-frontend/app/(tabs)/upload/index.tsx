import React, { useState, useEffect } from 'react';
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
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedText } from '@/components/ui/ThemedText';
import { Header } from '@/components/layout/Header';
import { Drawer } from '@/components/layout/Drawer';
import EvaluationModeSelector from '@/components/ui/EvaluationModeSelector';
import Dropdown from '@/components/ui/Dropdown';
import Slider from '@/components/ui/Slider';
import { useTheme } from '@/hooks/useTheme';
import { PREBUILT_DATASETS } from '@/lib/dataset';
import {
  runSingleInference,
  runDatasetEvaluation,
} from '@/lib/api';

type Mode = 'SINGLE' | 'DATASET';

export default function UploadScreen() {
  const router = useRouter();
  const { colors, toggleTheme } = useTheme();
  const [drawerVisible, setDrawerVisible] = useState(false);

  /* ================= MODE ================= */
  const [mode, setMode] = useState<Mode>('SINGLE');

  /* ================= DATA ================= */
  const [selectedDataset, setSelectedDataset] = useState<string>('MNIST_100');
  const [selectedDigit, setSelectedDigit] = useState<number>(0);

  /* ================= FILE ================= */
  const [file, setFile] = useState<any>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);

  /* ================= STRESS ================= */
  const [blur, setBlur] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [noise, setNoise] = useState(0);
  const [erase, setErase] = useState(0);

  /* ================= UI ================= */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openDrawer = () => setDrawerVisible(true);
  const closeDrawer = () => setDrawerVisible(false);

  const { width: screenWidth } = Dimensions.get('window');
  const PREVIEW_SIZE = Math.min(screenWidth * 0.8, 300);
  const GRID_CELL_SIZE = 44;

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
      setError(null);
    }
  };

  const pickZipFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/zip',
      });

      if (!result.canceled && result.assets[0]) {
        setFile(result.assets[0]);
        setError(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const runInference = async () => {
    setLoading(true);
    setError(null);

    try {
      if (mode === 'SINGLE') {
        if (!imageUri) {
          setError('Please upload an image');
          setLoading(false);
          return;
        }

        const res = await runSingleInference({
          image: {
            uri: imageUri,
            name: 'digit.png',
            type: 'image/png',
          },
          expectedDigit: selectedDigit,
          blur,
          rotation,
          noise,
          erase,
        });

        router.push(`/results/${res.id}`);
        return;
      }

      if (mode === 'DATASET') {
        const res = await runDatasetEvaluation({
          datasetName: selectedDataset,
          blur,
          rotation,
          noise,
          erase,
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

  /* ================= DIGIT DROPDOWN ITEMS ================= */
  const digitItems = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => ({
    label: String(d),
    value: d,
  }));

  /* ================= DATASET DROPDOWN ITEMS ================= */
  const datasetItems = PREBUILT_DATASETS.map((d) => ({
    label: d.label,
    value: d.id,
  }));

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
          <ThemedText style={styles.title}>Robustness Testing</ThemedText>
          <ThemedText style={styles.subtitle}>
            Real-time stress preview for single images and dataset samples
          </ThemedText>
        </View>

        {/* Mode Selector */}
        <View style={styles.section}>
          <EvaluationModeSelector mode={mode} setMode={setMode} />
        </View>

        {/* ================= SINGLE MODE ================= */}
        {mode === 'SINGLE' && (
          <View style={styles.section}>
            {/* Digit Selector - unchanged */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Expected Digit</ThemedText>
              <Dropdown
                value={selectedDigit}
                items={digitItems}
                onValueChange={(value) => setSelectedDigit(value as number)}
                placeholder="Select digit"
              />
            </View>

            {/* 🎯 IMAGE-ONLY STRESS PREVIEW */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Live Stress Preview</ThemedText>
              
              <TouchableOpacity style={styles.imageContainer} onPress={pickImage} activeOpacity={0.9}>
                {/* ✅ IMAGE with BLUR + ROTATION */}
                {imageUri && (
                  <Image
                    source={{ uri: imageUri }}
                    style={[
                      styles.stressImage,
                      {
                        width: PREVIEW_SIZE,
                        height: PREVIEW_SIZE,
                        opacity: Math.max(0.05, 1 - blur * 0.05), // Blur effect
                        transform: [{ rotate: `${rotation}deg` }], // Rotation
                      },
                    ]}
                  />
                )}
                
                {/* NO UPLOAD STATE */}
                {!imageUri && (
                  <View style={styles.uploadIcon}>
                    <ThemedText style={styles.uploadText}>Tap Image</ThemedText>
                  </View>
                )}
                
                {/* ✅ NOISE - ON IMAGE */}
                {imageUri && noise > 0 && (
                  <View
                    style={[
                      styles.noiseOverlay,
                      {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: `rgba(100,100,100,${noise * 0.6})`,
                      },
                    ]}
                  />
                )}
                
                {/* ✅ ERASE - BOTTOM RIGHT CORNER ON IMAGE */}
                {imageUri && erase > 0 && (
                  <View
                    style={[
                      styles.eraseCorner,
                      {
                        position: 'absolute',
                        bottom: -2,
                        right: -2,
                        width: PREVIEW_SIZE * erase,
                        height: PREVIEW_SIZE * erase,
                        backgroundColor: 'black',
                        borderRadius: 16,
                        shadowColor: '#000',
                        shadowOffset: { width: 2, height: 2 },
                        shadowOpacity: 0.8,
                        shadowRadius: 4,
                        elevation: 8,
                      },
                    ]}
                  />
                )}
              </TouchableOpacity>

              {/* ✅ ACTIVE EFFECTS INDICATORS */}
              {imageUri && (
                <View style={styles.effectBadges}>
                  {blur > 0 && (
                    <View style={[styles.badge, styles.blurBadge]}>
                      <ThemedText style={styles.badgeText}>🌫️ {blur.toFixed(1)}px</ThemedText>
                    </View>
                  )}
                  {Math.abs(rotation) > 1 && (
                    <View style={[styles.badge, styles.rotateBadge]}>
                      <ThemedText style={styles.badgeText}>↻ {rotation}°</ThemedText>
                    </View>
                  )}
                  {noise > 0 && (
                    <View style={[styles.badge, styles.noiseBadge]}>
                      <ThemedText style={styles.badgeText}>⚡ {noise.toFixed(2)}</ThemedText>
                    </View>
                  )}
                  {erase > 0 && (
                    <View style={[styles.badge, styles.eraseBadge]}>
                      <ThemedText style={styles.badgeText}>✂️ {Math.round(erase * 100)}%</ThemedText>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        )}


        {/* ================= DATASET MODE ================= */}
        {mode === 'DATASET' && (
          <View style={styles.section}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Select Dataset</ThemedText>
              <Dropdown
                value={selectedDataset}
                items={datasetItems}
                onValueChange={(value) => setSelectedDataset(value as string)}
                placeholder="Select dataset"
              />
            </View>

            {/* ✅ DATASET GRID PREVIEW */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Dataset Preview (6x6 Sample)</ThemedText>
              <View style={styles.datasetGrid}>
                {Array.from({ length: 36 }).map((_, i) => {
                  const digit = i % 10;
                  const randRotation = (Math.random() - 0.5) * rotation * 0.8;
                  return (
                    <View
                      key={i}
                      style={[
                        styles.gridCell,
                        {
                          opacity: Math.max(0.2, 1 - blur * 0.03),
                          transform: [{ rotate: `${randRotation}deg` }],
                          backgroundColor: noise > 0 
                            ? `rgba(30, 64, 175, ${0.9 - noise * 0.3})`
                            : '#1e40af',
                        },
                      ]}
                    >
                      <ThemedText style={styles.digitText}>{digit}</ThemedText>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* ================= ERROR ================= */}
        {error && (
          <View style={[styles.errorBox, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        )}

        {/* ================= STRESS CONTROLS ================= */}
        <View
          style={[
            styles.stressSection,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Robustness Controls</ThemedText>
          </View>

          <Slider
            label="Blur (px)"
            value={blur}
            setValue={setBlur}
            min={0}
            max={15}
            step={0.5}
            info="0-15px Gaussian blur"
          />
          <Slider
            label="Rotation (°)"
            value={rotation}
            setValue={setRotation}
            min={-30}
            max={30}
            step={1}
            info="±30° rotation"
          />
          <Slider
            label="Noise"
            value={noise}
            setValue={setNoise}
            min={0}
            max={1.5}
            step={0.05}
            info="0-1.5 intensity Gaussian noise"
          />
          <Slider
            label="Erase (%)"
            value={erase}
            setValue={setErase}
            min={0}
            max={0.6}
            step={0.05}
            info="0-60% bottom-right corner erase"
          />
        </View>

        {/* ================= RUN BUTTON ================= */}
        <TouchableOpacity
          style={[
            styles.runButton,
            {
              backgroundColor: loading ? colors.border : colors.primary,
            },
          ]}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    lineHeight: 22,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 24,
  },
  previewContainer: {
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  stressImage: {
    borderRadius: 18,
    resizeMode: 'contain',
  },
  noiseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 18,
  },
  eraseOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 16,
  },
  uploadPlaceholder: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.6,
    textAlign: 'center',
    color: '#64748b',
  },
  stressIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
  },
  indicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
  },
  indicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  datasetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  gridCell: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  digitText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  errorBox: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  errorText: {
    color: '#ef4444',
    fontWeight: '600',
    textAlign: 'center',
  },
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
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  runButton: {
    flexDirection: 'row',
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    minHeight: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  runButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  spinner: {
    width: 24,
    height: 24,
  },
  imageContainer: {
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 20,
  borderWidth: 2,
  borderColor: 'rgba(148, 163, 184, 0.5)',
  borderStyle: 'dashed',
  padding: 24,
  backgroundColor: 'rgba(248, 250, 252, 0.8)',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
  elevation: 10,
  },
  uploadIcon: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  eraseCorner: {
    shadowOpacity: 0.8,
  },
  effectBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  blurBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: 'rgba(99, 102, 241, 0.4)',
    borderWidth: 1,
  },
  rotateBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderWidth: 1,
  },
  noiseBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderWidth: 1,
  },
  eraseBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },

});
