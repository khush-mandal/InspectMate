import mongoose from 'mongoose';
import { Package } from '../src/db/models/Package';
import { Inspection } from '../src/db/models/Inspection';
import { ComplianceEvaluation } from '../src/db/models/ComplianceEvaluation';
import { RuleEvaluation } from '../src/db/models/RuleEvaluation';
import { Violation } from '../src/db/models/Violation';
import { OCRResult } from '../src/db/models/OCRResult';
import { Evidence } from '../src/db/models/Evidence';

export async function migrateV8Domain() {
  console.log('Starting Phase 8 canonical domain migration...');
  
  // 1. Migrate Products to Packages
  const products = await mongoose.connection.collection('products').find({}).toArray();
  for (const product of products) {
    const existingPackage = await Package.findOne({ gtin: product.gtin });
    if (!existingPackage) {
      await Package.create({
        gtin: product.gtin,
        productName: product.productName,
        brand: product.brand,
        company: product.company,
        category: product.category,
        source: product.source || 'migration'
      });
      console.log(`Migrated product ${product.gtin} to Package`);
    }
  }

  // 2. Migrate Inspections
  const inspections = await Inspection.find({});
  for (const insp of inspections) {
    // If it has 'DRAFT' or old statuses, update to canonical ones
    if (insp.status as any === 'PROCESSING') insp.status = 'EXTRACTION';
    if (insp.status as any === 'AWAITING_REVIEW') insp.status = 'REVIEW_REQUIRED';
    await insp.save();
  }
  
  // 3. Migrate Findings to RuleEvaluation & Violation
  const findings = await mongoose.connection.collection('findings').find({}).toArray();
  for (const finding of findings) {
    const complianceEval = await ComplianceEvaluation.findOneAndUpdate(
      { inspectionId: finding.inspection },
      { $setOnInsert: { inspectionId: finding.inspection, overallStatus: 'REVIEW_NEEDED' } },
      { upsert: true, new: true }
    );
    
    const ruleEval = await RuleEvaluation.create({
      complianceEvaluationId: complianceEval._id,
      ruleId: finding.ruleId,
      status: finding.result === 'PASS' ? 'PASS' : 'FAIL',
      evidenceIds: finding.supportingEvidence || []
    });
    
    if (finding.result !== 'PASS') {
      await Violation.create({
        complianceEvaluationId: complianceEval._id,
        ruleEvaluationId: ruleEval._id,
        severity: finding.severity,
        description: finding.reason || 'Migrated finding'
      });
    }
  }
  
  console.log('Migration complete.');
}
