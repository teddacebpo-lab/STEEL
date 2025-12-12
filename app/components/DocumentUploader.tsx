import React, { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle2, FileUp } from 'lucide-react';
import { DocumentContext } from '../types';
import Tooltip from './Tooltip';

interface DocumentUploaderProps {
  onContextSet: (ctx: DocumentContext | null) => void;
  currentContext: DocumentContext | null;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onContextSet, currentContext }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [textInput, setTextInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert("Please upload a valid PDF file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      onContextSet({
        type: 'file',
        content: base64String,
        mimeType: 'application/pdf',
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) return;
    onContextSet({
      type: 'text',
      content: textInput,
      name: 'Pasted Text Content'
    });
  };

  const clearContext = () => {
    onContextSet(null);
    setTextInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (currentContext) {
    return (
      <div className="bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-6 flex items-center justify-between shadow-sm transition-all animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-100 dark:bg-emerald-800 p-3 rounded-full shrink-0 animate-bounce-short">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-300" />
          </div>
          <div>
            <h3 className="font-bold text-emerald-900 dark:text-emerald-100">Knowledge Base Active</h3>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 opacity-80">Source: {currentContext.name}</p>
          </div>
        </div>
        <Tooltip content="Remove reference document">
          <button 
            onClick={clearContext}
            className="p-2.5 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors text-slate-400 hover:text-red-500 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800"
            title="Remove document"
          >
            <X className="w-5 h-5" />
          </button>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300">
      <div className="flex p-2 gap-2 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
        <button
          className={`flex-1 py-2 px-4 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
            activeTab === 'upload' 
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' 
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
          }`}
          onClick={() => setActiveTab('upload')}
        >
          <FileUp className="w-4 h-4" /> Upload PDF
        </button>
        <button
          className={`flex-1 py-2 px-4 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
            activeTab === 'paste' 
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' 
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
          }`}
          onClick={() => setActiveTab('paste')}
        >
          <FileText className="w-4 h-4" /> Paste Text
        </button>
      </div>

      <div className="p-8">
        {activeTab === 'upload' ? (
          <div className="text-center">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="group border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-xl p-10 transition-all cursor-pointer bg-slate-50 dark:bg-slate-900 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10"
            >
              <div className="bg-white dark:bg-slate-800 group-hover:scale-110 shadow-sm group-hover:shadow-md w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-300 border border-slate-100 dark:border-slate-700">
                <Upload className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
              </div>
              <h4 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-1">Upload Reference Document</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">Drag & drop or click to browse (PDF only)</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="application/pdf" 
                className="hidden" 
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste the full content of your MS Doc / HTS list here..."
              className="w-full h-48 p-4 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm font-mono text-slate-700 dark:text-slate-300 resize-none transition-all placeholder:text-slate-400"
            />
            <button
              onClick={handleTextSubmit}
              disabled={!textInput.trim()}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
            >
              Set as Knowledge Base
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentUploader;