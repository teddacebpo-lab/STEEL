import React, { useState, useEffect } from 'react';
import { Search, Database, ArrowRight, Loader2, History, Lock, Unlock, Settings, Moon, Sun, BookOpen, RefreshCw, Shield, LayoutDashboard, ChevronRight, X, FileText, ScanText, FileSearch, AlertCircle, Cpu } from 'lucide-react';
import DocumentUploader from './components/DocumentUploader';
import AnalysisResultCard from './components/AnalysisResultCard';
import ProvisionResultCard from './components/ProvisionResultCard';
import LoadingAnalysis from './components/LoadingAnalysis';
import ManualEntryManager from './components/ManualEntryManager';
import ReferenceInfo from './components/ReferenceInfo';
import Tooltip from './components/Tooltip';
import { checkHtsCode as geminiCheckHtsCode, extractDocumentHeadings as geminiExtractDocumentHeadings, lookupHtsProvision as geminiLookupHtsProvision } from './services/geminiService';
import { checkHtsCode as openaiCheckHtsCode, extractDocumentHeadings as openaiExtractDocumentHeadings, lookupHtsProvision as openaiLookupHtsProvision } from './services/openaiService';
import { 
  saveContextToDb, 
  getContextFromDb, 
  clearContextInDb,
  saveEntryToDb,
  getEntriesFromDb,
  deleteEntryFromDb
} from './services/dbService';
import { AnalysisResult, DocumentContext, ManualEntry, HeadingInfo, ProvisionResult } from './types';

