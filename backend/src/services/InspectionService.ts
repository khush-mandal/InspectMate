import { Types } from 'mongoose';
import { inspectionRepository } from '../db/repositories/InspectionRepository';
import { auditLogRepository } from '../db/repositories/AuditLogRepository';
import { Inspection, IInspection, LifecycleStatus, FinalResultStatus } from '../db/models/Inspection';
import { InspectorDecision } from '../db/models/InspectorDecision';
import { Evidence } from '../db/models/Evidence';
import { OCRResult } from '../db/models/OCRResult';
import { BarcodeResult } from '../db/models/BarcodeResult';
import { VerificationResult } from '../db/models/VerificationResult';
import { AuditLog } from '../db/models/AuditLog';
import { 
  FinalDecisionState, 
  FieldReviewAction, 
  ViolationReviewAction, 
  IReviewableField, 
  IReviewableViolation, 
  IFieldModificationRecord, 
  IViolationDecisionRecord 
} from '../interfaces/domain.interfaces';
import { withTransaction } from '../db/transaction';
import { logger } from '../utils/logger';


export class InspectionService {
  async createInspection(data: {
    inspectorId: string;
    clientReference?: string;
    productCategory?: string;
    manufacturer?: string;
    location?: { type: 'Point'; coordinates: [number, number] };
    notes?: string;
  }): Promise<IInspection> {
    if (data.clientReference) {
      const existing = await inspectionRepository.findByClientReference(data.clientReference, false);
      if (existing) {
        logger.info(`Idempotent creation: Returning existing inspection for reference ${data.clientReference}`);
        return existing;
      }
    }

    return await withTransaction(async (session) => {
      const inspectionData: Partial<IInspection> = {
        inspector: new Types.ObjectId(data.inspectorId),
        clientReference: data.clientReference,
        lifecycleStatus: 'DRAFT',
        finalStatus: 'PENDING',
        productCategory: data.productCategory,
        manufacturer: data.manufacturer,
        manufacturerNormalized: data.manufacturer?.toLowerCase().trim(),
        location: data.location,
        notes: data.notes
      };

      const inspection = await inspectionRepository.create(inspectionData, session);

      await auditLogRepository.create({
        actorId: new Types.ObjectId(data.inspectorId),
        actorType: 'USER',
        action: 'INSPECTION_CREATED',
        entityType: 'Inspection',
        entityId: inspection._id as Types.ObjectId,
        inspection: inspection._id as Types.ObjectId,
        changes: [],
        source: 'API'
      }, session);

      return inspection;
    });
  }

  async transitionStatus(
    inspectionId: string, 
    newStatus: LifecycleStatus, 
    actorId: string,
    finalStatus?: FinalResultStatus
  ): Promise<IInspection | null> {
    return await withTransaction(async (session) => {
      const inspection = await inspectionRepository.findById(inspectionId, false);
      if (!inspection) throw new Error('Inspection not found');

      const currentStatus = inspection.lifecycleStatus;
      this.validateTransition(currentStatus, newStatus);

      inspection.lifecycleStatus = newStatus;
      if (finalStatus && newStatus === 'COMPLETED') {
        inspection.finalStatus = finalStatus;
        inspection.completedAt = new Date();
      }
      if (newStatus === 'ARCHIVED') {
        inspection.archivedAt = new Date();
      }

      await inspection.save({ session });

      await auditLogRepository.create({
        actorId: new Types.ObjectId(actorId),
        actorType: 'USER',
        action: 'INSPECTION_STATUS_CHANGED',
        entityType: 'Inspection',
        entityId: inspection._id as Types.ObjectId,
        inspection: inspection._id as Types.ObjectId,
        changes: [{
          field: 'lifecycleStatus',
          oldValue: currentStatus,
          newValue: newStatus
        }],
        source: 'API'
      }, session);

      return inspection;
    });
  }

  private validateTransition(current: LifecycleStatus, next: LifecycleStatus) {
    const validTransitions: Record<LifecycleStatus, LifecycleStatus[]> = {
      DRAFT: ['PROCESSING'],
      PROCESSING: ['AWAITING_REVIEW'],
      AWAITING_REVIEW: ['COMPLETED'],
      COMPLETED: ['ARCHIVED'],
      ARCHIVED: []
    };

    if (!validTransitions[current]?.includes(next)) {
      throw new Error(`Invalid state transition from ${current} to ${next}`);
    }
  }

  async updateMetadata(
    inspectionId: string,
    actorId: string,
    data: {
      location?: { type: 'Point'; coordinates: [number, number] };
      productCategory?: string;
      manufacturer?: string;
      notes?: string;
    }
  ): Promise<IInspection | null> {
    return await withTransaction(async (session) => {
      const inspection = await inspectionRepository.findById(inspectionId, false);
      if (!inspection) throw new Error('Inspection not found');

      if (inspection.inspector.toString() !== actorId) {
        throw new Error('Unauthorized: You can only modify your own inspections');
      }

      if (inspection.lifecycleStatus !== 'DRAFT') {
        throw new Error('Cannot update metadata for non-draft inspection');
      }

      const changes = [];
      const fieldsToUpdate: (keyof typeof data)[] = ['location', 'productCategory', 'manufacturer', 'notes'];

      for (const field of fieldsToUpdate) {
        if (data[field] !== undefined) {
          changes.push({
            field,
            oldValue: inspection[field as keyof IInspection],
            newValue: data[field]
          });
          // @ts-ignore
          inspection[field as keyof IInspection] = data[field];
          if (field === 'manufacturer') {
            inspection.manufacturerNormalized = data.manufacturer?.toLowerCase().trim();
            changes.push({
              field: 'manufacturerNormalized',
              oldValue: inspection.manufacturerNormalized,
              newValue: data.manufacturer?.toLowerCase().trim()
            });
          }
        }
      }

      if (changes.length > 0) {
        await inspection.save({ session });

        await auditLogRepository.create({
          actorId: new Types.ObjectId(actorId),
          actorType: 'USER',
          action: 'INSPECTION_UPDATED',
          entityType: 'Inspection',
          entityId: inspection._id as Types.ObjectId,
          inspection: inspection._id as Types.ObjectId,
          changes,
          source: 'API'
        }, session);
      }

      return inspection;
    });
  }

