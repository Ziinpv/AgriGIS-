import React from 'react';
import { 
  Sprout, 
  Map, 
  ShieldAlert, 
  Truck, 
  CheckCircle2, 
  TrendingUp, 
  Layers,
  Sparkles
} from 'lucide-react';
import { FarmField, RiskLevel } from '../../types';

interface StatCardsProps {
  fields: FarmField[];
  onFilterRisk?: (risk: RiskLevel | 'ALL') => void;
  lang: 'en' | 'vi';
  compact?: boolean;
}

export const StatCards: React.FC<StatCardsProps> = ({ fields, onFilterRisk, lang, compact = false }) => {
  const totalAreaHa = Math.round(fields.reduce((sum, f) => sum + f.areaHa, 0) * 100) / 100;
  const normalCount = fields.filter((f) => f.riskLevel === 'BINH_THUONG').length;
  const warningCount = fields.filter((f) => f.riskLevel === 'CANH_BAO_NHE').length;
  const criticalCount = fields.filter((f) => f.riskLevel === 'NGUY_CO_CAO').length;

  const totalDispatchedTons = fields.reduce((acc, f) => {
    return acc + f.shippingLogs.reduce((bSum, b) => bSum + b.quantityTons, 0);
  }, 0);

  const uniqueCropsCount = new Set(fields.map((f) => f.cropType)).size;

  const t = {
    totalFields: lang === 'vi' ? 'Tổng Thửa Đất' : 'Registered Plots',
    managedArea: lang === 'vi' ? 'Tổng Diện Tích Canh Tác' : 'Managed Farm Area',
    riskStatus: lang === 'vi' ? 'Phân Bổ Nguy Cơ' : 'Disease Risk Status',
    safeZone: lang === 'vi' ? 'An Toàn' : 'Safe',
    warningZone: lang === 'vi' ? 'Cảnh Báo' : 'Warning',
    criticalZone: lang === 'vi' ? 'Nguy Cơ Cao' : 'Critical',
    shippingYield: lang === 'vi' ? 'Sản Lượng Xuất' : 'Dispatched Output',
    cropTypes: lang === 'vi' ? 'Chủng Loại Cây Trồng' : 'Crop Diversity',
  };

  if (compact) {
    return (
      <div id="agro-dashboard-stat-cards-compact" className="flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* 1. Total Fields */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-900/90 border border-stone-800 backdrop-blur-md">
          <div className="p-1 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/40">
            <Map className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400 font-medium">{t.totalFields}:</span>
            <span className="font-bold text-white text-sm">{fields.length}</span>
            <span className="text-[10px] text-emerald-400 font-medium hidden sm:inline">(100% PUC)</span>
          </div>
        </div>

        {/* 2. Total Area */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-900/90 border border-stone-800 backdrop-blur-md">
          <div className="p-1 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/40">
            <Sprout className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400 font-medium">{t.managedArea}:</span>
            <span className="font-bold text-white text-sm">{totalAreaHa} ha</span>
            <span className="text-[10px] text-stone-400 hidden md:inline">({uniqueCropsCount} cây trồng)</span>
          </div>
        </div>

        {/* 3. Risk Level Pills */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-stone-900/90 border border-stone-800 backdrop-blur-md">
          <span className="text-stone-400 text-[11px] font-medium px-1 hidden lg:inline">{t.riskStatus}:</span>
          <button
            onClick={() => onFilterRisk?.('BINH_THUONG')}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800/50 hover:bg-emerald-900 text-[11px] transition-colors"
            title="Lọc vùng an toàn"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-bold text-emerald-400">{normalCount}</span>
            <span className="text-emerald-300/80 text-[10px] hidden sm:inline">{t.safeZone}</span>
          </button>

          <button
            onClick={() => onFilterRisk?.('CANH_BAO_NHE')}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-950/80 border border-amber-800/50 hover:bg-amber-900 text-[11px] transition-colors"
            title="Lọc cảnh báo nhẹ"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="font-bold text-amber-400">{warningCount}</span>
            <span className="text-amber-300/80 text-[10px] hidden sm:inline">{t.warningZone}</span>
          </button>

          <button
            onClick={() => onFilterRisk?.('NGUY_CO_CAO')}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-950/80 border border-rose-800/50 hover:bg-rose-900 text-[11px] transition-colors"
            title="Lọc nguy cơ cao"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-bold text-rose-400">{criticalCount}</span>
            <span className="text-rose-300/80 text-[10px] hidden sm:inline">{t.criticalZone}</span>
          </button>
        </div>

        {/* 4. Dispatched Yield */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-900/90 border border-stone-800 backdrop-blur-md">
          <div className="p-1 rounded-lg bg-sky-950 text-sky-400 border border-sky-800/40">
            <Truck className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400 font-medium">{t.shippingYield}:</span>
            <span className="font-bold text-white text-sm">{totalDispatchedTons.toFixed(1)} Tấn</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="agro-dashboard-stat-cards" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Total Fields */}
      <div className="p-4 rounded-3xl bg-stone-900/80 border border-stone-800 backdrop-blur-xl shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-400">{t.totalFields}</span>
          <div className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
            <Map className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-extrabold text-white tracking-tight">{fields.length}</div>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
            <CheckCircle2 className="w-3 h-3" />
            100% Digitized PUC
          </span>
        </div>
      </div>

      {/* 2. Total Area (ha) */}
      <div className="p-4 rounded-3xl bg-stone-900/80 border border-stone-800 backdrop-blur-xl shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-400">{t.managedArea}</span>
          <div className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
            <Sprout className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-extrabold text-white tracking-tight">{totalAreaHa} <span className="text-sm font-normal text-stone-400">ha</span></div>
          <span className="text-[11px] text-stone-400">
            {uniqueCropsCount} {t.cropTypes}
          </span>
        </div>
      </div>

      {/* 3. Risk Level Breakdown Pills */}
      <div className="p-4 rounded-3xl bg-stone-900/80 border border-stone-800 backdrop-blur-xl shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-400">{t.riskStatus}</span>
          <div className="p-2 rounded-xl bg-rose-950/80 text-rose-400 border border-rose-800/50">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5">
          <button
            onClick={() => onFilterRisk?.('BINH_THUONG')}
            className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-950/80 border border-emerald-800/60 hover:bg-emerald-900 text-center transition-colors"
          >
            <span className="text-xs font-bold text-emerald-400 block">{normalCount}</span>
            <span className="text-[9px] text-emerald-300/80">{t.safeZone}</span>
          </button>

          <button
            onClick={() => onFilterRisk?.('CANH_BAO_NHE')}
            className="flex-1 py-1.5 px-2 rounded-xl bg-amber-950/80 border border-amber-800/60 hover:bg-amber-900 text-center transition-colors"
          >
            <span className="text-xs font-bold text-amber-400 block">{warningCount}</span>
            <span className="text-[9px] text-amber-300/80">{t.warningZone}</span>
          </button>

          <button
            onClick={() => onFilterRisk?.('NGUY_CO_CAO')}
            className="flex-1 py-1.5 px-2 rounded-xl bg-rose-950/80 border border-rose-800/60 hover:bg-rose-900 text-center transition-colors animate-pulse"
          >
            <span className="text-xs font-bold text-rose-400 block">{criticalCount}</span>
            <span className="text-[9px] text-rose-300/80">{t.criticalZone}</span>
          </button>
        </div>
      </div>

      {/* 4. Shipping & Export Yield */}
      <div className="p-4 rounded-3xl bg-stone-900/80 border border-stone-800 backdrop-blur-xl shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-400">{t.shippingYield}</span>
          <div className="p-2 rounded-xl bg-sky-950/80 text-sky-400 border border-sky-800/50">
            <Truck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-extrabold text-white tracking-tight">
            {totalDispatchedTons.toFixed(1)} <span className="text-sm font-normal text-stone-400">Tons</span>
          </div>
          <span className="text-[11px] text-sky-400 flex items-center gap-1 mt-0.5">
            <TrendingUp className="w-3 h-3" />
            Export to Japan, EU, China
          </span>
        </div>
      </div>
    </div>
  );
};
