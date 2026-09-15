import {
  Rule,
  EvaluationContext,
  ComplianceEvaluation,
  RuleResult,
  Violation,
  RuleResultStatus
} from './types';

export class ComplianceEngine {
  
  /**
   * Evaluates a set of extracted data against a set of rules deterministically.
   * Does not use LLMs, relies strictly on explicit logic.
   */
  static evaluateInspection(
    data: Record<string, any>,
    context: EvaluationContext,
    rules: Rule[]
  ): ComplianceEvaluation {
    const results: RuleResult[] = [];
    const violations: Violation[] = [];
    
    // Filter rules by active date, category, and version
    const activeRules = rules.filter(rule => this.isRuleApplicable(rule, context));

    for (const rule of activeRules) {
        const result = this.evaluateRule(rule, data, context);
        results.push(result);
        if (result.violation) {
            violations.push(result.violation);
        }
    }

    let overallStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'NEEDS_REVIEW' = 'COMPLIANT';
    if (results.some(r => r.status === 'FAIL')) {
        overallStatus = 'NON_COMPLIANT';
    } else if (results.some(r => r.status === 'UNKNOWN' || r.status === 'REQUIRES_REVIEW')) {
        overallStatus = 'NEEDS_REVIEW';
    }

    return {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      jurisdiction: context.jurisdiction,
      category: context.category,
      overallStatus,
      results,
      violations
    };
  }

  private static isRuleApplicable(rule: Rule, context: EvaluationContext): boolean {
    if (!rule.enabled) return false;
    
    // Category match
    if (!rule.category.includes('ALL') && !rule.category.includes(context.category)) {
      return false;
    }

    // Version match
    if (rule.regulationVersion !== context.regulationVersion) {
      return false; // Strict version match for deterministic evaluation
    }

    // Date check
    const inspectionDate = new Date(context.inspectionDate);
    const effectiveFrom = new Date(rule.effectiveFrom);
    if (inspectionDate < effectiveFrom) return false;
    if (rule.effectiveUntil) {
      const effectiveUntil = new Date(rule.effectiveUntil);
      if (inspectionDate > effectiveUntil) return false;
    }

    return true;
  }

  private static evaluateRule(rule: Rule, data: Record<string, any>, context: EvaluationContext): RuleResult {
    const primaryField = rule.fieldDependencies[0]; 
    const observedValue = data[primaryField];
    
    if (observedValue === undefined || observedValue === null || observedValue === '') {
        // Missing OCR data is NEVER an automatic PASS.
        if (rule.condition.operator === 'EXISTS') {
            return this.createFailure(rule, primaryField, observedValue, `Required field '${primaryField}' is missing.`);
        } else {
            return this.createUnknown(rule, primaryField, `Required data '${primaryField}' is missing for evaluation.`);
        }
    }

    let status: RuleResultStatus = 'PASS';
    let reason = '';

    switch (rule.condition.operator) {
      case 'EXISTS':
        status = 'PASS';
        break;
      case 'EQUALS':
        if (observedValue !== rule.condition.expectedValue) {
            status = 'FAIL';
            reason = `Expected ${rule.condition.expectedValue}, but observed ${observedValue}`;
        }
        break;
      case 'NOT_EQUALS':
        if (observedValue === rule.condition.expectedValue) {
             status = 'FAIL';
             reason = `Value should not be ${rule.condition.expectedValue}`;
        }
        break;
      case 'REGEX_MATCH':
        if (rule.condition.pattern) {
             const regex = new RegExp(rule.condition.pattern);
             if (!regex.test(String(observedValue))) {
                 status = 'FAIL';
                 reason = `Value does not match required pattern: ${rule.condition.pattern}`;
             }
        }
        break;
      case 'NUMERIC_RANGE':
        const numValue = Number(observedValue);
        if (isNaN(numValue)) {
            return this.createRequiresReview(rule, primaryField, observedValue, 'Value is not numeric for a range check.');
        }
        if (rule.condition.minValue !== undefined && numValue < rule.condition.minValue) {
            status = 'FAIL';
            reason = `Value ${numValue} is below minimum ${rule.condition.minValue}`;
        } else if (rule.condition.maxValue !== undefined && numValue > rule.condition.maxValue) {
            status = 'FAIL';
            reason = `Value ${numValue} is above maximum ${rule.condition.maxValue}`;
        }
        break;
      case 'DATE_NOT_EXPIRED':
        const dateValue = new Date(observedValue);
        const inspectionDate = new Date(context.inspectionDate);
        if (isNaN(dateValue.getTime())) {
            return this.createRequiresReview(rule, primaryField, observedValue, 'Unrecognized date format.');
        }
        if (dateValue < inspectionDate) {
            status = 'FAIL';
            reason = `Product expired on ${dateValue.toISOString()} (Inspection date: ${inspectionDate.toISOString()})`;
        }
        break;
      default:
         return this.createRequiresReview(rule, primaryField, observedValue, 'Unknown condition operator.');
    }

    if (status === 'PASS') {
        return { ruleId: rule.id, status: 'PASS' };
    } else {
        return this.createFailure(rule, primaryField, observedValue, reason, rule.condition.expectedValue);
    }
  }

  private static createFailure(rule: Rule, field: string, observedValue: any, reason: string, expectedValue?: any): RuleResult {
      return {
          ruleId: rule.id,
          status: 'FAIL',
          violation: {
              ruleId: rule.id,
              field,
              observedValue,
              expectedValue,
              reason,
              severity: rule.severity,
              regulationVersion: rule.regulationVersion
          }
      };
  }

  private static createUnknown(rule: Rule, field: string, reason: string): RuleResult {
      return {
          ruleId: rule.id,
          status: 'UNKNOWN',
          violation: {
             ruleId: rule.id,
             field,
             observedValue: null,
             reason,
             severity: rule.severity,
             regulationVersion: rule.regulationVersion
          }
      };
  }
  
  private static createRequiresReview(rule: Rule, field: string, observedValue: any, reason: string): RuleResult {
     return {
         ruleId: rule.id,
         status: 'REQUIRES_REVIEW',
         violation: {
             ruleId: rule.id,
             field,
             observedValue,
             reason,
             severity: rule.severity,
             regulationVersion: rule.regulationVersion
         }
     };
  }
}
