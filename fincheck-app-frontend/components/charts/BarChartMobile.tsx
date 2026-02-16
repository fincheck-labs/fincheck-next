import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/useTheme';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 80; 
const BAR_SPACING = 8;

interface DataPoint {
  model: string;
  value: number;
}

interface BarChartProps {
  title: string;
  subtitle: string;
  data: DataPoint[];
  bestModel?: string;
  unit?: string;
  lowIsBetter?: boolean; 
}

export default function BarChart({
  title,
  subtitle,
  data,
  bestModel,
  unit = '',
  lowIsBetter = false,
}: BarChartProps) {
  const { colors } = useTheme();

  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));

  const barWidth = (CHART_WIDTH - (data.length - 1) * BAR_SPACING) / data.length;

  const getBarColor = (model: string, value: number) => {
    if (model === bestModel) {
      return '#10b981'; // Green for best
    }
    
    const ratio = lowIsBetter 
      ? (maxValue - value) / (maxValue - minValue)
      : (value - minValue) / (maxValue - minValue);
    
    if (ratio > 0.66) return '#3b82f6'; 
    if (ratio > 0.33) return '#60a5fa'; 
    return '#93c5fd'; 
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
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <ThemedText style={styles.title}>{title}</ThemedText>
          <ThemedText style={[styles.subtitle, { opacity: 0.6 }]}>
            {subtitle}
          </ThemedText>
        </View>
        {bestModel && (
          <View style={styles.bestBadge}>
            <ThemedText style={[styles.bestText, { color: '#10b981' }]}>
              🏆 Best: {bestModel.replace('_mnist.pth', '')}
            </ThemedText>
            <ThemedText style={[styles.bestLabel, { color: '#10b981', fontSize: 10 }]}>
              ({lowIsBetter ? 'Lowest' : 'Highest'} {title})
            </ThemedText>
          </View>
        )}
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <ThemedText style={[styles.yLabel, { opacity: 0.5 }]}>
            {maxValue.toFixed(1)}
          </ThemedText>
          <ThemedText style={[styles.yLabel, { opacity: 0.5 }]}>
            {(maxValue / 2).toFixed(1)}
          </ThemedText>
          <ThemedText style={[styles.yLabel, { opacity: 0.5 }]}>0</ThemedText>
        </View>

        {/* Bars */}
        <View style={styles.barsContainer}>
          <View style={styles.bars}>
            {data.map((item, index) => {
              const height = (item.value / maxValue) * 200; // Max height 200px
              const barColor = getBarColor(item.model, item.value);

              return (
                <View
                  key={item.model}
                  style={[styles.barColumn, { width: barWidth }]}
                >
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: height || 5, // Minimum height for visibility
                          backgroundColor: barColor,
                        },
                      ]}
                    />
                  </View>
                  <ThemedText
                    style={[styles.barValue, { color: barColor }]}
                    numberOfLines={1}
                  >
                    {item.value.toFixed(2)}
                    {unit}
                  </ThemedText>
                  <ThemedText
                    style={[styles.barLabel, { opacity: 0.7 }]}
                    numberOfLines={2}
                  >
                    {item.model.replace('_mnist.pth', '').replace('_', '\n')}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Explanation */}
      {bestModel && (
        <View style={styles.explanation}>
          <ThemedText style={[styles.explanationText, { opacity: 0.7 }]}>
            Why this model is best: {bestModel} shows{' '}
            {lowIsBetter ? 'the lowest' : 'a substantial improvement in'} {title},{' '}
            reaching {data.find((d) => d.model === bestModel)?.value.toFixed(2)}
            {unit} compared to the group average of{' '}
            {(data.reduce((sum, d) => sum + d.value, 0) / data.length).toFixed(2)}
            {unit}.
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  header: {
    marginBottom: 20,
  },
  titleContainer: {
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
  },
  bestBadge: {
    marginTop: 8,
  },
  bestText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bestLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  chartContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  yAxis: {
    width: 40,
    justifyContent: 'space-between',
    paddingRight: 8,
    height: 200,
  },
  yLabel: {
    fontSize: 10,
    textAlign: 'right',
  },
  barsContainer: {
    flex: 1,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 200,
    gap: BAR_SPACING,
  },
  barColumn: {
    alignItems: 'center',
  },
  barWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 5,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 2,
  },
  barLabel: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 12,
  },
  explanation: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  explanationText: {
    fontSize: 12,
    lineHeight: 18,
  },
});