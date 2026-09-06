import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  ChevronRight, 
  MapPin, 
  Calendar, 
  Building2, 
  SlidersHorizontal,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { StatusPill } from '../common/StatusPill';
import { HISTORICAL_INSPECTIONS } from '../../data/mockData';
import { InspectionRecord } from '../../types';

interface InspectionHistoryScreenProps {
  onSelectInspection: (record: InspectionRecord) => void;
  onNavigate: (screen: number) => void;
}

export const InspectionHistoryScreen: React.FC<InspectionHistoryScreenProps> = ({
  onSelectInspection,
  onNavigate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredRecords = HISTORICAL_INSPECTIONS.filter(record => {
    const matchesSearch = 
      record.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.gtin.includes(searchQuery) ||
      record.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.retailerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || record.classification === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      ["ID,Product,GTIN,Manufacturer,Retailer,City,Status,Confidence,Date"]
      .concat(filteredRecords.map(r => `${r.id},"${r.productName}",${r.gtin},"${r.manufacturer}","${r.retailerName}",${r.city},${r.classification},${r.confidenceScore},${r.date}`))
      .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `InspectMate_Inspections_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              Inspection Dossier Repository
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {filteredRecords.length} Records
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Historical logs of field inspections, optical proof packages, and official notice notices.
          </p>
        </div>

        <GlassButton
          variant="secondary"
          size="sm"
          onClick={handleExportCSV}
          icon={<FileSpreadsheet size={15} />}
        >
          Export CSV Registry
        </GlassButton>
      </div>

      {/* Filter and Search Bar */}
      <GlassCard className="p-4 sm:p-5 border border-white/90 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, Product Name, GTIN, or Retailer..."
              className="w-full glass-input pl-10 pr-4 py-2 rounded-xl text-xs font-semibold text-slate-900"
            />
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {['ALL', 'VERIFIED', 'POTENTIAL_VIOLATION', 'INCONSISTENT', 'DRAFT'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  statusFilter === status
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white/70 text-slate-600 hover:bg-white hover:text-slate-900 border border-slate-200/80'
                }`}
              >
                {status === 'ALL' ? 'All Dossiers' : status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Main Table */}
      <GlassCard className="p-5 sm:p-6 border border-white/90">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="pb-3 pl-2">Inspection ID</th>
                <th className="pb-3">Product Name & GTIN</th>
                <th className="pb-3">Manufacturer</th>
                <th className="pb-3">Retail Premises</th>
                <th className="pb-3">Audit Date</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Certainty</th>
                <th className="pb-3 text-right pr-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((record) => (
                <tr
                  key={record.id}
                  onClick={() => {
                    onSelectInspection(record);
                    onNavigate(15);
                  }}
                  className="hover:bg-white/70 transition group cursor-pointer"
                >
                  <td className="py-3.5 pl-2 font-mono font-bold text-indigo-700">
                    {record.id}
                  </td>

                  <td className="py-3.5 max-w-[220px]">
                    <p className="font-bold text-slate-900 truncate">{record.productName}</p>
                    <p className="font-mono text-[10px] text-slate-500">GTIN: {record.gtin}</p>
                  </td>

                  <td className="py-3.5 text-slate-600 max-w-[150px] truncate">
                    {record.manufacturer}
                  </td>

                  <td className="py-3.5 text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate max-w-[140px]">{record.retailerName}</span>
                    </span>
                  </td>

                  <td className="py-3.5 text-slate-500 font-mono text-[11px]">
                    {record.date}
                  </td>

                  <td className="py-3.5">
                    <StatusPill status={record.classification} size="sm" />
                  </td>

                  <td className="py-3.5 font-semibold text-slate-700">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                      record.confidenceScore >= 90 ? 'bg-teal-50 text-teal-800' :
                      record.confidenceScore >= 70 ? 'bg-amber-50 text-amber-800' :
                      'bg-rose-50 text-rose-800'
                    }`}>
                      {record.confidenceScore}%
                    </span>
                  </td>

                  <td className="py-3.5 text-right pr-2">
                    <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold text-xs group-hover:translate-x-1 transition">
                      Review <ChevronRight size={14} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};
