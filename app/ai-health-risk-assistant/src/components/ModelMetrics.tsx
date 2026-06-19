/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Award, Target, Database, BarChart3, Settings, ShieldAlert, Sparkles, CheckCircle } from 'lucide-react';

interface MetricRowProps {
  label: string;
  value: string | number;
  barColor?: string;
  pct?: number;
}

function MetricRow({ label, value, barColor = "bg-indigo-600", pct }: MetricRowProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-semibold text-gray-700">
        <span>{label}</span>
        <span className="text-gray-900 font-bold">{value}</span>
      </div>
      {pct !== undefined && (
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div className={`${barColor} h-full rounded-full`} style={{ width: `${pct}%` }}></div>
        </div>
      )}
    </div>
  );
}

export default function ModelMetrics() {
  const models = [
    {
      name: "Heart Disease Model",
      type: "Balanced Logistic Regression",
      dataset: "CDC BRFSS 2022 (~318,000 samples)",
      metrics: [
        { label: "ROC-AUC Score", value: "83.0%", pct: 83, color: "bg-rose-500" },
        { label: "Sensitivity / Recall", value: "95.0%", pct: 95, color: "bg-rose-600" },
        { label: "Decision Threshold", value: "0.20", pct: 20, color: "bg-rose-400" }
      ],
      description: "Trained on the Centers for Disease Control (CDC) Behavioral Risk Factor Surveillance System 2022. It utilizes demographic variables, lifestyle parameters, and cardiac markers to estimate probability of coronary events."
    },
    {
      name: "Stroke Risk Model",
      type: "Balanced Logistic Regression",
      dataset: "Kaggle Stroke Dataset (~5,100 samples)",
      metrics: [
        { label: "ROC-AUC Score", value: "84.0%", pct: 84, color: "bg-indigo-500" },
        { label: "Sensitivity / Recall", value: "98.0%", pct: 98, color: "bg-indigo-600" },
        { label: "Decision Threshold", value: "0.10", pct: 10, color: "bg-indigo-400" }
      ],
      description: "Estimates cerebrovascular accidents by balancing age indexes, average glucose levels, BMI, and hypertension history. Built with a low decision threshold to maximize clinical screening recall."
    },
    {
      name: "Diabetes Risk Model",
      type: "Balanced Logistic Regression (Tuned)",
      dataset: "CDC BRFSS 2015 (~253,000 samples)",
      metrics: [
        { label: "ROC-AUC Score", value: "81.0%", pct: 81, color: "bg-orange-500" },
        { label: "Sensitivity / Recall", value: "99.0%", pct: 99, color: "bg-orange-600" },
        { label: "Decision Threshold", value: "0.10", pct: 10, color: "bg-orange-400" }
      ],
      description: "Specifically structured for early glycemic detection using 18 distinct user parameters. The decision boundary is calibrated to capture over 99% of early diabetic and prediabetic conditions."
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-8" id="model-metrics-component">
      
      {/* Header */}
      <div className="border-b border-gray-105 pb-5">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="text-indigo-600 w-5 h-5" />
          Clinical Model Validation & Evaluation Metrics
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Detailed performance parameters and dataset references of the active machine learning models.
        </p>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {models.map((model, idx) => (
          <div key={idx} className="border border-gray-100 rounded-2xl p-5 bg-gray-50/30 flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-md inline-block mb-1">
                  {model.type}
                </span>
                <h4 className="text-base font-bold text-gray-900">{model.name}</h4>
              </div>

              <p className="text-xs text-gray-550 leading-relaxed">
                {model.description}
              </p>

              <div className="border-t border-gray-150/40 pt-4 space-y-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Performance Metrics
                </span>
                {model.metrics.map((m, mIdx) => (
                  <MetricRow 
                    key={mIdx} 
                    label={m.label} 
                    value={m.value} 
                    barColor={m.color} 
                    pct={m.pct} 
                  />
                ))}
              </div>
            </div>

            <div className="border-t border-gray-150/40 pt-3 mt-4 flex items-center gap-1.5 text-[11px] text-gray-500">
              <Database className="w-3.5 h-3.5 text-gray-400" />
              <span>Dataset: <strong className="text-gray-700">{model.dataset}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Calibration Warning / Info */}
      <div className="bg-indigo-950 text-indigo-100 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row gap-5 items-center">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 opacity-20 blur-3xl -mr-10 -mt-10 rounded-full"></div>
        <div className="p-3 bg-indigo-850 rounded-xl text-indigo-400 shrink-0">
          <Settings className="w-6 h-6" />
        </div>
        <div className="space-y-1.5 text-center md:text-left">
          <h4 className="text-sm font-bold text-white flex items-center justify-center md:justify-start gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Decision Boundary Calibration
          </h4>
          <p className="text-xs text-indigo-200 leading-relaxed">
            All models were trained using Class-Weight Balancing to handle the typical demographic imbalance of rare conditions (e.g. Stroke represents &lt;5% of raw survey responses). The decision thresholds were shifted downwards (0.10 - 0.20) to favor <strong>Recall (Sensitivity)</strong> over <strong>Precision</strong>, ensuring that the health risk advisor highlights potential warnings rather than missing sub-clinical exposures.
          </p>
        </div>
      </div>

      {/* Performance Summary Checklist */}
      <div className="border border-gray-100 rounded-xl p-4 text-xs flex gap-2.5 bg-emerald-50/10 border-emerald-100/50">
        <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-gray-900 block mb-0.5">Clinical Evaluation Strategy</span>
          <p className="text-gray-500 leading-relaxed">
            Models were verified using stratified k-fold cross-validation. Since early intervention is the core objective of preventive screening, models are tuned to flag patients early, encouraging preventive lifestyle changes and professional consultation.
          </p>
        </div>
      </div>

    </div>
  );
}
