import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Info, Layers, ChevronRight, BookOpen, BarChart3, FileCheck, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { AnalysisResult, MetalType, DerivativeMatch } from '../types';
import Tooltip from './Tooltip';

interface AnalysisResultCardProps {
  result: AnalysisResult;
  htsCode: string;
}

// Helper to render HTS codes and keywords with styling
const renderTextSegments = (text: string) => {
  const parts = text.split(/(\b\d{4}(?:\.\d+)*\b|\b(?:Heading|Subheading|Chapter|Note)s?\b)/gi);
  return parts.map((part, i) => {
    // HTS Code detection (digits and dots)
    if (/^\d{4}(?:\.\d+)*$/.test(part)) {
      return (
        <span key={i} className="font-mono font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 px-1 py-0.5 rounded text-xs mx-0.5 border border-blue-100 dark:border-blue-800/50">
          {part}
        </span>
      );
    }
    // Keyword detection
    if (/^(Heading|Subheading|Chapter|Note)s?$/i.test(part)) {
      return (
        <span key={i} className="font-semibold text-slate-800 dark:text-slate-200 decoration-slate-300 dark:decoration-slate-600 underline decoration-dotted underline-offset-2">
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

interface HighlightedDetailProps {
  text: string;
  previewMode?: boolean;
}

const HighlightedDetail: React.FC<HighlightedDetailProps> = ({ text, previewMode = false }) => {
  if (previewMode) {
    // Strip markdown syntax for preview
    let cleanText = text
      .replace(/\*\*/g, '') // Remove bold
      .replace(/^[\-\*]\s+/gm, '') // Remove list bullets
      .replace(/\n+/g, ' '); // Collapse newlines
      
    return <span>{renderTextSegments(cleanText)}</span>;
  }

  // Full Markdown-like rendering
  const lines = text.split('\n');
  
  return (
    <div className="space-y-1.5 block my-1">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={lineIdx} className="h-1" />;

        const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
        const cleanLine = isBullet ? trimmed.substring(2) : trimmed;

        // Process bold syntax **text**
        const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
        
        const renderedLine = (
          <span>
            {parts.map((part, partIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={partIdx} className="font-bold text-slate-900 dark:text-slate-100">
                    {renderTextSegments(part.slice(2, -2))}
                  </strong>
                );
              }
              return <span key={partIdx}>{renderTextSegments(part)}</span>;
            })}
          </span>
        );

        if (isBullet) {
           return (
             <div key={lineIdx} className="flex items-start gap-2.5 ml-1">
               <span className="mt-2 w-1.5 h-1.5 rounded-full bg-slate-400/70 dark:bg-slate-500 shrink-0" />
               <span className="leading-relaxed">{renderedLine}</span>
             </div>
           );
        }

        return <div key={lineIdx} className="leading-relaxed">{renderedLine}</div>;
      })}
    </div>
  );
};

