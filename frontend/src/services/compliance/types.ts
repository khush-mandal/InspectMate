export type RuleResultStatus = 'PASS' | 'FAIL' | 'UNKNOWN' | 'NOT_APPLICABLE' | 'REQUIRES_REVIEW';
export type RuleSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ConditionOperator = 'EXISTS' | 'EQUALS' | 'NOT_EQUALS' | 'REGEX_MATCH' | 'NUMERIC_RANGE' | 'DATE_NOT_EXPIRED';

export interface Regulation {
  id: string;
  name: string;
  description: string;
}

export interface RegulationVersion {
  id: string;
  regulationId: string;
  version: string;
  effectiveFrom: string; // ISO Date string
  effectiveUntil?: string; // ISO Date string
}

export interface RuleCondition {
  operator: ConditionOperator;
  expectedValue?: string | number | boolean;
  minValue?: number;
  maxValue?: number;
  pattern?: string; // for REGEX_MATCH
}

export interface Rule {
  id: string;
  regulationId: string;
  regulationVersion: string;
  description: string;
  category: string[]; // e.g., ["Food", "Cosmetics"]
  fieldDependencies: string[]; // e.g., ["mrp", "netQuantity"]
  condition: RuleCondition;
  severity: RuleSeverity;
  effectiveFrom: string;
  effectiveUntil?: string;
  sourceReference: string; // e.g., "FSSAI Packaging and Labelling Regulations 2011, Sec 2.2.1"
  enabled: boolean;
}

export interface Violation {
  ruleId: string;
  field: string;
  observedValue: any;
  expectedValue?: any;
  reason: string;
  severity: RuleSeverity;
  regulationVersion: string;
  evidenceReferences?: string[]; // E.g., image IDs or bounding box IDs
}

export interface RuleResult {
  ruleId: string;
  status: RuleResultStatus;
  violation?: Violation;
}

export interface ComplianceEvaluation {
  id: string; // Evaluation ID
  timestamp: string;
  jurisdiction: string;
  category: string;
  overallStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'NEEDS_REVIEW';
  results: RuleResult[];
  violations: Violation[];
}

export interface EvaluationContext {
  jurisdiction: string;
  category: string; // e.g., "Food", "Electronics"
  regulationVersion: string;
  inspectionDate: string; // ISO Date
  applicableDeclarationRequirements?: string[];
}
