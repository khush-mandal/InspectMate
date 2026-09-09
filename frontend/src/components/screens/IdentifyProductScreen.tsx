import React from 'react';
import { 
  Barcode, 
  QrCode, 
  Camera, 
  Video, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  Search
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { ProductSample } from '../../types';

interface IdentifyProductScreenProps {
  onSelectMethod: (method: 'barcode' | 'qr' | 'image' | 'video') => void;
  product: ProductSample;
  onNavigate: (screen: number) => void;
}

export const IdentifyProductScreen: React.FC<IdentifyProductScreenProps> = ({
  onSelectMethod,
  product,
  onNavigate
}) => {
  const options = [
    {
      id: 'barcode',
      title: 'Scan 1D Barcode',
      subtitle: 'GTIN-13 / EAN / UPC format',
      description: 'Instantly reads the commercial barcode to cross-reference National GS1 Central Database.',
      icon: Barcode,
      color: 'indigo',
      badge: 'Fastest Lookup',
      action: () => {
        onSelectMethod('barcode');
        onNavigate(10);
      }
    },
    {
      id: 'qr',
      title: 'Scan 2D QR Code',
      subtitle: 'GS1 Digital Link / FSSAI QR',
      description: 'Decodes serialized QR codes containing batch-specific manufacturing & regulatory data.',
      icon: QrCode,
      color: 'teal',
      badge: 'Digital Link',
      action: () => {
        onSelectMethod('qr');
        onNavigate(10);
      }
    },
    {
      id: 'image',
      title: 'Capture Label Images',
      subtitle: 'Direct Multi-Angle Photo OCR',
      description: 'High-resolution capture of Principal Display Panel, back panel, dates, and price stamps.',
      icon: Camera,
      color: 'indigo',
      badge: 'Primary Protocol',
      action: () => {
        onSelectMethod('image');
        onNavigate(5);
      }
    },
    {
      id: 'video',
      title: 'Record Continuous Video',
      subtitle: 'Curved Cans / Bottles Rotation Capture',
      description: 'Captures 360-degree cylindrical packaging and extracts optimal non-glare frames for OCR.',
      icon: Video,
      color: 'amber',
      badge: 'Fallback Mode',
      action: () => {
        onSelectMethod('video');
        onNavigate(7);
      }
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
          Step 1: Product Identification
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif mt-2">
          How would you like to identify the product?
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Select an optical capture mode. You can combine barcode lookup with physical photo evidence at any time.
        </p>
      </div>

      {/* 4 Glass Option Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {options.map((opt) => {
          const Icon = opt.icon;

          return (
            <div
              key={opt.id}
              onClick={opt.action}
              className="glass-card glass-card-hover p-6 rounded-[22px] border border-white/90 text-left flex flex-col justify-between cursor-pointer group transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-3 rounded-2xl ${
                    opt.color === 'indigo' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' :
                    opt.color === 'teal' ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20' :
                    'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                  }`}>
                    <Icon size={24} />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {opt.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-900 transition">
                  {opt.title}
                </h3>
                <p className="text-xs font-semibold text-indigo-700/80 mb-2">
                  {opt.subtitle}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {opt.description}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-200/70 flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition">
                <span>Select & Launch Optical Sensor</span>
                <ArrowRight size={16} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Currently Selected Commodity Preview */}
      <GlassCard className="p-4 sm:p-5 border border-white/90 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
            <img
              src={product.imageUrlFront}
              alt={product.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">{product.name}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                GTIN: {product.gtin}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {product.manufacturer} • Declared Net Qty: {product.printedNetQuantity}
            </p>
          </div>
        </div>

        <GlassButton
          variant="primary"
          size="sm"
          onClick={() => onNavigate(5)}
          icon={<ArrowRight size={14} />}
        >
          Proceed to Evidence Capture →
        </GlassButton>
      </GlassCard>
    </div>
  );
};
