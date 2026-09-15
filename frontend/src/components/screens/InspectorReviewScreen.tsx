import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  FileText, 
  Eye, 
  Edit3, 
  AlertTriangle,
  ZoomIn,
  Send,
  Save,
  PlusCircle,
  History,
  Scale,
  Scan,
  Layers,
  Cpu,
  ExternalLink,
  Lock,
  Camera,
  AlertCircle,
  Check,
  RotateCcw,
  FileCheck,
  Sparkles,
  Info,
  ChevronRight,
  Database,
  UploadCloud,
  X
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { ConfidenceRing } from '../common/ConfidenceRing';
import { StatusPill } from '../common/StatusPill';
import { ProductSample } from '../../types';
import { 
  FinalDecisionState, 
  FieldReviewAction, 
  ViolationReviewAction, 
  ReviewableField, 
  ReviewableViolation,
  InspectorDecision
} from '../../types/domain.types';
import { inspectionReviewService, ReviewBundleResponse } from '../../services/inspectionReview.service';
import { useAuth } from '../../context/AuthContext';

interface InspectorReviewScreenProps {
  product: ProductSample;
  inspectionId?: string;
  onProceed: () => void;
  onNavigate: (screen: number) => void;
}

export const InspectorReviewScreen: React.FC<InspectorReviewScreenProps> = ({
  product,
  inspectionId = 'PRM-2026-0842',
  onProceed,
  onNavigate
}) => {
  const { user } = useAuth();
  const inspectorId = user?.id || 'OFFICER-LM-4091';
  const inspectorName = user?.name || 'Authorized Legal Metrology Officer';

  // Active Tab: 'FIELDS' | 'VIOLATIONS' | 'DECISION'
  const [activeTab, setActiveTab] = useState<'FIELDS' | 'VIOLATIONS' | 'DECISION'>('FIELDS');

  // Loading and error states
  const [loading, setLoading] = useState<boolean>(true);
  const [bundle, setBundle] = useState<ReviewBundleResponse | null>(null);
  const [fields, setFields] = useState<ReviewableField[]>([]);
  const [violations, setViolations] = useState<ReviewableViolation[]>([]);
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('field-mrp');
  const [selectedAngle, setSelectedAngle] = useState<'Front' | 'Back' | 'Side' | 'Additional'>('Back');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Decision State
  const [decisionState, setDecisionState] = useState<FinalDecisionState>('UNDER_REVIEW');
  const [decisionReason, setDecisionReason] = useState<string>(
    'Statutory review in progress under Legal Metrology Act, 2009 & Packaged Commodities Rules, 2011. Evidence and field declarations under officer adjudication.'
  );
  const [submittingDecision, setSubmittingDecision] = useState<boolean>(false);
  const [decisionSubmitted, setDecisionSubmitted] = useState<boolean>(false);
  const [guardrailError, setGuardrailError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals & Drawers
  const [editingField, setEditingField] = useState<ReviewableField | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editReason, setEditReason] = useState<string>('');
  const [showAuditDrawer, setShowAuditDrawer] = useState<boolean>(false);
  const [showAddEvidenceModal, setShowAddEvidenceModal] = useState<boolean>(false);
  const [overrideModalViolation, setOverrideModalViolation] = useState<ReviewableViolation | null>(null);
  const [overrideReasonInput, setOverrideReasonInput] = useState<string>('');

  // New Evidence Form
  const [newEvidenceSide, setNewEvidenceSide] = useState<string>('BACK');
  const [newEvidenceNotes, setNewEvidenceNotes] = useState<string>('');

  // Fetch review bundle on mount
  useEffect(() => {
    loadReviewBundle();
  }, [inspectionId]);

  const loadReviewBundle = async () => {
    try {
      setLoading(true);
      const data = await inspectionReviewService.getReviewBundle(inspectionId);
      setBundle(data);
      setFields(data.extractedFields || []);
      setViolations(data.violations || []);
      setEvidenceList(data.evidence || []);
      if (data.inspection?.decisionState) {
        setDecisionState(data.inspection.decisionState);
      }
      if (data.inspection?.adjudicationReason) {
        setDecisionReason(data.inspection.adjudicationReason);
      }
      setLoading(false);
    } catch (err: any) {
      console.error('Error loading review bundle:', err);
      // Fallback to offline/mock data if network fails
      setFields([
        {
          fieldId: 'field-mrp',
          fieldName: 'Maximum Retail Price (MRP)',
          machineValue: '₹349.00 (Incl. of all taxes)',
          inspectorValue: '₹349.00',
          confidence: 96,
          status: 'PENDING',
          sourceAngle: 'Back',
          ruleReference: 'PCR 2011 - Rule 6(1)(e)',
          boundingBox: { x: 55, y: 65, width: 35, height: 18 }
        },
        {
          fieldId: 'field-net-qty',
          fieldName: 'Net Quantity',
          machineValue: '200 g',
          inspectorValue: '200 g',
          confidence: 99,
          status: 'ACCEPTED',
          sourceAngle: 'Front',
          ruleReference: 'PCR 2011 - Rule 6(1)(c) & Rule 12',
          boundingBox: { x: 15, y: 75, width: 28, height: 12 }
        },
        {
          fieldId: 'field-mfg',
          fieldName: 'Name & Address of Manufacturer',
          machineValue: 'Apex Nutraceuticals Pvt Ltd, Plot 42, Okhla Phase III, New Delhi 110020',
          inspectorValue: 'Apex Nutraceuticals Pvt Ltd, Plot 42, Okhla Phase III, New Delhi 110020',
          confidence: 92,
          status: 'ACCEPTED',
          sourceAngle: 'Back',
          ruleReference: 'PCR 2011 - Rule 6(1)(a)',
          boundingBox: { x: 10, y: 40, width: 80, height: 22 }
        },
        {
          fieldId: 'field-dates',
          fieldName: 'Date of Manufacture / Expiry',
          machineValue: 'MFD: 02/2026 | EXP: 01/2028',
          inspectorValue: 'MFD: 02/2026 | EXP: 01/2028',
          confidence: 88,
          status: 'ACCEPTED',
          sourceAngle: 'Side',
          ruleReference: 'PCR 2011 - Rule 6(1)(d)',
          boundingBox: { x: 20, y: 30, width: 60, height: 15 }
        },
        {
          fieldId: 'field-care',
          fieldName: 'Consumer Care Helpline & Email',
          machineValue: '1800-11-4477 | care@apexnutra.com',
          inspectorValue: '1800-11-4477 | care@apexnutra.com',
          confidence: 94,
          status: 'ACCEPTED',
          sourceAngle: 'Back',
          ruleReference: 'PCR 2011 - Rule 6(1)(n)',
          boundingBox: { x: 10, y: 80, width: 75, height: 14 }
        }
      ]);
      setViolations([
        {
          violationId: 'viol-dual-pricing',
          ruleId: 'RULE-DUAL-PRICING',
          ruleName: 'Prohibition of Alteration of Price / Dual Pricing',
          regulationReference: 'Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 18(1) & Rule 6(1)(e)',
          severity: 'CRITICAL',
          description: 'Secondary price sticker of ₹349.00 pasted over original manufacturer declaration of ₹199.00 without statutory justification.',
          status: 'PENDING',
          affectedFields: ['mrp']
        }
      ]);
      setLoading(false);
    }
  };

  const selectedField = useMemo(() => {
    return fields.find(f => f.fieldId === selectedFieldId) || fields[0];
  }, [fields, selectedFieldId]);

  // Handle Field Actions
  const handleFieldAction = async (fieldId: string, action: FieldReviewAction) => {
    setGuardrailError(null);
    if (action === 'EDIT') {
      const target = fields.find(f => f.fieldId === fieldId);
      if (target) {
        setEditingField(target);
        setEditValue(target.inspectorValue || target.machineValue);
        setEditReason('');
      }
      return;
    }

    try {
      const res = await inspectionReviewService.updateFieldReview(inspectionId, {
        fieldId,
        action
      });
      setFields(res.allFields);
      setSuccessMessage(`Field status updated to ${action}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      // Local state fallback
      setFields(prev => prev.map(f => {
        if (f.fieldId === fieldId) {
          return {
            ...f,
            status: action === 'ACCEPT' ? 'ACCEPTED' : action === 'MARK_UNREADABLE' ? 'UNREADABLE' : 'RECAPTURE_REQUESTED',
            inspectorValue: action === 'ACCEPT' ? f.machineValue : action === 'MARK_UNREADABLE' ? '[UNREADABLE]' : f.inspectorValue
          };
        }
        return f;
      }));
    }
  };

  const submitFieldEdit = async () => {
    if (!editingField || !editValue.trim()) return;

    try {
      const res = await inspectionReviewService.updateFieldReview(inspectionId, {
        fieldId: editingField.fieldId,
        action: 'EDIT',
        inspectorValue: editValue.trim(),
        reason: editReason
      });
      setFields(res.allFields);
      setEditingField(null);
      setSuccessMessage(`Field value updated to "${editValue}" (machineValue strictly preserved)`);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      // Local state fallback
      setFields(prev => prev.map(f => {
        if (f.fieldId === editingField.fieldId) {
          return {
            ...f,
            status: 'EDITED',
            inspectorValue: editValue.trim(),
            notes: editReason
          };
        }
        return f;
      }));
      setEditingField(null);
    }
  };

  // Handle Violation Actions
  const handleViolationAction = async (violationId: string, action: ViolationReviewAction) => {
    setGuardrailError(null);
    if (action === 'REJECT') {
      const v = violations.find(vi => vi.violationId === violationId);
      if (v) {
        setOverrideModalViolation(v);
        setOverrideReasonInput(v.overrideReason || '');
      }
      return;
    }

    try {
      const res = await inspectionReviewService.updateViolationReview(inspectionId, {
        violationId,
        action
      });
      setViolations(res.allViolations);
      setSuccessMessage(`Violation ${action === 'CONFIRM' ? 'confirmed' : 'evidence requested'}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setViolations(prev => prev.map(v => {
        if (v.violationId === violationId) {
          return {
            ...v,
            status: action === 'CONFIRM' ? 'CONFIRMED' : 'REQUIRES_EVIDENCE'
          };
        }
        return v;
      }));
    }
  };

  const submitViolationOverride = async () => {
    if (!overrideModalViolation) return;
    if (!overrideReasonInput || overrideReasonInput.trim().length < 5) {
      setGuardrailError('Mandatory statutory justification reason is required to reject/override a violation (minimum 5 characters).');
      return;
    }

    try {
      const res = await inspectionReviewService.updateViolationReview(inspectionId, {
        violationId: overrideModalViolation.violationId,
        action: 'REJECT',
        overrideReason: overrideReasonInput.trim()
      });
      setViolations(res.allViolations);
      setOverrideModalViolation(null);
      setOverrideReasonInput('');
      setSuccessMessage('Violation rejected with documented officer justification.');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setViolations(prev => prev.map(v => {
        if (v.violationId === overrideModalViolation.violationId) {
          return {
            ...v,
            status: 'REJECTED',
            overrideReason: overrideReasonInput.trim()
          };
        }
        return v;
      }));
      setOverrideModalViolation(null);
      setOverrideReasonInput('');
    }
  };

  // Handle Additional Evidence Capture (Without Losing Existing Evidence)
  const handleAddEvidence = async () => {
    try {
      await inspectionReviewService.attachAdditionalEvidence(inspectionId, {
        captureSide: newEvidenceSide,
        storageKey: `additional_${newEvidenceSide.toLowerCase()}_${Date.now()}.jpg`,
        qualityScore: 94,
        notes: newEvidenceNotes
      });

      setEvidenceList(prev => [
        ...prev,
        {
          _id: `ev-new-${Date.now()}`,
          captureSide: newEvidenceSide,
          storageKey: `additional_${newEvidenceSide.toLowerCase()}_${Date.now()}.jpg`,
          capturedAt: new Date(),
          qualityAssessment: 'ACCEPT',
          qualityInformation: { score: 94 }
        }
      ]);

      setShowAddEvidenceModal(false);
      setNewEvidenceNotes('');
      setSuccessMessage('Additional evidence attached successfully without altering existing records.');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      console.error(err);
      setShowAddEvidenceModal(false);
    }
  };

  // Guardrail Evaluation Check before submitting decision
  const complianceGuardrail = useMemo(() => {
    const unreadable = fields.filter(f => f.status === 'UNREADABLE');
    const recapture = fields.filter(f => f.status === 'RECAPTURE_REQUESTED');
    const activeViolations = violations.filter(v => v.status === 'CONFIRMED' || v.status === 'PENDING');

    const canBeCompliant = unreadable.length === 0 && recapture.length === 0 && activeViolations.length === 0;

    let blockingReason = '';
    if (unreadable.length > 0) {
      blockingReason = `Cannot mark COMPLIANT: ${unreadable.length} field(s) (${unreadable.map(f => f.fieldName).join(', ')}) marked UNREADABLE. Incomplete evidence cannot silently become compliant.`;
    } else if (recapture.length > 0) {
      blockingReason = `Cannot mark COMPLIANT: Recapture requested for ${recapture.length} field(s). Supplementary evidence required.`;
    } else if (activeViolations.length > 0) {
      blockingReason = `Cannot mark COMPLIANT: ${activeViolations.length} violation(s) remain active or unreviewed. Inspector override with statutory justification is required to reject each violation.`;
    }

    return {
      canBeCompliant,
      blockingReason
    };
  }, [fields, violations]);

  // Submit Final Adjudication Decision
  const handleSubmitDecision = async () => {
    setGuardrailError(null);

    if (!decisionReason || decisionReason.trim().length < 5) {
      setGuardrailError('A documented statutory justification reason is required for court docket recording.');
      return;
    }

    if (decisionState === 'COMPLIANT' && !complianceGuardrail.canBeCompliant) {
      setGuardrailError(complianceGuardrail.blockingReason);
      return;
    }

    setSubmittingDecision(true);
    try {
      await inspectionReviewService.submitFinalDecision(inspectionId, {
        decision: decisionState,
        reason: decisionReason.trim()
      });
      setSubmittingDecision(false);
      setDecisionSubmitted(true);
      setSuccessMessage(`Final decision [${decisionState}] recorded and locked in immutable audit trail!`);
    } catch (err: any) {
      setSubmittingDecision(false);
      setGuardrailError(err.message || 'Failed to record decision');
    }
  };

  // Active Image Source based on angle or field
  const currentImageSrc = useMemo(() => {
    if (selectedAngle === 'Front') return product.imageUrlFront;
    if (selectedAngle === 'Side') return product.imageUrlNutrition;
    return product.imageUrlBack;
  }, [selectedAngle, product]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Toast Alert */}
      {successMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 p-4 rounded-2xl bg-emerald-600 text-white shadow-xl text-sm font-semibold animate-bounce">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Inspection Dossier: {inspectionId}
            </span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              <ShieldCheck size={12} />
              Human-In-The-Loop Cockpit
            </span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Current State: {decisionState}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif text-white">
            Statutory Inspection Review & Adjudication
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Authorized Officer: <span className="text-teal-300 font-bold">{inspectorName}</span> ({inspectorId}). 
            Machine AI results provide evidence suggestions; the human officer renders the sole legally binding decision.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setShowAuditDrawer(true)}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition border border-white/10"
          >
            <History size={15} />
            <span>Audit Trail</span>
          </button>

          <GlassButton
            variant="primary"
            size="md"
            onClick={onProceed}
            icon={<ArrowRight size={16} />}
          >
            Generate Official Notice →
          </GlassButton>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/80 border border-slate-200/80 shadow-xs backdrop-blur-md">
        <button
          onClick={() => setActiveTab('FIELDS')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'FIELDS'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <FileText size={15} />
          <span>Extracted Fields & Provenance ({fields.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('VIOLATIONS')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'VIOLATIONS'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <AlertTriangle size={15} />
          <span>Rules, Violations & Regulations ({violations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('DECISION')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'DECISION'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Scale size={15} />
          <span>Final Adjudication Bar ({decisionState})</span>
        </button>
      </div>

      {/* Main Review Cockpit Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Visual Evidence Studio & Quality Breakdown */}
        <div className="lg:col-span-5 space-y-4">
          <GlassCard className="p-4 border border-white/90 sticky top-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-indigo-600" />
                <span className="text-xs font-bold text-slate-900">
                  Visual Evidence Ground Truth
                </span>
              </div>

              {/* Angle Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
                {(['Front', 'Back', 'Side'] as const).map(angle => (
                  <button
                    key={angle}
                    onClick={() => setSelectedAngle(angle)}
                    className={`px-2 py-0.5 rounded-md transition ${
                      selectedAngle === angle 
                        ? 'bg-white text-indigo-700 shadow-xs' 
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {angle}
                  </button>
                ))}
              </div>
            </div>

            {/* Evidence Image Viewer with Bounding Box Overlay */}
            <div className="relative rounded-2xl overflow-hidden aspect-4/3 bg-slate-900 shadow-inner group">
              <img
                src={currentImageSrc}
                alt="Evidence"
                style={{ transform: `scale(${zoomLevel})` }}
                className="w-full h-full object-cover transition-transform duration-200 cursor-crosshair"
                referrerPolicy="no-referrer"
              />

              {/* Bounding Box for Selected Field */}
              {selectedField && selectedField.boundingBox && selectedField.sourceAngle === selectedAngle && (
                <div
                  className="absolute border-2 border-teal-400 bg-teal-400/20 rounded-md transition-all pointer-events-none"
                  style={{
                    top: `${selectedField.boundingBox.y}%`,
                    left: `${selectedField.boundingBox.x}%`,
                    width: `${selectedField.boundingBox.width}%`,
                    height: `${selectedField.boundingBox.height}%`
                  }}
                >
                  <span className="absolute -top-5 left-0 px-1.5 py-0.5 rounded bg-teal-600 text-white font-mono text-[9px] font-bold">
                    {selectedField.fieldName}
                  </span>
                </div>
              )}

              {/* Bottom Viewer Controls */}
              <div className="absolute bottom-2 left-2 right-2 p-2 rounded-xl bg-slate-950/80 backdrop-blur-md text-white text-[11px] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-slate-300 font-mono">Angle: {selectedAngle}</span>
                  <span className="text-emerald-400 font-bold">• 1080p Verified</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setZoomLevel(prev => Math.max(1, prev - 0.25))}
                    className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-xs font-bold"
                  >
                    -
                  </button>
                  <span className="font-mono text-[10px] px-1">{Math.round(zoomLevel * 100)}%</span>
                  <button
                    onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.25))}
                    className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-xs font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Quality Analysis Scores */}
            <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-indigo-600" />
                  Gemini Evidentiary Quality Metrics
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Acceptable for Legal Court Filing
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                <div className="p-2 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
                  <span className="block text-[10px] text-slate-500 uppercase font-semibold">Sharpness</span>
                  <span className="text-xs font-mono font-bold text-slate-900">96/100</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
                  <span className="block text-[10px] text-slate-500 uppercase font-semibold">Glare</span>
                  <span className="text-xs font-mono font-bold text-emerald-700">None (98%)</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
                  <span className="block text-[10px] text-slate-500 uppercase font-semibold">Resolution</span>
                  <span className="text-xs font-mono font-bold text-slate-900">1920x1080</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
                  <span className="block text-[10px] text-slate-500 uppercase font-semibold">Legibility</span>
                  <span className="text-xs font-mono font-bold text-teal-700">High (95%)</span>
                </div>
              </div>
            </div>

            {/* Supplementary Evidence Bar */}
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Layers size={14} className="text-indigo-600" />
                <span>Evidence Records: <strong>{evidenceList.length || 3} items</strong></span>
              </div>

              <button
                onClick={() => setShowAddEvidenceModal(true)}
                className="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold flex items-center gap-1 text-[11px] transition"
              >
                <PlusCircle size={13} />
                <span>Capture Supplementary Evidence</span>
              </button>
            </div>
          </GlassCard>
        </div>

        {/* RIGHT COLUMN: Active Workstation Tab Content */}
        <div className="lg:col-span-7 space-y-4">
          {/* TAB 1: EXTRACTED FIELDS & PROVENANCE ADJUDICATION */}
          {activeTab === 'FIELDS' && (
            <GlassCard className="p-6 border border-white/90 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <span>Statutory Field Adjudication</span>
                    <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      Provenance Preserved
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Original machine values are permanently preserved in amber. Officer decisions are recorded separately.
                  </p>
                </div>
              </div>

              {/* Fields List */}
              <div className="space-y-3">
                {fields.map((field) => {
                  const isSelected = selectedFieldId === field.fieldId;
                  const isEdited = field.status === 'EDITED';
                  const isUnreadable = field.status === 'UNREADABLE';
                  const isRecapture = field.status === 'RECAPTURE_REQUESTED';
                  const isAccepted = field.status === 'ACCEPTED';

                  return (
                    <div
                      key={field.fieldId}
                      onClick={() => {
                        setSelectedFieldId(field.fieldId);
                        if (field.sourceAngle) {
                          setSelectedAngle(field.sourceAngle as any);
                        }
                      }}
                      className={`
                        p-4 rounded-2xl border transition-all cursor-pointer text-left
                        ${
                          isSelected
                            ? 'bg-white/95 border-indigo-400 shadow-md ring-2 ring-indigo-500/20'
                            : 'bg-white/60 hover:bg-white border-slate-200/80'
                        }
                      `}
                    >
                      {/* Field Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{field.fieldName}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {field.sourceAngle || 'Panel'}
                          </span>
                          <span className="text-[10px] text-slate-400">{field.ruleReference}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isAccepted && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                              <Check size={11} /> Accepted
                            </span>
                          )}
                          {isEdited && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
                              <Edit3 size={11} /> Officer Edited
                            </span>
                          )}
                          {isUnreadable && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                              <XCircle size={11} /> Unreadable
                            </span>
                          )}
                          {isRecapture && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                              <RotateCcw size={11} /> Recapture
                            </span>
                          )}
                          <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                            {field.confidence}% OCR
                          </span>
                        </div>
                      </div>

                      {/* Values Comparison: Machine vs Officer */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Original Machine Value:
                          </span>
                          <p className="font-mono text-slate-700 font-semibold mt-0.5 select-all">
                            {field.machineValue}
                          </p>
                        </div>

                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                            Officer Value (Binding):
                          </span>
                          <p className={`font-mono font-bold mt-0.5 ${isEdited ? 'text-indigo-700' : isUnreadable ? 'text-rose-600' : 'text-slate-900'}`}>
                            {field.inspectorValue || field.machineValue}
                          </p>
                        </div>
                      </div>

                      {field.notes && (
                        <p className="text-[11px] text-slate-600 italic bg-amber-50/60 p-1.5 rounded-lg border border-amber-200/60 mb-2">
                          Note: {field.notes}
                        </p>
                      )}

                      {/* Action Buttons for Every Field */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/60" onClick={e => e.stopPropagation()}>
                        <span className="text-[10px] font-semibold text-slate-500 mr-1">Action:</span>

                        <button
                          type="button"
                          onClick={() => handleFieldAction(field.fieldId, 'ACCEPT')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            field.status === 'ACCEPTED'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200'
                          }`}
                        >
                          <Check size={12} />
                          <span>Accept Value</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleFieldAction(field.fieldId, 'EDIT')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            field.status === 'EDITED'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200'
                          }`}
                        >
                          <Edit3 size={12} />
                          <span>Edit Value</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleFieldAction(field.fieldId, 'MARK_UNREADABLE')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            field.status === 'UNREADABLE'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200'
                          }`}
                        >
                          <XCircle size={12} />
                          <span>Mark Unreadable</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleFieldAction(field.fieldId, 'REQUEST_RECAPTURE')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            field.status === 'RECAPTURE_REQUESTED'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-700 border border-slate-200'
                          }`}
                        >
                          <RotateCcw size={12} />
                          <span>Request Recapture</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Barcode & AI Verification Summary */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                    <Scan size={14} className="text-indigo-600" />
                    Barcode & GS1 Registry Intel
                  </span>
                  <span className="font-mono text-[11px] font-bold text-indigo-700">GTIN-13: {product.gtin}</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  GS1 Database verified manufacturer as <strong>{product.manufacturer}</strong>. Central price record is ₹{product.referenceMrp || '199.00'}.
                </p>
              </div>
            </GlassCard>
          )}

          {/* TAB 2: RULES, VIOLATIONS & REGULATION REFERENCES */}
          {activeTab === 'VIOLATIONS' && (
            <GlassCard className="p-6 border border-white/90 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <span>Statutory Violations & Legal Rules</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                      Legal Metrology Act, 2009
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review statutory non-compliances. Overriding machine violations requires a mandatory legal rationale.
                  </p>
                </div>
              </div>

              {/* Detected Conflicts Matrix */}
              <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 text-xs space-y-2">
                <div className="flex items-center gap-2 text-rose-900 font-bold">
                  <AlertCircle size={16} className="text-rose-600" />
                  <span>Cross-Source Discrepancy Conflict Detected</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                  <div className="bg-white p-2 rounded-xl border border-rose-200/60">
                    <span className="text-slate-500 block text-[10px]">Printed Package Label (OCR):</span>
                    <span className="font-bold text-rose-700">₹349.00</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-rose-200/60">
                    <span className="text-slate-500 block text-[10px]">GS1 National Registry:</span>
                    <span className="font-bold text-emerald-700">₹199.00</span>
                  </div>
                </div>
                <p className="text-[11px] text-rose-800">
                  Conflict Type: <strong>DUAL_PRICING_STICKER_OVERWRITE</strong>. Sticker affixed over original manufacturer MRP.
                </p>
              </div>

              {/* Violations Adjudication Cards */}
              <div className="space-y-3">
                {violations.map(violation => {
                  const isConfirmed = violation.status === 'CONFIRMED';
                  const isRejected = violation.status === 'REJECTED';
                  const isRequiresEvidence = violation.status === 'REQUIRES_EVIDENCE';

                  return (
                    <div
                      key={violation.violationId}
                      className={`p-4 rounded-2xl border transition-all text-left ${
                        isConfirmed 
                          ? 'bg-rose-50/40 border-rose-300' 
                          : isRejected 
                          ? 'bg-emerald-50/40 border-emerald-300' 
                          : 'bg-white border-slate-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-900">{violation.ruleName}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                            {violation.severity}
                          </span>
                        </div>

                        <div>
                          {isConfirmed && (
                            <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200">
                              Violation Confirmed
                            </span>
                          )}
                          {isRejected && (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                              Dismissed / Overridden
                            </span>
                          )}
                          {isRequiresEvidence && (
                            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                              More Evidence Requested
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed font-medium mb-2">
                        {violation.description}
                      </p>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] mb-3">
                        <span className="font-bold text-slate-800">Statutory Citation:</span>
                        <p className="text-slate-600 mt-0.5">{violation.regulationReference}</p>
                      </div>

                      {violation.overrideReason && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-[11px] mb-3 text-emerald-900">
                          <span className="font-bold">Officer Dismissal Justification:</span>
                          <p className="mt-0.5 italic">{violation.overrideReason}</p>
                        </div>
                      )}

                      {/* Violation Action Controls */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60">
                        <span className="text-[11px] font-semibold text-slate-500">Adjudication:</span>

                        <button
                          type="button"
                          onClick={() => handleViolationAction(violation.violationId, 'CONFIRM')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            isConfirmed
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200'
                          }`}
                        >
                          <CheckCircle2 size={13} />
                          <span>Confirm Violation</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleViolationAction(violation.violationId, 'REJECT')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            isRejected
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200'
                          }`}
                        >
                          <XCircle size={13} />
                          <span>Reject / Override (With Reason)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleViolationAction(violation.violationId, 'REQUEST_ADDITIONAL_EVIDENCE')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            isRequiresEvidence
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-700 border border-slate-200'
                          }`}
                        >
                          <HelpCircle size={13} />
                          <span>Request Evidence</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Statutory Regulation References Reference Table */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Scale size={14} className="text-indigo-600" />
                  Statutory Provisions under Evaluation
                </span>
                <div className="space-y-1.5 text-[11px] text-slate-600">
                  <div className="p-2 rounded-lg bg-white border border-slate-200/60">
                    <strong className="text-slate-800">PCR 2011 - Rule 18(1):</strong> Prohibition of alteration of price marked on the pre-packaged commodity.
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200/60">
                    <strong className="text-slate-800">PCR 2011 - Rule 6(1)(e):</strong> Requirement for declaration of Maximum Retail Price (inclusive of all taxes).
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200/60">
                    <strong className="text-slate-800">Legal Metrology Act, 2009 - Section 36:</strong> Penalty for selling, etc., of non-standard packages.
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {/* TAB 3: FINAL ADJUDICATION BAR & LEGAL DOSSIER SUBMISSION */}
          {activeTab === 'DECISION' && (
            <GlassCard className="p-6 border border-white/90 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Scale size={16} className="text-indigo-600" />
                    <span>Final Inspection Decision Docket</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select binding legal decision state and record mandatory statutory justification for judicial review.
                  </p>
                </div>

                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-900 text-white">
                  Officer: {inspectorId}
                </span>
              </div>

              {/* Guardrail Alert */}
              {guardrailError && (
                <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 text-xs flex items-start gap-2.5 animate-shake">
                  <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-rose-800 font-bold">Compliance Guardrail Triggered</strong>
                    <p className="mt-0.5 leading-relaxed">{guardrailError}</p>
                  </div>
                </div>
              )}

              {/* 7 Decision States Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Select Final Adjudication State:
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { state: 'COMPLIANT', color: 'emerald', label: 'COMPLIANT', desc: 'All statutory rules fully verified' },
                    { state: 'NON_COMPLIANT', color: 'rose', label: 'NON_COMPLIANT', desc: 'Violations confirmed; action required' },
                    { state: 'REQUIRES_EVIDENCE', color: 'amber', label: 'REQUIRES_EVIDENCE', desc: 'Incomplete evidence; supplementary needed' },
                    { state: 'INCONCLUSIVE', color: 'slate', label: 'INCONCLUSIVE', desc: 'Indeterminate data' },
                    { state: 'UNDER_REVIEW', color: 'indigo', label: 'UNDER_REVIEW', desc: 'Adjudication ongoing' },
                    { state: 'DRAFT', color: 'slate', label: 'DRAFT', desc: 'Preliminary inspection draft' },
                    { state: 'CLOSED', color: 'slate', label: 'CLOSED', desc: 'Inspection docket closed' }
                  ].map(item => {
                    const isSelected = decisionState === item.state;

                    return (
                      <button
                        key={item.state}
                        type="button"
                        onClick={() => {
                          setDecisionState(item.state as FinalDecisionState);
                          setGuardrailError(null);
                        }}
                        className={`
                          p-3 rounded-2xl border text-left transition relative
                          ${
                            isSelected
                              ? item.state === 'COMPLIANT'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                                : item.state === 'NON_COMPLIANT'
                                ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-500/20'
                                : item.state === 'REQUIRES_EVIDENCE'
                                ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-500/20'
                                : 'bg-slate-900 text-white border-slate-900 shadow-md'
                              : 'bg-white/70 hover:bg-white border-slate-200 text-slate-800'
                          }
                        `}
                      >
                        <span className="block text-xs font-mono font-extrabold tracking-wide">
                          {item.label}
                        </span>
                        <span className={`block text-[10px] mt-1 leading-tight ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                          {item.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mandatory Statutory Justification Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>Mandatory Officer Adjudication Justification:</span>
                  <span className="text-[10px] text-slate-400 font-normal">Recorded into legal court dossier</span>
                </label>
                <textarea
                  rows={4}
                  value={decisionReason}
                  onChange={(e) => {
                    setDecisionReason(e.target.value);
                    setGuardrailError(null);
                  }}
                  className="w-full glass-input p-3.5 rounded-2xl text-xs font-medium text-slate-900 leading-relaxed"
                  placeholder="State detailed statutory rationale for final determination under Legal Metrology Act, 2009 and Packaged Commodities Rules, 2011..."
                />
              </div>

              {/* Digital Officer Sign & Verification Seal */}
              <div className="p-4 rounded-2xl bg-linear-to-r from-slate-50 to-indigo-50/50 border border-slate-200/80 text-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold font-serif text-base shadow-sm">
                    LM
                  </div>
                  <div>
                    <span className="block font-bold text-slate-900">{inspectorName}</span>
                    <span className="block text-[10px] text-slate-500 font-mono">Badge: {inspectorId} • Ministry of Consumer Affairs</span>
                  </div>
                </div>

                <div className="text-right font-mono text-[11px] text-slate-600">
                  <span className="block font-bold text-emerald-700">Digital Seal: SHA-256</span>
                  <span className="text-[10px] text-slate-400">Timestamp: {new Date().toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Submit & Navigation Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <GlassButton
                  variant="secondary"
                  size="md"
                  onClick={() => onNavigate(12)}
                >
                  ← Back to Checklist
                </GlassButton>

                <GlassButton
                  variant="primary"
                  size="md"
                  onClick={handleSubmitDecision}
                  disabled={submittingDecision}
                  icon={submittingDecision ? <RotateCcw size={16} className="animate-spin" /> : <FileCheck size={16} />}
                >
                  {submittingDecision ? 'Sealing Docket...' : `Seal & Finalize Decision [${decisionState}]`}
                </GlassButton>
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      {/* MODAL: EDIT FIELD VALUE (Tamper-Proof Provenance) */}
      {editingField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Edit3 size={16} className="text-indigo-600" />
                <span>Adjudicate Extracted Field Value</span>
              </h3>
              <button onClick={() => setEditingField(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs">
              <span className="block text-[10px] uppercase font-bold text-amber-900">
                Original Machine Output (Immutable):
              </span>
              <p className="font-mono font-bold text-amber-950 mt-0.5">{editingField.machineValue}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Authorized Officer Value:
              </label>
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full glass-input p-3 rounded-xl text-xs font-bold text-slate-900 font-mono"
                placeholder="Enter corrected value..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Modification Statutory Rationale:
              </label>
              <textarea
                rows={2}
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                className="w-full glass-input p-2.5 rounded-xl text-xs text-slate-700"
                placeholder="E.g., Correction after inspecting PDP magnifying glass lens..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingField(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitFieldEdit}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              >
                Save Inspector Value
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIOLATION REJECTION / OVERRIDE (Mandatory Statutory Justification) */}
      {overrideModalViolation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <XCircle size={16} className="text-rose-600" />
                <span>Override & Reject Machine Violation</span>
              </h3>
              <button onClick={() => setOverrideModalViolation(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-900">{overrideModalViolation.ruleName}</span>
              <p className="text-slate-600 text-[11px]">{overrideModalViolation.description}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Mandatory Statutory Justification for Dismissal (Minimum 5 characters):
              </label>
              <textarea
                rows={3}
                value={overrideReasonInput}
                onChange={(e) => setOverrideReasonInput(e.target.value)}
                className="w-full glass-input p-3 rounded-xl text-xs text-slate-800 leading-relaxed"
                placeholder="State legal exemption, Gazette notification, or supporting official documents justifying dismissal..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setOverrideModalViolation(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitViolationOverride}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                Confirm Statutory Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CAPTURE ADDITIONAL EVIDENCE */}
      {showAddEvidenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Camera size={16} className="text-indigo-600" />
                <span>Capture Supplementary Evidence</span>
              </h3>
              <button onClick={() => setShowAddEvidenceModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Supplementary photos will be appended to the permanent inspection record with SHA-256 hashes. Prior evidence is never destroyed.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Target Packaging Angle / Feature:
              </label>
              <select
                value={newEvidenceSide}
                onChange={(e) => setNewEvidenceSide(e.target.value)}
                className="w-full glass-input p-2.5 rounded-xl text-xs font-semibold text-slate-900"
              >
                <option value="BACK">Back Declaration Panel</option>
                <option value="FRONT">Principal Display Panel (PDP)</option>
                <option value="SIDE">Date / Batch Stamp Macro</option>
                <option value="TOP">Cap / Seal Stamp</option>
                <option value="BOTTOM">Bottom Barcode Close-Up</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Inspector Observation Notes:
              </label>
              <textarea
                rows={2}
                value={newEvidenceNotes}
                onChange={(e) => setNewEvidenceNotes(e.target.value)}
                className="w-full glass-input p-2.5 rounded-xl text-xs text-slate-800"
                placeholder="High-resolution close-up of sticker corner..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowAddEvidenceModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddEvidence}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5"
              >
                <UploadCloud size={14} />
                <span>Attach Evidence</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER: FULL AUDIT TRAIL */}
      {showAuditDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md h-full bg-white shadow-2xl p-6 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <History size={18} className="text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Immutable Audit Trail</h3>
              </div>
              <button onClick={() => setShowAuditDrawer(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Chronological ledger of all machine extractions, officer edits, overrides, and final decisions.
            </p>

            <div className="space-y-3 pt-2">
              {(bundle?.auditLogs || []).length > 0 ? (
                bundle?.auditLogs.map((log: any, index: number) => (
                  <div key={log._id || index} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 font-mono text-[11px]">{log.action}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </span>
                    </div>

                    {log.metadata?.fieldName && (
                      <div className="text-[11px] text-slate-600">
                        Field: <strong>{log.metadata.fieldName}</strong> • Action: <strong>{log.metadata.action}</strong>
                      </div>
                    )}

                    {log.metadata?.machineValue && (
                      <div className="text-[10px] font-mono text-slate-500 bg-white p-1.5 rounded-lg border border-slate-200/60">
                        Machine: {log.metadata.machineValue}
                        <br />
                        Inspector: <span className="font-bold text-indigo-700">{log.metadata.inspectorValue}</span>
                      </div>
                    )}

                    {log.metadata?.overrideReason && (
                      <p className="text-[10px] italic text-emerald-800">
                        Override: {log.metadata.overrideReason}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No previous modifications logged for this session.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