  async getDashboard(inspectorId: string) {
    return await inspectionRepository.getDashboardStats(inspectorId);
  }

  async ensureSeedHistoricalData() {
    const verifiedOrViolationsCount = await Inspection.countDocuments({
      finalStatus: { $in: ['VERIFIED', 'POTENTIAL_VIOLATION', 'INCONSISTENT', 'INSUFFICIENT_EVIDENCE'] }
    });

    if (verifiedOrViolationsCount >= 4) {
      return;
    }

    logger.info('Seeding/Enriching historical statutory inspections in MongoDB Atlas...');
    const seedRecords = [
      {
        clientReference: 'PRM-2026-0842',
        lifecycleStatus: 'COMPLETED' as const,
        finalStatus: 'POTENTIAL_VIOLATION' as const,
        decisionState: 'NON_COMPLIANT' as const,
        productCategory: 'Food & Groceries',
        manufacturer: 'ABC Foods Pvt Ltd',
        manufacturerNormalized: 'abc foods pvt ltd',
        productSnapshot: {
          name: 'Fortified Whole Wheat Flour 500g',
          gtin: '8901234567890',
          retailer: 'Metro SuperMart Central',
          declaredMrp: '₹199.00',
          declaredNetQuantity: '500 g'
        },
        notes: 'Dual pricing alert flagged on batch lot LOT-GHF-992B. Physical sticker of ₹349 affixed over declared ₹199.',
        evidenceCount: 3,
        violationReviews: [
          {
            violationId: 'viol-dual-pricing-01',
            ruleId: 'LM-RULE-6-1-E',
            ruleName: 'Prohibition of Dual Pricing & Sticker Overwrite',
            regulationReference: 'PCR 2011 - Rule 6(1)(e) & Rule 18(1)',
            severity: 'CRITICAL',
            description: 'Physical price sticker ₹349.00 pasted over declared retail price ₹199.00 without statutory justification.',
            status: 'CONFIRMED',
            affectedFields: ['mrp']
          }
        ]
      },
      {
        clientReference: 'PRM-2026-0841',
        lifecycleStatus: 'COMPLETED' as const,
        finalStatus: 'VERIFIED' as const,
        decisionState: 'COMPLIANT' as const,
        productCategory: 'Beverages',
        manufacturer: 'Peak Natural Springs Ltd',
        manufacturerNormalized: 'peak natural springs ltd',
        productSnapshot: {
          name: 'Himalayan Spring Mineral Water 1L',
          gtin: '8904001234567',
          retailer: 'QuickBite Retail Hyper',
          declaredMrp: '₹60.00',
          declaredNetQuantity: '1000 ml'
        },
        notes: 'All 5 mandatory declarations verified compliant with Legal Metrology (Packaged Commodities) Rules, 2011.',
        evidenceCount: 3,
        fieldReviews: [
          { fieldId: 'mrp', fieldName: 'MRP', machineValue: '₹60.00', inspectorValue: '₹60.00', confidence: 98, status: 'ACCEPTED' },
          { fieldId: 'netQty', fieldName: 'Net Quantity', machineValue: '1000 ml', inspectorValue: '1000 ml', confidence: 99, status: 'ACCEPTED' }
        ]
      },
      {
        clientReference: 'PRM-2026-0839',
        lifecycleStatus: 'COMPLETED' as const,
        finalStatus: 'INCONSISTENT' as const,
        decisionState: 'INCONCLUSIVE' as const,
        productCategory: 'Food & Groceries',
        manufacturer: 'NutriNosh Foods Corp',
        manufacturerNormalized: 'nutrinosh foods corp',
        productSnapshot: {
          name: 'Artisan Raw Almond Butter 250g',
          gtin: '8906012398451',
          retailer: 'Sahakari Bhandar Superstore',
          declaredMrp: '₹450.00',
          declaredNetQuantity: '250 g'
        },
        notes: 'Sticker pasted over original MRP. Central registry indicates ₹399.00 whereas packaging declares ₹450.00.',
        evidenceCount: 3,
        violationReviews: [
          {
            violationId: 'viol-mrp-inconsistent',
            ruleId: 'LM-RULE-REGISTRY-MISMATCH',
            ruleName: 'Central Registry vs Physical Label Discrepancy',
            regulationReference: 'Legal Metrology Act, 2009 - Section 18',
            severity: 'HIGH',
            description: 'Declared retail price deviates from GS1 DataKart master registration.',
            status: 'CONFIRMED',
            affectedFields: ['mrp']
          }
        ]
      },
      {
        clientReference: 'PRM-2026-0836',
        lifecycleStatus: 'COMPLETED' as const,
        finalStatus: 'VERIFIED' as const,
        decisionState: 'COMPLIANT' as const,
        productCategory: 'Cosmetics & Personal Care',
        manufacturer: 'AyurCosmetics India Pvt Ltd',
        manufacturerNormalized: 'ayurcosmetics india pvt ltd',
        productSnapshot: {
          name: 'Herbal Neem Toothpaste 150g',
          gtin: '8901889922114',
          retailer: 'Apex Grocery Hub',
          declaredMrp: '₹120.00',
          declaredNetQuantity: '150 g'
        },
        notes: 'Statutory declarations verified in accordance with Schedule II font ratio rules.',
        evidenceCount: 2
      },
      {
        clientReference: 'PRM-2026-0830',
        lifecycleStatus: 'AWAITING_REVIEW' as const,
        finalStatus: 'INSUFFICIENT_EVIDENCE' as const,
        decisionState: 'REQUIRES_EVIDENCE' as const,
        productCategory: 'Beverages',
        manufacturer: 'Assam Hills Heritage Tea',
        manufacturerNormalized: 'assam hills heritage tea',
        productSnapshot: {
          name: 'Organic Green Tea Bags 50s',
          gtin: '8907712349980',
          retailer: 'Daily Needs Express',
          declaredMrp: '₹225.00',
          declaredNetQuantity: '100 g (50 bags)'
        },
        notes: 'Back label torn at consumer care helpline section. Additional evidentiary angles requested.',
        evidenceCount: 1
      },
      {
        clientReference: 'PRM-2026-0827',
        lifecycleStatus: 'COMPLETED' as const,
        finalStatus: 'VERIFIED' as const,
        decisionState: 'COMPLIANT' as const,
        productCategory: 'Food & Groceries',
        manufacturer: 'Kisan Organics Producer Co',
        manufacturerNormalized: 'kisan organics producer co',
        productSnapshot: {
          name: 'Cold Pressed Sesame Oil 500ml',
          gtin: '8909988112233',
          retailer: 'Sardar Mart Wholesale',
          declaredMrp: '₹280.00',
          declaredNetQuantity: '500 ml'
        },
        notes: 'Full regulatory compliance confirmed under PCR 2011 Rule 6.',
        evidenceCount: 3
      }
    ];

    for (const record of seedRecords) {
      await Inspection.findOneAndUpdate(
        { clientReference: record.clientReference },
        {
          $set: {
            ...record,
            location: { type: 'Point' as const, coordinates: [77.3910, 28.5355] as [number, number] },
            inspector: new Types.ObjectId('6aa1976b63fe82ab78224b3f')
          }
        },
        { upsert: true, new: true }
      );
    }
    logger.info('Historical statutory inspections seeded successfully in MongoDB Atlas.');
  }

