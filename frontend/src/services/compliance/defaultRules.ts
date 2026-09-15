import { Rule } from './types';

export const FSSAI_RULES: Rule[] = [
    {
        id: 'FSSAI-PKG-001',
        regulationId: 'FSSAI-PKG-2011',
        regulationVersion: '2011-v1',
        description: 'The MRP (Maximum Retail Price) must be explicitly declared on the package.',
        category: ['Food', 'Beverages', 'ALL'],
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
        category: ['Food', 'Beverages', 'ALL'],
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
        category: ['Food', 'Beverages', 'ALL'],
        fieldDependencies: ['expiryDate'],
        condition: { operator: 'DATE_NOT_EXPIRED' },
        severity: 'CRITICAL',
        effectiveFrom: '2011-08-05T00:00:00Z',
        sourceReference: 'FSSAI Packaging and Labelling Regulations 2011, Sec 2.2.9',
        enabled: true
    }
];
