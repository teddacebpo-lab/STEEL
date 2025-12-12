import React, { useState, useEffect } from 'react';
import { Loader2, FileSearch, Shield, Search, ScanSearch, Layers } from 'lucide-react';

const STEPS = [
  { text: "Initializing regulatory context...", icon: FileSearch, color: "text-slate-500" },
  { text: "Parsing HTS classification structure...", icon: ScanSearch, color: "text-indigo-500" },
  { text: "Analyzing against Aluminum 232 subject list...", icon: Shield, color: "text-blue-600" },
  { text: "Cross-referencing Steel derivative rules...", icon: Shield, color: "text-orange-500" },
  { text: "Scanning for specific exclusions & scope...", icon: Layers, color: "text-purple-500" },
  { text: "Compiling final compliance verification...", icon: Loader2, color: "text-emerald-500" }
];

const LoadingAnalysis: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Total time approx 9 seconds (1500ms * 6 steps)
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const step = STEPS[currentStep];
  const Icon = step.icon;

  return (
    <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors relative overflow-hidden group">
      
      {/* Custom Styles for Animations */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.5); }
          70% { transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>

      {/* Ambient background glow - changes color based on step */}
      <div className={`absolute inset-0 overflow-hidden pointer-events-none transition-colors duration-1000 opacity-20`}>
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl transition-colors duration-1000 ${
            currentStep % 2 === 0 ? 'bg-indigo-500/10' : 'bg-blue-500/10'
          }`}></div>
      </div>

      <div className="relative mb-12">
        {/* Pulsing Rings */}
        <div className="absolute inset-0 rounded-full border border-indigo-500/20 dark:border-indigo-400/20" style={{ animation: 'pulse-ring 3s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
        <div className="absolute inset-0 rounded-full border border-indigo-500/20 dark:border-indigo-400/20" style={{ animation: 'pulse-ring 3s cubic-bezier(0.4, 0, 0.6, 1) infinite', animationDelay: '1s' }}></div>
        
        {/* Central Icon Container */}
        <div className="bg-white dark:bg-slate-800 w-20 h-20 rounded-2xl shadow-xl shadow-indigo-500/10 border border-slate-100 dark:border-slate-700 relative z-10 flex items-center justify-center transition-all duration-500">
           {/* Key forces remount to trigger popIn animation on step change */}
           <div key={currentStep} className="animate-[popIn_0.6s_cubic-bezier(0.16,1,0.3,1)]">
             <Icon className={`w-10 h-10 transition-colors duration-300 ${step.color} ${currentStep === STEPS.length - 1 ? 'animate-spin' : ''}`} />
           </div>
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 tracking-tight">Analyzing Compliance</h3>
      
      {/* Animated Text Steps */}
      <div className="h-8 mb-10 relative w-full text-center flex items-center justify-center overflow-hidden">
        {STEPS.map((s, idx) => (
           <p 
            key={idx}
            className={`text-sm md:text-base font-medium absolute transition-all duration-700 ease-in-out transform w-full ${
                idx === currentStep ? 'opacity-100 translate-y-0 scale-100 blur-0 text-slate-600 dark:text-slate-300' : 
                idx < currentStep ? 'opacity-0 -translate-y-8 scale-95 blur-sm text-slate-400' : 
                'opacity-0 translate-y-8 scale-95 blur-sm text-slate-400'
            }`}
          >
            {s.text}
          </p>
        ))}
      </div>

      {/* Smooth Progress Bar with Shimmer */}
      <div className="w-64 md:w-80 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative shadow-inner">
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600 transition-all duration-[1500ms] ease-linear rounded-full"
          style={{ width: `${Math.min(((currentStep + 1) / STEPS.length) * 100, 100)}%` }}
        >
             {/* Shimmer Effect overlay */}
             <div 
               className="absolute inset-0 bg-white/30 skew-x-12" 
               style={{ animation: 'shimmer 2s infinite linear' }}
             ></div>
        </div>
      </div>
      
      {/* Step Dots Indicator */}
      <div className="flex gap-2 mt-6">
        {STEPS.map((_, idx) => (
            <div 
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                    idx === currentStep ? 'bg-indigo-600 dark:bg-indigo-400 w-6' : 
                    idx < currentStep ? 'bg-indigo-200 dark:bg-indigo-900/50 w-1.5' : 
                    'bg-slate-200 dark:bg-slate-800 w-1.5'
                }`}
            />
        ))}
      </div>
    </div>
  );
};

export default LoadingAnalysis;