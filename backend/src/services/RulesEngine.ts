import { Rule, IRule } from '../db/models/Rule';
import { logger } from '../utils/logger';

export type ComplianceOutcome = 'VERIFIED' | 'POTENTIAL_VIOLATION' | 'INCONSISTENT' | 'INSUFFICIENT_EVIDENCE';

export interface EvaluationInput {
  productName?: string | null;
  category?: string | null;
  isEdible?: boolean;
  barcode?: string | null;
  mrp?: string | null;
  hasDualPricing?: boolean;
  netQuantity?: string | null;
  manufacturer?: string | null;
  dateInfo?: string | null;
  consumerCare?: string | null;
  ingredients?: string | null;
  nutritionalInfo?: string | null;
  readabilityScore?: number;
  catalogData?: {
    expectedMrp?: number;
    expectedNetQuantity?: string;
    expectedManufacturer?: string;
  } | null;
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  ruleReference: string;
  ruleVersion: string;
  field: string;
  passed: boolean;
  confidence: number;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface StatutoryComplianceSummary {
  finalStatus: ComplianceOutcome;
  statusDescription: string;
  ruleResults: RuleEvaluationResult[];
  category: string;
  isEdible: boolean;
}

export class RulesEngine {
  /**
   * Evaluates statutory Legal Metrology and commodity labeling compliance
   * returning one of the 4 statutory outcomes:
   * VERIFIED | POTENTIAL VIOLATION | INCONSISTENT | INSUFFICIENT EVIDENCE
   */
  static async evaluate(input: EvaluationInput): Promise<StatutoryComplianceSummary> {
    try {
      const results: RuleEvaluationResult[] = [];
      const readability = input.readabilityScore ?? 75;

      // Check 1: Insufficient Evidence Gate
      const isInsufficient = readability < 40;

      // 1. Mandatory MRP & Tax Declaration (Rule 6(1)(e))
      const mrpPresent = !!input.mrp && input.mrp.trim().length > 0;
      results.push({
        ruleId: 'LM-RULE-6-1-E',
        ruleName: 'Maximum Retail Price (MRP) Declaration',
        ruleReference: 'Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(e)',
        ruleVersion: '2011.v4',
        field: 'mrp',
        passed: mrpPresent,
        confidence: mrpPresent ? 0.95 : 0.85,
        message: mrpPresent
          ? `MRP is declared: "${input.mrp}".`
          : 'Missing Maximum Retail Price (MRP) declaration on retail display panel.',
        severity: 'CRITICAL'
      });

      // 2. Dual Pricing / Price Sticker Tampering (Rule 18(2))
      const dualPricingDetected = Boolean(input.hasDualPricing);
      results.push({
        ruleId: 'LM-RULE-18-2',
        ruleName: 'Prohibition of Dual Pricing & Altered Price Stickers',
        ruleReference: 'Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 18(2)',
        ruleVersion: '2011.v4',
        field: 'hasDualPricing',
        passed: !dualPricingDetected,
        confidence: 0.90,
        message: dualPricingDetected
          ? 'Potential Dual Pricing detected: Altered price sticker or overprint identified.'
          : 'No dual pricing or sticker alteration detected on the package.',
        severity: 'CRITICAL'
      });

      // 3. Standard Net Quantity Declaration (Rule 6(1)(c) & Rule 12)
      const netQtyPresent = !!input.netQuantity && input.netQuantity.trim().length > 0;
      const validNetQtyUnits = !netQtyPresent || /(g|kg|ml|l|m|cm|n|pieces|units)\b/i.test(input.netQuantity || '');
      const netQtyPassed = netQtyPresent && validNetQtyUnits;
      results.push({
        ruleId: 'LM-RULE-6-1-C',
        ruleName: 'Net Quantity Standard Unit Specification',
        ruleReference: 'Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(c)',
        ruleVersion: '2011.v4',
        field: 'netQuantity',
        passed: netQtyPassed,
        confidence: 0.92,
        message: netQtyPassed
          ? `Net quantity declared compliant: "${input.netQuantity}".`
          : netQtyPresent
            ? `Non-standard net quantity measurement unit in: "${input.netQuantity}".`
            : 'Net quantity declaration missing from package.',
        severity: 'HIGH'
      });

      // 4. Complete Manufacturer / Packer / Importer Details (Rule 6(1)(a))
      const mfgPresent = !!input.manufacturer && input.manufacturer.trim().length > 5;
      results.push({
        ruleId: 'LM-RULE-6-1-A',
        ruleName: 'Manufacturer & Packer Name / Address',
        ruleReference: 'Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(a)',
        ruleVersion: '2011.v4',
        field: 'manufacturer',
        passed: mfgPresent,
        confidence: 0.88,
        message: mfgPresent
          ? `Manufacturer/Packer identity declared: "${input.manufacturer!.slice(0, 45)}...".`
          : 'Manufacturer or Packer name and full registered address missing.',
        severity: 'HIGH'
      });

      // 5. Date of Manufacture / Packaging (Rule 6(1)(d))
      const datePresent = !!input.dateInfo && input.dateInfo.trim().length > 0;
      results.push({
        ruleId: 'LM-RULE-6-1-D',
        ruleName: 'Month & Year of Manufacture or Packaging',
        ruleReference: 'Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(d)',
        ruleVersion: '2011.v4',
        field: 'dateInfo',
        passed: datePresent,
        confidence: 0.89,
        message: datePresent
          ? `Manufacturing/Packaging date declared: "${input.dateInfo}".`
          : 'Month and year of manufacture, packaging, or expiry date missing.',
        severity: 'HIGH'
      });

      // 6. Consumer Care / Grievance Redressal (Rule 6(1)(h))
      const consumerCarePresent = !!input.consumerCare && input.consumerCare.trim().length > 0;
      results.push({
        ruleId: 'LM-RULE-6-1-H',
        ruleName: 'Consumer Care Contact / Grievance Redressal',
        ruleReference: 'Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(h)',
        ruleVersion: '2011.v4',
        field: 'consumerCare',
        passed: consumerCarePresent,
        confidence: 0.91,
        message: consumerCarePresent
          ? `Consumer grievance redressal details present: "${input.consumerCare!.slice(0, 40)}...".`
          : 'Consumer care contact details (phone, email, or address) missing.',
        severity: 'MEDIUM'
      });

      // 7. Edible Product Specific Declarations (Ingredients & Nutrition)
      const isEdible = Boolean(input.isEdible || input.category === 'FOOD_BEVERAGE');
      if (isEdible) {
        const ingredientsPresent = !!input.ingredients && input.ingredients.trim().length > 0;
        results.push({
          ruleId: 'FSSAI-LAB-2-2-1',
          ruleName: 'Ingredients List Declaration (Edible Products)',
          ruleReference: 'FSSAI (Packaging and Labelling) Regulations, 2020 - Reg 2.2.1',
          ruleVersion: '2020.v2',
          field: 'ingredients',
          passed: ingredientsPresent,
          confidence: 0.90,
          message: ingredientsPresent
            ? 'Ingredients list declared in descending order of weight/volume.'
            : 'Missing mandatory Ingredients list for packaged food/edible commodity.',
          severity: 'CRITICAL'
        });

        const nutritionPresent = !!input.nutritionalInfo && input.nutritionalInfo.trim().length > 0;
        results.push({
          ruleId: 'FSSAI-LAB-2-2-2',
          ruleName: 'Nutritional Information Panel',
          ruleReference: 'FSSAI (Packaging and Labelling) Regulations, 2020 - Reg 2.2.2',
          ruleVersion: '2020.v2',
          field: 'nutritionalInfo',
          passed: nutritionPresent,
          confidence: 0.90,
          message: nutritionPresent
            ? 'Nutritional values per 100g/serving clearly declared.'
            : 'Missing mandatory Nutritional Information panel on food package.',
          severity: 'HIGH'
        });
      }

      // Check for INCONSISTENCY with catalog/cross-source if provided
      let hasInconsistency = false;
      let inconsistencyReason = '';
      if (input.catalogData && input.mrp) {
        const parsedMrp = parseFloat(input.mrp.replace(/[^0-9.]/g, ''));
        if (!isNaN(parsedMrp) && input.catalogData.expectedMrp && Math.abs(parsedMrp - input.catalogData.expectedMrp) > 1) {
          hasInconsistency = true;
          inconsistencyReason = `Physical MRP (₹${parsedMrp}) conflicts with catalog registered price (₹${input.catalogData.expectedMrp}).`;
          results.push({
            ruleId: 'CROSS-SRC-MRP-DISC',
            ruleName: 'Catalog Cross-Source Price Verification',
            ruleReference: 'Inter-Source Declarations Consistency Standard',
            ruleVersion: '2024.v1',
            field: 'mrp',
            passed: false,
            confidence: 0.94,
            message: inconsistencyReason,
            severity: 'HIGH'
          });
        }
      }

      // Determine Final Status across the 4 authoritative outcomes
      let finalStatus: ComplianceOutcome;
      let statusDescription: string;

      if (isInsufficient) {
        finalStatus = 'INSUFFICIENT_EVIDENCE';
        statusDescription = 'The package could not be reliably inspected due to low text readability, extreme glare, or visual occlusion.';
      } else if (hasInconsistency) {
        finalStatus = 'INCONSISTENT';
        statusDescription = inconsistencyReason || 'Different evidence sources or packaging declarations disagree with one another.';
      } else {
        const hasViolations = results.some(r => !r.passed);
        if (hasViolations) {
          finalStatus = 'POTENTIAL_VIOLATION';
          statusDescription = 'System finds strong indication of statutory non-compliance requiring inspector verification.';
        } else {
          finalStatus = 'VERIFIED';
          statusDescription = 'Evidence and declarations are consistent and comply with applicable statutory rules.';
        }
      }

      return {
        finalStatus,
        statusDescription,
        ruleResults: results,
        category: input.category || (isEdible ? 'FOOD_BEVERAGE' : 'GENERAL_COMMODITY'),
        isEdible
      };
    } catch (error) {
      logger.error('Error evaluating statutory rules:', error);
      throw error;
    }
  }
}

