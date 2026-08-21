import QRCode from 'qrcode';
import { FarmField, ShippingBatch } from '../types';

/**
 * Generate a QR code data URL for a given PUC code or Batch
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 320,
      margin: 2,
      color: {
        dark: '#1b4332',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });
  } catch (err) {
    console.error('Failed to generate QR code:', err);
    return '';
  }
}

/**
 * Creates public verification payload for a field
 */
export function buildPucVerificationUrl(pucCode: string): string {
  const host = typeof window !== 'undefined' ? window.location.origin : 'https://agrigis.gov.vn';
  return `${host}/trace/${encodeURIComponent(pucCode)}`;
}

/**
 * Creates public traceability metadata
 */
export function getFieldTraceabilityMetadata(field: FarmField, batch?: ShippingBatch) {
  return {
    pucCode: field.pucCode,
    fieldName: field.name,
    cropName: field.cropVariety || field.cropType,
    farmer: field.farmerName,
    cooperative: field.htxName,
    location: `${field.commune}, ${field.district}, ${field.province}`,
    area: `${field.areaHa} ha (${field.areaM2.toLocaleString()} m²)`,
    certification: field.certification,
    irrigation: field.irrigationType,
    ndviScore: field.ndviScore,
    riskStatus: field.riskLevel === 'BINH_THUONG' ? 'Passed (Green)' : field.riskLevel === 'CANH_BAO_NHE' ? 'Under Monitoring (Yellow)' : 'Quarantine Warning (Red)',
    batchCode: batch ? batch.batchCode : undefined,
    harvestDate: batch ? batch.harvestDate : field.expectedHarvestDate,
    destination: batch ? batch.destination : undefined,
    inspectionPassed: field.riskLevel !== 'NGUY_CO_CAO',
    verificationTime: new Date().toISOString(),
  };
}