const MatchItem: React.FC<{ match: DerivativeMatch; index: number }> = ({ match, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isAluminum = match.metalType === MetalType.ALUMINUM;
  const isSteel = match.metalType === MetalType.STEEL;
  const isBoth = match.metalType === MetalType.BOTH;
  
  // Check if text is long enough to warrant truncation
  const shouldTruncate = match.matchDetail.length > 150 || match.matchDetail.includes('\n');

  // Distinct styling based on metal type
  let borderColor = "border-l-4 border-l-slate-400 border-slate-200 dark:border-slate-700 dark:border-l-slate-500";
  let badgeColor = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  let iconColor = "text-slate-500 dark:text-slate-400";
  let containerBg = "bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-900"; // Default with hover

  if (isAluminum) {
    borderColor = "border-l-4 border-l-blue-500 border-blue-200 dark:border-blue-800 dark:border-l-blue-500";
    badgeColor = "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800";
    iconColor = "text-blue-600 dark:text-blue-400";
    containerBg = "bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30";
  } else if (isSteel) {
    borderColor = "border-l-4 border-l-orange-500 border-orange-200 dark:border-orange-800 dark:border-l-orange-500";
    badgeColor = "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800";
    iconColor = "text-orange-600 dark:text-orange-400";
    containerBg = "bg-orange-50/80 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30";
  } else if (isBoth) {
    borderColor = "border-l-4 border-l-purple-500 border-purple-200 dark:border-purple-800 dark:border-l-purple-500";
    badgeColor = "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800";
    iconColor = "text-purple-600 dark:text-purple-400";
    containerBg = "bg-purple-50/80 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30";
  }

  // Confidence Color Logic
  const getConfidenceStyle = (level: string) => {
    switch(level) {
      case 'High': return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-800';
      case 'Medium': return 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-800';
      case 'Low': return 'text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700';
      default: return 'text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700';
    }
  };

  const confidenceStyle = getConfidenceStyle(match.confidence);

  const confidenceContent = (
    <div className="text-left space-y-2">
      <div className="flex gap-1.5 items-start">
        <span className="font-bold text-emerald-300 shrink-0">High:</span>
        <span className="text-slate-200">Exact code or rule match found in the document.</span>
      </div>
      <div className="flex gap-1.5 items-start">
        <span className="font-bold text-amber-300 shrink-0">Medium:</span>
        <span className="text-slate-200">Matches a general heading or category description.</span>
      </div>
      <div className="flex gap-1.5 items-start">
        <span className="font-bold text-slate-300 shrink-0">Low:</span>
        <span className="text-slate-200">Inferred match based on context or partial keywords.</span>
      </div>
    </div>
  );

  return (
    <div className={`${containerBg} rounded-lg border ${borderColor} p-4 shadow-sm mb-3 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:scale-[1.01] hover:shadow-md`}>
      <div className="flex flex-wrap items-start justify-between mb-2 gap-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${badgeColor} bg-opacity-40`}>
            <Layers className={`w-4 h-4 ${iconColor}`} />
          </div>
          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm md:text-base">
            {match.derivativeCategory}
          </h4>
        </div>
        
        <div className="flex items-center gap-2">
          {match.confidence && (
            <div className="flex items-center gap-1.5">
              <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${confidenceStyle}`}>
                <BarChart3 className="w-3 h-3" />
                {match.confidence}
              </span>
              <Tooltip content={confidenceContent}>
                <button type="button" className="focus:outline-none cursor-help text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-0.5 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50">
                  <Info className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            </div>
          )}
          <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide ${badgeColor}`}>
            {match.metalType}
          </span>
        </div>
      </div>
      <div className="pl-9">
        <div 
          className={shouldTruncate ? "group cursor-pointer" : ""}
          onClick={shouldTruncate ? () => setIsExpanded(!isExpanded) : undefined}
        >
          <div className="text-sm text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-slate-200 mr-1 float-left">Detail:</span>
            {shouldTruncate && !isExpanded ? (
               <div className="line-clamp-2 leading-relaxed">
                  <HighlightedDetail text={match.matchDetail} previewMode={true} />
               </div>
            ) : (
               <HighlightedDetail text={match.matchDetail} previewMode={false} />
            )}
          </div>
          
          {shouldTruncate && (
            <div className="flex items-center gap-1 mt-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 opacity-80 group-hover:opacity-100 transition-opacity select-none clear-both">
              {isExpanded ? (
                <>Show Less <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>Read More <ChevronDown className="w-3 h-3" /></>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AnalysisResultCard: React.FC<AnalysisResultCardProps> = ({ result, htsCode }) => {
  // Sort matches logic: High Confidence > Medium > Low, then Alphabetical
  const sortedMatches = React.useMemo(() => {
    if (!result.matches) return [];
    return [...result.matches].sort((a, b) => {
      const confidenceScores: Record<string, number> = { 'High': 3, 'Medium': 2, 'Low': 1 };
      const scoreA = confidenceScores[a.confidence] || 0;
      const scoreB = confidenceScores[b.confidence] || 0;
      
      // Sort by confidence descending
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      
      // If confidence matches, sort by derivative category name ascending
      return a.derivativeCategory.localeCompare(b.derivativeCategory);
    });
  }, [result.matches]);

  // Case 1: Code was not found in the context of the document at all (explicit negative)
  if (!result.found) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 animate-fade-in transition-colors">
        <div className="flex items-start gap-4">
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full shrink-0">
            <AlertCircle className="w-6 h-6 text-slate-500 dark:text-slate-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              HTS Code {htsCode} - Not a Derivative
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              This code does not appear to fall under any monitored derivative category in the provided document.
            </p>
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg text-sm text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
              <span className="font-semibold block mb-1">Analysis Reasoning:</span>
              <HighlightedDetail text={result.reasoning} previewMode={false} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Code was found/recognized, but no specific derivative matches were listed (Valid code, not a derivative)
  if (result.found && result.matches.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-indigo-200 dark:border-indigo-800 p-6 animate-fade-in transition-colors">
        <div className="flex items-start gap-4">
          <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full shrink-0">
            <FileCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              HTS Code {htsCode} - Valid (No Derivative Match)
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              This HTS code is valid but does not fall under any derivative categories in the current reference.
            </p>
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg text-sm text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
              <span className="font-semibold block mb-1">Analysis Reasoning:</span>
              <HighlightedDetail text={result.reasoning} previewMode={false} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Derivative matches found
  
  // Determine overall header color based on the first match or if mixed
  const hasAluminum = result.matches.some(m => m.metalType === MetalType.ALUMINUM || m.metalType === MetalType.BOTH);
  const hasSteel = result.matches.some(m => m.metalType === MetalType.STEEL || m.metalType === MetalType.BOTH);
  
  let headerColor = "bg-slate-700 dark:bg-slate-800";
  if (hasAluminum && !hasSteel) headerColor = "bg-blue-600 dark:bg-blue-700";
  else if (!hasAluminum && hasSteel) headerColor = "bg-orange-600 dark:bg-orange-700";
  else if (hasAluminum && hasSteel) headerColor = "bg-purple-600 dark:bg-purple-700";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden animate-fade-in transition-colors">
      <div className={`${headerColor} px-6 py-4 flex items-center justify-between transition-colors`}>
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-white" />
          <div>
            <h3 className="text-xl font-bold text-white">Derivative Match Found</h3>
            <p className="text-white/80 text-xs font-medium">
              {result.matches.length} {result.matches.length === 1 ? 'category' : 'categories'} identified
            </p>
          </div>
        </div>
        <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
           HTS: {htsCode}
        </span>
      </div>
      
      <div className="p-6 bg-slate-50/50 dark:bg-slate-950/50">
        
        <div className="mb-6">
           <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1">Detailed Matches</h4>
           <div className="space-y-1">
             {sortedMatches.map((match, idx) => (
               <MatchItem key={idx} match={match} index={idx} />
             ))}
           </div>
        </div>
        
        <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg p-4">
          <div className="flex gap-3 items-start">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-200 text-sm">Summary Analysis</h4>
              <div className="text-slate-700 dark:text-slate-300 text-sm mt-1 leading-relaxed">
                <HighlightedDetail text={result.reasoning} previewMode={false} />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalysisResultCard;