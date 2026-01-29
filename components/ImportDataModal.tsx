import React, { useState } from 'react';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (csvText: string) => void;
}

export const ImportDataModal: React.FC<ImportDataModalProps> = ({ isOpen, onClose, onImport }) => {
  const [csvText, setCsvText] = useState('');
  
  if (!isOpen) return null;

  const handleImport = () => {
    if (csvText.trim()) {
      onImport(csvText);
      setCsvText('');
      onClose();
    }
  };

  const sampleFormat = `Resource, Role, Project, Task, Date, Hours
John Doe, QA, Alpha App, Login Testing, 2024-03-20, 4
Jane Smith, QA, Beta API, Regression, 2024-03-20, 6`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded-lg mr-3">
               <FileText className="text-green-600 w-5 h-5" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-slate-800">Import from Google Sheets</h2>
                <p className="text-sm text-slate-500">Paste your CSV data below to populate the dashboard</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
                <AlertCircle size={14} className="mr-2 text-indigo-500" />
                Expected Format (CSV)
            </h4>
            <pre className="text-xs text-slate-600 font-mono bg-white p-2 rounded border border-slate-200 overflow-x-auto">
{sampleFormat}
            </pre>
            <p className="text-xs text-slate-500 mt-2">
                * Copy columns from your sheet and paste here. Ensure the order matches.
            </p>
          </div>

          <div>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full h-48 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono text-sm"
              placeholder="Paste your CSV data here..."
            />
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!csvText.trim()}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white rounded-lg font-medium shadow-md transition-colors flex items-center"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};