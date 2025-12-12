import React from 'react';
import { BookOpen, AlertCircle, Search, Info } from 'lucide-react';
import { ProvisionResult } from '../types';

interface ProvisionResultCardProps {
  result: ProvisionResult;
  code: string;
}

const ProvisionResultCard: React.FC<ProvisionResultCardProps> = ({ result, code }) => {
  if (!result.found) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 animate-fade-in transition-colors">
        <div className="flex items-start gap-4">
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full shrink-0">
            <Search className="w-6 h-6 text-slate-500 dark:text-slate-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Provision "{code}" Not Found
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              The requested HTS provision or heading could not be located in the current reference document.
            </p>
            {result.description && (
               <p className="text-sm text-slate-500 italic border-l-2 border-slate-200 pl-3">
                 Note: {result.description}
               </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Determine styling based on metal type
  let borderColor = "border-l-4 border-l-slate-500 border-slate-200 dark:border-slate-700";
  let iconColor = "text-slate-600 dark:text-slate-400";
  let badgeColor = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

  if (result.metalType === "Aluminum") {
    borderColor = "border-l-4 border-l-blue-500 border-indigo-100 dark:border-indigo-900/50";
    iconColor = "text-blue-600 dark:text-blue-400";
    badgeColor = "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
  } else if (result.metalType === "Steel") {
    borderColor = "border-l-4 border-l-orange-500 border-orange-100 dark:border-orange-900/50";
    iconColor = "text-orange-600 dark:text-orange-400";
    badgeColor = "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300";
  } else if (result.metalType === "Both") {
    borderColor = "border-l-4 border-l-purple-500 border-purple-100 dark:border-purple-900/50";
    iconColor = "text-purple-600 dark:text-purple-400";
    badgeColor = "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300";
  }

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl shadow-lg border ${borderColor} overflow-hidden animate-fade-in transition-colors`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${badgeColor} bg-opacity-30`}>
              <BookOpen className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {result.code}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                Provision Detail
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${badgeColor}`}>
            {result.metalType}
          </span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/50 rounded-lg p-5 border border-slate-100 dark:border-slate-800">
          <div className="flex gap-3">
            <Info className={`w-5 h-5 shrink-0 ${iconColor} mt-0.5`} />
            <div className="space-y-2">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {result.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProvisionResultCard;