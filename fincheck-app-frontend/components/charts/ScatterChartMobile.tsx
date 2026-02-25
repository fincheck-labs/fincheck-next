import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ui/ThemedText';
import Svg, { Circle, Line, Text as SvgText, G, Polyline, Rect } from 'react-native-svg';

const SCREEN_WIDTH = Dimensions.get('window').width;
const VISIBLE_WIDTH = SCREEN_WIDTH - 88; // screen minus surrounding padding

export type ScatterPoint = {
  x: number;
  y: number;
  name: string;
  isPareto?: boolean;
  isEA?: boolean;
};

type ScatterChartMobileProps = {
  title: string;
  data: ScatterPoint[];
  xLabel?: string;
  yLabel?: string;
  paretoLine?: { x: number; y: number }[];
};

export default function ScatterChartMobile({
  title,
  data,
  xLabel = 'X',
  yLabel = 'Y',
  paretoLine,
}: ScatterChartMobileProps) {
  if (!data || data.length === 0) return null;

  const paddingLeft = 58;
  const paddingRight = 28;
  const paddingTop = 28;
  const paddingBottom = 56;

  // Give each point ~50px of horizontal space so labels don't collide
  const minNeeded = data.length * 50 + paddingLeft + paddingRight;
  const chartWidth = Math.max(VISIBLE_WIDTH, minNeeded);
  const chartHeight = 300;
  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const allX = data.map((d) => d.x);
  const allY = data.map((d) => d.y);
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);
  const padX = (maxX - minX) * 0.12 || 0.01;
  const padY = (maxY - minY) * 0.12 || 1;

  const scaleX = (x: number) =>
    paddingLeft + ((x - (minX - padX)) / (maxX - minX + 2 * padX)) * innerWidth;
  const scaleY = (y: number) =>
    paddingTop + innerHeight - ((y - (minY - padY)) / (maxY - minY + 2 * padY)) * innerHeight;

  const yTicks = 4;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) =>
    minY + (i / yTicks) * (maxY - minY)
  );
  const xTicks = 4;
  const xTickValues = Array.from({ length: xTicks + 1 }, (_, i) =>
    minX + (i / xTicks) * (maxX - minX)
  );

  const needsScroll = chartWidth > VISIBLE_WIDTH;

  return (
    <View style={styles.wrapper}>
      {title ? <ThemedText style={styles.title}>{title}</ThemedText> : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        bounces={false}
      >
        <Svg width={chartWidth} height={chartHeight}>
          {/* Chart area background */}
          <Rect
            x={paddingLeft}
            y={paddingTop}
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
          />

          {/* Horizontal grid lines + Y labels */}
          {yTickValues.map((val, i) => (
            <G key={i}>
              <Line
                x1={paddingLeft}
                y1={scaleY(val)}
                x2={chartWidth - paddingRight}
                y2={scaleY(val)}
                stroke="#374151"
                strokeWidth={1}
                strokeDasharray="5,4"
                strokeOpacity={0.5}
              />
              <SvgText
                x={paddingLeft - 6}
                y={scaleY(val) + 4}
                fontSize={9}
                textAnchor="end"
                fill="#9ca3af"
              >
                {val.toFixed(0)}
              </SvgText>
            </G>
          ))}

          {/* Axes */}
          <Line
            x1={paddingLeft}
            y1={paddingTop + innerHeight}
            x2={chartWidth - paddingRight}
            y2={paddingTop + innerHeight}
            stroke="#4b5563"
            strokeWidth={1}
          />
          <Line
            x1={paddingLeft}
            y1={paddingTop}
            x2={paddingLeft}
            y2={paddingTop + innerHeight}
            stroke="#4b5563"
            strokeWidth={1}
          />

          {/* X-axis tick labels */}
          {xTickValues.map((val, i) => (
            <SvgText
              key={i}
              x={scaleX(val)}
              y={paddingTop + innerHeight + 18}
              fontSize={9}
              textAnchor="middle"
              fill="#9ca3af"
            >
              {val.toFixed(3)}
            </SvgText>
          ))}

          {/* Axis labels */}
          <SvgText
            x={paddingLeft + innerWidth / 2}
            y={chartHeight - 6}
            fontSize={10}
            textAnchor="middle"
            fill="#6b7280"
          >
            {xLabel}
          </SvgText>
          <SvgText
            x={12}
            y={paddingTop + innerHeight / 2}
            fontSize={10}
            textAnchor="middle"
            fill="#6b7280"
            rotation="-90"
            originX={12}
            originY={paddingTop + innerHeight / 2}
          >
            {yLabel}
          </SvgText>

          {/* Pareto frontier dashed line */}
          {paretoLine && paretoLine.length > 1 && (
            <Polyline
              points={paretoLine.map((p) => `${scaleX(p.x)},${scaleY(p.y)}`).join(' ')}
              fill="none"
              stroke="#7c3aed"
              strokeWidth={2}
              strokeDasharray="7,4"
            />
          )}

          {/* Dominated points — grey */}
          {data
            .filter((d) => !d.isPareto && !d.isEA)
            .map((d, i) => (
              <G key={`dom-${i}`}>
                <Circle cx={scaleX(d.x)} cy={scaleY(d.y)} r={7} fill="#94a3b8" />
                <SvgText
                  x={scaleX(d.x)}
                  y={scaleY(d.y) - 11}
                  fontSize={8}
                  textAnchor="middle"
                  fill="#94a3b8"
                >
                  {d.name.replace('.pth', '')}
                </SvgText>
              </G>
            ))}

          {/* Pareto optimal — purple */}
          {data
            .filter((d) => d.isPareto && !d.isEA)
            .map((d, i) => (
              <G key={`pareto-${i}`}>
                <Circle
                  cx={scaleX(d.x)}
                  cy={scaleY(d.y)}
                  r={8}
                  fill="#7c3aed"
                  stroke="#4c1d95"
                  strokeWidth={1.5}
                />
                <SvgText
                  x={scaleX(d.x)}
                  y={scaleY(d.y) - 12}
                  fontSize={8}
                  textAnchor="middle"
                  fill="#7c3aed"
                  fontWeight="bold"
                >
                  {d.name.replace('.pth', '')}
                </SvgText>
              </G>
            ))}

          {/* EA selected — red, larger */}
          {data
            .filter((d) => d.isEA)
            .map((d, i) => (
              <G key={`ea-${i}`}>
                <Circle
                  cx={scaleX(d.x)}
                  cy={scaleY(d.y)}
                  r={11}
                  fill="#ef4444"
                  stroke="#991b1b"
                  strokeWidth={2}
                />
                <SvgText
                  x={scaleX(d.x)}
                  y={scaleY(d.y) - 15}
                  fontSize={9}
                  textAnchor="middle"
                  fill="#991b1b"
                  fontWeight="bold"
                >
                  {d.name.replace('.pth', '')}
                </SvgText>
              </G>
            ))}
        </Svg>
      </ScrollView>

      {needsScroll && (
        <ThemedText style={styles.scrollHint}>← swipe to see full chart →</ThemedText>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#94a3b8' }]} />
          <ThemedText style={styles.legendText}>Dominated</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#7c3aed' }]} />
          <ThemedText style={styles.legendText}>Pareto Optimal</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
          <ThemedText style={styles.legendText}>EA Selected</ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  scrollHint: {
    fontSize: 10,
    opacity: 0.4,
    textAlign: 'center',
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    opacity: 0.7,
  },
});