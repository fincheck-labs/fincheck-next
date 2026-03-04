import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ui/ThemedText';
import Svg, { Polyline, Line, Text as SvgText, Circle, G, Rect } from 'react-native-svg';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Minimum px per data point so the chart never feels squished
const MIN_PX_PER_POINT = 18;
// Visible canvas width = screen minus all surrounding padding (scrollContent:24 + section:20 = 44 each side)
const VISIBLE_WIDTH = SCREEN_WIDTH - 88;

type DataPoint = {
  x: number;
  y: number;
  label?: string;
};

type LineChartMobileProps = {
  title: string;
  data: DataPoint[];
  color?: string;
  unit?: string;
  height?: number;
};

export default function LineChartMobile({
  title,
  data,
  color = '#3b82f6',
  unit = '',
  height = 220,
}: LineChartMobileProps) {
  if (!data || data.length < 2) return null;

  const paddingLeft = 52;
  const paddingRight = 24;
  const paddingTop = 24;
  const paddingBottom = 44;

  // Make canvas wide enough so every point has breathing room
  const minNeeded = data.length * MIN_PX_PER_POINT + paddingLeft + paddingRight;
  const chartWidth = Math.max(VISIBLE_WIDTH, minNeeded);
  const chartHeight = height;
  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const minY = Math.min(...data.map((d) => d.y));
  const maxY = Math.max(...data.map((d) => d.y));
  const rangeY = maxY - minY || 1;
  // Add 10% vertical padding so the line never hugs the top/bottom edge
  const paddedMinY = minY - rangeY * 0.08;
  const paddedMaxY = maxY + rangeY * 0.08;

  const minX = data[0].x;
  const maxX = data[data.length - 1].x;

  const scaleX = (x: number) =>
    paddingLeft + ((x - minX) / (maxX - minX || 1)) * innerWidth;
  const scaleY = (y: number) =>
    paddingTop +
    innerHeight -
    ((y - paddedMinY) / (paddedMaxY - paddedMinY)) * innerHeight;

  const points = data.map((d) => `${scaleX(d.x)},${scaleY(d.y)}`).join(' ');

  // Y-axis ticks
  const yTicks = 4;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) =>
    minY + (i / yTicks) * (maxY - minY)
  );

  // X-axis ticks — show up to 8, evenly spaced across all data
  const xTickCount = Math.min(8, data.length);
  const xTickIndices = Array.from({ length: xTickCount }, (_, i) =>
    Math.round((i / (xTickCount - 1)) * (data.length - 1))
  );

  const needsScroll = chartWidth > VISIBLE_WIDTH;

  return (
    <View style={styles.wrapper}>
      <ThemedText style={styles.title}>{title}</ThemedText>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        bounces={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Svg width={chartWidth} height={chartHeight}>
          {/* Background fill for chart area */}
          <Rect
            x={paddingLeft}
            y={paddingTop}
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
          />

          {/* Horizontal grid lines + Y-axis labels */}
          {yTickValues.map((val, i) => {
            const y = scaleY(val);
            return (
              <G key={i}>
                <Line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="#374151"
                  strokeWidth={1}
                  strokeDasharray="5,4"
                  strokeOpacity={0.5}
                />
                <SvgText
                  x={paddingLeft - 6}
                  y={y + 4}
                  fontSize={10}
                  textAnchor="end"
                  fill="#9ca3af"
                >
                  {val.toFixed(1)}
                </SvgText>
              </G>
            );
          })}

          {/* Unit label above Y axis */}
          {unit !== '' && (
            <SvgText
              x={paddingLeft - 6}
              y={paddingTop - 8}
              fontSize={10}
              textAnchor="end"
              fill="#6b7280"
            >
              {unit}
            </SvgText>
          )}

          {/* X-axis baseline */}
          <Line
            x1={paddingLeft}
            y1={paddingTop + innerHeight}
            x2={chartWidth - paddingRight}
            y2={paddingTop + innerHeight}
            stroke="#4b5563"
            strokeWidth={1}
          />

          {/* Y-axis left border */}
          <Line
            x1={paddingLeft}
            y1={paddingTop}
            x2={paddingLeft}
            y2={paddingTop + innerHeight}
            stroke="#4b5563"
            strokeWidth={1}
          />

          {/* X-axis tick labels */}
          {xTickIndices.map((idx) => {
            const d = data[idx];
            const x = scaleX(d.x);
            return (
              <SvgText
                key={idx}
                x={x}
                y={paddingTop + innerHeight + 20}
                fontSize={10}
                textAnchor="middle"
                fill="#9ca3af"
              >
                {d.x}
              </SvgText>
            );
          })}

          {/* The line itself */}
          <Polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Data point dots — smaller on large datasets */}
          {data.map((d, i) => (
            <Circle
              key={i}
              cx={scaleX(d.x)}
              cy={scaleY(d.y)}
              r={data.length > 30 ? 2 : 4}
              fill={color}
            />
          ))}
        </Svg>
      </ScrollView>

      {needsScroll && (
        <ThemedText style={styles.scrollHint}>← swipe to see full chart →</ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  scrollContent: {
    // no extra padding — SVG handles its own internal padding
  },
  scrollHint: {
    fontSize: 10,
    opacity: 0.4,
    textAlign: 'center',
    marginTop: 4,
  },
});