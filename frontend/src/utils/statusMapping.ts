import { FindingClassification } from '../types';

export const getStatusLabel = (status: FindingClassification | string): string => {
  switch (status) {
    case 'VERIFIED':
      return 'Verified';
    case 'POTENTIAL_VIOLATION':
      return 'Potential Violation';
    case 'INCONSISTENT':
      return 'Inconsistent';
    case 'INSUFFICIENT_EVIDENCE':
      return 'Insufficient Evidence';
    case 'DRAFT':
      return 'Draft';
    case 'PROCESSING':
      return 'Processing';
    case 'AWAITING_REVIEW':
      return 'Needs Review';
    case 'COMPLETED':
      return 'Completed';
    case 'ARCHIVED':
      return 'Archived';
    case 'PENDING':
      return 'Pending';
    default:
      return status;
  }
};