function App() {
  const [documentContext, setDocumentContext] = useState<DocumentContext | null>(null);
  const [manualEntries, setManualEntries] = useState<ManualEntry[]>([]);
  const [htsInput, setHtsInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScanningDoc, setIsScanningDoc] = useState(false);
  
  // Compliance Analysis State
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [searchedHts, setSearchedHts] = useState('');
  
  // Provision Lookup State
  const [provisionResult, setProvisionResult] = useState<ProvisionResult | null>(null);
  const [searchedProvision, setSearchedProvision] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<{code: string, found: boolean}[]>([]);
  const [selectedHeading, setSelectedHeading] = useState<HeadingInfo | null>(null);
  
  // Search Mode State
  const [searchMode, setSearchMode] = useState<'compliance' | 'lookup'>('compliance');

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    }
    return 'light';
  });

  // AI Provider State
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('aiProvider') as 'gemini' | 'openai' || 'gemini';
    }
    return 'gemini';
  });

  // Admin State
  const [viewMode, setViewMode] = useState<'user' | 'admin'>('user');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminTab, setAdminTab] = useState<'document' | 'manual'>('document');

  // Apply Theme
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Save AI Provider
  useEffect(() => {
    localStorage.setItem('aiProvider', aiProvider);
  }, [aiProvider]);

  // Load Context and Entries from DB on Mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedContext = await getContextFromDb();
        if (savedContext) setDocumentContext(savedContext);
        
        const savedEntries = await getEntriesFromDb();
        setManualEntries(savedEntries);
      } catch (e) {
        console.error("Failed to load saved data", e);
      }
    };
    loadData();
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleContextUpdate = async (ctx: DocumentContext | null) => {
    setDocumentContext(ctx);
    if (ctx) {
      await saveContextToDb(ctx);
    } else {
      await clearContextInDb();
    }
  };

  const handleManualEntryAdd = async (entry: ManualEntry) => {
    await saveEntryToDb(entry);
    setManualEntries(prev => [...prev, entry]);
  };

  const handleManualEntryUpdate = async (entry: ManualEntry) => {
    await saveEntryToDb(entry);
    setManualEntries(prev => prev.map(e => e.id === entry.id ? entry : e));
  };

  const handleManualEntryDelete = async (id: string) => {
    await deleteEntryFromDb(id);
    setManualEntries(prev => prev.filter(e => e.id !== id));
  };

  const performSearch = async (input: string) => {
    if (!input.trim()) return;
    
    // Allow search if either document OR manual entries exist (for compliance)
    const hasData = documentContext || manualEntries.length > 0;
    if (!hasData) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setProvisionResult(null);

    try {
      if (searchMode === 'compliance') {
        const checkHtsCode = aiProvider === 'gemini' ? geminiCheckHtsCode : openaiCheckHtsCode;
        const data = await checkHtsCode(documentContext, manualEntries, input);
        setResult(data);
        setSearchedHts(input);
        setHistory(prev => [{ code: input, found: data.found }, ...prev.slice(0, 4)]);
      } else {
        const lookupHtsProvision = aiProvider === 'gemini' ? geminiLookupHtsProvision : openaiLookupHtsProvision;
        const data = await lookupHtsProvision(documentContext, input);
        setProvisionResult(data);
        setSearchedProvision(input);
      }
    } catch (err: any) {
      console.error("Analysis/Lookup error:", err);
      let errorMessage = "An unexpected error occurred. Please check your data source and try again.";
      if (err instanceof Error) {
        errorMessage = err.message;
        // Clean up common error prefixes
        errorMessage = errorMessage.replace(/^GoogleGenAIError:\s*/i, '');
        errorMessage = errorMessage.replace(/^Error:\s*/i, '');
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(htsInput);
  };

  const handleScanHeadings = async () => {
    if (!documentContext) return;
    setIsScanningDoc(true);
    try {
      const extractDocumentHeadings = aiProvider === 'gemini' ? geminiExtractDocumentHeadings : openaiExtractDocumentHeadings;
      const headings = await extractDocumentHeadings(documentContext);
      const updatedContext = { ...documentContext, extractedHeadings: headings };
      setDocumentContext(updatedContext);
      await saveContextToDb(updatedContext);
    } catch (err) {
      console.error(err);
      alert("Failed to scan document headings.");
    } finally {
      setIsScanningDoc(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === '332') {
      setIsAdminAuthenticated(true);
      setError(null);
    } else {
      alert("Incorrect Password");
    }
  };

  const toggleAdminView = () => {
    if (viewMode === 'user') {
      setViewMode('admin');
    } else {
      setViewMode('user');
    }
  };
  
  const isSystemReady = documentContext || manualEntries.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-blue-100/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 font-sans selection:bg-indigo-500/30 text-slate-900 dark:text-slate-100 transition-all duration-300 relative overflow-hidden">
      
      {/* Decorative Background Blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300/20 dark:bg-purple-900/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-200/20 dark:bg-yellow-900/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-200/20 dark:bg-pink-900/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-white/20 dark:border-white/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo Area */}
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setViewMode('user')}>
              <div className="bg-gradient-to-tr from-indigo-600 to-blue-500 p-2 rounded-xl shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/30 transition-all duration-300 transform group-hover:scale-105">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white leading-none">
                  HTS Analyzer
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">
                  Aluminum & Steel Derivatives
                </span>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              <Tooltip content={aiProvider === 'gemini' ? 'Switch to OpenAI' : 'Switch to Gemini'} position="bottom">
                <button
                  onClick={() => setAiProvider(prev => prev === 'gemini' ? 'openai' : 'gemini')}
                  className="p-2.5 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  <Cpu className="w-5 h-5" />
                </button>
              </Tooltip>

              <Tooltip content={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'} position="bottom">
                <button
                  onClick={toggleTheme}
                  className="p-2.5 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </button>
              </Tooltip>

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

              <Tooltip content={viewMode === 'admin' ? 'Exit Admin Panel' : 'Settings & Data'} position="bottom">
                <button
                  onClick={toggleAdminView}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
                    viewMode === 'admin'
                      ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:border-indigo-600 dark:hover:bg-indigo-50 shadow-lg shadow-slate-900/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 text-slate-700 dark:text-slate-200 shadow-sm'
                  }`}
                >
                  {viewMode === 'admin' ? (
                     <>
                       <ArrowRight className="w-4 h-4" /> <span className="hidden sm:inline">Exit Admin</span>
                     </>
                  ) : (
                     <>
                       <Settings className="w-4 h-4" /> <span className="hidden sm:inline">Admin</span>
                     </>
                  )}
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col gap-8">
        
        {/* ADMIN MODE */}
        {viewMode === 'admin' && (
          <div className="max-w-4xl mx-auto w-full animate-fade-in-up">
            {!isAdminAuthenticated ? (
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 dark:border-slate-700 p-8 md:p-12 text-center max-w-md mx-auto">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-white dark:from-slate-800 dark:to-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-slate-100 dark:border-slate-800">
                  <Lock className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Restricted Access</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8">Enter the administrative password to manage reference documents and rules.</p>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="relative group">
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all group-hover:border-indigo-300 dark:group-hover:border-indigo-700"
                      placeholder="Password"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Unlock className="w-4 h-4" /> Authenticate
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                   <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Data Management</h2>
                      <p className="text-slate-500 dark:text-slate-400">Manage HTS derivative reference documents and manual overrides.</p>
                   </div>
                   <button 
                      onClick={() => setIsAdminAuthenticated(false)}
                      className="text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg transition-colors self-start md:self-auto"
                   >
                      Lock Panel
                   </button>
                </div>

                {/* Custom Tabs */}
                <div className="flex p-1 bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl max-w-md">
                  <button
                    onClick={() => setAdminTab('document')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      adminTab === 'document' 
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Document Reference
                  </button>
                  <button
                    onClick={() => setAdminTab('manual')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      adminTab === 'manual' 
                         ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' 
                         : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Manual Entries
                  </button>
                </div>
                
                {adminTab === 'document' ? (
                  <div className="space-y-6 animate-fade-in">
                    <DocumentUploader 
                      onContextSet={handleContextUpdate} 
                      currentContext={documentContext} 
                    />
                    
                    {documentContext && (
                      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <BookOpen className="w-5 h-5 text-indigo-500" /> Detected HTS Headings
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                              Automatically scanned from the uploaded document.
                            </p>
                          </div>
                          <button 
                            onClick={handleScanHeadings}
                            disabled={isScanningDoc}
                            className="text-sm flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors disabled:opacity-50"
                          >
                            {isScanningDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            {isScanningDoc ? 'Scanning...' : 'Scan Now'}
                          </button>
                        </div>
                        
                        {documentContext.extractedHeadings ? (
                          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                            <table className="w-full text-sm text-left">
                              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                  <th className="px-6 py-4">Heading</th>
                                  <th className="px-6 py-4">Description</th>
                                  <th className="px-6 py-4 text-right"></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 bg-white/50 dark:bg-transparent">
                                {documentContext.extractedHeadings.length > 0 ? (
                                  documentContext.extractedHeadings.map((h, i) => (
                                    <tr 
                                      key={i} 
                                      onClick={() => setSelectedHeading(h)}
                                      className="hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors cursor-pointer group"
                                    >
                                      <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 w-32 group-hover:underline decoration-dashed underline-offset-4">{h.heading}</td>
                                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                        <div className="line-clamp-1">{h.description}</div>
                                      </td>
                                      <td className="px-6 py-4 text-right text-slate-400">
                                        <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500 italic">No headings found.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-12 px-6 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                             <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                             <p className="text-slate-500 dark:text-slate-400">Scan the document to extract key HTS headings.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="animate-fade-in">
                    <ManualEntryManager 
                      entries={manualEntries}
                      onAdd={handleManualEntryAdd}
                      onUpdate={handleManualEntryUpdate}
                      onDelete={handleManualEntryDelete}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* USER MODE */}
        {viewMode === 'user' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in-up">
            
            {/* Left Column: Input & Status */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              
              {/* Status Widget */}
              <div className={`rounded-2xl border p-5 backdrop-blur-sm shadow-sm transition-all duration-300 ${
                isSystemReady 
                  ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30' 
                  : 'bg-amber-50/50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30'
              }`}>
                 <div className="flex items-center gap-3 mb-2">
                    <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${isSystemReady ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${isSystemReady ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                      {isSystemReady ? 'System Online' : 'Data Required'}
                    </span>
                 </div>
                 <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]" title={documentContext?.name}>
                        {documentContext ? documentContext.name : 'No Document Loaded'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                        {manualEntries.length} Manual Rules Active
                      </p>
                    </div>
                    {isSystemReady ? (
                      <Database className="w-5 h-5 text-emerald-500/50" />
                    ) : (
                      <Lock className="w-5 h-5 text-amber-500/50" />
                    )}
                 </div>
              </div>

              {/* Search Card */}
              {isSystemReady && (
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-white/60 dark:border-slate-700 overflow-hidden">
                  
                  {/* Mode Toggles */}
                  <div className="flex border-b border-slate-200 dark:border-slate-800">
                    <button 
                      onClick={() => setSearchMode('compliance')}
                      className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                        searchMode === 'compliance' 
                          ? 'bg-white/50 dark:bg-slate-800/50 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' 
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <ScanText className="w-4 h-4" /> Analyze Code
                    </button>
                    <button 
                      onClick={() => setSearchMode('lookup')}
                      className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                        searchMode === 'lookup' 
                          ? 'bg-white/50 dark:bg-slate-800/50 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <FileSearch className="w-4 h-4" /> Lookup Provision
                    </button>
                  </div>

                  <div className="p-6 lg:p-8">
                    {searchMode === 'compliance' ? (
                      <>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Compliance Check</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Verify if a product HTS code falls under derivative lists.</p>
                      </>
                    ) : (
                      <>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Provision Lookup</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Retrieve the official description and text for a specific HTS provision (e.g., Chapter 99).</p>
                      </>
                    )}
                    
                    <form onSubmit={handleSearch} className="space-y-4">
                      <div className="relative group">
                        <input
                          id="hts-input"
                          type="text"
                          value={htsInput}
                          onChange={(e) => setHtsInput(e.target.value.replace(/[^0-9.]/g, ''))}
                          placeholder={searchMode === 'compliance' ? "e.g. 7604.10" : "e.g. 9903.81.91"}
                          className="w-full pl-5 pr-12 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none text-lg font-mono tracking-wide text-slate-900 dark:text-white transition-all shadow-inner group-hover:border-indigo-300 dark:group-hover:border-indigo-700"
                          disabled={isLoading}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <Search className="w-5 h-5" />
                        </div>
                      </div>
                      
                      <button
                        type="submit"
                        disabled={!htsInput || isLoading}
                        className={`w-full text-white py-4 rounded-xl font-bold shadow-lg transform active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group ${
                          searchMode === 'compliance' 
                            ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-indigo-500/20 hover:shadow-indigo-500/40' 
                            : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-blue-500/20 hover:shadow-blue-500/40'
                        }`}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" /> {searchMode === 'compliance' ? 'Analyzing...' : 'Searching...'}
                          </>
                        ) : (
                          <>
                            {searchMode === 'compliance' ? 'Run Analysis' : 'Get Details'} 
                            {searchMode === 'compliance' ? (
                              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            ) : (
                              <FileSearch className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            )}
                          </>
                        )}
                      </button>
                    </form>

                    {/* History Preview (Only for Compliance Mode currently) */}
                    {searchMode === 'compliance' && history.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400 mb-4">
                          <History className="w-3.5 h-3.5" /> Recent Scans
                        </div>
                        <div className="space-y-2.5">
                          {history.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm group cursor-pointer" onClick={() => setHtsInput(item.code)}>
                              <span className="font-mono text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{item.code}</span>
                              <span className={`w-2 h-2 rounded-full ${item.found ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Results & Info */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              {!isSystemReady ? (
                <div className="flex flex-col items-center justify-center text-center p-12 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 min-h-[400px]">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <Lock className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">System Locked</h3>
                  <p className="max-w-md text-slate-500 dark:text-slate-400">
                    Administrator access is required to initialize the knowledge base. Please upload a reference document or add manual rules.
                  </p>
                </div>
              ) : isLoading ? (
                <LoadingAnalysis />
              ) : (
                <>
                  {error && (
                    <div className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-200 dark:border-red-800 rounded-2xl p-6 text-red-800 dark:text-red-200 flex items-start gap-4 shadow-sm animate-fade-in">
                       <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-full shrink-0">
                         <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                       </div>
                       <div className="flex-1">
                         <h4 className="font-bold">Request Failed</h4>
                         <p className="text-sm mt-1 opacity-90 mb-4 leading-relaxed">{error}</p>
                         <button 
                           onClick={() => performSearch(htsInput)}
                           className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-lg text-sm font-semibold text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors shadow-sm"
                         >
                           <RefreshCw className="w-4 h-4" />
                           Retry Analysis
                         </button>
                       </div>
                    </div>
                  )}

                  {/* Render Results based on Mode */}
                  {searchMode === 'compliance' ? (
                    result ? (
                      <AnalysisResultCard result={result} htsCode={searchedHts} />
                    ) : (
                      !error && !provisionResult && (
                        <div className="flex flex-col items-center justify-center text-center p-12 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                          <div className="w-24 h-24 bg-gradient-to-tr from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 rounded-full flex items-center justify-center mb-6 shadow-sm">
                            <LayoutDashboard className="w-10 h-10 text-indigo-300 dark:text-slate-600" />
                          </div>
                          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">Ready for Analysis</h3>
                          <p className="max-w-md text-slate-500 dark:text-slate-400">
                            Enter an HTS code in the panel to the left to begin cross-referencing against the database.
                          </p>
                        </div>
                      )
                    )
                  ) : (
                    provisionResult ? (
                      <ProvisionResultCard result={provisionResult} code={searchedProvision} />
                    ) : (
                      !error && !result && (
                        <div className="flex flex-col items-center justify-center text-center p-12 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                          <div className="w-24 h-24 bg-gradient-to-tr from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-slate-800 rounded-full flex items-center justify-center mb-6 shadow-sm">
                            <BookOpen className="w-10 h-10 text-blue-300 dark:text-slate-600" />
                          </div>
                          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">Ready for Lookup</h3>
                          <p className="max-w-md text-slate-500 dark:text-slate-400">
                            Enter a specific HTS provision (e.g. 9903.81.91) to retrieve its official text and details.
                          </p>
                        </div>
                      )
                    )
                  )}
                  
                  {/* Reference Cards */}
                  <ReferenceInfo />
                </>
              )}
            </div>

          </div>
        )}

      </main>

      {/* Heading Details Modal */}
      {selectedHeading && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedHeading(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all scale-100"
            onClick={e => e.stopPropagation()}
          >
             <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold font-mono text-xl border border-indigo-200 dark:border-indigo-800/50 shadow-sm">
                   {selectedHeading.heading}
                 </div>
                 <div>
                   <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{selectedHeading.description}</h3>
                   <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">HTS Heading Detail</span>
                 </div>
               </div>
               <button 
                onClick={() => setSelectedHeading(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
               >
                 <X className="w-6 h-6" />
               </button>
             </div>
             
             <div className="p-8 max-h-[60vh] overflow-y-auto">
               <div className="flex gap-4">
                 <div className="mt-1">
                   <FileText className="w-5 h-5 text-slate-400" />
                 </div>
                 <div className="space-y-4">
                   <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {selectedHeading.details || "No detailed information extracted for this heading. Re-scan the document to update details."}
                   </p>
                 </div>
               </div>
             </div>
             
             <div className="p-4 bg-slate-50 dark:bg-slate-950/30 border-t border-slate-100 dark:border-slate-800 flex justify-end">
               <button 
                 onClick={() => setSelectedHeading(null)}
                 className="px-5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-lg transition-colors text-sm"
               >
                 Close Details
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Modern Footer */}
      <footer className="mt-12 py-8 border-t border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm bg-white/30 dark:bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-400 dark:text-slate-500 text-sm font-medium tracking-wide">
             © {new Date().getFullYear()} Junaid Abbasi &bull; HTS Compliance Tool
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;