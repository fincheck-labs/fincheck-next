import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedText } from '@/components/ui/ThemedText';
import { Header } from '@/components/layout/Header';
import { Drawer } from '@/components/layout/Drawer';
import { useTheme } from '@/hooks/useTheme';
import { getAllResults } from '@/lib/api';

type EvaluationType = 'SINGLE' | 'DATASET';
type SourceType = 'PREBUILT' | 'CUSTOM' | 'IMAGE_UPLOAD';

interface ResultMeta {
  evaluation_type?: EvaluationType;
  source?: SourceType;
  dataset_type?: string;
  num_images?: number;
  createdAt?: string;
}

interface ResultDoc {
  _id: string;
  // Backend now hoists this to top level as a clean ISO string
  createdAt?: string;
  data: Record<string, any>;
  meta?: ResultMeta;
}

export default function ResultsScreen() {
  const router = useRouter();
  const { colors, toggleTheme } = useTheme();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const [results, setResults] = useState<ResultDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openDrawer = () => setDrawerVisible(true);
  const closeDrawer = () => setDrawerVisible(false);

  const fetchResults = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);

    try {
      const data = await getAllResults();
      setResults(data);
    } catch (err) {
      console.error('Error fetching results:', err);
      setError('Failed to load results. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchResults(true);
  };

  const handleResultPress = (id: string) => {
    router.push(`/results/${id}` as any);
  };

  const normalizeMeta = (meta?: ResultMeta) => {
    return {
      evaluation_type: meta?.evaluation_type ?? 'SINGLE',
      source: meta?.source ?? 'IMAGE_UPLOAD',
      dataset_type: meta?.dataset_type,
      num_images: meta?.num_images,
    };
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    // Trim microseconds: "2026-02-17T23:29:17.813000" → "2026-02-17T23:29:17.813"
    // and append Z so Android/Hermes treats it as UTC
    let s = dateString.trim();
    // Truncate sub-millisecond precision (>3 decimal digits)
    s = s.replace(/(\.\d{3})\d+/, '$1');
    // Append Z if no timezone present
    if (!/[Zz]$/.test(s) && !/[+-]\d{2}:?\d{2}$/.test(s)) s += 'Z';
    const date = new Date(s);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getBadgeColor = (type: 'evaluation' | 'source' | 'dataset' | 'images') => {
    switch (type) {
      case 'evaluation': return colors.primary;
      case 'source':     return '#8b5cf6';
      case 'dataset':    return '#10b981';
      case 'images':     return '#6b7280';
      default:           return colors.primary;
    }
  };

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.section}>
          <ThemedText style={styles.title}>Inference History</ThemedText>
          <ThemedText style={[styles.subtitle, { opacity: 0.6 }]}>
            {results.length} {results.length === 1 ? 'result' : 'results'}
          </ThemedText>
        </View>

        {loading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={[styles.loadingText, { opacity: 0.6 }]}>
              Loading results...
            </ThemedText>
          </View>
        )}

        {error && !loading && results.length === 0 && (
          <View
            style={[
              styles.errorContainer,
              { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
            ]}
          >
            <ThemedText style={[styles.errorText, { color: '#dc2626' }]}>
              {error}
            </ThemedText>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={() => fetchResults()}
            >
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && results.length > 0 && (
          <View style={styles.resultsList}>
            {results.map((result) => {
              const meta = normalizeMeta(result.meta);

              return (
                <TouchableOpacity
                  key={result._id}
                  style={[
                    styles.resultCard,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleResultPress(result._id)}
                  activeOpacity={0.7}
                >
                  {/* createdAt is now at top level, hoisted by the backend */}
                  <ThemedText style={[styles.dateText, { opacity: 0.6 }]}>
                    {formatDate(result.meta?.createdAt)}
                  </ThemedText>

                  <View style={styles.badgesContainer}>
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: getBadgeColor('evaluation') + '20',
                          borderColor: getBadgeColor('evaluation'),
                        },
                      ]}
                    >
                      <ThemedText
                        style={[styles.badgeText, { color: getBadgeColor('evaluation') }]}
                      >
                        {meta.evaluation_type === 'SINGLE' ? 'Single Image' : 'Dataset'}
                      </ThemedText>
                    </View>

                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: getBadgeColor('source') + '20',
                          borderColor: getBadgeColor('source'),
                        },
                      ]}
                    >
                      <ThemedText
                        style={[styles.badgeText, { color: getBadgeColor('source') }]}
                      >
                        {meta.source}
                      </ThemedText>
                    </View>

                    {meta.dataset_type && (
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor: getBadgeColor('dataset') + '20',
                            borderColor: getBadgeColor('dataset'),
                          },
                        ]}
                      >
                        <ThemedText
                          style={[styles.badgeText, { color: getBadgeColor('dataset') }]}
                        >
                          {meta.dataset_type}
                        </ThemedText>
                      </View>
                    )}

                    {meta.num_images && (
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor: getBadgeColor('images') + '20',
                            borderColor: getBadgeColor('images'),
                          },
                        ]}
                      >
                        <ThemedText
                          style={[styles.badgeText, { color: getBadgeColor('images') }]}
                        >
                          {meta.num_images} images
                        </ThemedText>
                      </View>
                    )}
                  </View>

                  <View style={styles.arrowContainer}>
                    <ThemedText style={[styles.arrow, { color: colors.primary }]}>
                      →
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {!loading && !error && results.length === 0 && (
          <View style={styles.emptyContainer}>
            <ThemedText style={[styles.emptyText, { opacity: 0.6 }]}>
              No inference results found yet.
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { opacity: 0.5 }]}>
              Run an evaluation to see results here.
            </ThemedText>
            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/upload' as any)}
            >
              <ThemedText style={styles.uploadButtonText}>Go to Upload</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  section: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 15 },
  centerContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loadingText: { fontSize: 14, marginTop: 12 },
  errorContainer: { borderRadius: 12, borderWidth: 1, padding: 20, alignItems: 'center' },
  errorText: { fontSize: 14, textAlign: 'center', marginBottom: 16 },
  retryButton: { borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20 },
  retryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  resultsList: { gap: 16 },
  resultCard: { borderRadius: 12, borderWidth: 1, padding: 20, position: 'relative' },
  dateText: { fontSize: 13, marginBottom: 12 },
  badgesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { borderRadius: 12, borderWidth: 1, paddingVertical: 4, paddingHorizontal: 10 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  arrowContainer: { position: 'absolute', right: 20, top: '50%', transform: [{ translateY: -10 }] },
  arrow: { fontSize: 20, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, marginBottom: 8, textAlign: 'center' },
  emptySubtext: { fontSize: 14, marginBottom: 24, textAlign: 'center' },
  uploadButton: { borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24 },
  uploadButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
});