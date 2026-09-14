import { Rule, IRule } from '../db/models/Rule';
import { logger } from '../utils/logger';

export interface EvaluationInput {
  mrp?: string | null;
  netQuantity?: string | null;
  manufacturer?: string | null;
  dateInfo?: string | null;
  consumerCare?: string | null;
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  field: string;
  passed: boolean;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class RulesEngine {
  static async evaluate(extractedData: EvaluationInput): Promise<RuleEvaluationResult[]> {
    try {
      // Fetch all active rules
      const activeRules = await Rule.find({ status: 'ACTIVE' }).lean();
      
      const results: RuleEvaluationResult[] = [];

      for (const rule of activeRules) {
        const fieldName = rule.field as keyof EvaluationInput;
        const fieldValue = extractedData[fieldName];
        
        let passed = false;
        let message = '';

        if (!fieldValue && rule.operator !== 'IS_NULL') {
          passed = false;
          message = `Required field ${rule.field} was not found on the package.`;
        } else {
          // Simplified evaluation logic for demonstration
          switch (rule.operator) {
            case 'EXISTS':
              passed = !!fieldValue;
              message = passed ? `${rule.field} is present.` : `${rule.field} is missing.`;
              break;
            case 'CONTAINS':
              if (rule.parameters && rule.parameters.value) {
                passed = fieldValue?.toLowerCase().includes(rule.parameters.value.toLowerCase()) || false;
                message = passed ? `${rule.field} contains expected value.` : `${rule.field} does not contain '${rule.parameters.value}'.`;
              }
              break;
            case 'REGEX':
              if (rule.parameters && rule.parameters.pattern) {
                const regex = new RegExp(rule.parameters.pattern, 'i');
                passed = regex.test(fieldValue || '');
                message = passed ? `${rule.field} matches required format.` : `${rule.field} is incorrectly formatted.`;
              }
              break;
            case 'IS_NULL':
              passed = !fieldValue;
              message = passed ? `${rule.field} is correctly omitted.` : `${rule.field} should not be present.`;
              break;
            default:
              passed = true;
              message = `Operator ${rule.operator} not fully implemented, defaulting to pass.`;
          }
        }

        results.push({
          ruleId: rule.ruleId,
          ruleName: rule.name,
          field: rule.field,
          passed,
          message,
          severity: rule.severity
        });
      }

      return results;
    } catch (error) {
      logger.error('Error evaluating rules:', error);
      throw error;
    }
  }
}
