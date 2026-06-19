/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Recommendation } from '../types';
import { 
  Heart, 
  Apple, 
  Activity, 
  Clipboard, 
  ChevronRight, 
  Sparkles,
  Award
} from 'lucide-react';

interface RecommendationsProps {
  recommendations: Recommendation[];
}

export default function Recommendations({ recommendations }: RecommendationsProps) {
  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'lifestyle':
        return <Award className="w-4.5 h-4.5 text-indigo-600" />;
      case 'diet':
        return <Apple className="w-4.5 h-4.5 text-emerald-600" />;
      case 'activity':
        return <Activity className="w-4.5 h-4.5 text-orange-600 animate-pulse" />;
      case 'medical management':
        return <Clipboard className="w-4.5 h-4.5 text-rose-600" />;
      default:
        return <Sparkles className="w-4.5 h-4.5 text-indigo-600" />;
    }
  };

  const getCategoryTheme = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'lifestyle':
        return 'bg-indigo-50 border-indigo-100';
      case 'diet':
        return 'bg-emerald-50 border-emerald-100';
      case 'activity':
        return 'bg-orange-50 border-orange-100';
      case 'medical management':
        return 'bg-rose-50 border-rose-100';
      default:
        return 'bg-indigo-50 border-indigo-100';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6 animate-fade-in" id="recommendations-module">
      <div>
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="text-indigo-600 w-5 h-5 animate-pulse" />
          Personalized Preventive Wellness Protocol
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Smart interventions engineered to targeted biometrics and specific diagnostic risk factors.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec, idx) => {
          const isHigh = rec.impact === 'High';
          return (
            <div 
              key={idx} 
              className="border border-gray-105 rounded-2xl p-5 hover:border-indigo-400 hover:shadow-xs transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-xl border ${getCategoryTheme(rec.category)}`}>
                    {getCategoryIcon(rec.category)}
                  </div>
                  <span className={`text-[9px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full ${
                    isHigh ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {rec.impact} Impact
                  </span>
                </div>

                <h4 className="text-sm font-bold text-gray-900 mb-1">{rec.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{rec.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-55/40 flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 capitalize">{rec.category} Intervention</span>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
