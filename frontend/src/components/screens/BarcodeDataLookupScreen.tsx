import React, { useState } from 'react';
import { 
  Barcode, 
  Search, 
  Database, 
  ShieldAlert, 
  ArrowRight, 
  CheckCircle2, 
  ExternalLink,
  Building2,
  Package,
  AlertTriangle,
  Info
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { ProductSample } from '../../types';

interface BarcodeDataLookupScreenProps {
  product: ProductSample;
  onProceed: () => void;
  onNavigate: (screen: number) => void;
}

export const BarcodeDataLookupScreen: React.FC<BarcodeDataLookupScreenProps> = ({
  product,
  onProceed,
  onNavigate
}) => {
  const [gtinQuery, setGtinQuery] = useState(product.gtin);
  const [isQuerying, setIsQuerying] = useState(false);

  const handleSimulateScan = () => {
    setIsQuerying(true);
    setTimeout(() => {
      setIsQuerying(false);
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              Barcode / GTIN Reference Lookup
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              National GS1 Repository
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Querying registered manufacturer master data against the central commodity registry.
          </p>
        </div>

        <GlassButton
          variant="primary"
          size="md"
          onClick={onProceed}
          icon={<ArrowRight size={16} />}
        >
          Cross-Validate Physical vs Registry →
        </GlassButton>
      </div>

      {/* MANDATORY REGULATORY BANNER AS SPECIFIED IN PROMPT */}
      <div className="p-4 rounded-2xl glass-card border border-amber-300 bg-amber-50/70 text-slate-800 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5">
            <ShieldAlert size={18} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-amber-950 uppercase tracking-wide">
              Reference Data — Not Automatic Legal Truth.
            </h3>
            <p className="text-xs text-amber-900/90 mt-1 leading-relaxed">
              Under the <strong>Legal Metrology (Packaged Commodities) Rules, 2011</strong>, physical label declarations on the container are the sole legal representation offered to consumers. Central database records serve strictly as investigative cross-references, never as pre-emptive legal verdicts.
            </p>
          </div>
        </div>
      </div>

      {/* Barcode Scanner / Query Input Card */}
      <GlassCard className="p-5 border border-white/90">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:max-w-md">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Scanned Barcode / GTIN Number
            </label>
            <div className="relative">
              <Barcode size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={gtinQuery}
                onChange={(e) => setGtinQuery(e.target.value)}
                className="w-full glass-input pl-11 pr-4 py-2.5 rounded-xl font-mono text-sm font-bold text-indigo-950"
                placeholder="e.g. 8901234567890"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <GlassButton
              variant="secondary"
              size="md"
              onClick={handleSimulateScan}
              icon={<Search size={15} />}
              className="flex-1 sm:flex-initial"
            >
              {isQuerying ? 'Querying API...' : 'Re-Query Master DB'}
            </GlassButton>
          </div>
        </div>
      </GlassCard>

      {/* Retrieved Data Glass Card */}
      <GlassCard className="p-6 border border-white/90 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                National Commodity Master Record
              </h2>
              <p className="text-xs text-slate-500">
                Source: GS1 India DataKart & Department of Consumer Affairs Registry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200/80">
            <CheckCircle2 size={14} className="text-teal-600" />
            <span>Record Status: ACTIVE (Synced)</span>
          </div>
        </div>

        {/* Data Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Product Description
            </span>
            <p className="text-xs font-bold text-slate-900 mt-1">
              {product.name}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Registered Brand
            </span>
            <p className="text-xs font-bold text-slate-900 mt-1">
              {product.brand}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Parent Entity / Company
            </span>
            <p className="text-xs font-bold text-slate-900 mt-1">
              {product.referenceCompany}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Standard Category
            </span>
            <p className="text-xs font-bold text-slate-900 mt-1">
              {product.category}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Registered Net Content
            </span>
            <p className="text-xs font-bold text-slate-900 mt-1 font-mono">
              {product.referenceNetQuantity}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Registered Maximum Retail Price
            </span>
            <p className="text-xs font-bold text-indigo-950 mt-1 font-mono">
              {product.referenceMrp}
            </p>
          </div>
        </div>

        {/* Comparison Footnote */}
        <div className="pt-3 border-t border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>Global Trade Item Number: <strong className="font-mono text-slate-800">{product.gtin}</strong></span>
          <span className="text-slate-400">Last verified by manufacturer: 2 weeks ago</span>
        </div>
      </GlassCard>
    </div>
  );
};
