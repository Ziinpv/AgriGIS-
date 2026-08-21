import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles, 
  Upload, 
  CheckCircle2, 
  MapPin, 
  Filter, 
  Camera, 
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Plus
} from 'lucide-react';
import { FarmField, RiskLevel, DiseaseRecord } from '../../types';
import { CROP_CONFIG } from '../../data/mockData';
import confetti from 'canvas-confetti';

interface DiseaseAlertHubProps {
  fields: FarmField[];
  onSelectField: (field: FarmField) => void;
  onAddDiseaseAlert: (fieldId: string, disease: DiseaseRecord, newRisk: RiskLevel) => void;
  lang: 'en' | 'vi';
}

interface DiagnosticSample {
  id: string;
  name: string;
  nameVi: string;
  crop: string;
  confidence: number;
  risk: RiskLevel;
  symptoms: string;
  remedy: string;
  remedyVi: string;
}

const SAMPLE_DIAGNOSES: DiagnosticSample[] = [
  {
    id: 'samp-1',
    name: 'Rice Leaf Blast (Pyricularia oryzae)',
    nameVi: 'Bệnh Đạo Ôn Lá Lúa (Pyricularia)',
    crop: 'Paddy Rice (ST25)',
    confidence: 94.8,
    risk: 'CANH_BAO_NHE',
    symptoms: 'Spindle-shaped elliptical lesions with grayish centers and dark brown margins on upper leaves.',
    remedy: 'Apply biological Tricyclazole or Pseudomonas fluorescens antagonist. Drain standing water to 3cm.',
    remedyVi: 'Phun chế phẩm sinh học đối kháng Pseudomonas fluorescens; rút bớt nước ruộng xuống mức 3cm.',
  },
  {
    id: 'samp-2',
    name: 'Durian Phytophthora Canker (Phytophthora palmivora)',
    nameVi: 'Nứt Thân Xì Mủ Sầu Riêng (Phytophthora)',
    crop: 'Ri6 Durian',
    confidence: 91.2,
    risk: 'NGUY_CO_CAO',
    symptoms: 'Dark water-soaked trunk lesions oozing amber gum, leading to premature leaf chlorosis and root decay.',
    remedy: 'Scrape diseased bark, apply systemic Phosphonate trunk spray + Trichoderma drench at rootzone.',
    remedyVi: 'Cạo sạch vết bệnh, quét Phosphonate kết hợp tưới gốc nấm đối kháng Trichoderma harzianum.',
  },
  {
    id: 'samp-3',
    name: 'Coffee Berry Borer (Hypothenemus hampei)',
    nameVi: 'Mọt Đục Quả Cà Phê (Hypothenemus hampei)',
    crop: 'Arabica Coffee',
    confidence: 88.5,
    risk: 'CANH_BAO_NHE',
    symptoms: 'Entrance pinholes bored into the apex disc of green and ripening cherries causing yield drop.',
    remedy: 'Install methanol-ethanol kairomone bait traps and release Beauveria bassiana entomopathogenic fungus.',
    remedyVi: 'Treo bẫy dính cồn sinh học và phun nấm ký sinh côn trùng Beauveria bassiana.',
  },
];

export const DiseaseAlertHub: React.FC<DiseaseAlertHubProps> = ({
  fields,
  onSelectField,
  onAddDiseaseAlert,
  lang,
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<RiskLevel | 'ALL'>('ALL');
  const [activeSample, setActiveSample] = useState<DiagnosticSample>(SAMPLE_DIAGNOSES[0]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanCompleted, setScanCompleted] = useState<boolean>(true);
  const [targetFieldId, setTargetFieldId] = useState<string>(fields[0]?.id || '');

  // Extract all fields with alerts
  const alertFields = fields.filter((f) => f.riskLevel !== 'BINH_THUONG');

  const filteredAlertFields = alertFields.filter((f) => {
    return selectedSeverity === 'ALL' || f.riskLevel === selectedSeverity;
  });

  const handleRunAiScan = (sample: DiagnosticSample) => {
    setActiveSample(sample);
    setIsScanning(true);
    setScanCompleted(false);

    setTimeout(() => {
      setIsScanning(false);
      setScanCompleted(true);
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
    }, 900);
  };

  const handleApplyToField = () => {
    if (!targetFieldId) return;

    const newRecord: DiseaseRecord = {
      id: `dis-${Date.now()}`,
      name: activeSample.name,
      nameVi: activeSample.nameVi,
      detectedDate: new Date().toISOString().slice(0, 10),
      riskLevel: activeSample.risk,
      confidence: activeSample.confidence,
      affectedAreaPct: activeSample.risk === 'NGUY_CO_CAO' ? 14.5 : 4.2,
      symptoms: activeSample.symptoms,
      treatmentAdvice: activeSample.remedy,
      resolved: false,
    };

    onAddDiseaseAlert(targetFieldId, newRecord, activeSample.risk);
    confetti({ particleCount: 60, spread: 80, origin: { y: 0.5 } });
    alert(lang === 'vi' ? 'Đã cập nhật cảnh báo dịch bệnh vào thửa đất và đồng bộ bản đồ GIS!' : 'Disease alert applied to selected field and synchronized on GIS map!');
  };

  const t = {
    title: lang === 'vi' ? 'Trung Tâm Giám Sát Dịch Hại & Chẩn Đoán AI' : 'Crop Disease Intelligence & AI Diagnostic Hub',
    subtitle: lang === 'vi' ? 'Cảnh báo thời gian thực và mô hình thị giác máy tính phát hiện sâu bệnh trên ảnh vệ tinh / drone.' : 'Real-time epidemiological risk tracking with explainable deep learning plant pathology inference.',
    activeAlerts: lang === 'vi' ? 'Cảnh Báo Đang Hoạt Động' : 'Active Field Alerts',
    aiScannerTitle: lang === 'vi' ? 'Mô Phỏng Chẩn Đoán Sâu Bệnh Bằng AI (XAI CAM)' : 'AI Multispectral Disease Diagnostic Simulator',
    chooseSample: lang === 'vi' ? 'Chọn mẫu bệnh phẩm chụp thực tế:' : 'Select crop lesion scan sample:',
    runScan: lang === 'vi' ? 'Chạy Phân Tích AI' : 'Run Neural Diagnostic',
    confidenceScore: lang === 'vi' ? 'Độ tin cậy AI' : 'AI Confidence Score',
    protocol: lang === 'vi' ? 'Phác Đồ Xử Lý Sinh Học' : 'Bio-Intervention Protocol',
    applyToMap: lang === 'vi' ? 'Ghi Nhận Vào Thửa Đất Này' : 'Log Alert to Field Plot',
    viewOnMap: lang === 'vi' ? 'Xem vị trí' : 'View on Map',
  };

  return (
    <div id="disease-alert-hub-view" className="space-y-6 text-stone-100 p-4 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <span>{t.title}</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">{t.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-rose-950/80 border border-rose-800 text-xs font-bold text-rose-300 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{alertFields.length} {lang === 'vi' ? 'thửa đất có rủi ro' : 'fields at risk'}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Active Field Alerts, Right = AI Disease Scanner Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Field Alerts */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>{t.activeAlerts}</span>
            </h3>

            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value as any)}
              className="px-2.5 py-1 bg-stone-900 border border-stone-700 rounded-xl text-stone-300 text-xs focus:outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="NGUY_CO_CAO">Critical (🔴 High Risk)</option>
              <option value="CANH_BAO_NHE">Warning (🟡 Moderate)</option>
            </select>
          </div>

          <div className="space-y-3">
            {filteredAlertFields.length === 0 ? (
              <div className="p-8 text-center rounded-3xl bg-stone-900/60 border border-stone-800 space-y-2">
                <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-stone-200">No active disease outbreaks</p>
                <p className="text-xs text-stone-400">All registered agricultural zones are operating within healthy biosecurity thresholds.</p>
              </div>
            ) : (
              filteredAlertFields.map((field) => (
                <div
                  key={field.id}
                  className={`p-4 rounded-3xl bg-stone-900/80 border transition-all space-y-3 ${
                    field.riskLevel === 'NGUY_CO_CAO'
                      ? 'border-rose-800/80 shadow-lg shadow-rose-950/20'
                      : 'border-amber-800/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base">{CROP_CONFIG[field.cropType]?.icon}</span>
                        <h4 className="text-sm font-bold text-stone-100">{field.name}</h4>
                      </div>
                      <div className="text-xs font-mono text-emerald-400 mt-0.5">{field.pucCode}</div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        field.riskLevel === 'NGUY_CO_CAO'
                          ? 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse'
                          : 'bg-amber-950 text-amber-300 border-amber-700'
                      }`}
                    >
                      {field.riskLevel === 'NGUY_CO_CAO' ? 'CRITICAL OUTBREAK' : 'WARNING THRESHOLD'}
                    </span>
                  </div>

                  <p className="text-xs text-rose-200 bg-black/40 p-2.5 rounded-xl border border-stone-800">
                    {field.riskReason || 'Elevated fungal / insect vector activity detected.'}
                  </p>

                  <div className="flex items-center justify-between text-xs text-stone-400 pt-1">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-stone-500" />
                      <span>{field.commune}, {field.province} ({field.areaHa} ha)</span>
                    </div>

                    <button
                      onClick={() => onSelectField(field)}
                      className="px-3 py-1 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-semibold transition-colors flex items-center gap-1"
                    >
                      <span>{t.viewOnMap}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: AI Disease Scanner Simulator */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>{t.aiScannerTitle}</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                v2.4 ResNet Vision
              </span>
            </div>

            {/* Sample Selector Buttons */}
            <div className="space-y-1.5">
              <span className="text-xs text-stone-400 font-medium">{t.chooseSample}</span>
              <div className="grid grid-cols-3 gap-2">
                {SAMPLE_DIAGNOSES.map((samp) => (
                  <button
                    key={samp.id}
                    onClick={() => handleRunAiScan(samp)}
                    className={`p-2.5 rounded-2xl text-left border transition-all text-xs flex flex-col justify-between ${
                      activeSample.id === samp.id
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:bg-stone-900'
                    }`}
                  >
                    <span className="font-bold text-[11px] truncate">{samp.crop}</span>
                    <span className="text-[10px] text-stone-500 truncate mt-1">
                      {lang === 'vi' ? samp.nameVi : samp.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Live Scan Screen */}
            <div className="relative rounded-2xl overflow-hidden border border-stone-800 aspect-video bg-stone-950 flex flex-col justify-between p-3">
              {/* Heatmap background */}
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950 via-stone-900 to-rose-950 opacity-80" />

              {/* Scanning Laser Line */}
              {isScanning && (
                <div className="absolute inset-x-0 h-1 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-bounce z-10" />
              )}

              {/* Bounding box on lesion */}
              <div className="relative z-10 w-44 h-28 border-2 border-emerald-400/80 rounded-xl bg-emerald-500/10 p-2 flex flex-col justify-between">
                <span className="text-[10px] font-bold bg-emerald-900 text-emerald-200 px-1.5 py-0.5 rounded w-max">
                  {activeSample.crop}
                </span>
                <span className="text-[9px] font-mono text-white bg-black/60 px-1.5 py-0.5 rounded w-max">
                  Conf: {activeSample.confidence}%
                </span>
              </div>

              <div className="relative z-10 flex justify-between items-center text-[10px] text-stone-400 bg-black/70 px-3 py-1.5 rounded-xl backdrop-blur-md">
                <span>Model: AgroVision-XAI-DeepLabv3+</span>
                <span>Inference: 14ms (GPU-Accelerated)</span>
              </div>
            </div>

            {/* Diagnostic Details */}
            <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="font-bold text-stone-100 text-sm">
                  {lang === 'vi' ? activeSample.nameVi : activeSample.name}
                </div>
                <div className="font-mono text-emerald-400 font-bold text-xs">
                  {t.confidenceScore}: {activeSample.confidence}%
                </div>
              </div>

              <p className="text-stone-400 text-[11px] leading-relaxed">
                <strong>Symptoms:</strong> {activeSample.symptoms}
              </p>

              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-900/40 text-emerald-300 text-[11px]">
                <strong>{t.protocol}:</strong> {lang === 'vi' ? activeSample.remedyVi : activeSample.remedy}
              </div>
            </div>

            {/* Log to Field Selector */}
            <div className="pt-2 border-t border-stone-800 flex flex-col sm:flex-row items-center gap-2">
              <select
                value={targetFieldId}
                onChange={(e) => setTargetFieldId(e.target.value)}
                className="w-full sm:flex-1 px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs focus:outline-none"
              >
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.pucCode})
                  </option>
                ))}
              </select>

              <button
                onClick={handleApplyToField}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/40 whitespace-nowrap transition-all active:scale-95"
              >
                {t.applyToMap}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
