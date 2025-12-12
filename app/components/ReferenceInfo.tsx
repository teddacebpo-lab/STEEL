import React from 'react';
import { Shield, Hammer, ExternalLink } from 'lucide-react';

const ReferenceInfo: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
      
      {/* Aluminum Card */}
      <div className="group relative bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
        
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
               <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">Aluminum HTS</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Section 232 Subject List</p>
            </div>
          </div>
          
          <div className="text-sm text-slate-600 dark:text-slate-300 space-y-5 leading-relaxed">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Effective Aug 18, 2025.</span> See 90 FR 11251, 90 FR 14786.
            </div>
            
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Primary Scope
              </p>
              <ul className="space-y-1.5 pl-2 border-l-2 border-slate-100 dark:border-slate-800 ml-1">
                <li className="pl-3">Heading 7601 (Unwrought)</li>
                <li className="pl-3">Heading 7604 (Bars, rods, profiles)</li>
                <li className="pl-3">Heading 7605 (Wire)</li>
                <li className="pl-3">Heading 7606 (Plates, sheets, strip)</li>
                <li className="pl-3">Heading 7607 (Foil)</li>
                <li className="pl-3">Heading 7608/7609 (Tubes, pipes)</li>
                <li className="pl-3">Subheading 7616.99.51 (Castings/forgings)</li>
              </ul>
            </div>

            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Derivatives
              </p>
              <ul className="space-y-1.5 pl-2 border-l-2 border-slate-100 dark:border-slate-800 ml-1 text-xs">
                <li className="pl-3">Stranded wire/cables (7614.10.50, 7614.90.20/40/50)</li>
                <li className="pl-3">Bumper stampings (8708.10.30)</li>
                <li className="pl-3">Body stampings for tractors (8708.29.21)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Steel Card */}
      <div className="group relative bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-orange-600"></div>
        
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-orange-50 dark:bg-orange-900/30 rounded-xl text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
               <Hammer className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">Steel HTS</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Section 232 Subject List</p>
            </div>
          </div>
          
          <div className="text-sm text-slate-600 dark:text-slate-300 space-y-5 leading-relaxed">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Effective Aug 18, 2025.</span> See 90 FR 11249, 90 FR 24199.
            </div>

            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Primary Scope
              </p>
              <ul className="space-y-1.5 pl-2 border-l-2 border-slate-100 dark:border-slate-800 ml-1">
                <li className="pl-3">Flat-rolled (7208-7212, 7225-7226)</li>
                <li className="pl-3">Bars, rods (7213-7215, 7227-7228)</li>
                <li className="pl-3">Angles/shapes (7216), Wire (7217, 7229)</li>
                <li className="pl-3">Pipes/Tubes (7304-7306)</li>
                <li className="pl-3">Ingots/Semi-finished (7206-7207, 7224)</li>
                <li className="pl-3">Stainless Steel products (7218-7223)</li>
              </ul>
            </div>

            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Derivatives
              </p>
              <ul className="space-y-1.5 pl-2 border-l-2 border-slate-100 dark:border-slate-800 ml-1 text-xs">
                <li className="pl-3">Nails, tacks, staples (7317.00.30/55/65)</li>
                <li className="pl-3">Bumper stampings (8708.10.30)</li>
                <li className="pl-3">Body stampings for tractors (8708.29.21)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferenceInfo;