import { FarmField, ShippingBatch, DiseaseRecord } from '../types';

/**
 * Export field list to CSV
 */
export function exportFieldsToCSV(fields: FarmField[], filename = 'AgriGIS_Fields_Report.csv') {
  const headers = [
    'PUC Code',
    'Field Name',
    'Farmer Name',
    'Phone',
    'HTX / Cooperative',
    'Province',
    'District',
    'Commune',
    'Crop Type',
    'Variety',
    'Area (ha)',
    'Area (m2)',
    'Growth Stage',
    'Risk Level',
    'NDVI Index',
    'Certification',
    'Planting Date',
    'Expected Harvest',
  ];

  const rows = fields.map((f) => [
    `"${f.pucCode}"`,
    `"${f.name.replace(/"/g, '""')}"`,
    `"${f.farmerName.replace(/"/g, '""')}"`,
    `"${f.farmerPhone}"`,
    `"${f.htxName.replace(/"/g, '""')}"`,
    `"${f.province}"`,
    `"${f.district}"`,
    `"${f.commune}"`,
    `"${f.cropType}"`,
    `"${f.cropVariety}"`,
    f.areaHa,
    f.areaM2,
    `"${f.growthStage}"`,
    `"${f.riskLevel}"`,
    f.ndviScore,
    `"${f.certification}"`,
    `"${f.plantingDate}"`,
    `"${f.expectedHarvestDate}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export shipping logs to CSV
 */
export function exportShippingLogsToCSV(logs: { field: FarmField; batch: ShippingBatch }[], filename = 'AgriGIS_Shipping_Traceability.csv') {
  const headers = [
    'Batch Code',
    'Field PUC',
    'Field Name',
    'Crop',
    'Quantity (Tons)',
    'Harvest Date',
    'Ship Date',
    'Destination',
    'Carrier',
    'Status',
    'Standard',
  ];

  const rows = logs.map(({ field, batch }) => [
    `"${batch.batchCode}"`,
    `"${field.pucCode}"`,
    `"${field.name}"`,
    `"${field.cropVariety || field.cropType}"`,
    batch.quantityTons,
    `"${batch.harvestDate}"`,
    `"${batch.shipDate}"`,
    `"${batch.destination}"`,
    `"${batch.carrier}"`,
    `"${batch.status}"`,
    `"${batch.standard}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Trigger browser print for a stylized executive agricultural report
 */
export function printExecutiveReport(title: string, contentHtml: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate printable report.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            padding: 30px;
            color: #1a202c;
            line-height: 1.5;
          }
          .header {
            border-bottom: 2px solid #2e7d32;
            padding-bottom: 15px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .title { font-size: 24px; font-weight: bold; color: #1b4332; margin: 0; }
          .meta { font-size: 12px; color: #718096; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; font-size: 13px; }
          th { background: #f0fdf4; color: #166534; font-weight: 600; }
          .badge { padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold; display: inline-block; }
          .badge-green { background: #dcfce7; color: #15803d; }
          .badge-yellow { background: #fef9c3; color: #a16207; }
          .badge-red { background: #fee2e2; color: #b91c1c; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">🌾 AgriGIS - Agricultural Authority Report</h1>
            <div class="meta">Generated on: ${new Date().toLocaleString()} | Official Digital Registry</div>
          </div>
          <div style="text-align: right;">
            <strong>Planting Area Code (PUC) Registry</strong><br />
            <span style="font-size: 12px; color: #4a5568;">Ministry of Agriculture & Rural Development</span>
          </div>
        </div>
        <div>
          ${contentHtml}
        </div>
        <div style="margin-top: 40px; border-top: 1px dashed #cbd5e1; padding-top: 15px; font-size: 11px; color: #64748b; display: flex; justify-content: space-between;">
          <span>Official Document - AgriGIS Web GIS Engine v3.4</span>
          <span>Verified Cryptographic QR & PUC Signature</span>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
