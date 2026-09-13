import React, { useState } from 'react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { ExtractionResult, ExtractedField } from '../../types/ocr.types';
import { AlertTriangle, Check, Edit2, Save, Scan } from 'lucide-react';

interface ExtractionReviewScreenProps {
  result: ExtractionResult;
  onSave: (verifiedFields: ExtractedField[]) => void;
  onRetake: () => void;
}

export const ExtractionReviewScreen: React.FC<ExtractionReviewScreenProps> = ({
  result,
  onSave,
  onRetake
}) => {
  const [fields, setFields] = useState<ExtractedField[]>(result.fields);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  if (result.status === 'RECAPTURE_NEEDED' || result.status === 'FAILED') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <GlassCard className="p-8 text-center bg-red-50/50 border-red-200">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-900 mb-2">Extraction Failed</h2>
          <p className="text-red-700 mb-6">{result.message || 'The image quality was too low or processing failed.'}</p>
          <GlassButton variant="primary" onClick={onRetake}>
            Retake Photo
          </GlassButton>
        </GlassCard>
      </div>
    );
  }

  const handleEditClick = (field: ExtractedField) => {
    setEditingFieldId(field.fieldName);
    setEditValue(field.value);
  };

  const handleSaveEdit = (fieldName: string) => {
    setFields(prev => prev.map(f => {
      if (f.fieldName === fieldName) {
        return {
          ...f,
          value: editValue,
          needsVerification: false,
          extractionMethod: 'MANUAL_VERIFICATION'
        };
      }
      return f;
    }));
    setEditingFieldId(null);
  };

  const handleAcceptAll = () => {
    onSave(fields.map(f => ({ ...f, needsVerification: false })));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Review Extracted Data
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Please verify fields highlighted in yellow.
          </p>
        </div>
        <GlassButton variant="primary" onClick={handleAcceptAll} icon={<Check size={16} />}>
          Save Verified Data
        </GlassButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Image Preview Placeholder (In a real app we'd load the blob via URL.createObjectURL) */}
        <div className="space-y-4">
          <GlassCard className="p-4 bg-slate-900 h-96 flex items-center justify-center relative overflow-hidden">
             <div className="text-center text-slate-500">
               <Scan className="w-12 h-12 mx-auto mb-2 opacity-50" />
               <p className="text-sm font-medium">Source Image</p>
               <p className="text-xs">ID: {result.evidenceId}</p>
             </div>
             {/* Note: Bounding boxes would be drawn here based on selected field */}
          </GlassCard>
        </div>

        {/* Right Column: Fields */}
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
          {fields.map((field) => (
            <GlassCard
              key={field.fieldName}
              className={`p-4 border transition-all ${
                field.needsVerification ? 'bg-yellow-50/80 border-yellow-300' : 'bg-white/80 border-slate-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-700 uppercase">{field.fieldName}</span>
                    {field.needsVerification && (
                      <span className="text-[10px] bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded font-bold">
                        Low Confidence ({field.confidence}%)
                      </span>
                    )}
                  </div>

                  {editingFieldId === field.fieldName ? (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-sm border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(field.fieldName)}
                        className="p-1.5 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition"
                      >
                        <Save size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-semibold text-slate-900">
                        {field.value || <span className="text-slate-400 italic">Not found</span>}
                      </span>
                      <button
                        onClick={() => handleEditClick(field)}
                        className="p-1 text-slate-400 hover:text-indigo-600 transition ml-auto"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
};
