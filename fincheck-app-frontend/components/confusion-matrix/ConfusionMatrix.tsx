import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface ConfusionMatrixProps {
  model: string;
  matrix: number[][];
  accuracy?: number;
  FAR?: number;
  FRR?: number;
  riskScore?: number;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

export default function ConfusionMatrix({
  model,
  matrix,
  accuracy,
  FAR,
  FRR,
  riskScore,
}: ConfusionMatrixProps) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, savedScale.value * e.scale)
      );
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withTiming(1);
      savedScale.value = 1;
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, doubleTapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!matrix || matrix.length === 0) return null;

  const numClasses = matrix.length;
  const maxValue = Math.max(...matrix.flat());

  // Dynamically compute cell size so the matrix fits on screen
  const ROW_HEADER_WIDTH = 58;
  const PADDING = 32; // container padding * 2
  const availableWidth = screenWidth - PADDING - ROW_HEADER_WIDTH;
  const cellSize = Math.max(36, Math.floor(availableWidth / numClasses));

  const getCellColor = (row: number, col: number, value: number) => {
    const isCorrect = row === col;
    const intensity = maxValue > 0 ? value / maxValue : 0;
    if (isCorrect) {
      return `rgba(16, 185, 129, ${Math.max(0.2, intensity)})`;
    }
    return `rgba(239, 68, 68, ${Math.max(0.05, intensity * 0.8)})`;
  };

  return (
    <GestureHandlerRootView>
      <View
        style={[
          styles.container,
          { backgroundColor: colors.cardBackground, borderColor: colors.border },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.modelName}>{model}</ThemedText>
          {accuracy !== undefined && (
            <View style={styles.metricsRow}>
              <MetricItem label="Accuracy" value={`${accuracy.toFixed(2)}%`} color="#3b82f6" />
              {FAR !== undefined && (
                <MetricItem label="FAR" value={`${FAR.toFixed(2)}%`} color="#f59e0b" />
              )}
              {FRR !== undefined && (
                <MetricItem label="FRR" value={`${FRR.toFixed(2)}%`} color="#ef4444" />
              )}
              {riskScore !== undefined && (
                <MetricItem label="Risk Score" value={riskScore.toFixed(4)} color="#8b5cf6" />
              )}
            </View>
          )}
        </View>

        <ThemedText style={[styles.matrixTitle, { opacity: 0.7 }]}>
          Predicted Class
        </ThemedText>
        <ThemedText style={[styles.zoomHint, { opacity: 0.45 }]}>
          Pinch to zoom · Double-tap to reset
        </ThemedText>

        {/* Pinch-to-zoom wrapper */}
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[styles.zoomContainer, animatedStyle]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                {/* Column Headers */}
                <View style={styles.columnHeaders}>
                  <View style={[styles.cornerCell, { width: ROW_HEADER_WIDTH }]} />
                  {Array.from({ length: numClasses }).map((_, i) => (
                    <View key={i} style={[styles.headerCell, { width: cellSize }]}>
                      <ThemedText style={styles.headerText} numberOfLines={1}>
                        C{i}
                      </ThemedText>
                    </View>
                  ))}
                </View>

                {/* Matrix Rows */}
                {matrix.map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.matrixRow}>
                    <View style={[styles.rowHeader, { width: ROW_HEADER_WIDTH }]}>
                      <ThemedText style={styles.headerText} numberOfLines={1}>
                        C{rowIndex}
                      </ThemedText>
                    </View>
                    {row.map((value, colIndex) => (
                      <View
                        key={colIndex}
                        style={[
                          styles.cell,
                          {
                            width: cellSize,
                            height: cellSize,
                            backgroundColor: getCellColor(rowIndex, colIndex, value),
                          },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.cellText,
                            {
                              color:
                                value > maxValue * 0.5 ? '#ffffff' : colors.text,
                              fontSize: cellSize < 44 ? 9 : 11,
                            },
                          ]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                        >
                          {value}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </Animated.View>
        </GestureDetector>

        {/* Axis labels */}
        <View style={styles.axisLabels}>
          <ThemedText style={[styles.axisLabel, { opacity: 0.6 }]}>
            ↑ True Class &nbsp;&nbsp; Predicted Class →
          </ThemedText>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#10b981' }]} />
            <ThemedText style={styles.legendText}>Correct predictions</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#ef4444' }]} />
            <ThemedText style={styles.legendText}>Misclassifications</ThemedText>
          </View>
          <ThemedText style={[styles.legendNote, { opacity: 0.5 }]}>
            Intensity indicates frequency
          </ThemedText>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

function MetricItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.metricItem}>
      <ThemedText style={[styles.metricLabel, { opacity: 0.6 }]}>{label}:</ThemedText>
      <ThemedText style={[styles.metricValue, { color }]}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: { marginBottom: 16 },
  modelName: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricItem: { flexDirection: 'row', gap: 4 },
  metricLabel: { fontSize: 12 },
  metricValue: { fontSize: 12, fontWeight: '600' },
  matrixTitle: { fontSize: 13, textAlign: 'center', marginBottom: 2 },
  zoomHint: { fontSize: 11, textAlign: 'center', marginBottom: 10 },
  zoomContainer: {
    // Allow the animated view to overflow while zooming
    overflow: 'visible',
  },
  columnHeaders: { flexDirection: 'row', marginBottom: 2 },
  cornerCell: { height: 30 },
  headerCell: { height: 30, justifyContent: 'center', alignItems: 'center' },
  headerText: { fontSize: 10, fontWeight: '600', opacity: 0.7 },
  matrixRow: { flexDirection: 'row' },
  rowHeader: {
    height: 40,
    justifyContent: 'center',
    paddingRight: 6,
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(229,231,235,0.6)',
  },
  cellText: { fontWeight: '600' },
  axisLabels: { marginTop: 8, alignItems: 'center' },
  axisLabel: { fontSize: 11 },
  legend: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 6,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendBox: { width: 14, height: 14, borderRadius: 2 },
  legendText: { fontSize: 12 },
  legendNote: { fontSize: 11, fontStyle: 'italic', marginTop: 4 },
});