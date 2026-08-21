import React, { useState } from 'react';
import { 
  Truck, 
  Search, 
  FileSpreadsheet, 
  Plus, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Filter, 
  QrCode,
  Download,
  Calendar
} from 'lucide-react';
import { FarmField, ShippingBatch } from '../../types';
import { exportShippingLogsToCSV } from '../../utils/exportUtils';
import { CROP_CONFIG } from '../../data/mockData';

interface ShippingLogViewProps {
  fields: FarmField[];
  onOpenTraceability: (field: FarmField, batch?: ShippingBatch) => void;
  lang: 'en' | 'vi';
}

export const ShippingLogView: React.FC<ShippingLogViewProps> = ({
  fields,
  onOpenTraceability,
  lang,
}) => {
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Flatten all shipping logs with their corresponding parent field
  const allLogs = fields.flatMap((field) =>
    field.shippingLogs.map((batch) => ({
      field,
      batch,
    }))
  );

  const filteredLogs = allLogs.filter(({ field, batch }) => {
    const matchesSearch =
      !search ||
      batch.batchCode.toLowerCase().includes(search.toLowerCase()) ||
      batch.destination.toLowerCase().includes(search.toLowerCase()) ||
      field.name.toLowerCase().includes(search.toLowerCase()) ||
      field.pucCode.toLowerCase().includes(search.toLowerCase()) ||
      batch.carrier.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || batch.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalDispatched = filteredLogs.reduce((sum, item) => sum + item.batch.quantityTons, 0);

  const t = {
    title: lang === 'vi' ? 'Nhật Ký Xuất Kho & Chuỗi Cung Ứng Nông Sản' : 'Agri Shipping Logs & Supply Chain Traceability',
    subtitle: lang === 'vi' ? 'Quản lý các lô hàng xuất khẩu và nội địa, gắn liền với mã số vùng trồng PUC để truy xuất nguồn gốc minh bạch.' : 'End-to-end provenance logs linking dispatched agricultural batches with original GIS digitized plots.',
    exportCsv: lang === 'vi' ? 'Xuất Báo Cáo Vận Chuyển' : 'Export Shipping Report',
    searchPlaceholder: lang === 'vi' ? 'Tìm theo mã lô hàng, điểm đến, PUC, đơn vị vận chuyển...' : 'Search batch code, destination, PUC...',
    allStatus: lang === 'vi' ? 'Tất cả trạng thái' : 'All Statuses',
    totalShipped: lang === 'vi' ? 'Tổng Sản Lượng Đã Giao' : 'Total Dispatched Volume',
    viewQr: lang === 'vi' ? 'Mã QR Truy Xuất' : 'Trace QR',
  };

  return (
    <div id="shipping-log-traceability-view" className="space-y-4 text-stone-100 p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-100 flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-400" />
            <span>{t.title}</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">{t.subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-xs font-mono text-emerald-300 font-bold">
            {t.totalShipped}: {totalDispatched.toFixed(1)} Tons
          </div>

          <button
            onClick={() => exportShippingLogsToCSV(filteredLogs)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 text-xs font-semibold shadow transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>{t.exportCsv}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 rounded-2xl bg-stone-900/80 border border-stone-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-950 rounded-xl border border-stone-800 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-stone-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="bg-transparent text-xs text-stone-200 placeholder-stone-500 focus:outline-none w-full"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-300 text-xs focus:outline-none cursor-pointer"
        >
          <option value="ALL">{t.allStatus}</option>
          <option value="PREPARING">Preparing</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="CUSTOMS_CLEARED">Customs Cleared</option>
          <option value="DELIVERED">Delivered</option>
        </select>
      </div>

      {/* Shipping Batches Table */}
      <div className="rounded-2xl border border-stone-800 bg-stone-900/60 overflow-x-auto">
        <table className="w-full text-left text-xs text-stone-300">
          <thead className="bg-stone-950/80 text-[11px] text-stone-400 uppercase border-b border-stone-800">
            <tr>
              <th className="py-3 px-4">Batch Code & Origin PUC</th>
              <th className="py-3 px-4">Commodity / Crop</th>
              <th className="py-3 px-4">Quantity</th>
              <th className="py-3 px-4">Harvest & Ship Date</th>
              <th className="py-3 px-4">Destination</th>
              <th className="py-3 px-4">Carrier & Tracking</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Traceability</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800/60">
            {filteredLogs.map(({ field, batch }) => (
              <tr key={batch.id} className="hover:bg-stone-800/40 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-mono font-bold text-emerald-400">{batch.batchCode}</div>
                  <div className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-stone-500" />
                    <span>{field.name} ({field.pucCode})</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="font-medium text-stone-200">
                    {CROP_CONFIG[field.cropType]?.icon} {field.cropVariety || field.cropType}
                  </span>
                  <div className="text-[10px] text-amber-400 font-semibold">{batch.standard}</div>
                </td>
                <td className="py-3 px-4 font-mono font-bold text-white text-sm">
                  {batch.quantityTons} Tons
                </td>
                <td className="py-3 px-4">
                  <div>Harvest: {batch.harvestDate}</div>
                  <div className="text-[10px] text-stone-500">Shipped: {batch.shipDate}</div>
                </td>
                <td className="py-3 px-4 font-medium text-stone-200 max-w-[200px] truncate">
                  {batch.destination}
                </td>
                <td className="py-3 px-4">
                  <div>{batch.carrier}</div>
                  <div className="font-mono text-[10px] text-stone-500">{batch.trackingNumber}</div>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      batch.status === 'DELIVERED'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : batch.status === 'IN_TRANSIT'
                        ? 'bg-sky-950 text-sky-300 border-sky-800'
                        : 'bg-amber-950 text-amber-300 border-amber-800'
                    }`}
                  >
                    {batch.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => onOpenTraceability(field, batch)}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs font-semibold transition-colors inline-flex items-center gap-1"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{t.viewQr}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
