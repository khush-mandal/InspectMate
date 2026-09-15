import { describe, it, expect } from 'vitest';
import { ComplianceEngine } from './ComplianceEngine';
import { Rule, EvaluationContext } from './types';

describe('ComplianceEngine - Regulatory Scenario Tests', () => {
    // Real-world examples of FSSAI (Food Safety and Standards Authority of India) packaging rules
    const fssaiRules: Rule[] = [
        {
            id: 'FSSAI-PKG-001',
            regulationId: 'FSSAI-PKG-2011',
            regulationVersion: '2011-v1',
            description: 'The MRP (Maximum Retail Price) must be explicitly declared on the package.',
            category: ['Food', 'Beverages'],
            fieldDependencies: ['mrp'],
            condition: { operator: 'EXISTS' },
            severity: 'HIGH',
            effectiveFrom: '2011-08-05T00:00:00Z',
            sourceReference: 'FSSAI Packaging and Labelling Regulations 2011, Sec 2.2.1',
            enabled: true
        },
        {
            id: 'FSSAI-PKG-002',
            regulationId: 'FSSAI-PKG-2011',
            regulationVersion: '2011-v1',
            description: 'Vegetarian food must display a green dot logo (or non-veg brown/red dot).',
            category: ['Food', 'Beverages'],
            fieldDependencies: ['vegNonVegLogo'],
            condition: { operator: 'REGEX_MATCH', pattern: '^(VEG_GREEN|NON_VEG_BROWN|NON_VEG_RED)$' },
            severity: 'CRITICAL',
            effectiveFrom: '2011-08-05T00:00:00Z',
            sourceReference: 'FSSAI Packaging and Labelling Regulations 2011, Sec 2.2.2',
            enabled: true
        },
        {
            id: 'FSSAI-PKG-003',
            regulationId: 'FSSAI-PKG-2011',
            regulationVersion: '2011-v1',
            description: 'Product must not be expired at the time of inspection.',
            category: ['Food', 'Beverages'],
            fieldDependencies: ['expiryDate'],
            condition: { operator: 'DATE_NOT_EXPIRED' },
            severity: 'CRITICAL',
            effectiveFrom: '2011-08-05T00:00:00Z',
            sourceReference: 'FSSAI Packaging and Labelling Regulations 2011, Sec 2.2.9',
            enabled: true
        }
    ];

    const defaultContext: EvaluationContext = {
        jurisdiction: 'India',
        category: 'Food',
        regulationVersion: '2011-v1',
        inspectionDate: '2026-09-14T10:00:00Z'
    };

    it('should pass a fully compliant product', () => {
        const data = {
            mrp: '₹ 150',
            vegNonVegLogo: 'VEG_GREEN',
            expiryDate: '2027-12-31T00:00:00Z'
        };

        const result = ComplianceEngine.evaluateInspection(data, defaultContext, fssaiRules);

        expect(result.overallStatus).toBe('COMPLIANT');
        expect(result.results.length).toBe(3);
        expect(result.violations.length).toBe(0);
        expect(result.results.every(r => r.status === 'PASS')).toBe(true);
    });

    it('should fail when a required field is missing for an EXISTS condition', () => {
        // Omitting 'mrp'
        const data = {
            vegNonVegLogo: 'VEG_GREEN',
            expiryDate: '2027-12-31T00:00:00Z'
        };

        const result = ComplianceEngine.evaluateInspection(data, defaultContext, fssaiRules);

        expect(result.overallStatus).toBe('NON_COMPLIANT'); 
        const mrpResult = result.results.find(r => r.ruleId === 'FSSAI-PKG-001');
        expect(mrpResult?.status).toBe('FAIL'); // Because condition was EXISTS
        expect(mrpResult?.violation?.reason).toContain('is missing');

        // Verify other rules passed
        expect(result.results.find(r => r.ruleId === 'FSSAI-PKG-002')?.status).toBe('PASS');
    });

    it('should mark as UNKNOWN when missing data for a non-EXISTS rule', () => {
        // Omitting vegNonVegLogo (which is a REGEX rule)
        const data = {
            mrp: '₹ 150',
            expiryDate: '2027-12-31T00:00:00Z'
        };

        const result = ComplianceEngine.evaluateInspection(data, defaultContext, fssaiRules);

        expect(result.overallStatus).toBe('NEEDS_REVIEW'); 
        const logoResult = result.results.find(r => r.ruleId === 'FSSAI-PKG-002');
        expect(logoResult?.status).toBe('UNKNOWN'); 
        expect(logoResult?.violation?.reason).toContain('is missing for evaluation');
    });

    it('should fail when a rule condition is not met', () => {
        const data = {
            mrp: '₹ 150',
            vegNonVegLogo: 'INVALID_LOGO_TYPE',
            expiryDate: '2027-12-31T00:00:00Z'
        };

        const result = ComplianceEngine.evaluateInspection(data, defaultContext, fssaiRules);

        expect(result.overallStatus).toBe('NON_COMPLIANT');
        const logoResult = result.results.find(r => r.ruleId === 'FSSAI-PKG-002');
        expect(logoResult?.status).toBe('FAIL');
        expect(logoResult?.violation?.observedValue).toBe('INVALID_LOGO_TYPE');
    });

    it('should fail when a product is expired', () => {
        const data = {
            mrp: '₹ 150',
            vegNonVegLogo: 'VEG_GREEN',
            expiryDate: '2025-01-01T00:00:00Z' // Passed date
        };

        const result = ComplianceEngine.evaluateInspection(data, defaultContext, fssaiRules);

        expect(result.overallStatus).toBe('NON_COMPLIANT');
        const expiryResult = result.results.find(r => r.ruleId === 'FSSAI-PKG-003');
        expect(expiryResult?.status).toBe('FAIL');
        expect(expiryResult?.violation?.reason).toContain('Product expired on');
    });
    
    it('should not evaluate rules from a mismatched regulation version', () => {
        const data = {
            mrp: '₹ 150',
            vegNonVegLogo: 'VEG_GREEN',
            expiryDate: '2027-12-31T00:00:00Z'
        };
        const differentVersionContext = {
            ...defaultContext,
            regulationVersion: '2024-v2' // Rules are for 2011-v1
        };

        const result = ComplianceEngine.evaluateInspection(data, differentVersionContext, fssaiRules);
        expect(result.results.length).toBe(0); // No rules should be evaluated
        expect(result.overallStatus).toBe('COMPLIANT');
    });
});
