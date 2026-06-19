/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CrossDiseaseAnalysis } from '../types';
import { Layers, HelpCircle, Heart, Brain, Activity, CircleCheck } from 'lucide-react';

interface CrossDiseaseProps {
  analysis: CrossDiseaseAnalysis;
}

export default function CrossDisease({ analysis }: CrossDiseaseProps) {
  const { sharedDrivers, summary } = analysis;

  const getDiseaseIcon = (disease: string) => {
    switch (disease) {
      case 'Heart Disease':
        return <Heart className="w-3.5 h-3.5 inline text-rose-500 mr-1" />;
      case 'Stroke':
        return <Brain className="w-3.5 h-3.5 inline text-indigo-500 mr-1" />;
      case 'Diabetes':
        return <Activity className="w-3.5 h-3.5 inline text-orange-500 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6" id="cross-disease-component">
      <div>
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Layers className="text-indigo-650 w-5 h-5" />
          Cross-Condition Syndemic Linkage
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Identifying metabolic and lifestyle factors that fuel risk across multiple conditions simultaneously.
        </p>
      </div>

      {/* Grid of Shared Drivers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sharedDrivers.map((item, idx) => {
          let scoreColor = "text-indigo-600 bg-indigo-55/70";
          if (item.impactScore > 80) scoreColor = "text-rose-600 bg-rose-50";
          else if (item.impactScore > 50) scoreColor = "text-amber-600 bg-amber-50";

          return (
            <div key={idx} className="border border-gray-100 rounded-2xl p-5 bg-gray-50/40 relative overflow-hidden flex flex-col justify-between hover:shadow-xs transition-shadow">
              
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-sm font-bold text-gray-800 leading-snug">{item.driver}</h4>
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${scoreColor}`}>
                    Overlap: {item.impactScore}
                  </span>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  {item.explanation}
                </p>
              </div>

              {/* Tag overlaps */}
              <div className="border-t border-gray-150/40 pt-3 flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] font-semibold text-gray-400 mr-1">Overlaps on:</span>
                {item.affectedConditions.map((cond, cIdx) => (
                  <span key={cIdx} className="text-[10px] font-medium bg-white text-gray-700 px-2.5 py-0.5 rounded-md border border-gray-100 flex items-center">
                    {getDiseaseIcon(cond)}
                    {cond}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cohesive Corridor Summary Card */}
      <div className="p-6 bg-indigo-900 text-white rounded-2xl relative overflow-hidden">
        {/* Subtle decorative glowing background circle */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 opacity-20 blur-3xl -mr-10 -mt-10 rounded-full"></div>
        
        <h4 className="text-sm font-bold text-indigo-100 mb-2 flex items-center gap-1.5">
          <CircleCheck className="w-4 h-4 text-emerald-400" />
          Preventive Synergy Diagnostic Summary
        </h4>
        <p className="text-xs leading-relaxed text-indigo-150">
          {summary}
        </p>
      </div>
    </div>
  );
}
