# InspectMate — Master Blueprint & Technical Plan

## 1. App Overview & Objectives
**InspectMate** is an AI-assisted, progressive web application (PWA) designed for regulatory and Legal Metrology field officers. Its primary objective is to streamline the physical audit of commercial packaged commodities—transitioning enforcement from cumbersome paper-based inspections and manual calculations to an intelligent, automated, and court-admissible digital workflow.

The system empowers inspectors to scan any off-the-shelf commercial packaged product (edible and non-edible), extract statutory declarations via multimodal AI vision, evaluate compliance against legal standards, adjudicate potential infringements with human-in-the-loop oversight, and generate tamper-evident, evidence-backed regulatory notices on the spot.

---

## 2. Target Audience
1. **Field Legal Metrology Inspectors / Enforcement Officers**: Primary end-users who inspect retail stores, supermarkets, distribution centers, and warehouses on mobile devices (smartphones/tablets).
2. **Regulatory Supervisors & Adjudicating Authorities**: Administrative officials who review submitted dossiers, assess contested penalties, and authorize compounding notices or prosecution proceedings.
3. **Appellate & Legal Authorities**: Court officers, hearing authorities, and legal counsel who require an indisputable, cryptographically verified chain of custody and forensic evidence trail.

---

## 3. Core Features & Functionality

### 3.1 Guided Evidence Capture & Quality Gate
* **Multi-Slot Image Acquisition**: Guided capture slots covering all statutory packaging sides (Front, Back, MRP/Side Panel, Nutritional/Ingredients Panel).
* **Automated Barcode Detection**: Instant identification of 1D/2D symbologies (EAN-13, UPC-A, DataMatrix, QR).
* **Video Fallback & Frame Selection**: High-speed camera frame extraction for shiny, reflective, or cylindrical containers.
* **Dual-Layer Quality Pre-Flight**: Client-side heuristic checks followed by backend multimodal AI analysis assessing sharpness, glare, resolution, and text legibility before submission.

### 3.2 Multimodal AI Declaration Extraction
* **Open Commodity Support**: Evaluates arbitrary commercial goods off store shelves without requiring pre-registered product catalogs.
* **Standard Statutory Fields**: Automated extraction of Maximum Retail Price (MRP with inclusive tax declarations), Net Quantity with standard units, Manufacturer/Packer identity & address, Dates (Manufacturing, Packaging, Expiry/Best Before), and Consumer Care details.
* **Edible/FSSAI Commodity Intelligence**: Context-aware extraction of Ingredients lists, Nutritional Information panels, and dietary iconography.

### 3.3 Four-Tier Statutory Compliance Engine
Moves beyond simplistic binary pass/fail to four legally meaningful outcomes:
1. **VERIFIED**: Evidence and checks are consistent, and all statutory declarations satisfy legal criteria.
2. **POTENTIAL VIOLATION**: Strong indication of statutory infringement (e.g., dual pricing sticker overprint, missing consumer care, absent nutrition table, sub-minimum font height) requiring inspector sign-off.
3. **INCONSISTENT**: Divergence between detected declarations and secondary data sources or packaging panels.
4. **INSUFFICIENT EVIDENCE**: Occluded, damaged, or unreadable packaging that prevents reliable determination without prejudice.

### 3.4 Human-in-the-Loop Adjudication
* **Split-Pane Evidence Review**: Extracted text juxtaposed directly against cropped, high-resolution original evidence images.
* **Field-Level Review Actions**: Inspector can Accept, Edit with notes, Mark Unreadable, or Request Recapture.
* **Statutory Justification Guardrails**: Mandatory written statutory justification required whenever an officer confirms or overrides a flagged violation.
* **Tamper-Evident Audit Trail**: Every field modification and decision is recorded in an immutable append-only audit log.

### 3.5 Court-Admissible Regulatory Report Generation
* **Dossier & Notice Synthesis**: Instant generation of structured regulatory reports (e.g., Form VIII Inspection Notice / Notice of Seizure).
* **Forensic Metadata Inclusion**: Incorporates Inspection ID, Inspector identity, ISO timestamp, GPS location coordinates, product category, and GTIN.
* **Embedded Visual Evidence**: High-resolution cropped evidence frames highlighting the exact area of non-compliance.
* **Digital Signatures & Watermarking**: Cryptographic verification badge, official watermarks, and verification QR code.

