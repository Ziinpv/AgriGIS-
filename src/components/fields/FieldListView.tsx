import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Plus, 
  MapPin, 
  QrCode, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle,
  ArrowUpDown,
  LayoutGrid,
  List as ListIcon,
  ChevronRight,
  Download
} from 'lucide-react';
import { FarmField, CropType, RiskLevel, GrowthStage } from '../../types';
import { CROP_CONFIG, STAGE_CONFIG } from '../../data/mockData';
import { exportFieldsToCSV } from '../../utils/exportUtils';

interface FieldListViewProps {
  fields: FarmField[];
  onSelectField: (field: FarmField) => void;
  onOpenNewFieldModal: () => void;
  onOpenTraceability: (field: FarmField) => void;
  onViewOnMap: (field: FarmField) => void;
  lang: 'en' | 'vi';
}

export const FieldListView: React.FC<FieldListViewProps> = ({
  fields,
  onSelectField,
  onOpenNewFieldModal,
  onOpenTraceability,
  onViewOnMap,
  lang,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState<string>('');
  const [cropFilter, setCropFilter] = useState<CropType | 'ALL'>('ALL');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'ALL'>('ALL');
  const [stageFilter, setStageFilter] = useState<GrowthStage | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'area' | 'risk' | 'plantingDate'>('area');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const filteredFields = useMemo(() => {
    return fields
      .filter((f) => {
        const matchesSearch =
          !search ||
          f.name.toLowerCase().includes(search.toLowerCase()) ||
          f.pucCode.toLowerCase().includes(search.toLowerCase()) ||
          f.farmerName.toLowerCase().includes(search.toLowerCase()) ||
          f.cropVariety.toLowerCase().includes(search.toLowerCase()) ||
          f.province.toLowerCase().includes(search.toLowerCase());

        const matchesCrop = cropFilter === 'ALL' || f.cropType === cropFilter;
        const matchesRisk = riskFilter === 'ALL' || f.riskLevel === riskFilter;
        const matchesStage = stageFilter === 'ALL' || f.growthStage === stageFilter;

        return matchesSearch && matchesCrop && matchesRisk && matchesStage;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'name') diff = a.name.localeCompare(b.name);
        else if (sortBy === 'area') diff = a.areaHa - b.areaHa;
        else if (sortBy === 'plantingDate') diff = a.plantingDate.localeCompare(b.plantingDate);
        else if (sortBy === 'risk') {
          const riskRank = { BINH_THUONG: 1, CANH_BAO_NHE: 2, NGUY_CO_CAO: 3 };
          diff = riskRank[a.riskLevel] - riskRank[b.riskLevel];
        }
        return sortAsc ? diff : -diff;
      });
  }, [fields, search, cropFilter, riskFilter, stageFilter, sortBy, sortAsc]);

  const t = {
    title: lang === 'vi' ? 'Quản Lý Thửa Đất Canh Tác' : 'Field & Crop Registry',
    subtitle: lang === 'vi' ? 'Danh mục toàn bộ các thửa đất đã đăng ký mã số vùng trồng (PUC) và số hóa ranh giới.' : 'Comprehensive database of registered farm plots with verified geospatial boundaries.',
    addField: lang === 'vi' ? '+ Thêm Thửa Đất Mới' : '+ Add New Field',
    exportCsv: lang === 'vi' ? 'Xuất File Excel/CSV' : 'Export CSV',
    searchPlaceholder: lang === 'vi' ? 'Tìm theo tên thửa, mã PUC, nông dân, tỉnh...' : 'Search by field name, PUC code, farmer...',
    allCrops: lang === 'vi' ? 'Tất cả loại cây' : 'All Crop Types',
    allRisks: lang === 'vi' ? 'Tất cả rủi ro' : 'All Risk Levels',
    allStages: lang === 'vi' ? 'Tất cả giai đoạn' : 'All Growth Stages',
    viewMap: lang === 'vi' ? 'Xem Trên Bản Đồ' : 'Locate on Map',
    details: lang === 'vi' ? 'Chi Tiết Thửa' : 'View Dossier',
  };

  return (
    <div id="field-list-management-view" className="space-y-4 text-stone-100 p-4 max-w-7xl mx-auto">
      {/* Header & Primary Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-100">{t.title}</h2>
          <p className="text-xs text-stone-400 mt-0.5">{t.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportFieldsToCSV(filteredFields)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700/80 text-stone-200 text-xs font-semibold shadow transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>{t.exportCsv}</span>
          </button>

          <button
            onClick={onOpenNewFieldModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/40 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addField}</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Strip */}
      <div className="p-3 rounded-2xl bg-stone-900/80 border border-stone-800 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-950 rounded-xl border border-stone-800 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-stone-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="bg-transparent text-xs text-stone-200 placeholder-stone-500 focus:outline-none w-full"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-stone-500 hover:text-stone-300 text-xs">
              ✕
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-300 focus:outline-none cursor-pointer"
          >
            <option value="ALL">{t.allCrops}</option>
            {Object.entries(CROP_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>
                {v.icon} {lang === 'vi' ? v.nameVi : v.name}
              </option>
            ))}
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-300 focus:outline-none cursor-pointer"
          >
            <option value="ALL">{t.allRisks}</option>
            <option value="BINH_THUONG">🟢 Normal (Bình Thường)</option>
            <option value="CANH_BAO_NHE">🟡 Warning (Cảnh Báo)</option>
            <option value="NGUY_CO_CAO">🔴 Critical (Nguy Cơ Cao)</option>
          </select>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-300 focus:outline-none cursor-pointer"
          >
            <option value="ALL">{t.allStages}</option>
            {Object.entries(STAGE_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>
                {lang === 'vi' ? v.nameVi : v.name}
              </option>
            ))}
          </select>

          {/* View Toggle */}
          <div className="flex items-center p-0.5 rounded-xl bg-stone-950 border border-stone-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-stone-800 text-emerald-400' : 'text-stone-500'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg ${viewMode === 'table' ? 'bg-stone-800 text-emerald-400' : 'text-stone-500'}`}
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFields.map((field) => {
            const cropCfg = CROP_CONFIG[field.cropType] || { name: field.cropType, icon: '🌾' };
            const stageCfg = STAGE_CONFIG[field.growthStage] || { name: field.growthStage, nameVi: field.growthStage };

            return (
              <div
                key={field.id}
                className={`p-4 rounded-3xl bg-stone-900/80 border transition-all hover:border-emerald-500/70 hover:shadow-xl flex flex-col justify-between space-y-3 ${
                  field.riskLevel === 'NGUY_CO_CAO'
                    ? 'border-rose-900/60 shadow-rose-950/20'
                    : 'border-stone-800'
                }`}
              >
                <div>
                  {/* Top Bar: Icon, Crop, Risk Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{cropCfg.icon}</span>
                      <div>
                        <h4 className="text-sm font-bold text-stone-100 leading-snug">{field.name}</h4>
                        <span className="text-[11px] text-stone-400">{field.cropVariety || field.cropType}</span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        field.riskLevel === 'NGUY_CO_CAO'
                          ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
                          : field.riskLevel === 'CANH_BAO_NHE'
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      }`}
                    >
                      {field.riskLevel === 'NGUY_CO_CAO' ? 'CRITICAL' : field.riskLevel === 'CANH_BAO_NHE' ? 'WARNING' : 'NORMAL'}
                    </span>
                  </div>

                  {/* PUC code & Location */}
                  <div className="mt-2.5 p-2 rounded-xl bg-stone-950/80 border border-stone-800/80 flex items-center justify-between text-xs font-mono">
                    <span className="text-emerald-400 font-semibold">{field.pucCode}</span>
                    <span className="text-stone-400 font-sans text-[11px]">{field.province}</span>
                  </div>

                  {/* Key Stats Row */}
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div className="p-2 rounded-xl bg-stone-950/40">
                      <span className="text-[10px] text-stone-500 block">Area</span>
                      <span className="text-xs font-bold text-white">{field.areaHa} ha</span>
                    </div>
                    <div className="p-2 rounded-xl bg-stone-950/40">
                      <span className="text-[10px] text-stone-500 block">NDVI</span>
                      <span className="text-xs font-bold text-emerald-400">{field.ndviScore}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-stone-950/40">
                      <span className="text-[10px] text-stone-500 block">Standard</span>
                      <span className="text-xs font-bold text-amber-300 truncate block">{field.certification}</span>
                    </div>
                  </div>

                  {/* Growth Stage Progress */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-stone-400">{lang === 'vi' ? stageCfg.nameVi : stageCfg.name}</span>
                      <span className="text-emerald-400 font-semibold">{field.growthProgressPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-stone-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${field.growthProgressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-stone-800/80">
                  <button
                    onClick={() => onViewOnMap(field)}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <MapPin className="w-3.5 h-3.5 text-sky-400" />
                    <span>{t.viewMap}</span>
                  </button>

                  <button
                    onClick={() => onSelectField(field)}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-800/80 text-emerald-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <span>{t.details}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl border border-stone-800 bg-stone-900/60 overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="bg-stone-950/80 text-[11px] text-stone-400 uppercase border-b border-stone-800">
              <tr>
                <th className="py-3 px-4">PUC Code / Name</th>
                <th className="py-3 px-4">Crop & Variety</th>
                <th className="py-3 px-4">Farmer / HTX</th>
                <th className="py-3 px-4">Area (ha)</th>
                <th className="py-3 px-4">Growth Stage</th>
                <th className="py-3 px-4">Risk Status</th>
                <th className="py-3 px-4">Certification</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60">
              {filteredFields.map((f) => (
                <tr key={f.id} className="hover:bg-stone-800/40 transition-colors">
                  <td className="py-3 px-4 font-medium text-white">
                    <div className="font-mono text-emerald-400">{f.pucCode}</div>
                    <div className="text-[11px] text-stone-300">{f.name}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span>{CROP_CONFIG[f.cropType]?.icon} {f.cropVariety || f.cropType}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div>{f.farmerName}</div>
                    <div className="text-[10px] text-stone-500">{f.htxName}</div>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-stone-200">
                    {f.areaHa} ha
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-300 text-[10px]">
                      {STAGE_CONFIG[f.growthStage]?.nameVi || f.growthStage}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      f.riskLevel === 'NGUY_CO_CAO' ? 'bg-rose-950 text-rose-300' : f.riskLevel === 'CANH_BAO_NHE' ? 'bg-amber-950 text-amber-300' : 'bg-emerald-950 text-emerald-300'
                    }`}>
                      {f.riskLevel}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-amber-300 font-semibold">{f.certification}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onSelectField(f)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 text-xs font-semibold"
                    >
                      {t.details}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