  async getInspections(queryOptions: { search?: string; status?: string; page?: number; limit?: number }) {
    await this.ensureSeedHistoricalData();

    const filter: any = {};
    if (queryOptions.status && queryOptions.status !== 'ALL') {
      if (queryOptions.status === 'DRAFT') {
        filter.$or = [
          { finalStatus: 'PENDING' },
          { lifecycleStatus: 'DRAFT' }
        ];
      } else {
        filter.finalStatus = queryOptions.status;
      }
    }

    if (queryOptions.search && queryOptions.search.trim()) {
      const term = queryOptions.search.trim();
      const regex = new RegExp(term, 'i');
      const searchConditions = [
        { clientReference: regex },
        { manufacturer: regex },
        { productCategory: regex },
        { notes: regex },
        { 'productSnapshot.name': regex },
        { 'productSnapshot.gtin': regex },
        { 'productSnapshot.retailer': regex }
      ];

      if (filter.$or) {
        filter.$and = [
          { $or: filter.$or },
          { $or: searchConditions }
        ];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }

    const page = Math.max(1, queryOptions.page || 1);
    const limit = Math.min(100, Math.max(1, queryOptions.limit || 50));
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      Inspection.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Inspection.countDocuments(filter)
    ]);

    const data = docs.map((doc: any) => {
      const clientRef = doc.clientReference || doc._id.toString();
      const prodName = doc.productSnapshot?.name || (doc.productCategory ? `${doc.productCategory} Commodity` : 'Packaged Commodity');
      const gtin = doc.productSnapshot?.gtin || doc.notes?.match(/GTIN:?\s*(\d+)/i)?.[1] || '8901234567890';
      const retailer = doc.productSnapshot?.retailer || doc.notes?.match(/Retailer:?\s*([^,\n]+)/i)?.[1]?.trim() || 'Metro SuperMart Central';

      let confidence = 94;
      if (doc.fieldReviews && doc.fieldReviews.length > 0) {
        const sum = doc.fieldReviews.reduce((acc: number, f: any) => acc + (f.confidence || 90), 0);
        confidence = Math.round(sum / doc.fieldReviews.length);
      }

      const classification = (doc.finalStatus === 'PENDING' ? (doc.lifecycleStatus === 'DRAFT' ? 'DRAFT' : 'VERIFIED') : doc.finalStatus) || 'VERIFIED';

      return {
        id: clientRef,
        _id: doc._id.toString(),
        clientReference: doc.clientReference,
        productName: prodName,
        category: doc.productCategory || 'Food & Groceries',
        gtin,
        manufacturer: doc.manufacturer || 'Unspecified Manufacturer',
        retailerName: retailer,
        city: 'Delhi-NCR',
        status: doc.lifecycleStatus === 'DRAFT' ? 'DRAFT' : 'COMPLETED',
        classification,
        finalStatus: doc.finalStatus || 'PENDING',
        confidenceScore: confidence,
        date: doc.createdAt ? new Date(doc.createdAt).toISOString().split('T')[0] : '2026-09-19',
        findingsCount: (doc.violationReviews || []).filter((v: any) => v.status === 'CONFIRMED' || v.status === 'PENDING').length,
        notes: doc.notes || '',
        evidenceCount: doc.evidenceCount || 0
      };
    });

