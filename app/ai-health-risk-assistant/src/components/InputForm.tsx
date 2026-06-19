/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HealthProfileInputs } from '../types';
import { 
  Heart, 
  Droplet, 
  Activity, 
  Moon, 
  Flame, 
  Baby, 
  User, 
  Info,
  Scale,
  Sparkles,
  RefreshCw,
  PlusCircle,
  Stethoscope
} from 'lucide-react';

interface InputFormProps {
  onSubmit: (inputs: HealthProfileInputs) => void;
  isLoading: boolean;
  initialInputs?: HealthProfileInputs;
  onValuesChange?: (inputs: HealthProfileInputs) => void;
}

// Preset demographic archetypes for instant demonstration
const PRESETS: Record<string, HealthProfileInputs> = {
  athletic: {
    age: 28,
    gender: 'Male',
    height: 182,
    weight: 78,
    smoking: 'Never Smoked',
    systolic: 115,
    diastolic: 75,
    cholesterol: 'Normal',
    glucose: 85,
    physicalActivity: 210,
    sleepDuration: 8,
    generalHealth: 'Excellent',
    hypertension: false,
    familyHistoryHeart: false,
    familyHistoryDiabetes: false,
    alcohol: 'None',
    dietFruitVeg: true,
    difficultyWalking: false,
    everMarried: false,
    workType: 'Private',
    residenceType: 'Urban',
    cholesterolCheck: true,
    previousHeartAttack: false,
    mentalHealth: 1,
    kidneyDisease: false,
    education: 5,
    asthma: false
  },
  executive: {
    age: 49,
    gender: 'Male',
    height: 175,
    weight: 92,
    smoking: 'Active Smoker',
    systolic: 145,
    diastolic: 92,
    cholesterol: 'High',
    glucose: 112,
    physicalActivity: 30,
    sleepDuration: 5.5,
    generalHealth: 'Fair',
    hypertension: true,
    familyHistoryHeart: true,
    familyHistoryDiabetes: false,
    alcohol: 'Moderate',
    dietFruitVeg: false,
    difficultyWalking: false,
    everMarried: true,
    workType: 'Private',
    residenceType: 'Urban',
    cholesterolCheck: true,
    previousHeartAttack: false,
    mentalHealth: 10,
    kidneyDisease: false,
    education: 6,
    asthma: true
  },
  metabolic: {
    age: 68,
    gender: 'Female',
    height: 161,
    weight: 81,
    smoking: 'Former Smoker',
    systolic: 135,
    diastolic: 84,
    cholesterol: 'Borderline High',
    glucose: 142,
    physicalActivity: 45,
    sleepDuration: 7,
    generalHealth: 'Poor',
    hypertension: true,
    familyHistoryHeart: false,
    familyHistoryDiabetes: true,
    alcohol: 'None',
    dietFruitVeg: true,
    difficultyWalking: true,
    everMarried: true,
    workType: 'Self-employed',
    residenceType: 'Rural',
    cholesterolCheck: true,
    previousHeartAttack: true,
    mentalHealth: 5,
    kidneyDisease: true,
    education: 3,
    asthma: false
  }
};

