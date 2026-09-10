export type ProductIdentificationMode = 'BARCODE' | 'QR' | 'PHOTO' | 'VIDEO' | null;

export type UserRole = 'inspector' | 'regulator';

export type InspectionStatus = 
  | 'DRAFT' 
  | 'EVIDENCE_COLLECTION' 
  | 'OCR_PROCESSING' 
  | 'NEEDS_REVIEW' 
  | 'VERIFIED_COMPLIANT' 
  | 'POTENTIAL_VIOLATION' 
  | 'INSUFFICIENT_EVIDENCE';

export type FindingClassification = 
  | 'VERIFIED' 
  | 'POTENTIAL_VIOLATION' 
  | 'INCONSISTENT' 
  | 'INSUFFICIENT_EVIDENCE';

export interface ProductSample {
  id: string;
  name: string;
  brand: string;
  category: string;
  manufacturer: string;
  manufacturerAddress: string;
  consumerCareEmail: string;
  consumerCarePhone: string;
  gtin: string;
  printedMrp: string;
  printedNetQuantity: string;
  mfd: string;
  expiryDate: string;
  batchNumber: string;
  referenceMrp: string;
  referenceNetQuantity: string;
  referenceCompany: string;
  imageUrlFront: string;
  imageUrlBack: string;
  imageUrlNutrition: string;
  imageUrlBarcode: string;
  hasViolation: boolean;
  violationReason?: string;
  ruleCode?: string;
}

export interface ExtractedField {
  id: string;
  label: string;
  value: string;
  visionCrossCheck: string;
  confidence: number;
  status: 'VERIFIED' | 'NEEDS_VERIFICATION' | 'CONFLICT';
  boundingBox: { x: number; y: number; width: number; height: number }; // percentages 0-100
  sourceAngle: 'Front' | 'Back' | 'Side' | 'Base';
  ruleReference: string;
  referenceValue?: string;
  isCompliant: boolean | null;
  complianceNote?: string;
}

export interface QualityMetric {
  id: string;
  label: string;
  passed: boolean;
  score: number;
  description: string;
}

export interface InspectionRecord {
  id: string;
  date: string;
  time: string;
  inspectorName: string;
  inspectorId: string;
  retailerName: string;
  retailerAddress: string;
  city: string;
  productName: string;
  category: string;
  manufacturer: string;
  gtin: string;
  status: InspectionStatus;
  classification: FindingClassification;
  confidenceScore: number;
  findingsCount: number;
  notes?: string;
  verifiedAt?: string;
}

export interface InspectionStepState {
  currentScreen: number; // 1 to 19
  role: UserRole;
  selectedProduct: ProductSample;
  inspectionId: string;
  inspectionDate: string;
  retailerLocation: string;
  notes: string;
  capturedAngles: {
    front: boolean;
    back: boolean;
    side: boolean;
    label: boolean;
  };
  qualityMode: 'good' | 'bad';
  videoAnalyzing: boolean;
  inconsistencyMode: boolean; // toggle consistent vs data-inconsistency
  inspectorDecision: 'PENDING' | 'VERIFIED_VIOLATION' | 'DISMISSED' | 'REQUEST_MORE';
  inspectorNotes: string;
}
