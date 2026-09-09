/**
 * PDF & Print Export Helper Utility for InspectMate
 * 
 * Provides print-friendly PDF document generation via browser print engine
 * and formatted standalone file export.
 */

export interface ExportReportOptions {
  /** The DOM ID of the report container to print */
  elementId?: string;
  /** Custom filename without extension */
  filename?: string;
  /** The inspection or dossier ID (e.g., PRM-2026-0842) */
  inspectionId?: string;
  /** Product name for dossier titling */
  productName?: string;
  /** Callback triggered immediately before printing starts */
  onBeforePrint?: () => void;
  /** Callback triggered after print dialog is closed or dismissed */
  onAfterPrint?: () => void;
}

/**
 * Triggers the browser's native high-fidelity print-to-PDF engine with
 * custom document naming, clean page styling, and UI isolation.
 */
export function exportReportToPDF(options: ExportReportOptions = {}): Promise<boolean> {
  return new Promise((resolve) => {
    const {
      elementId = 'final-inspection-report',
      filename,
      inspectionId = 'PRM-2026-0842',
      productName,
      onBeforePrint,
      onAfterPrint
    } = options;

    const originalTitle = document.title;
    const cleanId = inspectionId.replace(/[^a-zA-Z0-9-_]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const generatedFilename = filename 
      ? filename 
      : productName
        ? `InspectMate_Notice_Form_VIII_${cleanId}_${productName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr}`
        : `InspectMate_Notice_Form_VIII_${cleanId}_${dateStr}`;

    // Set the document title so default filename in "Save as PDF" is officially designated
    document.title = generatedFilename;
    document.body.classList.add('is-printing-report');

    if (onBeforePrint) {
      onBeforePrint();
    }

    const reportElem = document.getElementById(elementId);
    if (reportElem) {
      reportElem.scrollIntoView({ behavior: 'instant', block: 'start' });
    }

    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      document.title = originalTitle;
      document.body.classList.remove('is-printing-report');
      window.removeEventListener('afterprint', cleanup);
      if (onAfterPrint) {
        onAfterPrint();
      }
      resolve(true);
    };

    window.addEventListener('afterprint', cleanup, { once: true });

    // Fallback safety timeout for browser environments where afterprint might not fire
    setTimeout(() => {
      if (!cleanedUp) {
        cleanup();
      }
    }, 12000);

    // Give browser a microtask tick to apply layout changes before opening dialog
    requestAnimationFrame(() => {
      window.print();
    });
  });
}

/**
 * Exports a standalone, fully self-contained HTML file of the inspection report
 * complete with embedded print-optimized styles.
 */
export function downloadReportAsHTML(options: ExportReportOptions = {}): void {
  const {
    elementId = 'final-inspection-report',
    filename,
    inspectionId = 'PRM-2026-0842',
    productName
  } = options;

  const reportElem = document.getElementById(elementId);
  if (!reportElem) {
    console.error(`Report element with ID "${elementId}" not found.`);
    return;
  }

  const cleanId = inspectionId.replace(/[^a-zA-Z0-9-_]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const fileTitle = filename || `InspectMate_Regulatory_Dossier_${cleanId}_${dateStr}`;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fileTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      line-height: 1.5;
    }
    .print-header-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-bottom: 24px;
    }
    .btn-print {
      background: #0f172a;
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      font-size: 13px;
    }
    @media print {
      .print-header-actions {
        display: none !important;
      }
      body {
        padding: 0;
      }
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 10px 12px;
      text-align: left;
    }
    th {
      background-color: #f8fafc;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .font-mono {
      font-family: 'JetBrains Mono', monospace;
    }
  </style>
</head>
<body>
  <div class="print-header-actions">
    <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
  </div>
  <div id="report-content">
    ${reportElem.outerHTML}
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileTitle}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
