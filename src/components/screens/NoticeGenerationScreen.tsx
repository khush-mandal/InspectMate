import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Send, 
  Copy, 
  Check, 
  Printer, 
  ShieldAlert, 
  CheckCircle2, 
  Building2, 
  MapPin, 
  Calendar, 
  User, 
  Scale, 
  ExternalLink,
  Share2,
  QrCode,
  AlertTriangle,
  Loader2,
  Package
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { StatusPill } from '../common/StatusPill';
import { ProductSample } from '../../types';
import { exportReportToPDF, downloadReportAsHTML } from '../../utils/pdfExport';

interface NoticeGenerationScreenProps {
  product: ProductSample;
  inspectionId: string;
  onNavigate: (screen: number) => void;
}

export const NoticeGenerationScreen: React.FC<NoticeGenerationScreenProps> = ({
  product,
  inspectionId,
  onNavigate
}) => {
  const [copied, setCopied] = useState(false);
  const [noticeSent, setNoticeSent] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const handleCopySummary = () => {
    const summary = `OFFICIAL REGULATORY NOTICE - FORM VIII\n` +
      `Dossier Ref: ${inspectionId}\n` +
      `Commodity: ${product.name} (GTIN: ${product.gtin})\n` +
      `Manufacturer: ${product.manufacturer}\n` +
      `Inspected Premises: Metro SuperMart Central, Sector 18, Noida\n` +
      `Infringement 1: Rule 6(1)(e) - Dual Pricing & MRP Alteration (Physical ₹349.00 vs Stated ₹199.00)\n` +
      `Infringement 2: Rule 12(2) - Sub-minimum Font Height (1.8mm vs required 2.5mm)\n` +
      `Inspector: Ashish Sainik (INS-DEL-742), Legal Metrology NCT Delhi\n` +
      `Date: ${currentDate}`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportReportToPDF({
        elementId: 'final-inspection-report',
        inspectionId,
        productName: product.name,
        onAfterPrint: () => {
          setIsExporting(false);
        }
      });
    } catch (err) {
      console.error('Error exporting PDF report:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadHTML = () => {
    downloadReportAsHTML({
      elementId: 'final-inspection-report',
      inspectionId,
      productName: product.name
    });
  };

  const handleSendNotice = () => {
    setNoticeSent(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Interactive Action Header (Hidden in Print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/50 p-4 rounded-2xl border border-white/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              Official Regulatory Notice & Dossier
            </h1>
            <StatusPill status="NOTICE_ISSUED" size="md" />
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Form VIII under Rule 29 of the Legal Metrology (Packaged Commodities) Rules, 2011.
          </p>
        </div>

        {/* Export & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <GlassButton
            variant="secondary"
            size="sm"
            onClick={handleCopySummary}
            icon={copied ? <Check size={14} className="text-teal-600" /> : <Copy size={14} />}
          >
            {copied ? 'Summary Copied!' : 'Copy Summary'}
          </GlassButton>

          <GlassButton
            variant="secondary"
            size="sm"
            onClick={handleDownloadHTML}
            icon={<Download size={14} />}
            title="Download formatted HTML archive"
          >
            Save HTML
          </GlassButton>

          <GlassButton
            variant="primary"
            size="sm"
            onClick={handleExportPDF}
            disabled={isExporting}
            icon={isExporting ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
          >
            {isExporting ? 'Formatting PDF...' : 'Export Signed PDF'}
          </GlassButton>
        </div>
      </div>

      {noticeSent && (
        <div className="no-print p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 flex items-center justify-between text-xs font-semibold animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-teal-600" />
            <span>Notice Form VIII dispatched electronically to registered packer email: compliance@abcfoods.in</span>
          </div>
          <span className="font-mono text-[11px] text-teal-700">Ref: DCA-DEL-2026-9912</span>
        </div>
      )}

      {/* Main Official Document Sheet (Print-Friendly Container) */}
      <div 
        id="final-inspection-report" 
        className="printable-report glass-panel p-6 sm:p-10 border border-slate-300/80 shadow-xl space-y-7 bg-white text-slate-900"
      >
        {/* State Seal / Official Header */}
        <div className="text-center border-b-2 border-slate-900 pb-5 space-y-1 print-avoid-break">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-900 mb-1 border border-slate-400">
            <Scale size={24} />
          </div>
          <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-widest text-slate-950">
            Government of National Capital Territory of Delhi
          </h2>
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Department of Consumer Affairs • Legal Metrology Wing
          </p>
          <div className="inline-block px-3 py-1 bg-slate-100 rounded-md border border-slate-300 mt-2">
            <p className="text-[11px] font-mono font-bold text-slate-900 tracking-wide">
              FORM VIII • NOTICE OF STATUTORY INSPECTION & SEIZURE RECOMMENDATION
            </p>
          </div>
          <p className="text-[11px] text-slate-600 font-serif italic pt-1">
            Issued under Section 15 of Legal Metrology Act, 2009 read with Rule 29 of PCR, 2011
          </p>
        </div>

        {/* Dossier Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-300 text-xs stat-box print-avoid-break">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Inspection Dossier ID
            </span>
            <p className="font-mono font-bold text-indigo-950 mt-0.5">{inspectionId}</p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Inspection Date & Time
            </span>
            <p className="font-semibold text-slate-900 mt-0.5">{currentDate}</p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Authorized Inspector
            </span>
            <p className="font-semibold text-slate-900 mt-0.5">Ashish Sainik (INS-DEL-742)</p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Regulatory Determination
            </span>
            <p className="font-bold text-rose-800 mt-0.5">Notice Issued (Violation)</p>
          </div>
        </div>

        {/* Premises & Packer Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs premises-block print-avoid-break">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-200 pb-1">
              <MapPin size={13} className="text-slate-600" />
              Inspected Retail Premises
            </h3>
            <p className="font-bold text-slate-900 pt-1">Metro SuperMart Central</p>
            <p className="text-slate-700">Plot 12, Sector 18 Commercial Hub, Noida, Gautam Buddha Nagar, UP 201301</p>
            <p className="text-slate-600 font-mono text-[11px]">GSTIN: 07AAACM1234F1Z8 • Trade License: TL-NOI-2024-8831</p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-200 pb-1">
              <Building2 size={13} className="text-slate-600" />
              Packer / Manufacturer Entity
            </h3>
            <p className="font-bold text-slate-900 pt-1">{product.manufacturer}</p>
            <p className="text-slate-700">Industrial Area Phase 2, Okhla, New Delhi 110020</p>
            <p className="text-slate-600 font-mono text-[11px]">CIN: U15400DL2018PTC334120 • FSSAI Lic: 10019011006542</p>
          </div>
        </div>

        {/* Commodity Particulars & Photographic Evidence Snippet */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs space-y-3 print-avoid-break">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Package size={13} className="text-slate-600" />
              Commodity Particulars & Seized Sample Evidence
            </h3>
            <span className="font-mono text-[10px] text-slate-500">Evidence Batch: #B-2026-08</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <div className="sm:col-span-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-bold block">Commodity Description:</span>
                <span className="font-bold text-slate-900">{product.name}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-bold block">Global Trade Item No (GTIN):</span>
                <span className="font-mono font-bold text-slate-900">{product.gtin}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-bold block">Declared Net Quantity:</span>
                <span className="font-bold text-slate-900">{product.declaredNetQuantity}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-bold block">Declared MRP on Label:</span>
                <span className="font-bold text-slate-900">{product.declaredMrp}</span>
              </div>
            </div>

            {/* Macro Evidence Photo Preview */}
            <div className="border border-slate-300 rounded-lg p-1.5 bg-white flex items-center gap-3">
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-16 h-16 object-cover rounded border border-slate-200"
                crossOrigin="anonymous"
              />
              <div className="text-[11px] space-y-0.5">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-300 uppercase">
                  Optical Evidence
                </span>
                <p className="text-slate-700 font-medium">Sticker Overlay Detected</p>
                <p className="text-[10px] font-mono text-slate-500">Box: [y:412, x:188]</p>
              </div>
            </div>
          </div>
        </div>

        {/* Violations Table */}
        <div className="space-y-2 print-avoid-break">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center justify-between">
            <span>Summary of Established Statutory Infringements</span>
            <span className="text-[10px] font-normal text-slate-500">2 Infractions Recorded</span>
          </h3>

          <div className="overflow-x-auto rounded-xl border border-slate-300">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Rule Reference</th>
                  <th className="py-2.5 px-3">Statutory Description</th>
                  <th className="py-2.5 px-3">Evidence Discrepancy Recorded</th>
                  <th className="py-2.5 px-3 text-right">Offense Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-3 px-3 font-mono font-bold text-rose-800">
                    PCR 2011 - Rule 6(1)(e)
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-950">
                    Prohibition of Dual Pricing & Sticker Overwrite
                  </td>
                  <td className="py-3 px-3 text-slate-800">
                    Physical sticker ₹349.00 affixed over declared pre-printed retail price ₹199.00.
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="print-severity-major px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                      Major Offense
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-mono font-bold text-amber-800">
                    PCR 2011 - Rule 12(2)
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-950">
                    Numeral & Character Height Ratio Deficit
                  </td>
                  <td className="py-3 px-3 text-slate-800">
                    MRP font height measured 1.8mm; statutory minimum is 2.5mm for packages &gt;200g.
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="print-severity-moderate px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      Moderate
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Formal Statutory Show Cause Notice Directive */}
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/70 text-xs space-y-1.5 legal-notice-box print-avoid-break">
          <h4 className="font-bold text-amber-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-amber-700" />
            Statutory Show-Cause Directive & Compliance Timeline
          </h4>
          <p className="text-amber-900 leading-relaxed text-[11px]">
            You are hereby called upon under Rule 29 of the Legal Metrology (Packaged Commodities) Rules, 2011, to show cause 
            within <strong>fifteen (15) calendar days</strong> from the date of service of this notice as to why penal proceedings 
            under Section 36 of the Legal Metrology Act, 2009 should not be initiated against your establishment. Failure to reply 
            within the stipulated period will result in compounding proceedings or formal complaint filing before the Competent Judicial Magistrate.
          </p>
        </div>

        {/* Digital Signature & Evidentiary Stamp */}
        <div className="pt-4 border-t-2 border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-6 signature-block print-avoid-break">
          <div className="text-xs text-slate-600 space-y-1 text-center sm:text-left">
            <p>Certified Cryptographic Hash: <strong className="font-mono text-slate-900">sha256:d83f27bb09c84e11...99a1</strong></p>
            <p>Timestamp of Cryptographic Signing: {currentDate} • 14:32:08 UTC</p>
            <p className="text-[10px] text-slate-500">Verification URL: https://legalmetrology.gov.in/verify?dossier={inspectionId}</p>
          </div>

          <div className="text-center sm:text-right">
            <div className="print-digital-seal inline-block p-2 border-2 border-dashed border-teal-600 rounded-xl bg-teal-50 mb-1">
              <span className="text-xs font-mono font-bold text-teal-900 flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-teal-700" />
                DIGITALLY CERTIFIED & SIGNED
              </span>
            </div>
            <p className="text-xs font-bold text-slate-950">Ashish Sainik</p>
            <p className="text-[11px] text-slate-600">Legal Metrology Officer, Enforcement Wing • NCT Delhi</p>
          </div>
        </div>
      </div>

      {/* Screen Navigation & Packer Dispatch (Hidden in Print) */}
      <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <GlassButton
          variant="secondary"
          size="md"
          onClick={() => onNavigate(17)}
        >
          ← View All Inspection History
        </GlassButton>

        <div className="flex items-center gap-2">
          <GlassButton
            variant="secondary"
            size="md"
            onClick={handleExportPDF}
            icon={<Printer size={15} />}
          >
            Print Notice
          </GlassButton>

          <GlassButton
            variant="primary"
            size="md"
            onClick={handleSendNotice}
            icon={<Send size={15} />}
          >
            Dispatch Official Notice to Packer
          </GlassButton>
        </div>
      </div>
    </div>
  );
};

