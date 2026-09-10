import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  User, 
  Tag, 
  FileText, 
  ArrowRight, 
  Save, 
  Sparkles,
  Barcode,
  Info
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { StatusPill } from '../common/StatusPill';
import { SAMPLE_PRODUCTS } from '../../data/mockData';
import { ProductSample } from '../../types';

import { useUpdateInspection } from '../../hooks/useUpdateInspection';

interface NewInspectionFormProps {
  inspectionId: string;
  onProceed: (data: {
    location: string;
    category: string;
    product: ProductSample;
    notes: string;
  }) => void;
  onSelectSampleProduct: (product: ProductSample) => void;
  selectedProduct: ProductSample;
}

export const NewInspectionForm: React.FC<NewInspectionFormProps> = ({
  inspectionId,
  onProceed,
  onSelectSampleProduct,
  selectedProduct
}) => {
  const [retailerLocation, setRetailerLocation] = useState('Metro SuperMart Central, Sector 18, Noida');
  const [category, setCategory] = useState('Food & Groceries');
  const [batchNo, setBatchNo] = useState('LOT-GHF-992B');
  const [notes, setNotes] = useState('Routine surveillance inspection for Legal Metrology Packaged Commodities compliance.');
  const [inspectReason, setInspectReason] = useState('Routine Market Surveillance');
  
  const { updateMetadata, isUpdating } = useUpdateInspection();

  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleSaveMetadata = async () => {
    // In a real app we'd convert address to coordinates. For mock, just omit or send dummy.
    await updateMetadata(inspectionId, {
      productCategory: category,
      manufacturer: selectedProduct.manufacturer, // using selected mock manufacturer
      notes
    });
  };

  const handleSaveAndProceed = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateMetadata(inspectionId, {
      productCategory: category,
      manufacturer: selectedProduct.manufacturer,
      notes
    });
    
    if (success) {
      onProceed({
        location: retailerLocation,
        category,
        product: selectedProduct,
        notes
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header bar with ID and DRAFT status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              New Inspection
            </h1>
            <StatusPill status="DRAFT" size="md" />
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Initialize legal audit dossier before evidence ingestion and OCR verification.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-600 bg-white/70 px-3 py-1.5 rounded-xl border border-slate-200">
          <span>Inspection ID:</span>
          <strong className="text-indigo-700">{inspectionId}</strong>
        </div>
      </div>

      <form onSubmit={handleSaveAndProceed} className="space-y-6">
        {/* Dossier Metadata Card */}
        <GlassCard className="p-6 border border-white/90">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
            <Info size={16} className="text-indigo-600" />
            1. Inspector & Audit Meta
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Authorized Inspector
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  disabled
                  value="Ashish Sainik (ID: INS-DEL-742)"
                  className="w-full glass-input pl-9 pr-3 py-2 rounded-xl text-xs font-medium bg-slate-50 text-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Inspection Date
              </label>
              <div className="relative">
                <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  disabled
                  value={`${currentDate} • ${currentTime}`}
                  className="w-full glass-input pl-9 pr-3 py-2 rounded-xl text-xs font-medium bg-slate-50 text-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Audit Trigger / Reason
              </label>
              <select
                value={inspectReason}
                onChange={(e) => setInspectReason(e.target.value)}
                className="w-full glass-input px-3 py-2 rounded-xl text-xs font-semibold text-slate-800"
              >
                <option>Routine Market Surveillance</option>
                <option>Consumer Grievance / Complaint</option>
                <option>Special Enforcement Drive</option>
                <option>Repeat Violator Re-Inspection</option>
              </select>
            </div>
          </div>
        </GlassCard>

        {/* Retail Location & Category */}
        <GlassCard className="p-6 border border-white/90">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
            <Building2 size={16} className="text-teal-600" />
            2. Premises & Commodity Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Retail / Warehouse Location
              </label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={retailerLocation}
                  onChange={(e) => setRetailerLocation(e.target.value)}
                  className="w-full glass-input pl-9 pr-3 py-2.5 rounded-xl text-xs font-medium text-slate-800"
                  placeholder="e.g. Metro SuperMart, Connaught Place"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Commodity Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full glass-input px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-800"
              >
                <option>Food & Groceries</option>
                <option>Packaged Foods</option>
                <option>Beverages & Mineral Water</option>
                <option>Cosmetics & Personal Care</option>
                <option>Household Chemicals</option>
                <option>Electronics & Hardware</option>
              </select>
            </div>
          </div>

          {/* Preset Sample Selector to test different legal scenarios */}
          <div className="mt-5 pt-4 border-t border-slate-200/80">
            <div className="flex items-center justify-between mb-2.5">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles size={14} className="text-indigo-600" />
                Select Test Product Dossier:
              </label>
              <span className="text-[11px] text-slate-500">Pick a sample to simulate real enforcement scenarios</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SAMPLE_PRODUCTS.map((prod) => {
                const isSelected = selectedProduct.id === prod.id;

                return (
                  <div
                    key={prod.id}
                    onClick={() => onSelectSampleProduct(prod)}
                    className={`
                      p-3 rounded-2xl border text-left cursor-pointer transition-all
                      ${
                        isSelected
                          ? 'bg-gradient-to-br from-indigo-50 to-teal-50 border-indigo-400 shadow-md ring-2 ring-indigo-500/20'
                          : 'bg-white/60 hover:bg-white border-slate-200 hover:border-slate-300'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                        GTIN: {prod.gtin}
                      </span>
                      {prod.hasViolation ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                          Discrepancy Case
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                          Compliant Case
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-900 leading-tight truncate">
                      {prod.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {prod.manufacturer} • {prod.printedNetQuantity}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Batch / Lot Number (if visible)
              </label>
              <input
                type="text"
                value={batchNo}
                onChange={(e) => setBatchNo(e.target.value)}
                className="w-full glass-input px-3 py-2 rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Inspector Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full glass-input px-3 py-2 rounded-xl text-xs font-medium"
              />
            </div>
          </div>
        </GlassCard>

        {/* Buttons */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <GlassButton
            type="button"
            variant="secondary"
            onClick={handleSaveMetadata}
            disabled={isUpdating}
            icon={isUpdating ? <Sparkles className="animate-spin" size={15} /> : <Save size={15} />}
          >
            {isUpdating ? 'Saving...' : 'Save Draft Dossier'}
          </GlassButton>

          <GlassButton
            type="submit"
            size="lg"
            variant="primary"
            disabled={isUpdating}
            icon={<ArrowRight size={16} />}
          >
            Proceed to Identify Product →
          </GlassButton>
        </div>
      </form>
    </div>
  );
};
