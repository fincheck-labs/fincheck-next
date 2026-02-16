import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/useTheme';

interface ConfusionMatrixProps {
  model: string;
  matrix: number[][];
  accuracy?: number;
  FAR?: number;
  FRR?: number;
  riskScore?: number;
}

export default function ConfusionMatrix({
  model,
  matrix,
  accuracy,
  FAR,
  FRR,
  riskScore,
}: ConfusionMatrixProps) {
  const { colors } = useTheme();

  if (!matrix || matrix.length === 0) {
    return null;
  }

  const numClasses = matrix.length;

  // Calculate max value for color intensity
  const maxValue = Math.max(...matrix.flat());

  // Get color based on cell value and position
  const getCellColor = (row: number, col: number, value: number) => {
    const isCorrect = row === col;
    const intensity = value / maxValue;

    if (isCorrect) {
      // Green for correct predictions
      const greenIntensity = Math.max(0.2, intensity);
      return `rgba(16, 185, 129, ${greenIntensity})`;
    } else {
      // Red for misclassifications
      const redIntensity = Math.max(0.1, intensity * 0.8);
      return `rgba(239, 68, 68, ${redIntensity})`;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.modelName}>{model}</ThemedText>
        {accuracy !== undefined && (
          <View style={styles.metricsRow}>
            <MetricItem
              label="Accuracy"
              value={`${accuracy.toFixed(2)}%`}
              color="#3b82f6"
            />
            {FAR !== undefined && (
              <MetricItem
                label="FAR"
                value={`${FAR.toFixed(2)}%`}
                color="#f59e0b"
              />
            )}
            {FRR !== undefined && (
              <MetricItem
                label="FRR"
                value={`${FRR.toFixed(2)}%`}
                color="#ef4444"
              />
            )}
            {riskScore !== undefined && (
              <MetricItem
                label="Risk Score"
                value={riskScore.toFixed(4)}
                color="#8b5cf6"
              />
            )}
          </View>
        )}
      </View>

      {/* Matrix Title */}
      <ThemedText style={[styles.matrixTitle, { opacity: 0.7 }]}>
        Predicted Class
      </ThemedText>

      {/* Scrollable Matrix */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Column Headers */}
          <View style={styles.columnHeaders}>
            <View style={styles.cornerCell} />
            {Array.from({ length: numClasses }).map((_, i) => (
              <View key={i} style={styles.headerCell}>
                <ThemedText style={styles.headerText}>Class {i}</ThemedText>
              </View>
            ))}
          </View>

          {/* Matrix Rows */}
          {matrix.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.matrixRow}>
              {/* Row Header */}
              {rowIndex === 0 && (
                <View style={styles.rowLabelContainer}>
                  <ThemedText style={styles.rowLabelText}>True Class</ThemedText>
                </View>
              )}
              <View style={styles.rowHeader}>
                <ThemedText style={styles.headerText}>
                  Class {rowIndex}
                </ThemedText>
              </View>

              {/* Row Cells */}
              {row.map((value, colIndex) => (
                <View
                  key={colIndex}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: getCellColor(rowIndex, colIndex, value),
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.cellText,
                      { color: value > maxValue * 0.5 ? '#ffffff' : colors.text },
                    ]}
                  >
                    {value}
                  </ThemedText>
                </View>
              ))}
            </View>
          ))}

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: '#10b981' }]} />
              <ThemedText style={styles.legendText}>
                Correct predictions
              </ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: '#ef4444' }]} />
              <ThemedText style={styles.legendText}>
                Misclassifications
              </ThemedText>
            </View>
            <ThemedText style={[styles.legendNote, { opacity: 0.5 }]}>
              Intensity indicates frequency
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function MetricItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.metricItem}>
      <ThemedText style={[styles.metricLabel, { opacity: 0.6 }]}>
        {label}:
      </ThemedText>
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
  },
  header: {
    marginBottom: 16,
  },
  modelName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricItem: {
    flexDirection: 'row',
    gap: 4,
  },
  metricLabel: {
    fontSize: 12,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  matrixTitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  columnHeaders: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  cornerCell: {
    width: 70,
  },
  headerCell: {
    width: 60,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.7,
  },
  rowLabelContainer: {
    position: 'absolute',
    left: -20,
    top: '50%',
    transform: [{ rotate: '-90deg' }, { translateX: -30 }],
    width: 100,
  },
  rowLabelText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.7,
  },
  matrixRow: {
    flexDirection: 'row',
    position: 'relative',
  },
  rowHeader: {
    width: 70,
    height: 50,
    justifyContent: 'center',
    paddingRight: 8,
  },
  cell: {
    width: 60,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
  },
  cellText: {
    fontSize: 12,
    fontWeight: '600',
  },
  legend: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
  },
  legendNote: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 4,
  },
});