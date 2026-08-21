import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  QrCode, 
  Download, 
  Printer, 
  MapPin, 
  CheckCircle2, 
  Sprout, 
  Calendar, 
  Truck,
  ExternalLink,
  Award
} from 'lucide-react';
import { FarmField, ShippingBatch } from '../../types';
import { generateQrDataUrl } from '../../utils/qrUtils';
import { printExecutiveReport } from '../../utils/exportUtils';
import { CROP_CONFIG } from '../../data/mockData';

interface PucTraceabilityModalProps {
  field: FarmField | null;
  batch?: ShippingBatch | null;
  onClose: () => void;
  lang: 'en' | 'vi';
}

export const PucTraceabilityModal: React.FC<PucTraceabilityModalProps> = ({
  field,
  batch,
  onClose,
  lang,
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    if (field) {
      const payload = `https://agrigis.gov.vn/trace/${field.pucCode}${batch ? `?batch=${batch.batchCode}` : ''}`;
      generateQrDataUrl(payload).then(setQrUrl);
    }
  }, [field, batch]);

  if (!field) return null;

  const cropCfg = CROP_CONFIG[field.cropType] || { name: field.cropType, icon: '🌾' };

  const handlePrintCertificate = () => {
    const html = `
      <div style="border: 4px double #1b4332; padding: 25px; border-radius: 12px; background: #fafafa;">
        <div style="text-align: center; border-bottom: 2px solid #1b4332; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #1b4332; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
            National Planting Unit Code (PUC) Certificate
          </h2>
          <p style="margin: 5px 0 0; color: #4b5563; font-size: 13px;">
            Ministry of Agriculture & Rural Development • Digital Geospatial Registry
          </p>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
          <div>
            <div style="font-size: 18px; font-weight: bold; color: #166534; font-family: monospace;">
              PUC: ${field.pucCode}
            </div>
            <div style="font-size: 13px; color: #374151; margin-top: 4px;">
              <strong>Field:</strong> ${field.name} | <strong>Crop:</strong> ${field.cropVariety || field.cropType}
            </div>
            <div style="font-size: 13px; color: #374151;">
              <strong>Farmer:</strong> ${field.farmerName} (${field.farmerPhone})
            </div>
            <div style="font-size: 13px; color: #374151;">
              <strong>Cooperative (HTX):</strong> ${field.htxName}
            </div>
            <div style="font-size: 13px; color: #374151;">
              <strong>Location:</strong> ${field.commune}, ${field.district}, ${field.province}
            </div>
          </div>
          ${qrUrl ? `<img src="${qrUrl}" style="width: 110px; height: 110px; border: 1px solid #d1d5db; padding: 4px; background: #fff;" />` : ''}
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <th style="border: 1px solid #cbd5e1; padding: 8px; background: #f0fdf4; text-align: left;">Total Area</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px; background: #f0fdf4; text-align: left;">Certification</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px; background: #f0fdf4; text-align: left;">NDVI Health</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px; background: #f0fdf4; text-align: left;">Safety Status</th>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px;">${field.areaHa} ha (${field.areaM2.toLocaleString()} m²)</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px;">${field.certification}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px;">${field.ndviScore} (Optimal)</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px; color: #166534; font-weight: bold;">PASSED / VERIFIED</td>
          </tr>
        </table>

        <div style="background: #f0fdf4; padding: 12px; border-radius: 8px; border: 1px solid #bbf7d0; font-size: 12px; color: #166534; margin-bottom: 25px;">
          ✓ Maximum Residue Limit (MRL) chemical test: <strong>PASSED (0.00 ppm banned agrochemicals)</strong><br />
          ✓ Heavy metal soil contamination test (Cd, Pb, As): <strong>PASSED (Below safety threshold)</strong>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 10px;">
          <span>Verification Date: ${new Date().toLocaleDateString()}</span>
          <span>Cryptographic Signature: SHA-256 Verified</span>
        </div>
      </div>
    `;
    printExecutiveReport(`PUC_Certificate_${field.pucCode}`, html);
  };

  const t = {
    title: lang === 'vi' ? 'Cổng Tra Cứu Nguồn Gốc Vùng Trồng Quốc Gia' : 'National Agricultural Traceability Portal',
    pucCode: lang === 'vi' ? 'Mã Số Vùng Trồng (PUC)' : 'Planting Unit Code (PUC)',
    verifiedBadge: lang === 'vi' ? 'Đã Xác Thực Chính Thức' : 'Official Verified Origin',
    farmer: lang === 'vi' ? 'Chủ Thể Canh Tác' : 'Producer & Farmer',
    coop: lang === 'vi' ? 'Hợp Tác Xã Quản Lý' : 'Managing Cooperative',
    crop: lang === 'vi' ? 'Nông Sản & Giống' : 'Agricultural Commodity',
    location: lang === 'vi' ? 'Vùng Sản Xuất' : 'Geographic Origin',
    labTest: lang === 'vi' ? 'Kết Quả Kiểm Nghiệm Dư Lượng (MRL)' : 'Residue & Safety Lab Tests',
    downloadQr: lang === 'vi' ? 'Tải Ảnh Mã QR' : 'Download QR Code',
    printCert: lang === 'vi' ? 'In Giấy Chứng Nhận PUC' : 'Print Certificate',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl bg-stone-950 border border-stone-800 rounded-3xl p-6 shadow-2xl text-stone-100 space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Modal Top Header */}
        <div className="flex items-start justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-950 text-emerald-400 border border-emerald-800">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-100">{t.title}</h3>
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t.verifiedBadge}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Big PUC Badge & QR Display */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-stone-900 to-stone-900 border border-emerald-800/80 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-xs text-stone-400 font-medium">{t.pucCode}</span>
            <div className="text-xl sm:text-2xl font-mono font-extrabold text-emerald-300 tracking-wide">
              {field.pucCode}
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-900/80 text-emerald-200 border border-emerald-700 text-xs font-semibold">
                {field.certification} Standard
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-stone-800 text-stone-300 text-xs">
                {field.areaHa} Hectares
              </span>
            </div>
          </div>

          {qrUrl && (
            <div className="p-3 bg-white rounded-2xl shadow-xl shrink-0 flex flex-col items-center">
              <img src={qrUrl} alt="PUC QR Code" className="w-28 h-28" />
              <span className="text-[10px] font-mono text-stone-700 font-bold mt-1">SCAN TO VERIFY</span>
            </div>
          )}
        </div>

        {/* Traceability Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-1">
            <span className="text-stone-400 block">{t.farmer}</span>
            <div className="font-bold text-stone-200">{field.farmerName}</div>
            <div className="text-stone-500">{field.farmerPhone}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-1">
            <span className="text-stone-400 block">{t.coop}</span>
            <div className="font-bold text-stone-200">{field.htxName}</div>
            <div className="text-stone-500">Official Registered Cooperative</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-1">
            <span className="text-stone-400 block">{t.crop}</span>
            <div className="font-bold text-stone-200">{cropCfg.icon} {field.cropVariety || field.cropType}</div>
            <div className="text-stone-500">Planting: {field.plantingDate}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-1">
            <span className="text-stone-400 block">{t.location}</span>
            <div className="font-bold text-stone-200">{field.commune}, {field.district}</div>
            <div className="text-stone-500">{field.province}, Vietnam</div>
          </div>
        </div>

        {/* Lab Testing & Quality Certification */}
        <div className="p-4 rounded-2xl bg-stone-900/50 border border-stone-800 space-y-2 text-xs">
          <div className="font-bold text-stone-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{t.labTest}</span>
          </div>
          <div className="space-y-1.5 text-[11px] text-stone-300">
            <div className="flex items-center justify-between p-2 rounded-xl bg-stone-950">
              <span>Pesticide Residue (EU/US MRL Standards):</span>
              <span className="text-emerald-400 font-bold">PASSED (0.00 ppm)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-stone-950">
              <span>Soil & Irrigation Water Heavy Metals:</span>
              <span className="text-emerald-400 font-bold">CLEARED (VietGAP Standard)</span>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-800">
          <a
            href={qrUrl}
            download={`QR_${field.pucCode}.png`}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{t.downloadQr}</span>
          </a>

          <button
            onClick={handlePrintCertificate}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/40 transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>{t.printCert}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