export default function InputForm({ onSubmit, isLoading, initialInputs, onValuesChange }: InputFormProps) {
  const [inputs, setInputs] = useState<HealthProfileInputs>(() => {
    if (initialInputs) {
      return initialInputs;
    }
    return {
      age: 42,
      gender: 'Male',
      height: 175,
      weight: 78,
      smoking: 'Never Smoked',
      systolic: 120,
      diastolic: 80,
      cholesterol: 'Normal',
      glucose: 92,
      physicalActivity: 120,
      sleepDuration: 7,
      generalHealth: 'Good',
      hypertension: false,
      familyHistoryHeart: false,
      familyHistoryDiabetes: false,
      alcohol: 'Moderate',
      dietFruitVeg: true,
      difficultyWalking: false,
      everMarried: true,
      workType: 'Private',
      residenceType: 'Urban',
      cholesterolCheck: true,
      previousHeartAttack: false,
      mentalHealth: 2,
      kidneyDisease: false,
      education: 4,
      asthma: false
    };
  });

  const [imperial, setImperial] = useState(() => {
    const base = initialInputs || { height: 175, weight: 78 };
    const totInches = base.height / 2.54;
    return {
      feet: Math.floor(totInches / 12),
      inches: Math.round(totInches % 12),
      lbs: Math.round(base.weight / 0.453592)
    };
  });

  const [useImperial, setUseImperial] = useState(false);

  // Sync state to parent stably to persist if user navigates away
  const serializedInputs = JSON.stringify(inputs);
  useEffect(() => {
    if (onValuesChange) {
      onValuesChange(JSON.parse(serializedInputs));
    }
  }, [serializedInputs, onValuesChange]);

  // Sync metric height/weight back and forth with Imperial
  useEffect(() => {
    if (useImperial) {
      const calculatedHeight = Math.round((imperial.feet * 30.48) + (imperial.inches * 2.54));
      const calculatedWeight = Math.round(imperial.lbs * 0.453592);
      setInputs(prev => ({
        ...prev,
        height: calculatedHeight,
        weight: calculatedWeight
      }));
    }
  }, [imperial, useImperial]);

  // Sync imperial inputs back if metric is adjusted
  const updateMetric = (key: 'height' | 'weight', value: number) => {
    setInputs(prev => {
      const next = { ...prev, [key]: value };
      if (!useImperial) {
        // Keeps imperial state sync ready
        const totInches = next.height / 2.54;
        const feet = Math.floor(totInches / 12);
        const inches = Math.round(totInches % 12);
        const lbs = Math.round(next.weight / 0.453592);
        setImperial({ feet, inches, lbs });
      }
      return next;
    });
  };

  const handlePresetSelect = (presetKey: keyof typeof PRESETS) => {
    const selected = PRESETS[presetKey];
    setInputs(selected);
    const totInches = selected.height / 2.54;
    setImperial({
      feet: Math.floor(totInches / 12),
      inches: Math.round(totInches % 12),
      lbs: Math.round(selected.weight / 0.453592)
    });
  };

  // BMI calculations
  const heightM = inputs.height / 100;
  const bmi = heightM > 0 ? (inputs.weight / (heightM * heightM)) : 0;

  const getBmiCategory = (val: number) => {
    if (val < 18.5) return { label: 'Underweight', color: 'text-amber-500 bg-amber-50' };
    if (val < 25) return { label: 'Optimal Weight', color: 'text-emerald-600 bg-emerald-50' };
    if (val < 30) return { label: 'Overweight', color: 'text-orange-500 bg-orange-50' };
    return { label: 'Obese Range', color: 'text-rose-600 bg-rose-50' };
  };

  const bmiCat = getBmiCategory(bmi);

  const getBpCategory = (sys: number, dia: number) => {
    if (sys < 120 && dia < 80) return { label: 'Normal Blood Pressure', color: 'text-emerald-600' };
    if (sys >= 120 && dia < 80) return { label: 'Elevated Blood Pressure', color: 'text-emerald-600' };
    if ((sys >= 130 && sys < 140) || (dia >= 80 && dia < 90)) return { label: 'Stage 1 Hypertension', color: 'text-orange-500' };
    if (sys >= 140 || dia >= 90) return { label: 'Stage 2 Hypertension', color: 'text-rose-600' };
    return { label: 'Elevated Pressure', color: 'text-amber-500' };
  };

  const bpCat = getBpCategory(inputs.systolic, inputs.diastolic);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...inputs,
      // Provide clean computed BMI
      ...({ bmi: Math.round(bmi * 10) / 10 })
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" id="health-intake-module">
      {/* Clinician Presets Bar */}
      <div className="bg-gray-50/70 border-b border-gray-100 p-4">
        <label className="block text-xs font-semibold text-gray-500 tracking-wider uppercase mb-2">
          Demonstration Presets
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            id="preset-athletic-btn"
            onClick={() => handlePresetSelect('athletic')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 border ${
              inputs.age === 28 && inputs.physicalActivity === 210
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-emerald-500" />
            Active Athlete
          </button>
          
          <button
            type="button"
            id="preset-executive-btn"
            onClick={() => handlePresetSelect('executive')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 border ${
              inputs.age === 49 && inputs.smoking === 'Active Smoker'
                ? 'bg-rose-50 border-rose-200 text-rose-800 shadow-sm'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-rose-500" />
            Sedentary Exec
          </button>

          <button
            type="button"
            id="preset-metabolic-btn"
            onClick={() => handlePresetSelect('metabolic')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 border ${
              inputs.age === 68 && inputs.familyHistoryDiabetes
                ? 'bg-orange-50 border-orange-200 text-orange-800 shadow-sm'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Droplet className="w-3.5 h-3.5 text-orange-500" />
            Elderly Risk
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <User className="text-indigo-600 w-5 h-5" />
            Health Intake Dossier
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Complete the biometrics and behavioral fields below to query clinical risks.
          </p>
        </div>

        {/* Input Blocks */}
        <div className="space-y-6">
          
          {/* Section 1: Demographics */}
          <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-500" />
              1. Demographics & Profile
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="age" className="block text-xs font-medium text-gray-700 mb-1.5">
                  Age (Years)
                </label>
                <input
                  type="number"
                  id="age"
                  min="18"
                  max="120"
                  required
                  value={inputs.age}
                  onChange={e => setInputs(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="gender" className="block text-xs font-medium text-gray-700 mb-1.5">
                  Biological Sex
                </label>
                <select
                  id="gender"
                  value={inputs.gender}
                  onChange={e => setInputs(prev => ({ ...prev, gender: e.target.value as any }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="everMarried" className="block text-xs font-medium text-gray-700 mb-1.5">
                  Ever Married?
                </label>
                <select
                  id="everMarried"
                  value={inputs.everMarried ? "Yes" : "No"}
                  onChange={e => setInputs(prev => ({ ...prev, everMarried: e.target.value === "Yes" }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label htmlFor="education" className="block text-xs font-medium text-gray-700 mb-1.5">
                  Education Level
                </label>
                <select
                  id="education"
                  value={inputs.education}
                  onChange={e => setInputs(prev => ({ ...prev, education: parseInt(e.target.value) || 4 }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="1">Grade school or less</option>
                  <option value="2">Some High School</option>
                  <option value="3">High School Graduate</option>
                  <option value="4">Some College</option>
                  <option value="5">College Graduate</option>
                  <option value="6">Advanced / Professional Degree</option>
                </select>
              </div>

              <div>
                <label htmlFor="workType" className="block text-xs font-medium text-gray-700 mb-1.5">
                  Employment Type
                </label>
                <select
                  id="workType"
                  value={inputs.workType}
                  onChange={e => setInputs(prev => ({ ...prev, workType: e.target.value as any }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Private">Private Company</option>
                  <option value="Self-employed">Self-employed</option>
                  <option value="Govt_job">Government Job</option>
                  <option value="children">Child / Minor</option>
                  <option value="Never_worked">Never Worked</option>
                </select>
              </div>

              <div>
                <label htmlFor="residenceType" className="block text-xs font-medium text-gray-700 mb-1.5">
                  Residence Area
                </label>
                <select
                  id="residenceType"
                  value={inputs.residenceType}
                  onChange={e => setInputs(prev => ({ ...prev, residenceType: e.target.value as any }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Urban">Urban</option>
                  <option value="Rural">Rural</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Somatic Dimensions (Height, Weight, BMI) */}
          <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-indigo-500" />
                2. Somatic Dimensions
              </span>
              <div className="flex bg-white rounded-lg p-0.5 border border-gray-200 text-xs">
                <button
                  type="button"
                  onClick={() => setUseImperial(false)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${!useImperial ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-500'}`}
                >
                  Metric
                </button>
                <button
                  type="button"
                  onClick={() => setUseImperial(true)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${useImperial ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-500'}`}
                >
                  Imperial
                </button>
              </div>
            </div>

            {useImperial ? (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="imperial-feet" className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Feet</label>
                  <input
                    type="number"
                    id="imperial-feet"
                    min="3"
                    max="8"
                    value={imperial.feet}
                    onChange={e => setImperial(prev => ({ ...prev, feet: parseInt(e.target.value) || 5 }))}
                    className="w-full text-center bg-white rounded-lg border border-gray-200 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="imperial-inches" className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Inches</label>
                  <input
                    type="number"
                    id="imperial-inches"
                    min="0"
                    max="11"
                    value={imperial.inches}
                    onChange={e => setImperial(prev => ({ ...prev, inches: parseInt(e.target.value) || 0 }))}
                    className="w-full text-center bg-white rounded-lg border border-gray-200 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="imperial-lbs" className="block text-[10px] uppercase font-bold text-gray-500 mb-1">lbs</label>
                  <input
                    type="number"
                    id="imperial-lbs"
                    min="50"
                    max="500"
                    value={imperial.lbs}
                    onChange={e => setImperial(prev => ({ ...prev, lbs: parseInt(e.target.value) || 120 }))}
                    className="w-full text-center bg-white rounded-lg border border-gray-200 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="height-cm" className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    id="height-cm"
                    min="100"
                    max="250"
                    value={inputs.height}
                    onChange={e => updateMetric('height', parseInt(e.target.value) || 170)}
                    className="w-full bg-white rounded-lg border border-gray-200 py-2 px-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="weight-kg" className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    id="weight-kg"
                    min="30"
                    max="250"
                    value={inputs.weight}
                    onChange={e => updateMetric('weight', parseInt(e.target.value) || 70)}
                    className="w-full bg-white rounded-lg border border-gray-200 py-2 px-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Simulated Live BMI Indicator */}
            <div className="bg-white border border-gray-100 p-3 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 block uppercase">Calculated Somatic Index</span>
                <span className="text-sm font-semibold text-gray-800">BMI: {bmi.toFixed(1)}</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${bmiCat.color}`}>
                {bmiCat.label}
              </span>
            </div>
          </div>

          {/* Section 3: Cardiovascular and Glycemic Markers */}
          <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-500" />
              3. Clinical & Cardiovascular Metrics
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="systolic" className="block text-xs font-medium text-gray-700 mb-1">
                  Systolic BP (mmHg)
                </label>
                <input
                  type="number"
                  id="systolic"
                  min="70"
                  max="240"
                  value={inputs.systolic}
                  onChange={e => setInputs(prev => ({ ...prev, systolic: parseInt(e.target.value) || 120 }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label htmlFor="diastolic" className="block text-xs font-medium text-gray-700 mb-1">
                  Diastolic BP (mmHg)
                </label>
                <input
                  type="number"
                  id="diastolic"
                  min="40"
                  max="140"
                  value={inputs.diastolic}
                  onChange={e => setInputs(prev => ({ ...prev, diastolic: parseInt(e.target.value) || 80 }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <p className="text-[10px] font-semibold text-gray-500 -mt-2 pl-1 italic">
              Blood pressure state: <span className={bpCat.color}>{bpCat.label}</span>
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="cholesterol" className="block text-xs font-medium text-gray-700 mb-1.5">
                  Cholesterol Status
                </label>
                <select
                  id="cholesterol"
                  value={inputs.cholesterol}
                  onChange={e => setInputs(prev => ({ ...prev, cholesterol: e.target.value as any }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  <option value="Normal">Normal (&lt;200 mg/dL)</option>
                  <option value="Borderline High">Borderline (200-239 mg/dL)</option>
                  <option value="High">High (&ge;240 mg/dL)</option>
                </select>
              </div>

              <div>
                <label htmlFor="glucose" className="block text-xs font-medium text-gray-700 mb-1.5">
                  Avg Glucose / Fasting (mg/dL)
                </label>
                <input
                  type="number"
                  id="glucose"
                  min="50"
                  max="300"
                  value={inputs.glucose}
                  onChange={e => setInputs(prev => ({ ...prev, glucose: parseInt(e.target.value) || 90 }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Behavior, Lifestyle & Well-being */}
          <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-indigo-500" />
              4. Lifestyle & General Well-being
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="smoking" className="block text-xs font-medium text-gray-700 mb-1.5">
                  Smoking Status
                </label>
                <select
                  id="smoking"
                  value={inputs.smoking}
                  onChange={e => setInputs(prev => ({ ...prev, smoking: e.target.value as any }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  <option value="Never Smoked">Never Smoked</option>
                  <option value="Former Smoker">Former Smoker</option>
                  <option value="Active Smoker">Active Smoker</option>
                </select>
              </div>

              <div>
                <label htmlFor="alcohol" className="block text-xs font-medium text-gray-700 mb-1.5">
                  Alcohol Consumption
                </label>
                <select
                  id="alcohol"
                  value={inputs.alcohol}
                  onChange={e => setInputs(prev => ({ ...prev, alcohol: e.target.value as any }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  <option value="None">None / Rarely</option>
                  <option value="Moderate">Moderate Drinking</option>
                  <option value="Heavy">Heavy Drinking</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="physicalActivity" className="block text-xs font-medium text-gray-700 mb-1.5">
                  Exercise (Mins/Week)
                </label>
                <input
                  type="number"
                  id="physicalActivity"
                  min="0"
                  max="1000"
                  value={inputs.physicalActivity}
                  onChange={e => setInputs(prev => ({ ...prev, physicalActivity: parseInt(e.target.value) || 0 }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label htmlFor="sleepDuration" className="block text-xs font-medium text-gray-700 mb-1.5">
                  Sleep Time (Hours/Night)
                </label>
                <input
                  type="number"
                  id="sleepDuration"
                  min="3"
                  max="14"
                  value={inputs.sleepDuration}
                  onChange={e => setInputs(prev => ({ ...prev, sleepDuration: parseInt(e.target.value) || 7 }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="generalHealth" className="block text-xs font-medium text-gray-700 mb-1.5">
                  Self Health Evaluation
                </label>
                <select
                  id="generalHealth"
                  value={inputs.generalHealth}
                  onChange={e => setInputs(prev => ({ ...prev, generalHealth: e.target.value as any }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Very Good">Very Good</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>

              <div>
                <label htmlFor="mentalHealth" className="block text-xs font-medium text-gray-700 mb-1.5">
                  Mental Health (Poor Days/Month)
                </label>
                <input
                  type="number"
                  id="mentalHealth"
                  min="0"
                  max="30"
                  value={inputs.mentalHealth}
                  onChange={e => setInputs(prev => ({ ...prev, mentalHealth: parseInt(e.target.value) || 0 }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Co-morbidities & Hereditary Factors */}
          <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-indigo-500" />
              5. Co-morbidities & Clinical History
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              
              <label 
                htmlFor="hypertension"
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${
                  inputs.hypertension 
                    ? 'border-indigo-200 bg-indigo-50/50 text-indigo-900 font-medium shadow-2xs' 
                    : 'border-gray-150 hover:bg-gray-50 text-gray-600 bg-white'
                }`}
              >
                <input
                  id="hypertension"
                  type="checkbox"
                  checked={inputs.hypertension}
                  onChange={e => setInputs(prev => ({ ...prev, hypertension: e.target.checked }))}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                Hypertension Dx
              </label>

              <label 
                htmlFor="cholesterolCheck"
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${
                  inputs.cholesterolCheck 
                    ? 'border-indigo-200 bg-indigo-50/50 text-indigo-900 font-medium shadow-2xs' 
                    : 'border-gray-150 hover:bg-gray-50 text-gray-600 bg-white'
                }`}
              >
                <input
                  id="cholesterolCheck"
                  type="checkbox"
                  checked={inputs.cholesterolCheck}
                  onChange={e => setInputs(prev => ({ ...prev, cholesterolCheck: e.target.checked }))}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                Cholesterol Checked
              </label>

              <label 
                htmlFor="previousHeartAttack"
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${
                  inputs.previousHeartAttack 
                    ? 'border-indigo-200 bg-indigo-50/50 text-indigo-900 font-medium shadow-2xs' 
                    : 'border-gray-150 hover:bg-gray-50 text-gray-600 bg-white'
                }`}
              >
                <input
                  id="previousHeartAttack"
                  type="checkbox"
                  checked={inputs.previousHeartAttack}
                  onChange={e => setInputs(prev => ({ ...prev, previousHeartAttack: e.target.checked }))}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                Heart Disease Hist.
              </label>

              <label 
                htmlFor="kidneyDisease"
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${
                  inputs.kidneyDisease 
                    ? 'border-indigo-200 bg-indigo-50/50 text-indigo-900 font-medium shadow-2xs' 
                    : 'border-gray-150 hover:bg-gray-50 text-gray-600 bg-white'
                }`}
              >
                <input
                  id="kidneyDisease"
                  type="checkbox"
                  checked={inputs.kidneyDisease}
                  onChange={e => setInputs(prev => ({ ...prev, kidneyDisease: e.target.checked }))}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                Kidney Disease Dx
              </label>

              <label 
                htmlFor="asthma"
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${
                  inputs.asthma 
                    ? 'border-indigo-200 bg-indigo-50/50 text-indigo-900 font-medium shadow-2xs' 
                    : 'border-gray-150 hover:bg-gray-50 text-gray-600 bg-white'
                }`}
              >
                <input
                  id="asthma"
                  type="checkbox"
                  checked={inputs.asthma}
                  onChange={e => setInputs(prev => ({ ...prev, asthma: e.target.checked }))}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                Asthma Dx
              </label>

              <label 
                htmlFor="dietFruitVeg"
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${
                  inputs.dietFruitVeg 
                    ? 'border-indigo-200 bg-indigo-50/50 text-indigo-900 font-medium shadow-2xs' 
                    : 'border-gray-150 hover:bg-gray-50 text-gray-600 bg-white'
                }`}
              >
                <input
                  id="dietFruitVeg"
                  type="checkbox"
                  checked={inputs.dietFruitVeg}
                  onChange={e => setInputs(prev => ({ ...prev, dietFruitVeg: e.target.checked }))}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                Veg & Fruits Daily
              </label>

              <label 
                htmlFor="familyHistoryHeart"
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${
                  inputs.familyHistoryHeart 
                    ? 'border-indigo-200 bg-indigo-50/50 text-indigo-900 font-medium shadow-2xs' 
                    : 'border-gray-150 hover:bg-gray-50 text-gray-600 bg-white'
                }`}
              >
                <input
                  id="familyHistoryHeart"
                  type="checkbox"
                  checked={inputs.familyHistoryHeart}
                  onChange={e => setInputs(prev => ({ ...prev, familyHistoryHeart: e.target.checked }))}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                Heart Disease FHx
              </label>

              <label 
                htmlFor="familyHistoryDiabetes"
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${
                  inputs.familyHistoryDiabetes 
                    ? 'border-indigo-200 bg-indigo-50/50 text-indigo-900 font-medium shadow-2xs' 
                    : 'border-gray-150 hover:bg-gray-50 text-gray-600 bg-white'
                }`}
              >
                <input
                  id="familyHistoryDiabetes"
                  type="checkbox"
                  checked={inputs.familyHistoryDiabetes}
                  onChange={e => setInputs(prev => ({ ...prev, familyHistoryDiabetes: e.target.checked }))}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                Diabetes FHx
              </label>

              <label 
                htmlFor="difficultyWalking"
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${
                  inputs.difficultyWalking 
                    ? 'border-indigo-200 bg-indigo-50/50 text-indigo-900 font-medium shadow-2xs' 
                    : 'border-gray-150 hover:bg-gray-50 text-gray-600 bg-white'
                }`}
              >
                <input
                  id="difficultyWalking"
                  type="checkbox"
                  checked={inputs.difficultyWalking}
                  onChange={e => setInputs(prev => ({ ...prev, difficultyWalking: e.target.checked }))}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                Difficulty Walking
              </label>

            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          id="submit-prediction-btn"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-sm font-semibold tracking-wide transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Compiling Epidemiological Inference...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-indigo-200" />
              Generate Health Intelligence Report
            </>
          )}
        </button>
      </form>
    </div>
  );
}
