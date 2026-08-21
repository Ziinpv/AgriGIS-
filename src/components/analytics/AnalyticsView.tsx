import React from 'react';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  CartesianGrid,
  Legend
} from 'recharts';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  PieChart as PieIcon, 
  BarChart3, 
  Printer,
  Sparkles,
  Layers
} from 'lucide-react';
import { FarmField } from '../../types';
import { CROP_CONFIG } from '../../data/mockData';
import { printExecutiveReport, exportFieldsToCSV } from '../../utils/exportUtils';

interface AnalyticsViewProps {
  fields: FarmField[];
  lang: 'en' | 'vi';
}

const MONTHLY_YIELD_DATA = [
  { month: 'Jan', rice: 24, durian: 12, coffee: 45, tomato: 8 },
  { month: 'Feb', rice: 28, durian: 18, coffee: 52, tomato: 12 },
  { month: 'Mar', rice: 32, durian: 24, coffee: 30, tomato: 15 },
  { month: 'Apr', rice: 40, durian: 35, coffee: 20, tomato: 18 },
  { month: 'May', rice: 45, durian: 50, coffee: 15, tomato: 22 },
  { month: 'Jun', rice: 55, durian: 68, coffee: 18, tomato: 25 },
  { month: 'Jul', rice: 62, durian: 75, coffee: 25, tomato: 20 },
  { month: 'Aug', rice: 70, durian: 82, coffee: 38, tomato: 28 },
];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ fields, lang }) => {
  // Aggregate area by crop type
  const cropData = Object.keys(CROP_CONFIG).map((cropKey) => {
    const cropFields = fields.filter((f) => f.cropType === cropKey);
    const totalArea = cropFields.reduce((sum, f) => sum + f.areaHa, 0);
    const cfg = CROP_CONFIG[cropKey as keyof typeof CROP_CONFIG];
    return {
      name: lang === 'vi' ? cfg.nameVi : cfg.name,
      area: Math.round(totalArea * 10) / 10,
      count: cropFields.length,
      color: cfg.color,
    };
  }).filter((c) => c.area > 0);

  // Risk distribution data
  const riskCounts = {
    BINH_THUONG: fields.filter((f) => f.riskLevel === 'BINH_THUONG').length,
    CANH_BAO_NHE: fields.filter((f) => f.riskLevel === 'CANH_BAO_NHE').length,
    NGUY_CO_CAO: fields.filter((f) => f.riskLevel === 'NGUY_CO_CAO').length,
  };

  const riskData = [
    { name: lang === 'vi' ? 'Bình Thường (An Toàn)' : 'Normal (Safe)', value: riskCounts.BINH_THUONG, color: '#16a34a' },
    { name: lang === 'vi' ? 'Cảnh Báo Nhẹ' : 'Warning Level', value: riskCounts.CANH_BAO_NHE, color: '#eab308' },
    { name: lang === 'vi' ? 'Nguy Cơ Cao (Dịch Hại)' : 'Critical Threat', value: riskCounts.NGUY_CO_CAO, color: '#ef4444' },
  ];

  const handlePrintComprehensiveReport = () => {
    const totalArea = fields.reduce((sum, f) => sum + f.areaHa, 0).toFixed(2);
    const html = `
      <div style="margin-bottom: 25px;">
        <h2>Executive Agricultural Regional Report</h2>
        <p style="color: #64748b;">Comprehensive Land Parcel, Risk & PUC Traceability Audit</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 25px;">
        <div style="padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <strong>Total Registered Plots:</strong><br />${fields.length} Fields
        </div>
        <div style="padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <strong>Managed Area:</strong><br />${totalArea} Hectares
        </div>
        <div style="padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <strong>Safe Plots:</strong><br />${riskCounts.BINH_THUONG} / ${fields.length}
        </div>
        <div style="padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <strong>Critical Disease Outbreaks:</strong><br />${riskCounts.NGUY_CO_CAO} Plots
        </div>
      </div>

      <h3>Full Land Parcel Register</h3>
      <table>
        <thead>
          <tr>
            <th>PUC Code</th>
            <th>Field Name</th>
            <th>Crop & Variety</th>
            <th>Farmer</th>
            <th>Area (ha)</th>
            <th>NDVI</th>
            <th>Risk Status</th>
          </tr>
        </thead>
        <tbody>
          ${fields.map(f => `
            <tr>
              <td><code>${f.pucCode}</code></td>
              <td><strong>${f.name}</strong></td>
              <td>${f.cropVariety || f.cropType}</td>
              <td>${f.farmerName}</td>
              <td>${f.areaHa} ha</td>
              <td>${f.ndviScore}</td>
              <td><span class="badge ${f.riskLevel === 'BINH_THUONG' ? 'badge-green' : f.riskLevel === 'CANH_BAO_NHE' ? 'badge-yellow' : 'badge-red'}">${f.riskLevel}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    printExecutiveReport('AgriGIS_Regional_Audit_Report', html);
  };

  const t = {
    title: lang === 'vi' ? 'Thống Kê & Báo Cáo Phân Tích Nông Nghiệp' : 'Agricultural Analytics & Regional Statistics',
    subtitle: lang === 'vi' ? 'Tổng hợp diện tích cơ cấu cây trồng, phân bổ rủi ro dịch hại và xu hướng sản lượng.' : 'Aggregated spatial crop distribution, biosecurity risk balance, and harvest volume trends.',
    cropShare: lang === 'vi' ? 'Cơ Cấu Diện Tích Cây Trồng (ha)' : 'Crop Area Distribution (Hectares)',
    riskBreakdown: lang === 'vi' ? 'Tỷ Lệ An Toàn Dịch Bệnh Vùng Trồng' : 'Biosecurity & Risk Distribution',
    yieldTrends: lang === 'vi' ? 'Xu Hướng Sản Lượng Thu Hoạch (Tấn/Tháng)' : 'Monthly Harvest Yield Trends (Tons)',
    exportReport: lang === 'vi' ? 'In Báo Cáo Tổng Hợp (PDF)' : 'Print Regional Dossier',
  };

  return (
    <div id="analytics-reporting-view" className="space-y-6 text-stone-100 p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span>{t.title}</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">{t.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintComprehensiveReport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/40 transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>{t.exportReport}</span>
          </button>
        </div>
      </div>

      {/* Chart Grid: Row 1 = Crop Area (Donut) & Risk Balance (Donut/Bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Crop Area Distribution */}
        <div className="lg:col-span-6 p-5 rounded-3xl bg-stone-900/80 border border-stone-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-200 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-400" />
              <span>{t.cropShare}</span>
            </h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cropData}
                  dataKey="area"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {cropData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0c0a09',
                    borderColor: '#292524',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Breakdown */}
        <div className="lg:col-span-6 p-5 rounded-3xl bg-stone-900/80 border border-stone-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-200 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span>{t.riskBreakdown}</span>
            </h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                <XAxis type="number" stroke="#78716c" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#78716c" fontSize={11} width={130} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0c0a09',
                    borderColor: '#292524',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {riskData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Monthly Yield Trends Area Chart */}
      <div className="p-5 rounded-3xl bg-stone-900/80 border border-stone-800 space-y-4">
        <h3 className="text-sm font-bold text-stone-200 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-sky-400" />
          <span>{t.yieldTrends}</span>
        </h3>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MONTHLY_YIELD_DATA}>
              <defs>
                <linearGradient id="colorRice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorDurian" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#65a30d" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#65a30d" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorCoffee" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#854d0e" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#854d0e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
              <XAxis dataKey="month" stroke="#78716c" fontSize={11} />
              <YAxis stroke="#78716c" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0c0a09',
                  borderColor: '#292524',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Area type="monotone" dataKey="rice" name="Rice (Lúa)" stroke="#16a34a" fillOpacity={1} fill="url(#colorRice)" />
              <Area type="monotone" dataKey="durian" name="Durian (Sầu Riêng)" stroke="#65a30d" fillOpacity={1} fill="url(#colorDurian)" />
              <Area type="monotone" dataKey="coffee" name="Coffee (Cà Phê)" stroke="#854d0e" fillOpacity={1} fill="url(#colorCoffee)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
