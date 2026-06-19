/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Heart, Activity, Brain, Info, AlertTriangle } from 'lucide-react';

interface RiskGaugeProps {
  label: 'Heart Disease Risk' | 'Stroke Risk' | 'Diabetes Risk';
  score: number;
  level: string;
  explanation: string;
}

export default function RiskGauge({ label, score, level, explanation }: RiskGaugeProps) {
  // Theme color maps
  const getTheme = (scoreVal: number) => {
    if (scoreVal >= 40) {
      return {
        stroke: 'stroke-rose-500',
        track: 'stroke-rose-100',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-100',
        badge: 'bg-rose-100 text-rose-800'
      };
    }
    if (scoreVal >= 15) {
      return {
        stroke: 'stroke-amber-500',
        track: 'stroke-amber-100',
        bg: 'bg-amber-50/50',
        text: 'text-amber-700',
        border: 'border-amber-100',
        badge: 'bg-amber-100 text-amber-800'
      };
    }
    return {
      stroke: 'stroke-emerald-500',
      track: 'stroke-emerald-100',
      bg: 'bg-emerald-50/30',
      text: 'text-emerald-700',
      border: 'border-emerald-100',
      badge: 'bg-emerald-100 text-emerald-800'
    };
  };

  const theme = getTheme(score);

  // SVG Gauge calculations
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getIcon = () => {
    switch (label) {
      case 'Heart Disease Risk':
        return <Heart className={`w-5 h-5 ${theme.text}`} />;
      case 'Stroke Risk':
        return <Brain className={`w-5 h-5 ${theme.text}`} />;
      case 'Diabetes Risk':
        return <Activity className={`w-5 h-5 ${theme.text}`} />;
    }
  };

  return (
    <div className={`p-6 rounded-2xl border ${theme.border} ${theme.bg} flex flex-col justify-between h-full transition-all duration-300 hover:shadow-md`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-white rounded-xl shadow-xs border border-gray-100">
            {getIcon()}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">{label}</h3>
            <span className={`inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md mt-1 ${theme.badge}`}>
              {level}
            </span>
          </div>
        </div>
      </div>

      {/* Radial Indicator Section */}
      <div className="my-6 flex justify-center items-center relative">
        <svg className="w-32 h-32 transform -rotate-90">
          {/* Background track */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            className={`${theme.track}`}
            strokeWidth="10"
            fill="transparent"
          />
          {/* Animated active path */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            className={`${theme.stroke} transition-all duration-500 ease-out`}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        
        {/* Core Percentage text */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-gray-900 leading-none">
            {score}%
          </span>
          <span className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-wide">
            Likelihood
          </span>
        </div>
      </div>

      {/* Explanation Footnote */}
      <div className="bg-white/80 backdrop-blur-xs rounded-xl p-3 border border-gray-100/50 text-xs text-gray-600">
        <div className="flex gap-1.5">
          <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{explanation}</p>
        </div>
      </div>
    </div>
  );
}