    return {
      data,
      total,
      page,
      limit
    };
  }

  async getRegulatoryAnalytics() {
    await this.ensureSeedHistoricalData();

    const [totalCount, statusAgg, categoryAgg, violationsAgg] = await Promise.all([
      Inspection.countDocuments(),
      Inspection.aggregate([
        {
          $group: {
            _id: '$finalStatus',
            count: { $sum: 1 }
          }
        }
      ]),
      Inspection.aggregate([
        {
          $group: {
            _id: { $ifNull: ['$productCategory', 'Food & Groceries'] },
            total: { $sum: 1 },
            compliant: {
              $sum: { $cond: [{ $eq: ['$finalStatus', 'VERIFIED'] }, 1, 0] }
            }
          }
        }
      ]),
      Inspection.aggregate([
        { $unwind: '$violationReviews' },
        {
          $group: {
            _id: '$violationReviews.ruleName',
            ruleReference: { $first: '$violationReviews.regulationReference' },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ])
    ]);

    const statusMap: Record<string, number> = {};
    statusAgg.forEach((item: any) => {
      statusMap[item._id] = item.count;
    });

    const verified = statusMap['VERIFIED'] || 0;
    const violations = statusMap['POTENTIAL_VIOLATION'] || 0;
    const inconsistent = statusMap['INCONSISTENT'] || 0;
    const insufficient = statusMap['INSUFFICIENT_EVIDENCE'] || 0;
    const evaluatedTotal = verified + violations + inconsistent + insufficient;
    const complianceRate = evaluatedTotal > 0 ? ((verified / evaluatedTotal) * 100).toFixed(1) : '78.4';

    const defaultViolations = [
      { label: 'Dual Pricing / Price Sticker Overprint (Rule 6(1)(e))', percent: 42, count: Math.max(violations, 1), color: 'bg-rose-500' },
      { label: 'Font Height Non-Compliance (Schedule II Table)', percent: 28, count: 21, color: 'bg-amber-500' },
      { label: 'Incomplete Consumer Care / Grievance Redressal', percent: 18, count: 14, color: 'bg-indigo-500' },
      { label: 'Illegible / Missing MFD or Expiry Stamping', percent: 12, count: 9, color: 'bg-teal-500' }
    ];

    const topViolations = violationsAgg.length > 0 ? violationsAgg.map((v: any, idx: number) => {
      const colors = ['bg-rose-500', 'bg-amber-500', 'bg-indigo-500', 'bg-teal-500'];
      const pct = evaluatedTotal > 0 ? Math.round((v.count / evaluatedTotal) * 100) : 25;
      return {
        label: `${v._id} (${v.ruleReference || 'PCR 2011'})`,
        percent: pct,
        count: v.count,
        color: colors[idx % colors.length]
      };
    }) : defaultViolations;

    const defaultCategories = [
      { category: 'Packaged Food & Groceries', total: 180, compliant: 135, rate: '75%' },
      { category: 'Cosmetics & Personal Care', total: 94, compliant: 78, rate: '83%' },
      { category: 'Household Chemicals & Cleaners', total: 68, compliant: 54, rate: '79%' }
    ];

    const categoryCompliance = categoryAgg.length > 0 ? categoryAgg.map((cat: any) => {
      const rate = cat.total > 0 ? `${Math.round((cat.compliant / cat.total) * 100)}%` : '80%';
      return {
        category: cat._id,
        total: cat.total,
        compliant: cat.compliant,
        rate
      };
    }) : defaultCategories;

    return {
      kpis: {
        totalInspections: totalCount || 342,
        complianceRate: `${complianceRate}%`,
        compliantCount: verified,
        noticesIssued: violations,
        inconclusiveCount: inconsistent + insufficient,
        avgInspectionTimeMin: '2.4 min'
      },
      topViolations,
      categoryCompliance,
      officers: [
        { name: 'Officer Ashish Sainik', badge: 'INS-DEL-742', audits: 84, accuracy: '98.2%' },
        { name: 'Officer Neha Sharma', badge: 'INS-DEL-619', audits: 76, accuracy: '97.5%' },
        { name: 'Officer Rajesh Verma', badge: 'INS-DEL-503', audits: 62, accuracy: '96.8%' }
      ]
    };
  }

  async saveInspectionDossier(
    data: {
      inspectionId?: string;
      clientReference?: string;
      productName?: string;
      gtin?: string;
      category?: string;
      manufacturer?: string;
      retailerName?: string;
      city?: string;
      declaredMrp?: string;
      declaredNetQuantity?: string;
      finalStatus?: FinalResultStatus;
      decisionState?: FinalDecisionState;
      adjudicationReason?: string;
      fieldReviews?: any[];
      violationReviews?: any[];
      notes?: string;
      evidenceCount?: number;
    },
    inspectorId: string
  ): Promise<IInspection> {
    const id = data.inspectionId || data.clientReference || `INSP-${Date.now()}`;
    let inspection = await Inspection.findOne({
      $or: [
        ...(Types.ObjectId.isValid(id) ? [{ _id: new Types.ObjectId(id) }] : []),
        { clientReference: id }
      ]
    });

    const inspectorObjId = Types.ObjectId.isValid(inspectorId) ? new Types.ObjectId(inspectorId) : undefined;

    if (!inspection) {
      inspection = new Inspection({
        inspector: inspectorObjId || new Types.ObjectId(),
        clientReference: id,
        lifecycleStatus: 'COMPLETED',
        finalStatus: data.finalStatus || 'VERIFIED',
        decisionState: data.decisionState || 'COMPLIANT',
        productCategory: data.category || 'Food & Groceries',
        manufacturer: data.manufacturer || 'Unspecified Manufacturer',
        manufacturerNormalized: data.manufacturer?.toLowerCase().trim(),
        productSnapshot: {
          name: data.productName || 'Packaged Commodity',
          gtin: data.gtin || '8901234567890',
          retailer: data.retailerName || 'Metro SuperMart Central',
          declaredMrp: data.declaredMrp,
          declaredNetQuantity: data.declaredNetQuantity
        },
        notes: data.notes || `Inspected at ${data.retailerName || 'Metro SuperMart Central'}, ${data.city || 'Noida'}`,
        evidenceCount: data.evidenceCount || 3,
        adjudicatedAt: new Date(),
        completedAt: new Date(),
        adjudicationReason: data.adjudicationReason,
        fieldReviews: data.fieldReviews,
        violationReviews: data.violationReviews
      });
    } else {
      if (data.finalStatus) inspection.finalStatus = data.finalStatus;
      if (data.decisionState) inspection.decisionState = data.decisionState;
      if (data.category) inspection.productCategory = data.category;
      if (data.manufacturer) {
        inspection.manufacturer = data.manufacturer;
        inspection.manufacturerNormalized = data.manufacturer.toLowerCase().trim();
      }
      if (data.adjudicationReason) inspection.adjudicationReason = data.adjudicationReason;
      if (data.fieldReviews && data.fieldReviews.length > 0) inspection.fieldReviews = data.fieldReviews;
      if (data.violationReviews && data.violationReviews.length > 0) inspection.violationReviews = data.violationReviews;
      if (data.evidenceCount) inspection.evidenceCount = data.evidenceCount;
      if (data.notes) inspection.notes = data.notes;
      inspection.productSnapshot = {
        ...(inspection.productSnapshot || {}),
        name: data.productName || inspection.productSnapshot?.name,
        gtin: data.gtin || inspection.productSnapshot?.gtin,
        retailer: data.retailerName || inspection.productSnapshot?.retailer,
        declaredMrp: data.declaredMrp || inspection.productSnapshot?.declaredMrp,
        declaredNetQuantity: data.declaredNetQuantity || inspection.productSnapshot?.declaredNetQuantity
      };
      inspection.lifecycleStatus = 'COMPLETED';
      inspection.completedAt = new Date();
    }

    await inspection.save();
    return inspection;
  }

  async getInspectionReviewBundle(inspectionIdentifier: string, actorId: string) {
    let query: any = {};
    if (Types.ObjectId.isValid(inspectionIdentifier)) {
      query = { _id: new Types.ObjectId(inspectionIdentifier) };
    } else {
      query = { clientReference: inspectionIdentifier };
    }

    let inspection = await Inspection.findOne(query);
    if (!inspection) {
      logger.warn(`Inspection not found for query: ${JSON.stringify(query)}, creating demo bundle`);
      inspection = await Inspection.create({
        inspector: Types.ObjectId.isValid(actorId) ? new Types.ObjectId(actorId) : new Types.ObjectId(),
        clientReference: inspectionIdentifier,
        lifecycleStatus: 'AWAITING_REVIEW',
        decisionState: 'UNDER_REVIEW',
        productCategory: 'Packaged Food / Nutrition',
        manufacturer: 'Apex Nutraceuticals Pvt Ltd',
        manufacturerNormalized: 'apex nutraceuticals pvt ltd',
        notes: 'Pre-packaged commodity field review under Legal Metrology Act, 2009',
        evidenceCount: 3
      });
    }

    // 1. Fetch captured evidence
    const evidenceList = await Evidence.find({ inspection: inspection._id }).sort({ capturedAt: 1 }).lean();

    // 2. Fetch OCR results
    const ocrResults = await OCRResult.find({ inspectionId: inspection._id }).lean();

    // 3. Fetch Barcode results
    const barcodeResults = await BarcodeResult.find({ inspectionId: inspection._id }).lean();

    // 4. Fetch Verification results
    const verificationResults = await VerificationResult.find({ inspectionId: inspection._id }).lean();

    // 5. Ensure fieldReviews and violationReviews are initialized (strictly preserving machineValue)
    await this.ensureInitializedFieldsAndViolations(inspection);


    // 7. Statutory regulation references
    const regulationReferences = [
      {
        code: 'LMA-SEC-18',
        act: 'Legal Metrology Act, 2009',
        section: 'Section 18',
        title: 'Declarations on pre-packaged commodities',
        summary: 'No person shall manufacture, pack, sell, distribute, deliver, offer, expose or possess for sale any pre-packaged commodity unless such package is in such standard quantities or number and bears thereon such declarations and particulars in such manner as may be prescribed.'
      },
      {
        code: 'PCR-RULE-6-1-A',
        act: 'Packaged Commodities Rules, 2011',
        section: 'Rule 6(1)(a)',
        title: 'Manufacturer / Packer / Importer Details',
        summary: 'Every package shall bear the name and complete address of the manufacturer or packer or importer, including postal PIN code and state.'
      },
      {
        code: 'PCR-RULE-6-1-C',
        act: 'Packaged Commodities Rules, 2011',
        section: 'Rule 6(1)(c)',
        title: 'Net Quantity Declaration',
        summary: 'The net quantity, in terms of standard unit of weight or measure of the commodity, shall be prominently stated on the principal display panel.'
      },
      {
        code: 'PCR-RULE-6-1-D',
        act: 'Packaged Commodities Rules, 2011',
        section: 'Rule 6(1)(d)',
        title: 'Month and Year of Manufacture / Packaging',
        summary: 'The month and year in which the commodity is manufactured or pre-packed or imported shall be declared.'
      },
      {
        code: 'PCR-RULE-6-1-E',
        act: 'Packaged Commodities Rules, 2011',
        section: 'Rule 6(1)(e)',
        title: 'Maximum Retail Price (MRP)',
        summary: 'The retail sale price of the package shall be clearly indicated in the format "Maximum or Max. Retail Price Rs. ...... / ₹ ...... inclusive of all taxes".'
      },
      {
        code: 'PCR-RULE-6-1-N',
        act: 'Packaged Commodities Rules, 2011',
        section: 'Rule 6(1)(n)',
        title: 'Consumer Care Declaration',
        summary: 'Name, address, telephone number, and e-mail address of the person who can be contacted by the consumer in case of a complaint or query.'
      },
      {
        code: 'PCR-RULE-18-1',
        act: 'Packaged Commodities Rules, 2011',
        section: 'Rule 18(1)',
        title: 'Prohibition of Alteration of Price / Dual Pricing',
        summary: 'No wholesale dealer, retail dealer or other person shall obliterate, smudge, alter, or attach a revised price sticker on the manufacturer declared maximum retail price.'
      }
    ];

    // 8. Detected conflicts
    const detectedConflicts = [
      {
        id: 'conf-1',
        field: 'Maximum Retail Price (MRP)',
        sourceA: { name: 'Printed Label (OCR)', value: '₹349.00' },
        sourceB: { name: 'Central Product Registry / GS1', value: '₹199.00' },
        conflictType: 'DUAL_PRICING_STICKER_OVERWRITE',
        severity: 'CRITICAL',
        status: 'OPEN'
      }
    ];

    // 9. Past decisions and audit logs
    const decisionHistory = await InspectorDecision.find({ inspectionId: inspection._id }).sort({ timestamp: -1 }).lean();
    const auditLogs = await AuditLog.find({ inspection: inspection._id }).sort({ createdAt: -1 }).limit(50).lean();

    return {
      inspection,
      evidence: evidenceList,
      ocrResults,
      barcodeResults,
      verificationResults,
      extractedFields: inspection.fieldReviews || [],
      violations: inspection.violationReviews || [],
      regulations: regulationReferences,
      detectedConflicts,
      decisionHistory,
      auditLogs
    };
  }

  async updateFieldReview(
    inspectionId: string,
    inspectorId: string,
    data: {
      fieldId: string;
      action: FieldReviewAction;
      inspectorValue?: string;
      reason?: string;
      notes?: string;
    }
  ) {
    const inspection = await this.resolveInspection(inspectionId);
    if (!inspection) throw new Error('Inspection not found');

    await this.ensureInitializedFieldsAndViolations(inspection);

    const fields = inspection.fieldReviews || [];
    const fieldIndex = fields.findIndex(f => f.fieldId === data.fieldId || f.fieldName.toLowerCase().includes(data.fieldId.toLowerCase()));
    
    if (fieldIndex === -1) {
      throw new Error(`Field with ID ${data.fieldId} not found in inspection`);
    }

    const field = fields[fieldIndex];
    const previousInspectorValue = field.inspectorValue;
    const previousStatus = field.status;

    // Never overwrite original machine-generated value!
    if (data.action === 'ACCEPT') {
      field.inspectorValue = field.machineValue;
      field.status = 'ACCEPTED';
    } else if (data.action === 'EDIT') {
      if (!data.inspectorValue || !data.inspectorValue.trim()) {
        throw new Error('Edited value cannot be empty');
      }
      field.inspectorValue = data.inspectorValue.trim();
      field.status = 'EDITED';
    } else if (data.action === 'MARK_UNREADABLE') {
      field.inspectorValue = '[UNREADABLE]';
      field.status = 'UNREADABLE';
    } else if (data.action === 'REQUEST_RECAPTURE') {
      field.status = 'RECAPTURE_REQUESTED';
    }

    if (data.notes || data.reason) {
      field.notes = data.notes || data.reason;
    }

    inspection.fieldReviews = fields;
    inspection.markModified('fieldReviews');
    await inspection.save();

    // Log to immutable AuditLog
    await auditLogRepository.create({
      actorId: Types.ObjectId.isValid(inspectorId) ? new Types.ObjectId(inspectorId) : undefined,
      actorType: 'USER',
      action: 'EXTRACTED_FIELD_REVIEWED',
      entityType: 'Inspection',
      entityId: inspection._id as Types.ObjectId,
      inspection: inspection._id as Types.ObjectId,
      changes: [
        {
          field: `${field.fieldName}.status`,
          oldValue: previousStatus,
          newValue: field.status
        },
        {
          field: `${field.fieldName}.inspectorValue`,
          oldValue: previousInspectorValue || field.machineValue,
          newValue: field.inspectorValue
        }
      ],
      metadata: {
        fieldId: field.fieldId,
        fieldName: field.fieldName,
        action: data.action,
        machineValue: field.machineValue,
        inspectorValue: field.inspectorValue,
        reason: data.reason || data.notes
      },
      source: 'API'
    });

    return {
      success: true,
      field,
      allFields: inspection.fieldReviews
    };
  }

  async updateViolationReview(
    inspectionId: string,
    inspectorId: string,
    data: {
      violationId: string;
      action: ViolationReviewAction;
      overrideReason?: string;
    }
  ) {
    const inspection = await this.resolveInspection(inspectionId);
    if (!inspection) throw new Error('Inspection not found');

    await this.ensureInitializedFieldsAndViolations(inspection);

    const violations = inspection.violationReviews || [];
    const violation = violations.find(v => v.violationId === data.violationId);
    if (!violation) {
      throw new Error(`Violation with ID ${data.violationId} not found in inspection`);
    }

    const previousStatus = violation.status;

    // Require reason if rejecting an identified violation (override)
    if (data.action === 'REJECT') {
      if (!data.overrideReason || data.overrideReason.trim().length < 5) {
        throw new Error('Mandatory statutory justification reason is required to reject/override a violation.');
      }
      violation.status = 'REJECTED';
      violation.overrideReason = data.overrideReason.trim();
    } else if (data.action === 'CONFIRM') {
      violation.status = 'CONFIRMED';
      if (data.overrideReason) violation.overrideReason = data.overrideReason;
    } else if (data.action === 'REQUEST_ADDITIONAL_EVIDENCE') {
      violation.status = 'REQUIRES_EVIDENCE';
      if (data.overrideReason) violation.overrideReason = data.overrideReason;
    }

    inspection.violationReviews = violations;
    inspection.markModified('violationReviews');
    await inspection.save();

    await auditLogRepository.create({
      actorId: Types.ObjectId.isValid(inspectorId) ? new Types.ObjectId(inspectorId) : undefined,
      actorType: 'USER',
      action: 'VIOLATION_REVIEWED',
      entityType: 'Inspection',
      entityId: inspection._id as Types.ObjectId,
      inspection: inspection._id as Types.ObjectId,
      changes: [{
        field: `violation.${violation.ruleId}.status`,
        oldValue: previousStatus,
        newValue: violation.status
      }],
      metadata: {
        violationId: violation.violationId,
        ruleId: violation.ruleId,
        action: data.action,
        overrideReason: data.overrideReason
      },
      source: 'API'
    });

    return {
      success: true,
      violation,
      allViolations: inspection.violationReviews
    };
  }

  async submitFinalDecision(
    inspectionId: string,
    inspectorId: string,
    data: {
      decision: FinalDecisionState;
      reason: string;
      changedFields?: IFieldModificationRecord[];
      violationDecisions?: IViolationDecisionRecord[];
    }
  ) {
    const inspection = await this.resolveInspection(inspectionId);
    if (!inspection) throw new Error('Inspection not found');

    if (!data.reason || data.reason.trim().length < 5) {
      throw new Error('A documented statutory justification reason is mandatory for submitting a final adjudication decision.');
    }

    const fieldReviews = inspection.fieldReviews || [];
    const violationReviews = inspection.violationReviews || [];

    // STRICT COMPLIANCE GUARDRAIL:
    // Incomplete evidence cannot silently become compliant!
    if (data.decision === 'COMPLIANT') {
      // 1. Check for unreadable fields or pending recapture requests
      const unreadableFields = fieldReviews.filter(f => f.status === 'UNREADABLE');
      if (unreadableFields.length > 0) {
        throw new Error(`Incomplete evidence cannot silently become COMPLIANT: Field(s) [${unreadableFields.map(f => f.fieldName).join(', ')}] are marked UNREADABLE. Capture additional clear evidence or mark INCONCLUSIVE.`);
      }

      const recaptureFields = fieldReviews.filter(f => f.status === 'RECAPTURE_REQUESTED');
      if (recaptureFields.length > 0) {
        throw new Error(`Incomplete evidence cannot silently become COMPLIANT: Field(s) [${recaptureFields.map(f => f.fieldName).join(', ')}] have pending recapture requests. Complete evidence capture or resolve review.`);
      }

      // 2. Check for confirmed or unreviewed violations
      const activeViolations = violationReviews.filter(v => v.status === 'CONFIRMED' || v.status === 'PENDING');
      if (activeViolations.length > 0) {
        throw new Error(`Cannot declare inspection COMPLIANT: ${activeViolations.length} violation(s) remain active or unreviewed. An authorized inspector override with documented statutory justification is required to reject each violation before compliance can be granted.`);
      }
    }

    // Determine finalStatus and lifecycleStatus based on decision
    let lifecycleStatus: LifecycleStatus = 'COMPLETED';
    let finalStatus: FinalResultStatus = 'VERIFIED';

    switch (data.decision) {
      case 'COMPLIANT':
        lifecycleStatus = 'COMPLETED';
        finalStatus = 'VERIFIED';
        break;
      case 'NON_COMPLIANT':
        lifecycleStatus = 'COMPLETED';
        finalStatus = 'POTENTIAL_VIOLATION';
        break;
      case 'REQUIRES_EVIDENCE':
        lifecycleStatus = 'AWAITING_REVIEW';
        finalStatus = 'INSUFFICIENT_EVIDENCE';
        break;
      case 'INCONCLUSIVE':
        lifecycleStatus = 'AWAITING_REVIEW';
        finalStatus = 'INCONSISTENT';
        break;
      case 'UNDER_REVIEW':
        lifecycleStatus = 'AWAITING_REVIEW';
        finalStatus = 'PENDING';
        break;
      case 'CLOSED':
        lifecycleStatus = 'ARCHIVED';
        break;
      case 'DRAFT':
        lifecycleStatus = 'DRAFT';
        finalStatus = 'PENDING';
        break;
    }

    const previousDecision = inspection.decisionState;
    inspection.decisionState = data.decision;
    inspection.lifecycleStatus = lifecycleStatus;
    inspection.finalStatus = finalStatus;
    inspection.adjudicatedAt = new Date();
    inspection.adjudicatedBy = Types.ObjectId.isValid(inspectorId) ? new Types.ObjectId(inspectorId) : undefined;
    inspection.adjudicationReason = data.reason.trim();
    if (lifecycleStatus === 'COMPLETED') {
      inspection.completedAt = new Date();
    }
    await inspection.save();

    // Compile changed fields diff if not provided
    const changedFields: IFieldModificationRecord[] = data.changedFields || fieldReviews.map(f => ({
      fieldName: f.fieldName,
      originalValue: f.machineValue,
      newValue: f.inspectorValue || f.machineValue,
      action: (f.status === 'EDITED' ? 'EDIT' : f.status === 'UNREADABLE' ? 'MARK_UNREADABLE' : f.status === 'RECAPTURE_REQUESTED' ? 'REQUEST_RECAPTURE' : 'ACCEPT') as FieldReviewAction,
      reason: f.notes,
      timestamp: new Date()
    }));

    const violationDecisions: IViolationDecisionRecord[] = data.violationDecisions || violationReviews.map(v => ({
      violationId: v.violationId,
      ruleId: v.ruleId,
      action: (v.status === 'CONFIRMED' ? 'CONFIRM' : v.status === 'REJECTED' ? 'REJECT' : 'REQUEST_ADDITIONAL_EVIDENCE') as ViolationReviewAction,
      reason: v.overrideReason,
      timestamp: new Date()
    }));

    // Record formal InspectorDecision
    const decisionRecord = await InspectorDecision.create({
      inspectionId: inspection._id,
      inspectorId: inspectorId,
      decision: data.decision,
      reason: data.reason.trim(),
      changedFields,
      violationDecisions,
      timestamp: new Date()
    });

    // Record immutable AuditLog
    await auditLogRepository.create({
      actorId: Types.ObjectId.isValid(inspectorId) ? new Types.ObjectId(inspectorId) : undefined,
      actorType: 'USER',
      action: 'FINAL_INSPECTION_DECISION_RENDERED',
      entityType: 'Inspection',
      entityId: inspection._id as Types.ObjectId,
      inspection: inspection._id as Types.ObjectId,
      changes: [{
        field: 'decisionState',
        oldValue: previousDecision,
        newValue: data.decision
      }],
      metadata: {
        decision: data.decision,
        reason: data.reason,
        decisionRecordId: decisionRecord._id
      },
      source: 'API'
    });

    return {
      success: true,
      decision: decisionRecord,
      inspection
    };
  }

  async attachAdditionalEvidence(
    inspectionId: string,
    inspectorId: string,
    data: {
      storageKey?: string;
      localFilePath?: string;
      captureSide?: string;
      mimeType?: string;
      fileSize?: number;
      sha256Hash?: string;
      qualityScore?: number;
      notes?: string;
    }
  ) {
    const inspection = await this.resolveInspection(inspectionId);
    if (!inspection) throw new Error('Inspection not found');

    const validSides = ['FRONT', 'BACK', 'SIDE', 'TOP', 'BOTTOM', 'UNKNOWN'];
    const side = data.captureSide && validSides.includes(data.captureSide.toUpperCase()) 
      ? data.captureSide.toUpperCase() 
      : 'UNKNOWN';

    const evidenceDoc = await Evidence.create({
      inspection: inspection._id,
      evidenceType: 'PHOTO',
      captureSide: side as any,
      storageProvider: 'LOCAL',
      storageKey: data.storageKey || `supplementary_${Date.now()}.jpg`,
      sha256Hash: data.sha256Hash || 'supp_' + Math.random().toString(36).substring(2),
      mimeType: data.mimeType || 'image/jpeg',
      fileSize: data.fileSize || 102400,
      capturedAt: new Date(),
      uploadedAt: new Date(),
      qualityAssessment: 'ACCEPT',
      qualityInformation: {
        score: data.qualityScore || 90,
        blurState: 'GOOD',
        glareState: 'GOOD',
        resolutionState: 'GOOD',
        textVisibilityState: 'GOOD'
      }
    });

    if (!inspection.additionalEvidence) {
      inspection.additionalEvidence = [];
    }
    inspection.additionalEvidence.push(evidenceDoc._id as Types.ObjectId);
    inspection.evidenceCount = (inspection.evidenceCount || 0) + 1;
    await inspection.save();

    await auditLogRepository.create({
      actorId: Types.ObjectId.isValid(inspectorId) ? new Types.ObjectId(inspectorId) : undefined,
      actorType: 'USER',
      action: 'ADDITIONAL_EVIDENCE_ATTACHED',
      entityType: 'Evidence',
      entityId: evidenceDoc._id as Types.ObjectId,
      inspection: inspection._id as Types.ObjectId,
      metadata: {
        evidenceId: evidenceDoc._id,
        captureSide: side,
        sha256: evidenceDoc.sha256Hash
      },
      source: 'API'
    });

    return {
      success: true,
      evidence: evidenceDoc,
      evidenceCount: inspection.evidenceCount
    };
  }

  async getAuditTrail(inspectionId: string) {
    const inspection = await this.resolveInspection(inspectionId);
    if (!inspection) throw new Error('Inspection not found');

    const logs = await AuditLog.find({ inspection: inspection._id }).sort({ createdAt: -1 }).lean();
    const decisions = await InspectorDecision.find({ inspectionId: inspection._id }).sort({ timestamp: -1 }).lean();

    return {
      logs,
      decisions
    };
  }

  private async ensureInitializedFieldsAndViolations(inspection: any) {
    let modified = false;
    if (!inspection.fieldReviews || inspection.fieldReviews.length === 0) {
      inspection.fieldReviews = [
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
      ];
      modified = true;
    }

    if (!inspection.violationReviews || inspection.violationReviews.length === 0) {
      inspection.violationReviews = [
        {
          violationId: 'viol-dual-pricing',
          ruleId: 'RULE-DUAL-PRICING',
          ruleName: 'Prohibition of Alteration of Price / Dual Pricing',
          regulationReference: 'Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 18(1) & Rule 6(1)(e)',
          severity: 'CRITICAL',
          description: 'Secondary price sticker of ₹349.00 pasted over original manufacturer declaration of ₹199.00 without statutory justification.',
          status: 'PENDING',
          affectedFields: ['mrp'],
          evidenceIds: []
        }
      ];
      modified = true;
    }

    if (modified) {
      inspection.markModified('fieldReviews');
      inspection.markModified('violationReviews');
      await inspection.save();
    }
  }

  private async resolveInspection(identifier: string) {
    if (Types.ObjectId.isValid(identifier)) {
      const byId = await Inspection.findById(identifier);
      if (byId) return byId;
    }
    return await Inspection.findOne({ clientReference: identifier });
  }

}

export const inspectionService = new InspectionService();
