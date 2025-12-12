import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Save, Database, X, AlertCircle } from 'lucide-react';
import { ManualEntry, MetalType } from '../types';
import Tooltip from './Tooltip';

interface ManualEntryManagerProps {
  entries: ManualEntry[];
  onAdd: (entry: ManualEntry) => void;
  onUpdate: (entry: ManualEntry) => void;
  onDelete: (id: string) => void;
}

const ManualEntryManager: React.FC<ManualEntryManagerProps> = ({ entries, onAdd, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ManualEntry>>({
    code: '',
    description: '',
    category: '',
    metalType: MetalType.ALUMINUM
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    const htsRegex = /^[\d.]+(?:\s*-\s*[\d.]+)?$/;

    if (!formData.code?.trim()) {
      newErrors.code = "HTS Code is required";
    } else if (!htsRegex.test(formData.code.trim())) {
      newErrors.code = "Invalid format (digits/dots only, e.g. 7604.10)";
    }

    if (!formData.category?.trim()) {
      newErrors.category = "Category name is required";
    }

    if (!formData.description?.trim()) {
      newErrors.description = "Rule detail is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      category: '',
      metalType: MetalType.ALUMINUM
    });
    setErrors({});
    setIsEditing(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    if (isEditing) {
      onUpdate({ ...formData, id: isEditing } as ManualEntry);
    } else {
      onAdd({
        ...formData,
        id: crypto.randomUUID(),
      } as ManualEntry);
    }
    resetForm();
  };

  const handleEdit = (entry: ManualEntry) => {
    setIsEditing(entry.id);
    setFormData(entry);
    setErrors({});
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
           <Database className="w-5 h-5" />
        </div>
        <div>
           <h3 className="text-lg font-bold text-slate-900 dark:text-white">Manual Override Rules</h3>
           <p className="text-xs text-slate-500 dark:text-slate-400">Add custom HTS matches that override the document.</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mb-8 bg-slate-50 dark:bg-slate-950/50 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">HTS Code / Range <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.code}
              onChange={e => {
                setFormData({...formData, code: e.target.value});
                if(errors.code) setErrors({...errors, code: ''});
              }}
              placeholder="e.g. 7604.10"
              className={`w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-slate-900 text-sm focus:ring-2 outline-none transition-shadow ${
                errors.code 
                  ? 'border-red-300 dark:border-red-800 focus:ring-red-500/20 focus:border-red-500' 
                  : 'border-slate-300 dark:border-slate-700 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
            {errors.code && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1 animate-fade-in">
                <AlertCircle className="w-3 h-3" /> {errors.code}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Category Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.category}
              onChange={e => {
                 setFormData({...formData, category: e.target.value});
                 if(errors.category) setErrors({...errors, category: ''});
              }}
              placeholder="e.g. Aluminum Wire"
              className={`w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-slate-900 text-sm focus:ring-2 outline-none transition-shadow ${
                errors.category 
                  ? 'border-red-300 dark:border-red-800 focus:ring-red-500/20 focus:border-red-500' 
                  : 'border-slate-300 dark:border-slate-700 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
            {errors.category && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1 animate-fade-in">
                <AlertCircle className="w-3 h-3" /> {errors.category}
              </p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Rule Detail <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.description}
              onChange={e => {
                setFormData({...formData, description: e.target.value});
                if(errors.description) setErrors({...errors, description: ''});
              }}
              placeholder="Matching criteria details..."
              className={`w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-slate-900 text-sm focus:ring-2 outline-none transition-shadow ${
                errors.description 
                  ? 'border-red-300 dark:border-red-800 focus:ring-red-500/20 focus:border-red-500' 
                  : 'border-slate-300 dark:border-slate-700 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
             {errors.description && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1 animate-fade-in">
                <AlertCircle className="w-3 h-3" /> {errors.description}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Metal Type</label>
            <div className="relative">
              <select
                value={formData.metalType}
                onChange={e => setFormData({...formData, metalType: e.target.value as MetalType})}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none transition-shadow cursor-pointer"
              >
                <option value={MetalType.ALUMINUM}>Aluminum</option>
                <option value={MetalType.STEEL}>Steel</option>
                <option value={MetalType.BOTH}>Both</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800/50">
          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          )}
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all active:scale-95"
          >
            {isEditing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isEditing ? 'Update Rule' : 'Add Rule'}
          </button>
        </div>
      </form>

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 uppercase text-xs font-bold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-5 py-4">HTS Code</th>
              <th className="px-5 py-4">Category</th>
              <th className="px-5 py-4">Metal</th>
              <th className="px-5 py-4">Rule</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900/20">
            {entries.length > 0 ? (
              entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-5 py-3 font-mono font-bold text-slate-800 dark:text-slate-200">{entry.code}</td>
                  <td className="px-5 py-3 text-slate-700 dark:text-slate-300 font-medium">{entry.category}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                      entry.metalType === MetalType.ALUMINUM ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                      entry.metalType === MetalType.STEEL ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' :
                      'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                    }`}>
                      {entry.metalType}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={entry.description}>
                    {entry.description}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <Tooltip content="Edit">
                        <button onClick={() => handleEdit(entry)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-all">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </Tooltip>
                      <Tooltip content="Delete">
                        <button onClick={() => onDelete(entry.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-slate-400 italic">
                  No manual entries found. Use the form above to create your first rule.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManualEntryManager;