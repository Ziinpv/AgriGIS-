import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  QrCode, 
  Download, 
  FileText, 
  AlertTriangle, 
  ShieldCheck, 
  ChevronRight, 
  Calendar, 
  TrendingUp, 
  Droplet, 
  Sun, 
  Truck, 
  Plus, 
  ExternalLink,
  Sparkles,
  RefreshCw,
  Edit3,
  Phone,
  CheckCircle2
} from 'lucide-react';
import { FarmField, GrowthStage, RiskLevel, ShippingBatch } from '../../types';
import { CROP_CONFIG, STAGE_CONFIG } from '../../data/mockData';
import { generateQrDataUrl, buildPucVerificationUrl } from '../../utils/qrUtils';
import { printExecutiveReport, exportFieldsToCSV } from '../../utils/exportUtils';
import confetti from 'canvas-confetti';

interface FieldDrawerProps {
  field: FarmField | null;
  onClose: () => void;
  onAdvanceStage: (fieldId: string, nextStage: GrowthStage) => void;
  onAddShippingBatch: (fieldId: string, batch: Partial<ShippingBatch>) => void;
  onTriggerScan: (fieldId: string) => void;
  onOpenTraceability: (field: FarmField) => void;
  lang: 'en' | 'vi';
  theme: 'dark' | 'light';
}

