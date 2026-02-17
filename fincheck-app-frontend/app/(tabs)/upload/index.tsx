import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
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
type DatasetSource = 'PREBUILT' | 'CUSTOM';

export default function UploadScreen() {
  const router = useRouter();
  const { colors, toggleTheme } = useTheme();
  const [drawerVisible, setDrawerVisible] = useState(false);

  /* ================= MODE ================= */
  const [mode, setMode] = useState<Mode>('SINGLE');
  const [datasetSource, setDatasetSource] = useState<DatasetSource>('PREBUILT');

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

  const openDrawer = () => setDrawerVisible(true);
  const closeDrawer = () => setDrawerVisible(false);

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
    }
  };

  /* ================= ZIP PICKER ================= */
  const pickZipFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/zip',
      });

      if (!result.canceled && result.assets[0]) {
        setFile(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const runInference = async () => {
    try {
      if (mode === 'SINGLE') {
        if (!imageUri) {
          Alert.alert('Error', 'Please upload an image');
          return;
        }

        setLoading(true);

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

        setLoading(false);

        router.push(`/results/${res.id}`);
        return;
      }

      if (mode === 'DATASET') {
        setLoading(true);

        if (datasetSource === 'PREBUILT') {
          const res = await runDatasetEvaluation({
            datasetName: selectedDataset,
            blur,
            rotation,
            noise,
            erase,
          });

          setLoading(false);
          router.push(`/results/${res.id}`);
          return;
        }

        if (datasetSource === 'CUSTOM') {
          Alert.alert(
            'Not Supported',
            'Custom ZIP dataset upload is not yet implemented on backend'
          );
          setLoading(false);
          return;
        }
      }
    } catch (err: any) {
      setLoading(false);
      Alert.alert(
        'Error',
        err?.message ?? 'Inference failed. Please try again.'
      );
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
          <ThemedText style={styles.title}>Run Inference</ThemedText>
        </View>

        {/* Mode Selector */}
        <View style={styles.section}>
          <EvaluationModeSelector mode={mode} setMode={setMode} />
        </View>

        {/* ================= SINGLE MODE ================= */}
        {mode === 'SINGLE' && (
          <View style={styles.section}>
            {/* Digit Selector */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Expected Digit</ThemedText>
              <Dropdown
                value={selectedDigit}
                items={digitItems}
                onValueChange={(value) => setSelectedDigit(value as number)}
                placeholder="Select digit"
              />
            </View>

            {/* Image Upload */}
            <View style={styles.inputGroup}>
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
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                ) : (
                  <ThemedText style={styles.uploadText}>
                    Click / Tap to Upload Image
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>

            {/* Live Preview Note */}
            {imageUri && (
              <View style={styles.infoBox}>
                <ThemedText style={[styles.infoText, { opacity: 0.7 }]}>
                  Stress effects will be applied during inference
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {/* ================= DATASET MODE ================= */}
        {mode === 'DATASET' && (
          <View style={styles.section}>
            {/* Dataset Source Radio */}
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setDatasetSource('PREBUILT')}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radio,
                    {
                      borderColor: colors.primary,
                      backgroundColor:
                        datasetSource === 'PREBUILT'
                          ? colors.primary
                          : 'transparent',
                    },
                  ]}
                >
                  {datasetSource === 'PREBUILT' && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <ThemedText style={styles.radioLabel}>Prebuilt Dataset</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setDatasetSource('CUSTOM')}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radio,
                    {
                      borderColor: colors.primary,
                      backgroundColor:
                        datasetSource === 'CUSTOM' ? colors.primary : 'transparent',
                    },
                  ]}
                >
                  {datasetSource === 'CUSTOM' && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <ThemedText style={styles.radioLabel}>Custom ZIP</ThemedText>
              </TouchableOpacity>
            </View>

            {/* Prebuilt Dataset Selector */}
            {datasetSource === 'PREBUILT' && (
              <View style={styles.inputGroup}>
                <Dropdown
                  value={selectedDataset}
                  items={datasetItems}
                  onValueChange={(value) => setSelectedDataset(value as string)}
                  placeholder="Select dataset"
                />
              </View>
            )}

            {/* Custom ZIP Upload */}
            {datasetSource === 'CUSTOM' && (
              <View style={styles.inputGroup}>
                <TouchableOpacity
                  style={[
                    styles.fileButton,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={pickZipFile}
                  activeOpacity={0.7}
                >
                  <ThemedText style={styles.fileButtonText}>
                    {file ? file.name : 'Choose ZIP File'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}
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
          <ThemedText style={styles.sectionTitle}>
            Stress / Perturbation Controls
          </ThemedText>

          <Slider
            label="Blur"
            value={blur}
            setValue={setBlur}
            min={0}
            max={5}
            step={0.1}
          />
          <Slider
            label="Rotation"
            value={rotation}
            setValue={setRotation}
            min={0}
            max={30}
            step={1}
          />
          <Slider
            label="Noise"
            value={noise}
            setValue={setNoise}
            min={0}
            max={0.5}
            step={0.01}
          />
          <Slider
            label="Erase"
            value={erase}
            setValue={setErase}
            min={0}
            max={0.4}
            step={0.05}
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
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <ThemedText style={styles.runButtonText}>Run Evaluation</ThemedText>
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
  inputGroup: {
    marginBottom: 20,
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
  previewImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  infoBox: {
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 20,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  radioLabel: {
    fontSize: 15,
  },
  fileButton: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  fileButtonText: {
    fontSize: 15,
  },
  stressSection: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  runButton: {
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  runButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});