---

## 4. User Interface & Experience (UI/UX) Design Principles

### 4.1 Premium Glassmorphism & Visual Aesthetics
* **Frosted Glass Depth**: Semi-translucent panels (`backdrop-blur-xl`, `bg-white/10` or `bg-slate-900/40`), micro-borders (`border-white/20`), and subtle multi-layered shadows.
* **Ambient Lighting & Atmospheric Accents**: Subtle floating radial gradient glows (deep indigo, electric cyan, and warm amber) providing depth without visual clutter.
* **Minimalist Ergonomics**: Clean hierarchy, generous padding, high-contrast readable typography (e.g., Inter/Outfit), and zero extraneous decorative noise.
* **Dark / Light Harmony**: Sleek, high-authority dark surfaces combined with crisp, accessible high-contrast legal text zones.

### 4.2 Field-Optimized Mobile UX
* **Single-Handed Touch Zones**: Primary actions (shutter button, approval toggles, next phase buttons) positioned within thumb reach on mobile viewports.
* **Micro-Interactions & Haptic Signals**: Smooth tab transitions, skeleton loaders during network latency, and tactile feedback on critical legal actions.
* **No-Print Cleanliness**: Dedicated print/export stylesheets stripping navigation bars, floating blurs, and interactive controls when rendering official notices.

### 4.3 SEO & Web Standard Excellence
* **Semantic HTML5 Architecture**: Proper heading hierarchies (`h1` through `h4`), `<main>`, `<nav>`, `<article>`, and `<section>` tags.
* **Descriptive Metadata & Social Tags**: OpenGraph, Twitter Cards, dynamic `<title>` tags, and canonical tags for public-facing regulatory verification portals.
* **Lighthouse Performance**: Code splitting, lazy-loaded visual modules, optimized WebP graphics, and sub-second Time to Interactive (TTI).

---

## 5. High-Level Technical Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   InspectMate PWA (Vite/React)           │
│  - Glassmorphic UI System                                │
│  - Camera Stream & Barcode Scanner                       │
│  - Client Pre-flight Quality Gate                        │
│  - Offline IndexedDB Engine (Evidence, Queue, Blobs)     │
└────────────────────────────┬─────────────────────────────┘
                             │ HTTPS / REST (4G/5G)
                             ▼
┌──────────────────────────────────────────────────────────┐
│                  InspectMate Express API                 │
│  - JWT Authentication & RBAC (Inspector / Regulator)     │
│  - Inspection Lifecycle & Adjudication Controller        │
│  - Statutory Rules Engine (Legal Metrology / FSSAI)      │
│  - Notice & Dossier Export Service                       │
└─────────────┬──────────────────────────────┬─────────────┘
              │                              │
              ▼                              ▼
