/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShapAnalysis, ShapFactor } from '../types';
import { TrendingUp, ShieldCheck, HelpCircle, Eye } from 'lucide-react';

interface ShapExplanationProps {
  analysis: ShapAnalysis;
}

export default function ShapExplanation({ analysis }: ShapExplanationProps) {
  const { increasingFactors, decreasingFactors } = analysis;

  // Find max absolute impact to normalize bar lengths
  const maxImpact = Math.max(
    ...increasingFactors.map(f => Math.abs(f.impact)),
    ...decreasingFactors.map(f => Math.abs(f.impact)),
    10 // Fallback minimum baseline
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6" id="shap-explain-component">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-105 pb-5">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Eye className="text-indigo-600 w-5 h-5" />
            Explainable AI: SHAP Biometric Attribution
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Visualizing the mathematical contribution of your specific biomarkers to your risk scores.
          </p>
        </div>
        <div className="flex gap-2 text-[10px] items-center text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-xs inline-block"></span>
            Elevated Risk
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs inline-block"></span>
            Protective Impact
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Factors Increasing Risk */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-rose-50 rounded-lg">
              <TrendingUp className="w-4 h-4 text-rose-600" />
            </div>
            <h4 className="text-sm font-bold text-rose-900">Accelerating Drivers (Risk Amplifiers)</h4>
          </div>

          {increasingFactors.length === 0 ? (
            <p className="text-xs bg-gray-50 text-gray-500 p-4 rounded-xl italic">
              No significant biometric triggers recognized. Your biometrics align closely with metabolic guidelines.
            </p>
          ) : (
            <div className="space-y-4">
              {increasingFactors.map((factor, idx) => {
                const widthPct = Math.min((Math.abs(factor.impact) / maxImpact) * 100, 100);
                return (
                  <div key={idx} className="group border border-gray-100/70 rounded-xl p-3 hover:bg-rose-50/25 transition-all duration-200">
                    <div className="flex justify-between items-start text-xs font-semibold text-gray-800 mb-1">
                      <span className="flex items-center gap-1.5">
                        {factor.feature}
                        <span className="text-[9px] px-1.5 py-0.2 bg-gray-105 rounded-full text-gray-500 font-medium">
                          {factor.disease}
                        </span>
                      </span>
                      <span className="text-rose-600 font-bold">+{factor.impact}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-2">
                      <div 
                        className="bg-rose-500 h-full rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${widthPct}%` }}
                      ></div>
                    </div>

                    {/* Rationale description */}
                    <p className="text-[11px] leading-relaxed text-gray-550">
                      {factor.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Factors Decreasing Risk */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <h4 className="text-sm font-bold text-emerald-950">Protective Buffers (Risk Mitigators)</h4>
          </div>

          {decreasingFactors.length === 0 ? (
            <p className="text-xs bg-gray-50 text-gray-500 p-4 rounded-xl italic">
              No significant protective buffers detected. Adding regular physical exercise or daily produce can establish healthy protection shields.
            </p>
          ) : (
            <div className="space-y-4">
              {decreasingFactors.map((factor, idx) => {
                const widthPct = Math.min((Math.abs(factor.impact) / maxImpact) * 100, 100);
                return (
                  <div key={idx} className="group border border-gray-105/70 rounded-xl p-3 hover:bg-emerald-50/20 transition-all duration-200">
                    <div className="flex justify-between items-start text-xs font-semibold text-gray-800 mb-1">
                      <span className="flex items-center gap-1.5">
                        {factor.feature}
                        <span className="text-[9px] px-1.5 py-0.2 bg-gray-105 rounded-full text-gray-500 font-medium">
                          {factor.disease}
                        </span>
                      </span>
                      <span className="text-emerald-600 font-bold">{factor.impact}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-2">
                      <div 
                        className="bg-emerald-550 h-full rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${widthPct}%` }}
                      ></div>
                    </div>

                    {/* Rationale description */}
                    <p className="text-[11px] leading-relaxed text-gray-550">
                      {factor.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-xs flex gap-2.5">
        <HelpCircle className="w-4.5 h-4.5 text-indigo-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-gray-800 block mb-0.5">Understanding SHAP Values</span>
          <p className="text-gray-500 leading-relaxed">
            The attribution scores represent how many percentage points were added or subtracted from the demographic baseline framework. Highly clinical weight distributions allow you to pinpoint which lifestyle parameters yield the highest return on intervention choices.
          </p>
        </div>
      </div>
    </div>
  );
}
