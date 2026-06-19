/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HealthProfileInputs, RiskAssessmentResult } from './types';
import InputForm from './components/InputForm';
import RiskGauge from './components/RiskGauge';
import ShapExplanation from './components/ShapExplanation';
import CrossDisease from './components/CrossDisease';
import Recommendations from './components/Recommendations';
import ModelMetrics from './components/ModelMetrics';
import { 
  ShieldAlert, Heart, Award, Activity, Stethoscope, Sparkles, Info, RefreshCw, Clock, Brain,
  Droplet, Eye, Layers, ArrowRight, ClipboardList, ChevronRight, Sparkle, BarChart3
} from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'form' | 'dashboard'>('form');
  const [userInputs, setUserInputs] = useState<HealthProfileInputs | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RiskAssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Sticky-Hide & Scroll-to-Reveal Navigation State
  const [showHeader, setShowHeader] = useState(true);

  useEffect(() => {
    let lastScrollY = window.pageYOffset;
    const handleScroll = () => {
      const currentScrollY = window.pageYOffset;
      if (currentScrollY < 80) {
        setShowHeader(true);
        return;
      }
      if (currentScrollY > lastScrollY) {
        setShowHeader(false); // Scrolling down - hide
      } else {
        setShowHeader(true); // Scrolling up - reveal
      }
      lastScrollY = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePredict = async (inputs: HealthProfileInputs) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/predict-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs)
      });
      
      if (!response.ok) {
        throw new Error('Inference server returned error. Recalculating fallback routines.');
      }
      
      const data = await response.json();
      setResult(data);
      setActiveTab('overview');
      setCurrentPage('dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Inference Engine connection lost.");
    } finally {
      setIsLoading(false);
    }
  };

  // Compute composite overall wellness score
  const getOverallWellnessMetric = (res: RiskAssessmentResult) => {
    const averageRisk = (res.heartDiseaseRisk.score + res.strokeRisk.score + res.diabetesRisk.score) / 3;
    const overallScore = Math.max(5, Math.round(100 - averageRisk));
    
    let level = "Good / Minimal Exposure";
    let colorTheme = {
      text: 'text-emerald-700',
      bg: 'bg-emerald-50/50',
      border: 'border-emerald-100',
      progress: 'stroke-emerald-500',
      badge: 'bg-emerald-100 text-emerald-800'
    };

    if (overallScore >= 80) {
      level = "Extremely Protective Status";
      colorTheme = {
        text: 'text-emerald-700',
        bg: 'bg-emerald-50/40',
        border: 'border-emerald-100',
        progress: 'stroke-emerald-500',
        badge: 'bg-emerald-200 text-emerald-900 shadow-2xs'
      };
    } else if (overallScore >= 65) {
      level = "Moderate Defensive Shield";
      colorTheme = {
        text: 'text-indigo-700',
        bg: 'bg-indigo-50/40',
        border: 'border-indigo-100',
        progress: 'stroke-indigo-500',
        badge: 'bg-indigo-100 text-indigo-800'
      };
    } else if (overallScore >= 45) {
      level = "Sub-clinical Metabolic Strain";
      colorTheme = {
        text: 'text-amber-700',
        bg: 'bg-amber-50/30',
        border: 'border-amber-100',
        progress: 'stroke-amber-500',
        badge: 'bg-amber-100 text-amber-800'
      };
    } else {
      level = "High Combined Syndemic Exposure";
      colorTheme = {
        text: 'text-rose-700',
        bg: 'bg-rose-50/30',
        border: 'border-rose-100',
        progress: 'stroke-rose-500',
        badge: 'bg-rose-100 text-rose-800'
      };
    }

    return { overallScore, level, colorTheme };
  };

  // Helper filters for disease tabs
  const getDiseaseHighlights = (diseaseName: 'Heart Disease' | 'Stroke' | 'Diabetes') => {
    if (!result) return { shapIncreasing: [], shapDecreasing: [], recs: [] };

    const shapIncreasing = result.shapAnalysis.increasingFactors.filter(f => f.disease === diseaseName || f.disease === 'Multi-Disease');
    const shapDecreasing = result.shapAnalysis.decreasingFactors.filter(f => f.disease === diseaseName || f.disease === 'Multi-Disease');
    
    let recs: any[] = [];
    if (diseaseName === 'Heart Disease') {
      recs = result.recommendations.filter(rec => 
        rec.description.toLowerCase().includes('heart') ||
        rec.description.toLowerCase().includes('cardio') ||
        rec.description.toLowerCase().includes('blood pressure') ||
        rec.description.toLowerCase().includes('systolic') ||
        rec.description.toLowerCase().includes('cholesterol') ||
        rec.description.toLowerCase().includes('smoking') ||
        rec.title.toLowerCase().includes('smoking') ||
        rec.title.toLowerCase().includes('heart') ||
        rec.category.toLowerCase() === 'medical management'
      );
    } else if (diseaseName === 'Stroke') {
      recs = result.recommendations.filter(rec => 
        rec.description.toLowerCase().includes('stroke') ||
        rec.description.toLowerCase().includes('cerebral') ||
        rec.description.toLowerCase().includes('blood pressure') ||
        rec.description.toLowerCase().includes('systolic') ||
        rec.description.toLowerCase().includes('sleep') ||
        rec.description.toLowerCase().includes('smoking') ||
        rec.title.toLowerCase().includes('smoking') ||
        rec.title.toLowerCase().includes('sleep')
      );
    } else {
      recs = result.recommendations.filter(rec => 
        rec.description.toLowerCase().includes('diabetes') ||
        rec.description.toLowerCase().includes('glucose') ||
        rec.description.toLowerCase().includes('insulin') ||
        rec.description.toLowerCase().includes('weight') ||
        rec.description.toLowerCase().includes('bmi') ||
        rec.description.toLowerCase().includes('diet') ||
        rec.title.toLowerCase().includes('weight') ||
        rec.category.toLowerCase() === 'diet' ||
        rec.category.toLowerCase() === 'weight management'
      );
    }

    if (recs.length === 0) {
      recs = result.recommendations.slice(0, 2);
    }

    return { shapIncreasing, shapDecreasing, recs };
  };

  const TABS = [
    { id: 'overview', name: 'Overview', icon: Activity },
    { id: 'heart', name: 'Heart Disease', icon: Heart },
    { id: 'stroke', name: 'Stroke', icon: Brain },
    { id: 'diabetes', name: 'Diabetes', icon: Droplet },
    { id: 'shap', name: 'Explainable AI', icon: Eye },
    { id: 'recommendations', name: 'Recommendations', icon: Award },
    { id: 'cross', name: 'Cross-Disease Analysis', icon: Layers },
    { id: 'metrics', name: 'Model Evaluation', icon: BarChart3 }
  ];

  return (
    <div className="min-h-screen bg-gray-50/40 text-gray-905 font-sans antialiased flex flex-col justify-between" id="applet-viewport">
      
      {/* Premium Medical Workspace Header */}
      <header className="bg-indigo-950 border-b border-indigo-900 text-white relative py-6 px-4 md:px-8 shadow-xs" id="workspace-header">
        <div className="absolute inset-0 bg-linear-to-r from-indigo-950 via-indigo-900 to-indigo-950 opacity-90"></div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/30 border border-indigo-500/30 rounded-2xl flex items-center justify-center shadow-inner">
              <Stethoscope className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                 AI Health Risk Advisor
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/20 tracking-wider uppercase">
                  v3.5 Live
                </span>
              </h1>
              <p className="text-xs text-indigo-200">
                Preventative Clinical Risk Estimator & Cross-Morbidity SHAP Explainer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-indigo-200">
            {currentPage === 'dashboard' && (
              <button
                onClick={() => setCurrentPage('form')}
                className="hidden sm:flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 rounded-lg border border-indigo-500 text-white transition-colors cursor-pointer text-xs font-bold"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Intake Form</span>
              </button>
            )}
            <div className="flex items-center gap-1.5 bg-indigo-900/50 px-3 py-1.5 rounded-lg border border-indigo-800">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Diagnostic Mode: High-Fidelity Gemini Inference</span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Core Body Segment */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex-1 w-full" id="primary-grid">
        
        {/* PAGE 1: HEALTH ASSESSMENT INPUT FORM */}
        {currentPage === 'form' && (
          <div className="max-w-3xl mx-auto space-y-8 animate-fade-in" id="form-layout-page">
            
            {/* Introductory Header Banner to Intake */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-xs relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
              <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 opacity-5">
                <Stethoscope className="w-64 h-64 text-indigo-950" />
              </div>

              <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 shrink-0">
                <Activity className="w-10 h-10 animate-pulse text-indigo-600" />
              </div>

              <div className="space-y-2 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className="text-[10px] uppercase font-black px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full tracking-wider">
                    Prevention First
                  </span>
                  <span className="text-[10px] uppercase font-black px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-full tracking-wider flex items-center gap-1">
                    <Sparkle className="w-3 h-3 text-rose-600" />
                    Multi-Model
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Create your Preventive Clinical Health Profile</h2>
                <p className="text-xs text-gray-500 leading-relaxed max-w-xl">
                  Register your cardiac metrics, somatic parameters, and daily lifestyle markers in the clinical dossier below.  AI compiles these drivers across heart disease, stroke, and diabetes risk vectors instantly.
                </p>
              </div>
            </div>

            {/* Error alignment */}
            {error && (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 flex gap-3 text-xs" id="error-card">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-rose-900 block mb-1">Inference Alignment Error</span>
                  <p className="text-rose-700 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {/* Main questionnaire form */}
            <div className="relative">
              {isLoading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-xs rounded-2xl z-40 flex flex-col items-center justify-center space-y-6" id="assessment-loader">
                  <div className="relative">
                    <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin" />
                    <div className="absolute inset-0 m-auto w-3 h-3 bg-indigo-250 rounded-full"></div>
                  </div>
                  <div className="text-center space-y-2 px-6">
                    <h3 className="font-bold text-gray-950 text-base">Compiling Health Intelligence Report</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                      Calculating clinical hazard coefficients & aligning multi-morbidity SHAP models dynamically using advanced epidemiological datasets...
                    </p>
                  </div>
                </div>
              )}
              
              <InputForm 
                onSubmit={handlePredict} 
                isLoading={isLoading} 
                initialInputs={userInputs}
                onValuesChange={setUserInputs}
              />
            </div>

            {/* Side-by-side informational footer segment */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-500 pt-2">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                <span className="font-bold text-gray-800 block">1. Biometric Alignment</span>
                <p className="leading-relaxed text-[11px]">Inputs are standardized and aligned directly against physical indicators from recent cardiometabolic datasets.</p>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                <span className="font-bold text-gray-800 block">2. Model Weighting</span>
                <p className="leading-relaxed text-[11px]">Calculates coefficients for separate prediction targets: Stroke risk, Heart Disease risk, and Type II Diabetes.</p>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                <span className="font-bold text-gray-800 block">3. Explanatory SHAP Analysis</span>
                <p className="leading-relaxed text-[11px]">Unveils real-time biometric attributions, showing precisely why risk metrics fluctuate based on lifestyle changes.</p>
              </div>
            </div>

          </div>
        )}

        {/* PAGE 2: ANALYTICS DASHBOARD PAGE */}
        {currentPage === 'dashboard' && result && (
          <div className="space-y-6 animate-fade-in" id="dashboard-layout-page">
            
            {/* STICKY-HIDE / SCROLL-TO-REVEAL NAVIGATION COMBINED SELECTOR CARD */}
            <div className={`sticky top-0 z-40 transition-all duration-500 ease-in-out bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 p-2 shadow-sm ${
              showHeader ? 'translate-y-0 opacity-100' : '-translate-y-16 opacity-0 pointer-events-none'
            }`} id="sticky-header-tabs-wrapper">
              
              {/* Mobile Dropdown (shown on small screens) */}
              <div className="block md:hidden p-1" id="mobile-tab-selector">
                <div className="relative">
                  <select
                    id="tab-select"
                    value={activeTab}
                    onChange={(e) => setActiveTab(e.target.value)}
                    className="w-full bg-linear-to-r from-gray-50 to-white border border-gray-200 hover:border-indigo-600 text-gray-800 font-bold px-4 py-2.5 rounded-xl focus:border-indigo-650 focus:ring-1 focus:ring-indigo-600 outline-hidden transition-all text-xs cursor-pointer appearance-none"
                  >
                    {TABS.map((tab) => (
                      <option key={tab.id} value={tab.id}>
                        {tab.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600">
                    <svg className="w-4 h-4 stroke-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Tablet & Desktop Tab bar (shown on larger screens, strictly single-row) */}
              <div className="hidden md:block" id="dashboard-tab-bar">
                <nav className="flex flex-row flex-nowrap overflow-x-auto scrollbar-none gap-1 md:gap-1.5 p-0.5" aria-label="Tabs">
                  {TABS.map((tab) => {
                    const TabIcon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`group flex items-center justify-center p-2.5 md:px-4 md:py-2.5 text-[11px] md:text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer shrink-0 ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-950 hover:bg-gray-100'
                        }`}
                        id={`tab-button-${tab.id}`}
                      >
                        <TabIcon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-950'}`} />
                        <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                          isActive
                            ? 'max-w-xs opacity-100 ml-1.5 md:ml-2'
                            : 'max-w-0 md:max-w-xs opacity-0 md:opacity-100 md:ml-2 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-1.5 group-focus:max-w-xs group-focus:opacity-100 group-focus:ml-1.5 active:max-w-xs active:opacity-100 active:ml-1.5'
                        }`}>
                          {tab.name}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>

            </div>

            {/* Dynamic tab contents panel */}
            <div className="min-h-125" id="tab-content-panel">

              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-6 animate-fade-in" id="overview-tab-content">
                  
                  {/* Overall Wellness Core Index Card */}
                  {(() => {
                    const { overallScore, level, colorTheme } = getOverallWellnessMetric(result);
                    const risks = [
                      { label: 'Heart Disease', score: result.heartDiseaseRisk.score, tabId: 'heart', color: 'text-rose-600' },
                      { label: 'Stroke', score: result.strokeRisk.score, tabId: 'stroke', color: 'text-indigo-600' },
                      { label: 'Diabetes', score: result.diabetesRisk.score, tabId: 'diabetes', color: 'text-orange-600' }
                    ];
                    const sortedRisks = [...risks].sort((a, b) => b.score - a.score);
                    const highestRisk = sortedRisks[0];
                    const lowestRisk = sortedRisks[2];

                    return (
                      <div className={`p-6 md:p-8 rounded-3xl border ${colorTheme.border} ${colorTheme.bg} flex flex-col md:flex-row gap-6 md:gap-8 items-center shadow-xs`}>
                        
                        {/* Radial Wellness Score Ring */}
                        <div className="relative shrink-0 flex items-center justify-center w-36 h-36">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="72"
                              cy="72"
                              r="56"
                              className="stroke-gray-100/70"
                              strokeWidth="12"
                              fill="transparent"
                            />
                            <circle
                              cx="72"
                              cy="72"
                              r="56"
                              className={`${colorTheme.progress} transition-all duration-1000 ease-out`}
                              strokeWidth="12"
                              strokeDasharray={2 * Math.PI * 56}
                              strokeDashoffset={2 * Math.PI * 56 - (overallScore / 100) * (2 * Math.PI * 56)}
                              strokeLinecap="round"
                              fill="transparent"
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center">
                            <span className="text-3xl font-black text-gray-900 leading-none">{overallScore}%</span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase mt-1 tracking-wider">Health Index</span>
                          </div>
                        </div>

                        {/* Dynamic Clinical Summary */}
                        <div className="space-y-3 flex-1 text-center md:text-left">
                          <div className="space-y-1">
                            <span className={`inline-block text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full ${colorTheme.badge}`}>
                              {level}
                            </span>
                            <h3 className="text-base font-bold text-gray-900">Preventive Biometric Health Digest</h3>
                          </div>
                          <p className="text-xs text-gray-650 leading-relaxed">
                            Your overall risk-adjusted index is <strong className="text-gray-900">{overallScore}/100</strong>. Your highest clinical risk exposure lies in <strong className={highestRisk.color}>{highestRisk.label} Risk</strong> estimated at <strong className="text-gray-900">{highestRisk.score}%</strong>. Conversely, <strong className={lowestRisk.color}>{lowestRisk.label} Risk</strong> represents your minimal exposure score at <strong className="text-gray-900">{lowestRisk.score}%</strong>.
                          </p>
                          
                          {/* Interactive Quick navigation links */}
                          <div className="flex flex-wrap gap-2.5 pt-1.5 justify-center md:justify-start">
                            <button
                              onClick={() => setActiveTab(highestRisk.tabId)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-white border border-indigo-100 hover:bg-indigo-50/50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
                            >
                              <span>Inspect {highestRisk.label} Drivers</span>
                              <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                            </button>
                            <button
                              onClick={() => setActiveTab('cross')}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
                            >
                              <span>Syndemic Overlaps</span>
                              <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Somatic Hazard Distributions */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Somatic Hazard Distributions
                      </h3>
                      <span className="text-xs text-indigo-600 font-bold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                        Interactive Risk Analysis
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <RiskGauge
                        label="Heart Disease Risk"
                        score={result.heartDiseaseRisk.score}
                        level={result.heartDiseaseRisk.level}
                        explanation={result.heartDiseaseRisk.explanation}
                      />
                      <RiskGauge
                        label="Stroke Risk"
                        score={result.strokeRisk.score}
                        level={result.strokeRisk.level}
                        explanation={result.strokeRisk.explanation}
                      />
                      <RiskGauge
                        label="Diabetes Risk"
                        score={result.diabetesRisk.score}
                        level={result.diabetesRisk.level}
                        explanation={result.diabetesRisk.explanation}
                      />
                    </div>
                  </div>

                  {/* Brief Navigation teaser card */}
                  <div className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-50 rounded-xl">
                        <Eye className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="text-xs text-left">
                        <h4 className="font-bold text-gray-900 leading-snug">Dive Deeper with Explainable AI</h4>
                        <p className="text-[10px] text-gray-450 mt-0.5">Understand how your blood pressure, sleep, and activity directly impact calculations.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('shap')}
                      className="p-1 px-3 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer shrink-0"
                    >
                      Explore SHAP Elements →
                    </button>
                  </div>

                </div>
              )}

              {/* HEART DISEASE TAB */}
              {activeTab === 'heart' && (
                <div className="space-y-6 animate-fade-in" id="heart-tab-content">
                  <div className="bg-white border border-gray-100/90 rounded-2xl p-6 md:p-8 space-y-6">
                    
                    <div className="border-b border-gray-100 pb-4">
                      <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <Heart className="text-rose-500 w-5 h-5 animate-pulse" />
                        Cardiovascular Risk & SHAP Attributions
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Dedicated cardiac preventive dossier outlining biological drivers and medical lifestyle triggers.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                      
                      {/* Left column: Heart Risk Gauge */}
                      <div className="h-full">
                        <RiskGauge
                          label="Heart Disease Risk"
                          score={result.heartDiseaseRisk.score}
                          level={result.heartDiseaseRisk.level}
                          explanation={result.heartDiseaseRisk.explanation}
                        />
                      </div>

                      {/* Right column: Specific SHAP cardiac drivers */}
                      <div className="space-y-4 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                          Key Cardiac Biometric Weights
                        </h4>
                        
                        {(() => {
                          const { shapIncreasing, shapDecreasing } = getDiseaseHighlights('Heart Disease');
                          const hasIncreasing = shapIncreasing.length > 0;
                          const hasDecreasing = shapDecreasing.length > 0;

                          return (
                            <div className="space-y-3.5">
                              {hasIncreasing && (
                                <div className="space-y-2">
                                  <span className="text-[10px] font-bold text-rose-700 block">Accelerating Risk Triggers:</span>
                                  {shapIncreasing.map((factor, idx) => (
                                    <div key={idx} className="bg-white border border-red-50/80 rounded-xl p-3 text-xs shadow-2xs">
                                      <div className="flex justify-between font-bold text-gray-800 mb-1">
                                        <span>{factor.feature}</span>
                                        <span className="text-rose-600 font-extrabold">+{factor.impact}</span>
                                      </div>
                                      <p className="text-[10px] text-gray-500 leading-normal">{factor.description}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {hasDecreasing && (
                                <div className="space-y-2">
                                  <span className="text-[10px] font-bold text-emerald-700 block">Protective Buffers:</span>
                                  {shapDecreasing.map((factor, idx) => (
                                    <div key={idx} className="bg-white border border-emerald-50/80 rounded-xl p-3 text-xs shadow-2xs">
                                      <div className="flex justify-between font-bold text-gray-800 mb-1">
                                        <span>{factor.feature}</span>
                                        <span className="text-emerald-600 font-extrabold">{factor.impact}</span>
                                      </div>
                                      <p className="text-[10px] text-gray-500 leading-normal">{factor.description}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {!hasIncreasing && !hasDecreasing && (
                                <p className="text-[11px] text-gray-400 italic">No extreme biological triggers detected.</p>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                    </div>

                    {/* Targeted Cardiac Recommendations Row */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Tailored Heart and Vascular Protocols
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getDiseaseHighlights('Heart Disease').recs.map((rec, idx) => (
                          <div key={idx} className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col justify-between hover:shadow-2xs transition-shadow">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold uppercase text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-md">
                                  {rec.category}
                                </span>
                                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                                  rec.impact === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {rec.impact} Impact
                                </span>
                              </div>
                              <h5 className="text-xs font-bold text-gray-900 mb-1">{rec.title}</h5>
                              <p className="text-[11px] text-gray-500 leading-relaxed">{rec.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* STROKE TAB */}
              {activeTab === 'stroke' && (
                <div className="space-y-6 animate-fade-in" id="stroke-tab-content">
                  <div className="bg-white border border-gray-100/90 rounded-2xl p-6 md:p-8 space-y-6">
                    
                    <div className="border-b border-gray-100 pb-4">
                      <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <Brain className="text-indigo-600 w-5 h-5" />
                        Cerebrovascular & Stroke Matrix
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Analyzing structural vessel dynamics and intracranial parameters to counter blood clot hazards.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                      
                      {/* Left column: Stroke Gauge */}
                      <div className="h-full">
                        <RiskGauge
                          label="Stroke Risk"
                          score={result.strokeRisk.score}
                          level={result.strokeRisk.level}
                          explanation={result.strokeRisk.explanation}
                        />
                      </div>

                      {/* Right column: Stroke SHAP drivers */}
                      <div className="space-y-4 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                          Stroke Biometric Attribution weight parameters
                        </h4>
                        
                        {(() => {
                          const { shapIncreasing, shapDecreasing } = getDiseaseHighlights('Stroke');
                          const hasIncreasing = shapIncreasing.length > 0;
                          const hasDecreasing = shapDecreasing.length > 0;

                          return (
                            <div className="space-y-3.5">
                              {hasIncreasing && (
                                <div className="space-y-2">
                                  <span className="text-[10px] font-bold text-rose-700 block">Capillary Strain Factors:</span>
                                  {shapIncreasing.map((factor, idx) => (
                                    <div key={idx} className="bg-white border border-red-50/80 rounded-xl p-3 text-xs shadow-2xs">
                                      <div className="flex justify-between font-bold text-gray-800 mb-1">
                                        <span>{factor.feature}</span>
                                        <span className="text-rose-600 font-extrabold">+{factor.impact}</span>
                                      </div>
                                      <p className="text-[10px] text-gray-500 leading-normal">{factor.description}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {hasDecreasing && (
                                <div className="space-y-2">
                                  <span className="text-[10px] font-bold text-emerald-700 block">Vascular Shields:</span>
                                  {shapDecreasing.map((factor, idx) => (
                                    <div key={idx} className="bg-white border border-emerald-50/80 rounded-xl p-3 text-xs shadow-2xs">
                                      <div className="flex justify-between font-bold text-gray-800 mb-1">
                                        <span>{factor.feature}</span>
                                        <span className="text-emerald-600 font-extrabold">{factor.impact}</span>
                                      </div>
                                      <p className="text-[10px] text-gray-500 leading-normal">{factor.description}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {!hasIncreasing && !hasDecreasing && (
                                <p className="text-[11px] text-gray-400 italic">No extreme biological triggers detected.</p>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                    </div>

                    {/* Stroke recommendations */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Tailored Cerebrovascular Protocols
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getDiseaseHighlights('Stroke').recs.map((rec, idx) => (
                          <div key={idx} className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col justify-between hover:shadow-2xs transition-shadow">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold uppercase text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-md">
                                  {rec.category}
                                </span>
                                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                                  rec.impact === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {rec.impact} Impact
                                </span>
                              </div>
                              <h5 className="text-xs font-bold text-gray-900 mb-1">{rec.title}</h5>
                              <p className="text-[11px] text-gray-500 leading-relaxed">{rec.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* DIABETES TAB */}
              {activeTab === 'diabetes' && (
                <div className="space-y-6 animate-fade-in" id="diabetes-tab-content">
                  <div className="bg-white border border-gray-100/90 rounded-2xl p-6 md:p-8 space-y-6">
                    
                    <div className="border-b border-gray-100 pb-4">
                      <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <Droplet className="text-orange-500 w-5 h-5" />
                        Insulin & Glycemia Metabolic Profiler
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Analyzing carbohydrate absorption indices, BMI indices, and pancreas hormone load buffers.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                      
                      {/* Left column: Diabetes Gauge */}
                      <div className="h-full">
                        <RiskGauge
                          label="Diabetes Risk"
                          score={result.diabetesRisk.score}
                          level={result.diabetesRisk.level}
                          explanation={result.diabetesRisk.explanation}
                        />
                      </div>

                      {/* Right column: Diabetes SHAP drivers */}
                      <div className="space-y-4 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                          Metabolic Weight Attribution Profiles
                        </h4>
                        
                        {(() => {
                          const { shapIncreasing, shapDecreasing } = getDiseaseHighlights('Diabetes');
                          const hasIncreasing = shapIncreasing.length > 0;
                          const hasDecreasing = shapDecreasing.length > 0;

                          return (
                            <div className="space-y-3.5">
                              {hasIncreasing && (
                                <div className="space-y-2">
                                  <span className="text-[10px] font-bold text-rose-700 block">Insulin Dampening Metrics:</span>
                                  {shapIncreasing.map((factor, idx) => (
                                    <div key={idx} className="bg-white border border-red-50/80 rounded-xl p-3 text-xs shadow-2xs">
                                      <div className="flex justify-between font-bold text-gray-800 mb-1">
                                        <span>{factor.feature}</span>
                                        <span className="text-rose-600 font-extrabold">+{factor.impact}</span>
                                      </div>
                                      <p className="text-[10px] text-gray-500 leading-normal">{factor.description}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {hasDecreasing && (
                                <div className="space-y-2">
                                  <span className="text-[10px] font-bold text-emerald-700 block">Endocrine Protective Factors:</span>
                                  {shapDecreasing.map((factor, idx) => (
                                    <div key={idx} className="bg-white border border-emerald-50/80 rounded-xl p-3 text-xs shadow-2xs">
                                      <div className="flex justify-between font-bold text-gray-800 mb-1">
                                        <span>{factor.feature}</span>
                                        <span className="text-emerald-600 font-extrabold">{factor.impact}</span>
                                      </div>
                                      <p className="text-[10px] text-gray-500 leading-normal">{factor.description}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {!hasIncreasing && !hasDecreasing && (
                                <p className="text-[11px] text-gray-400 italic">No extreme biological triggers detected.</p>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                    </div>

                    {/* Diabetes recommendations */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Tailored Insulin & Glycemia Protocols
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getDiseaseHighlights('Diabetes').recs.map((rec, idx) => (
                          <div key={idx} className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col justify-between hover:shadow-2xs transition-shadow">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold uppercase text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-md">
                                  {rec.category}
                                </span>
                                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                                  rec.impact === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {rec.impact} Impact
                                </span>
                              </div>
                              <h5 className="text-xs font-bold text-gray-900 mb-1">{rec.title}</h5>
                              <p className="text-[11px] text-gray-500 leading-relaxed">{rec.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* EXPLAINABLE AI TAB */}
              {activeTab === 'shap' && (
                <div className="animate-fade-in" id="explainable-ai-tab-content">
                  <ShapExplanation analysis={result.shapAnalysis} />
                </div>
              )}

              {/* RECOMMENDATIONS TAB */}
              {activeTab === 'recommendations' && (
                <div className="animate-fade-in" id="recommendations-tab-content">
                  <Recommendations recommendations={result.recommendations} />
                </div>
              )}

              {/* CROSS-DISEASE ANALYSIS TAB */}
              {activeTab === 'cross' && (
                <div className="animate-fade-in" id="cross-disease-tab-content">
                  <CrossDisease analysis={result.crossDiseaseAnalysis} />
                </div>
              )}

              {/* MODEL METRICS TAB */}
              {activeTab === 'metrics' && (
                <div className="animate-fade-in" id="model-metrics-tab-content">
                  <ModelMetrics />
                </div>
              )}

            </div>

            {/* FLOATING RETREAT TO FORM INTAKE BUTTON */}
            <button
              onClick={() => setCurrentPage('form')}
              className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs md:text-sm px-4 py-3.5 md:px-5 md:py-4 rounded-full shadow-xl hover:shadow-2xl flex items-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer border border-indigo-500/20"
              id="floating-back-btn"
              title="Refine your clinical diagnostics profile"
            >
              <ClipboardList className="w-4.5 h-4.5" />
              <span>Modify Health Profile</span>
            </button>

          </div>
        )}

      </main>

      {/* Aesthetic Medical Disclaimer and Footer */}
      <footer className="bg-white border-t border-gray-150 py-8 px-4 md:px-8 mt-12" id="workspace-footer">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <span className="text-xs font-extrabold text-indigo-950 uppercase tracking-wide flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-indigo-600" />
               Clinical Workspace
            </span>
            <span className="text-[10px] text-gray-450 font-medium">
              Simulated with Google AI Studio & Antigravity Intelligence systems.
            </span>
          </div>

          <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-rose-800">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-rose-950 block mb-0.5">Core Medical Disclaimer</span>
              <p>
                This application acts solely as an interactive machine learning educational playground and wellness simulation. The outputs, SHAP attributions, score percentages, and lifestyle suggestions do not represent professional clinical diagnoses, medical statements, or therapeutics advice. Never bypass direct medical counselor advice or modify active health regimens based solely on this platform's estimates.
              </p>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