export const FieldDrawer: React.FC<FieldDrawerProps> = ({
  field,
  onClose,
  onAdvanceStage,
  onAddShippingBatch,
  onTriggerScan,
  onOpenTraceability,
  lang,
  theme,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showAddBatchModal, setShowAddBatchModal] = useState<boolean>(false);
  const [showXaiModal, setShowXaiModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'disease' | 'shipping' | 'soil'>('overview');

  // Form state for new shipping batch
  const [newBatchData, setNewBatchData] = useState({
    quantityTons: 5.0,
    destination: 'VinMart Central Distribution (Hanoi)',
    standard: 'GlobalGAP' as const,
    carrier: 'VNPost Agri Logistics',
  });

  // Generate QR Code when field changes
  useEffect(() => {
    if (field) {
      const url = buildPucVerificationUrl(field.pucCode);
      generateQrDataUrl(url).then(setQrCodeUrl);
    }
  }, [field]);

  if (!field) return null;

  const cropCfg = CROP_CONFIG[field.cropType] || { name: field.cropType, icon: '🌾' };

  // Stages in sequence
  const stageSequence: GrowthStage[] = ['GIEO_HAT', 'PHAT_TRIEN', 'RA_HOA', 'THU_HOACH', 'NGHI_CANH'];
  const currentStageIndex = stageSequence.indexOf(field.growthStage);

  const handleNextStage = () => {
    if (currentStageIndex < stageSequence.length - 1) {
      const nextStage = stageSequence[currentStageIndex + 1];
      onAdvanceStage(field.id, nextStage);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    }
  };

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const batchCode = `BATCH-${field.pucCode.replace(/-/g, '')}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(10 + Math.random() * 90)}`;
    const batch: ShippingBatch = {
      id: `ship-${Date.now()}`,
      batchCode,
      harvestDate: new Date().toISOString().slice(0, 10),
      shipDate: new Date().toISOString().slice(0, 10),
      quantityTons: Number(newBatchData.quantityTons),
      destination: newBatchData.destination,
      status: 'IN_TRANSIT',
      standard: newBatchData.standard,
      carrier: newBatchData.carrier,
      trackingNumber: `AGR-TRK-${Math.floor(100000 + Math.random() * 900000)}`,
    };
    onAddShippingBatch(field.id, batch);
    setShowAddBatchModal(false);
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
  };

  const handleExportSingleReport = () => {
    const contentHtml = `
      <div style="margin-bottom: 20px;">
        <h2 style="color: #1b4332; margin-bottom: 5px;">Field Dossier: ${field.name}</h2>
        <p style="margin: 0; color: #4a5568;"><strong>PUC Registry Code:</strong> ${field.pucCode}</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
        <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <strong>Farmer:</strong> ${field.farmerName} (${field.farmerPhone})<br />
          <strong>Cooperative:</strong> ${field.htxName}<br />
          <strong>Location:</strong> ${field.commune}, ${field.district}, ${field.province}
        </div>
        <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <strong>Crop & Variety:</strong> ${field.cropVariety || field.cropType}<br />
          <strong>Area:</strong> ${field.areaHa} ha (${field.areaM2.toLocaleString()} m²)<br />
          <strong>Certification:</strong> ${field.certification} | <strong>NDVI:</strong> ${field.ndviScore}
        </div>
      </div>

      <h3>Growth Stage & Health Inspection</h3>
      <table style="margin-bottom: 20px;">
        <tr>
          <th>Current Growth Stage</th>
          <th>Risk Status</th>
          <th>Planting Date</th>
          <th>Expected Harvest</th>
        </tr>
        <tr>
          <td><strong>${STAGE_CONFIG[field.growthStage]?.nameVi || field.growthStage}</strong></td>
          <td><span class="badge ${field.riskLevel === 'BINH_THUONG' ? 'badge-green' : field.riskLevel === 'CANH_BAO_NHE' ? 'badge-yellow' : 'badge-red'}">${field.riskLevel}</span></td>
          <td>${field.plantingDate}</td>
          <td>${field.expectedHarvestDate}</td>
        </tr>
      </table>

      <h3>Traceability & Shipping Batches</h3>
      <table>
        <thead>
          <tr>
            <th>Batch Code</th>
            <th>Harvest Date</th>
            <th>Quantity (Tons)</th>
            <th>Destination</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${field.shippingLogs.length === 0 ? '<tr><td colspan="5" style="text-align: center; color: #94a3b8;">No batches dispatched yet.</td></tr>' : field.shippingLogs.map(b => `
            <tr>
              <td><code>${b.batchCode}</code></td>
              <td>${b.harvestDate}</td>
              <td><strong>${b.quantityTons} T</strong></td>
              <td>${b.destination}</td>
              <td>${b.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    printExecutiveReport(`Field_Dossier_${field.pucCode}`, contentHtml);
  };

  const t = {
    pucTitle: lang === 'vi' ? 'Mã Số Vùng Trồng (PUC)' : 'Planting Unit Code (PUC)',
    farmer: lang === 'vi' ? 'Chủ Hộ Canh Tác' : 'Farmer / Operator',
    cooperative: lang === 'vi' ? 'Hợp Tác Xã (HTX)' : 'Cooperative',
    crop: lang === 'vi' ? 'Loại Cây & Giống' : 'Crop & Variety',
    area: lang === 'vi' ? 'Diện Tích' : 'Plot Area',
    elevation: lang === 'vi' ? 'Độ Cao & Độ Dốc' : 'Elevation & Slope',
    growthTimeline: lang === 'vi' ? 'Tiến Độ Sinh Trưởng' : 'Growth Timeline',
    advanceStage: lang === 'vi' ? 'Chuyển Giai Đoạn Tiếp' : 'Advance Stage',
    diseaseHistory: lang === 'vi' ? 'Lịch Sử Dịch Bệnh & Cảnh Báo' : 'Disease History & Alerts',
    shippingLogs: lang === 'vi' ? 'Nhật Ký Xuất Kho & Vận Chuyển' : 'Shipping & Export Logs',
    addBatch: lang === 'vi' ? '+ Tạo Lô Xuất Hàng' : '+ New Shipping Batch',
    exportReport: lang === 'vi' ? 'Xuất Hồ Sơ Vùng Trồng (PDF)' : 'Export Dossier (PDF)',
    viewTrace: lang === 'vi' ? 'Tra Cứu Mã QR Công Khai' : 'Public QR Traceability',
    soilHealth: lang === 'vi' ? 'Chỉ Số Đất & Môi Trường' : 'Soil & Environment',
    scanDrone: lang === 'vi' ? 'Quét Vệ Tinh / Drone' : 'Rescan Satellite',
    xaiImage: lang === 'vi' ? 'Xem Ảnh Chẩn Đoán AI (XAI)' : 'View AI XAI Heatmap',
  };

  return (
    <>
      <div 
        id="field-detail-drawer"
        className="fixed inset-y-0 right-0 z-40 w-full sm:w-[480px] lg:w-[520px] bg-stone-950/95 backdrop-blur-2xl border-l border-stone-800 shadow-2xl flex flex-col text-stone-100 animate-in slide-in-from-right duration-300"
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-stone-800 flex items-start justify-between gap-3 bg-stone-900/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">{cropCfg.icon}</span>
              <h3 className="text-base font-bold text-stone-100">{field.name}</h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-400">
              <span className="font-mono bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800/60 font-semibold">
                {field.pucCode}
              </span>
              <span>•</span>
              <span>{field.cropVariety || field.cropType}</span>
            </div>
          </div>

          <button
            id="btn-close-field-drawer"
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Risk & Notification Banner */}
        {field.riskLevel === 'NGUY_CO_CAO' ? (
          <div className="px-4 py-2.5 bg-rose-950/90 border-b border-rose-800/80 flex items-center justify-between text-rose-200 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
              <span><strong>{lang === 'vi' ? 'Cảnh báo dịch hại!' : 'Critical Risk:'}</strong> {field.riskReason || 'High pathogen activity detected.'}</span>
            </div>
            <button 
              onClick={() => setShowXaiModal(true)}
              className="px-2 py-1 bg-rose-800 hover:bg-rose-700 text-white rounded text-[11px] font-semibold whitespace-nowrap ml-2"
            >
              {t.xaiImage}
            </button>
          </div>
        ) : field.riskLevel === 'CANH_BAO_NHE' ? (
          <div className="px-4 py-2 bg-amber-950/80 border-b border-amber-800/80 flex items-center gap-2 text-amber-200 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{field.riskReason || 'Minor disease threshold under monitoring.'}</span>
          </div>
        ) : (
          <div className="px-4 py-1.5 bg-emerald-950/50 border-b border-emerald-800/40 flex items-center gap-2 text-emerald-300 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{lang === 'vi' ? 'Vùng trồng đạt chuẩn an toàn, sinh trưởng tốt.' : 'Good health index, passed quality checks.'}</span>
          </div>
        )}

        {/* Navigation Subtabs */}
        <div className="flex items-center border-b border-stone-800 px-3 bg-stone-900/30 overflow-x-auto no-scrollbar text-xs">
          {[
            { id: 'overview', label: lang === 'vi' ? 'Tổng Quan' : 'Overview' },
            { id: 'timeline', label: lang === 'vi' ? 'Tiến Độ Sinh Trưởng' : 'Growth Timeline' },
            { id: 'disease', label: lang === 'vi' ? 'Dịch Bệnh' : 'Disease Log', badge: field.diseaseHistory.length },
            { id: 'shipping', label: lang === 'vi' ? 'Xuất Kho' : 'Shipping Logs', badge: field.shippingLogs.length },
            { id: 'soil', label: lang === 'vi' ? 'Thổ Nhưỡng' : 'Soil & Sensor' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2.5 font-medium whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-400 font-semibold'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-stone-800 text-stone-300">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Primary Key Metrics Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-2xl bg-stone-900/70 border border-stone-800 flex flex-col">
                  <span className="text-[11px] text-stone-400">{t.area}</span>
                  <span className="text-lg font-bold text-stone-100 mt-1">{field.areaHa} ha</span>
                  <span className="text-[10px] text-stone-500 font-mono">{field.areaM2.toLocaleString()} m²</span>
                </div>

                <div className="p-3 rounded-2xl bg-stone-900/70 border border-stone-800 flex flex-col">
                  <span className="text-[11px] text-stone-400">NDVI Index</span>
                  <span className="text-lg font-bold text-emerald-400 mt-1">{field.ndviScore}</span>
                  <span className="text-[10px] text-emerald-600">
                    {field.ndviScore > 0.8 ? 'Lush Green' : 'Normal Green'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-stone-900/70 border border-stone-800 flex flex-col">
                  <span className="text-[11px] text-stone-400">{lang === 'vi' ? 'Tiêu Chuẩn' : 'Standard'}</span>
                  <span className="text-sm font-bold text-amber-300 mt-1 truncate">{field.certification}</span>
                  <span className="text-[10px] text-stone-500">{field.irrigationType} Irrigation</span>
                </div>
              </div>

              {/* Farmer & Location Info Card */}
              <div className="p-4 rounded-2xl bg-stone-900/50 border border-stone-800/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-700 flex items-center justify-center text-sm font-bold text-emerald-300">
                      {field.farmerName.slice(0, 1)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-200">{field.farmerName}</div>
                      <div className="text-[11px] text-stone-400">{field.htxName}</div>
                    </div>
                  </div>
                  <a
                    href={`tel:${field.farmerPhone}`}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{field.farmerPhone}</span>
                  </a>
                </div>

                <div className="flex items-start gap-2 pt-2 border-t border-stone-800/60 text-xs text-stone-400">
                  <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                  <span>
                    {field.commune}, {field.district}, {field.province} (Elev: {field.elevationAvgM}m, Slope: {field.slopeDegrees}°)
                  </span>
                </div>
              </div>

              {/* QR Code & Public Traceability Seal Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-stone-900 to-stone-900 border border-emerald-900/60 flex items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <QrCode className="w-4 h-4" />
                    <span>{t.pucTitle}</span>
                  </div>
                  <p className="text-xs text-stone-300 font-mono">{field.pucCode}</p>
                  <p className="text-[11px] text-stone-400">
                    {lang === 'vi' ? 'Mã định danh nguồn gốc điện tử đã xác thực.' : 'Official verified digital provenance seal.'}
                  </p>
                  <button
                    onClick={() => onOpenTraceability(field)}
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold pt-1"
                  >
                    <span>{t.viewTrace}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {qrCodeUrl && (
                  <div className="p-2 rounded-xl bg-white shrink-0 shadow-md">
                    <img src={qrCodeUrl} alt="PUC QR Code" className="w-20 h-20" />
                  </div>
                )}
              </div>

              {/* Quick Actions Panel */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  id="btn-export-field-report"
                  onClick={handleExportSingleReport}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-xs font-semibold text-stone-200 transition-all"
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>{t.exportReport}</span>
                </button>

                <button
                  id="btn-trigger-drone-scan"
                  onClick={() => onTriggerScan(field.id)}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-xs font-semibold text-stone-200 transition-all"
                >
                  <RefreshCw className="w-4 h-4 text-sky-400" />
                  <span>{t.scanDrone}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: GROWTH TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-300">{t.growthTimeline}</span>
                  <span className="text-xs font-bold text-emerald-400">
                    {field.growthProgressPercent}% Completed
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${field.growthProgressPercent}%` }}
                  />
                </div>

                {/* Stepper Component */}
                <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-800">
                  {stageSequence.map((stg, idx) => {
                    const isPassed = idx < currentStageIndex;
                    const isCurrent = idx === currentStageIndex;
                    const stgCfg = STAGE_CONFIG[stg];

                    return (
                      <div key={stg} className="relative flex items-start justify-between">
                        {/* Step Marker Icon */}
                        <div 
                          className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                            isCurrent
                              ? 'bg-emerald-500 text-white border-emerald-400 ring-4 ring-emerald-950'
                              : isPassed
                              ? 'bg-emerald-900 text-emerald-300 border-emerald-700'
                              : 'bg-stone-900 text-stone-500 border-stone-800'
                          }`}
                        >
                          {isPassed ? '✓' : idx + 1}
                        </div>

                        <div>
                          <div className={`text-xs font-bold ${isCurrent ? 'text-emerald-300' : isPassed ? 'text-stone-300' : 'text-stone-500'}`}>
                            {lang === 'vi' ? stgCfg.nameVi : stgCfg.name}
                          </div>
                          <div className="text-[11px] text-stone-400 mt-0.5">
                            {isCurrent
                              ? `Currently active (Planting: ${field.plantingDate})`
                              : isPassed
                              ? 'Stage completed'
                              : `Estimated by: ${field.expectedHarvestDate}`}
                          </div>
                        </div>

                        {isCurrent && currentStageIndex < stageSequence.length - 1 && (
                          <button
                            onClick={handleNextStage}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95 flex items-center gap-1"
                          >
                            <span>{t.advanceStage}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DISEASE & RISK LOG */}
          {activeTab === 'disease' && (
            <div className="space-y-3">
              {field.diseaseHistory.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-stone-900/40 border border-stone-800/80 space-y-2">
                  <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-stone-200">
                    {lang === 'vi' ? 'Không phát hiện mầm bệnh' : 'Clean Disease Record'}
                  </p>
                  <p className="text-[11px] text-stone-400">
                    {lang === 'vi' ? 'Thửa đất được kiểm tra định kỳ không có dịch hại lây lan.' : 'Regular multispectral scans indicate healthy crop conditions.'}
                  </p>
                </div>
              ) : (
                field.diseaseHistory.map((dis) => (
                  <div 
                    key={dis.id}
                    className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-bold text-stone-100">{lang === 'vi' ? dis.nameVi : dis.name}</div>
                        <div className="text-[11px] text-stone-400 font-mono mt-0.5">
                          Detected: {dis.detectedDate} • Confidence: <strong className="text-emerald-400">{dis.confidence}%</strong>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        dis.resolved ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {dis.resolved ? 'RESOLVED' : 'ACTIVE THREAT'}
                      </span>
                    </div>

                    <p className="text-xs text-stone-300 bg-stone-950/60 p-2 rounded-xl">
                      <strong>Symptoms:</strong> {dis.symptoms}
                    </p>

                    <div className="text-xs text-emerald-400 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-900/40">
                      <strong>Intervention Protocol:</strong> {dis.treatmentAdvice}
                    </div>

                    <button
                      onClick={() => setShowXaiModal(true)}
                      className="w-full py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-200 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t.xaiImage}</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: SHIPPING LOGS */}
          {activeTab === 'shipping' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-300">{t.shippingLogs}</span>
                <button
                  onClick={() => setShowAddBatchModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.addBatch}</span>
                </button>
              </div>

              {field.shippingLogs.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-stone-900/40 border border-stone-800/80 space-y-2">
                  <Truck className="w-8 h-8 text-stone-600 mx-auto" />
                  <p className="text-xs text-stone-400">
                    {lang === 'vi' ? 'Chưa có lô hàng xuất kho từ thửa đất này.' : 'No shipping batches dispatched yet.'}
                  </p>
                </div>
              ) : (
                field.shippingLogs.map((batch) => (
                  <div
                    key={batch.id}
                    className="p-3.5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-emerald-400 font-bold">{batch.batchCode}</span>
                      <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 text-[10px] font-semibold">
                        {batch.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-300 pt-1">
                      <div>
                        <span className="text-stone-500">Harvest:</span> {batch.harvestDate}
                      </div>
                      <div>
                        <span className="text-stone-500">Quantity:</span> <strong className="text-white">{batch.quantityTons} Tons</strong>
                      </div>
                      <div className="col-span-2">
                        <span className="text-stone-500">Destination:</span> {batch.destination}
                      </div>
                      <div className="col-span-2 text-stone-400 font-mono text-[10px]">
                        Carrier: {batch.carrier} ({batch.trackingNumber})
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 5: SOIL & SENSOR METRICS */}
          {activeTab === 'soil' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
                <span className="text-xs font-bold text-stone-300">{t.soilHealth}</span>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800/80">
                    <span className="text-stone-400 text-[11px]">Soil pH</span>
                    <div className="text-base font-bold text-emerald-400 mt-0.5">{field.soil.ph}</div>
                    <span className="text-[10px] text-stone-500">Optimal (6.0 - 6.8)</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800/80">
                    <span className="text-stone-400 text-[11px]">Soil Moisture</span>
                    <div className="text-base font-bold text-sky-400 mt-0.5">{field.soil.moisturePercent}%</div>
                    <span className="text-[10px] text-stone-500">Field Capacity Saturation</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800/80">
                    <span className="text-stone-400 text-[11px]">Organic Matter</span>
                    <div className="text-base font-bold text-amber-400 mt-0.5">{field.soil.organicMatterPercent}%</div>
                    <span className="text-[10px] text-stone-500">Rich Humus Layer</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800/80">
                    <span className="text-stone-400 text-[11px]">Rootzone Temp</span>
                    <div className="text-base font-bold text-stone-200 mt-0.5">{field.soil.temperatureC}°C</div>
                    <span className="text-[10px] text-stone-500">Optimal for Microbial Activity</span>
                  </div>
                </div>

                {/* N-P-K Nutrients */}
                <div className="pt-2 border-t border-stone-800 space-y-1.5 text-xs">
                  <span className="text-[11px] font-semibold text-stone-400">NPK Macronutrient Balance</span>
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div className="p-2 bg-stone-950 rounded-lg">
                      <span className="text-stone-500 text-[10px]">Nitrogen (N)</span>
                      <div className="font-bold text-emerald-400">{field.soil.nitrogen}</div>
                    </div>
                    <div className="p-2 bg-stone-950 rounded-lg">
                      <span className="text-stone-500 text-[10px]">Phosphorus (P)</span>
                      <div className="font-bold text-amber-400">{field.soil.phosphorus}</div>
                    </div>
                    <div className="p-2 bg-stone-950 rounded-lg">
                      <span className="text-stone-500 text-[10px]">Potassium (K)</span>
                      <div className="font-bold text-sky-400">{field.soil.potassium}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: New Shipping Batch Form */}
      {showAddBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-stone-950 border border-stone-800 rounded-3xl p-6 shadow-2xl text-stone-100 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>{t.addBatch}</span>
              </h3>
              <button 
                onClick={() => setShowAddBatchModal(false)}
                className="text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-400 mb-1">Source Field & PUC</label>
                <div className="p-2 bg-stone-900 rounded-xl font-mono text-emerald-300 font-semibold">
                  {field.name} ({field.pucCode})
                </div>
              </div>

              <div>
                <label className="block text-stone-400 mb-1">Harvest Quantity (Tons)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newBatchData.quantityTons}
                  onChange={(e) => setNewBatchData({ ...newBatchData, quantityTons: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-stone-400 mb-1">Destination Logistics Node</label>
                <input
                  type="text"
                  required
                  value={newBatchData.destination}
                  onChange={(e) => setNewBatchData({ ...newBatchData, destination: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-400 mb-1">Export Standard</label>
                  <select
                    value={newBatchData.standard}
                    onChange={(e) => setNewBatchData({ ...newBatchData, standard: e.target.value as any })}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 focus:outline-none"
                  >
                    <option value="VietGAP">VietGAP</option>
                    <option value="GlobalGAP">GlobalGAP</option>
                    <option value="Organic">Organic</option>
                    <option value="Standard">Standard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-400 mb-1">Carrier</label>
                  <input
                    type="text"
                    value={newBatchData.carrier}
                    onChange={(e) => setNewBatchData({ ...newBatchData, carrier: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowAddBatchModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 hover:bg-stone-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-900/40"
                >
                  Confirm & Dispatch Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: AI XAI Diagnostic Heatmap Overlay Simulator */}
      {showXaiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-stone-950 border border-stone-800 rounded-3xl p-6 shadow-2xl text-stone-100 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Explainable AI (XAI) Deep Learning Diagnostic</span>
              </h3>
              <button onClick={() => setShowXaiModal(false)} className="text-stone-400 hover:text-white">✕</button>
            </div>

            {/* Simulated multispectral / CAM diagnostic view */}
            <div className="relative rounded-2xl overflow-hidden border border-stone-800 aspect-video bg-stone-900 flex items-center justify-center">
              {/* Simulated Leaf & Heatmap */}
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950 via-stone-900 to-amber-950 opacity-90" />
              
              {/* Bounding box on lesion */}
              <div className="absolute top-1/4 left-1/3 w-36 h-28 border-2 border-rose-500 rounded-lg bg-rose-500/20 animate-pulse flex flex-col justify-between p-1.5">
                <span className="text-[10px] font-bold bg-rose-600 text-white px-1.5 py-0.5 rounded w-max">
                  Pathogen: Pyricularia (91.4%)
                </span>
                <span className="text-[9px] font-mono text-rose-200 bg-black/60 px-1 rounded w-max">
                  CAM Weight: 0.94
                </span>
              </div>

              {/* Grid overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:16px_16px]" />

              <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center text-[10px] text-stone-400 bg-black/70 px-3 py-1.5 rounded-xl backdrop-blur-md">
                <span>Model: AgriVision-ResNet101v3</span>
                <span>Resolution: 4K Drone Multispectral</span>
              </div>
            </div>

            <div className="text-xs text-stone-300 space-y-1.5 bg-stone-900/60 p-3.5 rounded-2xl">
              <div className="font-bold text-stone-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>XAI Gradient-Weighted Class Activation Map</span>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                The neural activation focuses sharply on the spindle-shaped necrosis borders on the upper leaf parenchyma, distinguishing from physiological stress with 91.4% confidence.
              </p>
            </div>

            <button
              onClick={() => setShowXaiModal(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
            >
              Close Diagnostic View
            </button>
          </div>
        </div>
      )}
    </>
  );
};