┌───────────────────────────┐  ┌───────────────────────────┐
│     MongoDB Database      │  │ Google Gemini 2.5 Flash   │
│ - Inspections & Findings  │  │ - Image Quality Scoring   │
│ - Products & Declarations │  │ - Multi-modal Extraction  │
│ - Immutable Audit Logs    │  │ - Label Semantic Analysis │
└───────────────────────────┘  └───────────────────────────┘
```

### 5.1 Technology Recommendations
* **Frontend**: React 18 + TypeScript + Vite PWA. TailwindCSS / Vanilla CSS variables tailored for translucent glassmorphism tokens.
* **Backend**: Node.js + Express + TypeScript. Stateless, horizontal scalability with structured validation using Zod.
* **AI & Machine Intelligence**: Google Gemini 2.5 Flash multimodal vision API for sub-3-second field extraction and semantic label inspection.
* **Database & Persistence**: MongoDB Atlas (leveraging transactions for audit immutability and document flexibility for varied commodity schemas).
* **Storage**: High-throughput object storage (GCS / S3 compatible) for original evidence photos and generated PDF notices.

---

## 6. Conceptual Data Model

### 6.1 Core Entities & Relationships
1. **User (Officer)**: Identifier, badge number, jurisdictional zone, role (`inspector`, `regulator`), cryptographic key.
2. **Inspection**: Dossier ID, lifecycle state (`DRAFT`, `CAPTURING`, `UNDER_REVIEW`, `FINALIZED`), premises name, GPS geolocation, timestamp.
3. **Product**: Barcode/GTIN, commercial name, manufacturer/packer name, commodity category (Food/Edible vs General).
4. **Evidence**: Media slot (Front, Back, MRP/Side, Nutrition), original image reference, cropped ROI, SHA-256 hash, quality score.
5. **ExtractedDeclaration**: Key-value statutory fields, extracted raw text, normalized value, bounding box coordinates, model confidence score.
6. **RuleFinding**: Rule identifier (e.g., Legal Metrology Rule 6(1)(e)), rule version, evaluated outcome (`VERIFIED`, `POTENTIAL_VIOLATION`, `INCONSISTENT`, `INSUFFICIENT_EVIDENCE`), rationale.
7. **InspectorDecision**: Officer determination, manual overrides, statutory rationale, timestamp, digital signature.
8. **AuditLog**: Immutable append-only record tracking actor, action, previous value, new value, and tamper seal.

---

## 7. Security, Trust & Forensic Integrity
* **Cryptographic Evidence Hashing**: Every photo captured in the field is immediately hashed (SHA-256) on the client to ensure the image cannot be modified or replaced prior to adjudication.
* **Non-Repudiation**: Officers must authenticate with JWT; all overrides require mandatory statutory justifications recorded in an append-only audit trail.
* **Zero Client Secret Exposure**: API keys (including Gemini AI credentials) are strictly sequestered on the backend API layer.
* **Role-Based Scoping**: Inspectors have access strictly to inspections within their assigned jurisdiction; regulators have read/audit oversight across regional registries.

---

## 8. Development Phases & Milestones

### Phase 1: End-to-End "Golden Thread" Integration (Current Priority)
* Wire live camera capture directly to backend Gemini vision extraction for real-world products.
* Replace mock fixtures across Screens 8 through 13 with dynamic, live-extracted package declarations.
* Implement dynamic categorization (General Commodity vs Edible/Nutritional rules).

### Phase 2: Four-Status Rule Engine & Review Refinement
* Formally connect the Rules Engine to output the four statutory outcomes (`VERIFIED`, `POTENTIAL VIOLATION`, `INCONSISTENT`, `INSUFFICIENT EVIDENCE`).
* Ensure Inspector Review screen displays side-by-side photo crops with 1-tap accept/edit actions.

### Phase 3: Court-Admissible Notice Generation & PDF Export
* Implement high-fidelity server/client rendering of official Inspection Reports / Notices of Seizure.
* Embed cropped evidence images, GPS coordinates, statutory citations, and inspector digital signatures.

### Phase 4: Glassmorphic UI/UX Polish & SEO
* Apply complete, cohesive glassmorphic styling across all 19 screens.
* Optimize semantic markup, meta tags, and mobile responsive ergonomics.

### Phase 5: Regulator Portal & Offline Enhancements (Future Scope)
* Supervisory dashboard for multi-inspector jurisdiction oversight.
* Background offline queue synchronization for low-connectivity warehouses.

---

## 9. Potential Challenges & Solutions
1. **Glossy/Reflective Commodity Packaging**:
   * *Challenge*: Glare washes out white text on reflective foils.
   * *Solution*: Client-side glare detection warns inspector in real-time; video frame extractor samples multiple angles to pick glare-free frames.
2. **Curved Bottles and Canisters**:
   * *Challenge*: Text wrapping around cylindrical cans causes distorted OCR lines.
   * *Solution*: Multimodal AI (Gemini 2.5 Flash) recognizes warped text natively without requiring complex planar flattening.
3. **Varied Packaging Standards Across Product Categories**:
   * *Challenge*: Enforcing food-specific requirements (e.g. nutrition tables) on electronics or hardware.
   * *Solution*: Dynamic product categorization that loads targeted compliance rule subsets based on the detected commodity type.

---

## 10. Future Expansion Possibilities
* **GS1 & National Registry Federation**: Automated live API cross-checks against national product registries and brand databases.
* **Consumer Grievance Direct Dispatch**: Automatic generation of compliance inquiries to brand consumer care helplines.
* **Geospatial Hotspot Mapping**: Heatmap visualization of retail zones with high recidivism or counterfeit density for enforcement planning.
