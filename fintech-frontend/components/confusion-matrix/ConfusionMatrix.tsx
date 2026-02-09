import React from 'react';
import type { ConfusionMatrixModel, ConfusionMatrixData } from './types';

interface ConfusionMatrixProps {
  data: ConfusionMatrixModel;
  classLabels?: string[];
}

export const ConfusionMatrix: React.FC<ConfusionMatrixProps> = ({
  data,
  classLabels,
}) => {
  const { model, matrix, FAR, FRR, risk_score } = data;

  // matrix is now ConfusionMatrixData (number[][])
  const numClasses = matrix.length;
  
  // Generate default labels if not provided
  const labels =
    classLabels || Array.from({ length: numClasses }, (_, i) => `Class ${i}`);
  
  // Flatten once (performance)
  const flatMatrix = matrix.flat();
  const maxValue = Math.max(...flatMatrix);
  
  // Calculate accuracy
  const totalPredictions = flatMatrix.reduce((sum, val) => sum + val, 0);
  const correctPredictions = matrix.reduce(
    (sum, row, i) => sum + row[i],
    0
  );

  const accuracy =
    totalPredictions > 0
      ? ((correctPredictions / totalPredictions) * 100).toFixed(2)
      : '0.00';

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{model}</h2>
        <div className="flex gap-6 text-sm text-gray-600">
          <span className="font-semibold">
            Accuracy: <span className="text-blue-600">{accuracy}%</span>
          </span>

          {FAR !== undefined && (
            <span>
              FAR: <span className="font-mono">{(FAR * 100).toFixed(2)}%</span>
            </span>
          )}

          {FRR !== undefined && (
            <span>
              FRR: <span className="font-mono">{(FRR * 100).toFixed(2)}%</span>
            </span>
          )}

          {risk_score !== undefined && (
            <span>
              Risk Score:{' '}
              <span className="font-mono">{risk_score.toFixed(4)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Confusion Matrix */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">

          <div className="text-center mb-2">
            <span className="text-sm font-semibold text-gray-700">
              Predicted Class
            </span>
          </div>

          <div className="flex">
            {/* True label */}
            <div className="flex items-center justify-center pr-4">
              <span className="text-sm font-semibold text-gray-700 -rotate-90 whitespace-nowrap">
                True Class
              </span>
            </div>

            {/* Matrix table */}
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className="w-24"></th>
                  {labels.map((label, i) => (
                    <th
                      key={i}
                      className="px-3 py-2 text-xs font-semibold text-gray-700 text-center"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {matrix.map((row, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-xs font-semibold text-gray-700 text-right whitespace-nowrap">
                      {labels[i]}
                    </td>

                    {row.map((value, j) => {
                      const isCorrect = i === j;

                      return (
                        <td
                          key={j}
                          className="border border-gray-300 text-center relative group"
                          style={{
                            backgroundColor: isCorrect
                              ? `rgba(34, 197, 94, ${
                                  value > 0
                                    ? 0.2 + (value / maxValue) * 0.6
                                    : 0.05
                                })`
                              : value > 0
                              ? `rgba(239, 68, 68, ${
                                  0.1 + (value / maxValue) * 0.5
                                })`
                              : 'rgba(243, 244, 246, 1)',
                          }}
                        >
                          <div className="px-4 py-3 min-w-[60px]">
                            <span
                              className={`text-sm font-semibold ${
                                value > maxValue * 0.5
                                  ? 'text-gray-900'
                                  : 'text-gray-700'
                              }`}
                            >
                              {value}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: 'rgba(34, 197, 94, 0.6)' }}
          />
          <span>Correct predictions</span>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.4)' }}
          />
          <span>Misclassifications</span>
        </div>

        <div className="ml-auto">
          <span className="italic">Intensity indicates frequency</span>
        </div>
      </div>
    </div>
  );
};
