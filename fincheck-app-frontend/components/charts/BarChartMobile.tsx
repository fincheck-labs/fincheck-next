import React from 'react';
import { View, StyleSheet, useWindowDimensions, ScrollView } from 'react-native';
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

const BAR_SPACING = 8;
const MIN_SCALE = 0.8;
const MAX_SCALE = 3;
const CHART_HEIGHT = 160;
const Y_AXIS_WIDTH = 40;
const VALUE_LABEL_HEIGHT = 16;
const X_LABEL_HEIGHT = 36;
// Total horizontal space consumed: paddingHorizontal(20)*2 + marginHorizontal(4)*2 + Y_AXIS_WIDTH + extra buffer
// The extra 16 accounts for GestureHandlerRootView layout quirks and border widths
const HORIZONTAL_INSETS = 20 * 2 + 4 * 2 + Y_AXIS_WIDTH + 16;

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
  const { width: screenWidth } = useWindowDimensions();

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withTiming(1);
      savedScale.value = 1;
    });

  const composed = Gesture.Simultaneous(pinchGesture, doubleTap);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));

  // Precise available width for bars
  const chartAreaWidth = screenWidth - HORIZONTAL_INSETS;
  const barWidth = Math.max(
    20,
    (chartAreaWidth - (data.length - 1) * BAR_SPACING) / data.length
  );

  const getBarColor = (model: string, value: number) => {
    if (model === bestModel) return '#10b981';
    const ratio = lowIsBetter
      ? (maxValue - value) / Math.max(maxValue - minValue, 0.001)
      : (value - minValue) / Math.max(maxValue - minValue, 0.001);
    if (ratio > 0.66) return '#3b82f6';
    if (ratio > 0.33) return '#60a5fa';
    return '#93c5fd';
  };

  const yMid = (maxValue + minValue) / 2;

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <View
        style={[
          styles.container,
          { backgroundColor: colors.cardBackground, borderColor: colors.border },
        ]}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <ThemedText style={styles.title}>{title}</ThemedText>
            {bestModel && (
              <View style={styles.badge}>
                <ThemedText style={styles.badgeText}>
                  🏆 {bestModel.replace('_mnist.pth', '')}
                </ThemedText>
              </View>
            )}
          </View>

          <ThemedText style={[styles.subtitle, { opacity: 0.55 }]}>
            {subtitle}
          </ThemedText>

          {bestModel && (
            <ThemedText style={[styles.bestStat, { opacity: 0.55 }]}>
              {lowIsBetter ? 'Lowest' : 'Highest'} {title}:{' '}
              <ThemedText style={[styles.bestStatValue, { color: '#10b981' }]}>
                {data.find((d) => d.model === bestModel)?.value.toFixed(2)}{unit}
              </ThemedText>
            </ThemedText>
          )}
        </View>

        {/* ── Zoom hint ── */}
        <ThemedText style={[styles.zoomHint, { opacity: 0.35 }]}>
          Pinch to zoom  ·  Double-tap to reset
        </ThemedText>

        {/* ── Chart — clipped so bars never escape the card ── */}
        <View style={styles.chartClip}>
          <GestureDetector gesture={composed}>
            <Animated.View style={[styles.animatedChart, animatedStyle]}>
              <View style={styles.chartWrapper}>
                {/* Y-axis */}
                <View style={[styles.yAxis, { width: Y_AXIS_WIDTH }]}>
                  <ThemedText style={[styles.yLabel, { opacity: 0.45 }]}>
                    {maxValue.toFixed(1)}
                  </ThemedText>
                  <ThemedText style={[styles.yLabel, { opacity: 0.45 }]}>
                    {yMid.toFixed(1)}
                  </ThemedText>
                  <ThemedText style={[styles.yLabel, { opacity: 0.45 }]}>
                    {minValue > 0 ? minValue.toFixed(1) : '0.0'}
                  </ThemedText>
                </View>

                {/* Bars area — ScrollView ensures every bar is reachable */}
                <View style={styles.barsArea}>
                  {/* Grid lines (behind scroll content) */}
                  <View
                    style={[styles.gridOverlay, { height: CHART_HEIGHT }]}
                    pointerEvents="none"
                  >
                    {[0, 1, 2].map((i) => (
                      <View
                        key={i}
                        style={[styles.gridLine, { borderTopColor: colors.border }]}
                      />
                    ))}
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    scrollEnabled={true}
                    bounces={false}
                  >
                    <View>
                      {/* Value labels row */}
                      <View style={[styles.valueLabelsRow, { height: VALUE_LABEL_HEIGHT }]}>
                        {data.map((item) => {
                          const barColor = getBarColor(item.model, item.value);
                          return (
                            <View
                              key={item.model}
                              style={{ width: barWidth, alignItems: 'center' }}
                            >
                              <ThemedText
                                style={[styles.valueLabel, { color: barColor }]}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                              >
                                {item.value.toFixed(2)}{unit}
                              </ThemedText>
                            </View>
                          );
                        })}
                      </View>

                      {/* Bars row */}
                      <View style={[styles.barsRow, { height: CHART_HEIGHT, gap: BAR_SPACING }]}>
                        {data.map((item) => {
                          const barColor = getBarColor(item.model, item.value);
                          const barHeight = Math.max(
                            6,
                            (item.value / maxValue) * CHART_HEIGHT
                          );
                          return (
                            <View
                              key={item.model}
                              style={[styles.barTrack, { width: barWidth }]}
                            >
                              <View
                                style={[
                                  styles.bar,
                                  { height: barHeight, backgroundColor: barColor },
                                ]}
                              />
                            </View>
                          );
                        })}
                      </View>

                      {/* Baseline divider */}
                      <View style={[styles.baseline, { backgroundColor: colors.border }]} />

                      {/* X-axis labels row */}
                      <View style={[styles.xLabelsRow, { height: X_LABEL_HEIGHT, gap: BAR_SPACING }]}>
                        {data.map((item) => {
                          const label = item.model
                            .replace('_mnist.pth', '')
                            .replace(/_/g, ' ');
                          return (
                            <View
                              key={item.model}
                              style={{ width: barWidth, alignItems: 'center' }}
                            >
                              <ThemedText
                                style={[styles.xLabel, { opacity: 0.6 }]}
                                numberOfLines={2}
                              >
                                {label}
                              </ThemedText>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  </ScrollView>
                </View>
              </View>
            </Animated.View>
          </GestureDetector>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  // GestureHandlerRootView must not stretch — keep it as a block wrapper only
  gestureRoot: {
    alignSelf: 'stretch',
  },

  container: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    marginBottom: 16,
    marginHorizontal: 4,
    // Clip anything the animated scale pushes outside the card
    overflow: 'hidden',
  },

  // ── Header ──────────────────────────────────────────────
  header: {
    marginBottom: 14,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    flexShrink: 1,
    marginRight: 8,
  },
  badge: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  bestStat: {
    fontSize: 12,
    marginTop: 1,
  },
  bestStatValue: {
    fontWeight: '600',
  },

  // ── Zoom hint ────────────────────────────────────────────
  zoomHint: {
    fontSize: 10,
    marginBottom: 16,
    letterSpacing: 0.2,
  },

  // ── Clip wrapper — hard boundary for the zoomable chart ──
  chartClip: {
    overflow: 'hidden',
    // Explicit height = value labels + bars + baseline + x-labels
    height: VALUE_LABEL_HEIGHT + CHART_HEIGHT + 1 + 6 + X_LABEL_HEIGHT,
  },

  // Animated.View needs explicit size so scale transforms from center
  animatedChart: {
    flex: 1,
  },

  // ── Chart layout ─────────────────────────────────────────
  chartWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  yAxis: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
    height: CHART_HEIGHT,
    marginTop: VALUE_LABEL_HEIGHT,
  },
  yLabel: {
    fontSize: 10,
  },

  barsArea: {
    flex: 1,
    // Prevent barsArea itself from ever exceeding its flex allocation
    overflow: 'hidden',
  },

  gridOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: VALUE_LABEL_HEIGHT,
    justifyContent: 'space-between',
  },
  gridLine: {
    borderTopWidth: StyleSheet.hairlineWidth,
    width: '100%',
  },

  valueLabelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BAR_SPACING,
  },
  valueLabel: {
    fontSize: 10,
    fontWeight: '600',
  },

  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  barTrack: {
    justifyContent: 'flex-end',
    height: '100%',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },

  baseline: {
    height: 1,
    width: '100%',
    opacity: 0.25,
    marginTop: 1,
  },

  xLabelsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  xLabel: {
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 12,
  },
});