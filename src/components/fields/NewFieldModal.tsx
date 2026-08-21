import React, { useState } from 'react';
import { X, Sprout, MapPin, QrCode, Check, Sparkles } from 'lucide-react';
import { FarmField, CropType, GeoPoint, GrowthStage } from '../../types';
import { CROP_CONFIG } from '../../data/mockData';
import { generatePucCode, calculatePolygonCentroid } from '../../utils/geoUtils';
import confetti from 'canvas-confetti';

interface NewFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveField: (newField: FarmField) => void;
  drawnVertices: GeoPoint[];
  calculatedAreaM2: number;
  calculatedAreaHa: number;
  lang: 'en' | 'vi';
}

export const NewFieldModal: React.FC<NewFieldModalProps> = ({
  isOpen,
  onClose,
  onSaveField,
  drawnVertices,
  calculatedAreaM2,
  calculatedAreaHa,
  lang,
}) => {
  const [name, setName] = useState<string>('New Agro Plot ' + Math.floor(100 + Math.random() * 900));
  const [cropType, setCropType] = useState<CropType>('RICE');
  const [cropVariety, setCropVariety] = useState<string>('ST25 Organic Rice');
  const [farmerName, setFarmerName] = useState<string>('Nguyễn Văn Hùng');
  const [farmerPhone, setFarmerPhone] = useState<string>('0918 345 789');
  const [htxName, setHtxName] = useState<string>('HTX Nông Nghiệp Hưng Phú');
  const [province, setProvince] = useState<string>('Sóc Trăng');
  const [district, setDistrict] = useState<string>('Mỹ Tú');
  const [commune, setCommune] = useState<string>('Hưng Phú');
  const [certification, setCertification] = useState<'VietGAP' | 'GlobalGAP' | 'Organic' | 'In-Conversion'>('VietGAP');
  const [irrigationType, setIrrigationType] = useState<'DRIP' | 'SPRINKLER' | 'FLOOD' | 'MANUAL'>('FLOOD');
  const [plantingDate, setPlantingDate] = useState<string>(new Date().toISOString().slice(0, 10));
  
  // Compute expected harvest date (90 days from planting)
  const defaultHarvest = new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const [expectedHarvestDate, setExpectedHarvestDate] = useState<string>(defaultHarvest);

  if (!isOpen) return null;

  const generatedPuc = generatePucCode(province === 'Sóc Trăng' ? 'ST' : province === 'Tiền Giang' ? 'TG' : province === 'Lâm Đồng' ? 'LD' : 'AG');
  const centerPoint = drawnVertices.length > 0 ? calculatePolygonCentroid(drawnVertices) : { lat: 10.605, lng: 105.895 };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newField: FarmField = {
      id: `f-${Date.now()}`,
      pucCode: generatedPuc,
      name,
      cropType,
      cropVariety,
      farmerName,
      farmerPhone,
      htxName,
      province,
      district,
      commune,
      areaHa: calculatedAreaHa || 2.5,
      areaM2: calculatedAreaM2 || 25000,
      plantingDate,
      expectedHarvestDate,
      growthStage: 'GIEO_HAT',
      growthProgressPercent: 12,
      riskLevel: 'BINH_THUONG',
      coordinates: drawnVertices.length >= 3 ? drawnVertices : [
        { lat: centerPoint.lat + 0.005, lng: centerPoint.lng - 0.005 },
        { lat: centerPoint.lat + 0.005, lng: centerPoint.lng + 0.005 },
        { lat: centerPoint.lat - 0.005, lng: centerPoint.lng + 0.005 },
        { lat: centerPoint.lat - 0.005, lng: centerPoint.lng - 0.005 },
      ],
      center: centerPoint,
      elevationAvgM: 3.5,
      slopeDegrees: 1.0,
      ndviScore: 0.78,
      irrigationType,
      certification,
      lastScannedAt: new Date().toLocaleString(),
      soil: {
        ph: 6.3,
        nitrogen: 'Medium',
        phosphorus: 'Medium',
        potassium: 'High',
        moisturePercent: 82,
        organicMatterPercent: 4.0,
        temperatureC: 27.8,
      },
      diseaseHistory: [],
      shippingLogs: [],
      notes: 'Newly digitized agricultural parcel registered into national Web GIS portal.',
    };

    onSaveField(newField);
    confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    onClose();
  };

  const t = {
    title: lang === 'vi' ? 'Đăng Ký Thửa Đất Mới & Cấp Mã PUC' : 'Register New Field & Issue PUC Code',
    desc: lang === 'vi' ? 'Thông tin tọa độ ranh giới đã được số hóa trực tiếp từ bản đồ GIS.' : 'Geospatial boundary digitized directly from the interactive GIS canvas.',
    pucCodeLabel: lang === 'vi' ? 'Mã Số Vùng Trồng Tự Động (PUC)' : 'Auto-Generated PUC Code',
    fieldName: lang === 'vi' ? 'Tên Thửa Đất' : 'Field / Plot Name',
    cropType: lang === 'vi' ? 'Loại Cây Trồng' : 'Crop Category',
    cropVariety: lang === 'vi' ? 'Tên Giống Cây' : 'Crop Variety',
    farmer: lang === 'vi' ? 'Chủ Hộ Nông Dân' : 'Farmer Name',
    phone: lang === 'vi' ? 'Số Điện Thoại' : 'Phone Number',
    cooperative: lang === 'vi' ? 'Hợp Tác Xã (HTX)' : 'Cooperative (HTX)',
    location: lang === 'vi' ? 'Địa Điểm Hành Chính' : 'Administrative Location',
    areaLabel: lang === 'vi' ? 'Diện Tích Ranh Giới (Số Hóa)' : 'Digitized Area',
    cert: lang === 'vi' ? 'Tiêu Chuẩn Canh Tác' : 'Certification',
    irrigation: lang === 'vi' ? 'Hệ Thống Tưới' : 'Irrigation Method',
    saveBtn: lang === 'vi' ? 'Xác Nhận & Lưu Vùng Trồng' : 'Save & Register Field',
    cancel: lang === 'vi' ? 'Hủy' : 'Cancel',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl bg-stone-950 border border-stone-800 rounded-3xl p-6 shadow-2xl text-stone-100 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-800 pb-3">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
              <Sprout className="w-5 h-5 text-emerald-400" />
              <span>{t.title}</span>
            </h3>
            <p className="text-xs text-stone-400">{t.desc}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* PUC Code & Digitized Area Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60">
            <div className="space-y-1">
              <span className="text-[11px] text-emerald-300 font-semibold">{t.pucCodeLabel}</span>
              <div className="font-mono text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <QrCode className="w-4 h-4" />
                <span>{generatedPuc}</span>
              </div>
            </div>

            <div className="space-y-1 sm:text-right">
              <span className="text-[11px] text-stone-400">{t.areaLabel}</span>
              <div className="font-mono text-sm font-bold text-stone-100">
                {calculatedAreaHa > 0 ? `${calculatedAreaHa} ha` : '2.50 ha'}
                <span className="text-xs font-normal text-stone-400 ml-1.5">
                  ({calculatedAreaM2 > 0 ? calculatedAreaM2.toLocaleString() : '25,000'} m²)
                </span>
              </div>
            </div>
          </div>

          {/* Field Name & Crop Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-400 mb-1 font-semibold">{t.fieldName}</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-stone-400 mb-1 font-semibold">{t.cropType}</label>
              <select
                value={cropType}
                onChange={(e) => {
                  const newType = e.target.value as CropType;
                  setCropType(newType);
                  setCropVariety(CROP_CONFIG[newType]?.name || newType);
                }}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 focus:outline-none focus:border-emerald-500"
              >
                {Object.entries(CROP_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.icon} {lang === 'vi' ? cfg.nameVi : cfg.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Variety & Certification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-400 mb-1 font-semibold">{t.cropVariety}</label>
              <input
                type="text"
                required
                value={cropVariety}
                onChange={(e) => setCropVariety(e.target.value)}
                placeholder="e.g., ST25, Cat Chu, Arabica Cau Dat"
                className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-stone-400 mb-1 font-semibold">{t.cert}</label>
              <select
                value={certification}
                onChange={(e) => setCertification(e.target.value as any)}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 focus:outline-none"
              >
                <option value="VietGAP">VietGAP</option>
                <option value="GlobalGAP">GlobalGAP</option>
                <option value="Organic">Organic (Hữu cơ)</option>
                <option value="In-Conversion">In-Conversion (Chuyển đổi)</option>
              </select>
            </div>
          </div>

          {/* Farmer & Cooperative Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-stone-400 mb-1 font-semibold">{t.farmer}</label>
              <input
                type="text"
                required
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-stone-400 mb-1 font-semibold">{t.phone}</label>
              <input
                type="text"
                required
                value={farmerPhone}
                onChange={(e) => setFarmerPhone(e.target.value)}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-stone-400 mb-1 font-semibold">{t.cooperative}</label>
              <input
                type="text"
                required
                value={htxName}
                onChange={(e) => setHtxName(e.target.value)}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 focus:outline-none"
              />
            </div>
          </div>

          {/* Location details */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-stone-400 mb-1">Province (Tỉnh)</label>
              <input
                type="text"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-stone-400 mb-1">District (Huyện)</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-stone-400 mb-1">Commune (Xã)</label>
              <input
                type="text"
                value={commune}
                onChange={(e) => setCommune(e.target.value)}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 focus:outline-none"
              />
            </div>
          </div>

          {/* Dates & Irrigation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-stone-400 mb-1">Planting Date</label>
              <input
                type="date"
                value={plantingDate}
                onChange={(e) => setPlantingDate(e.target.value)}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-stone-400 mb-1">Expected Harvest</label>
              <input
                type="date"
                value={expectedHarvestDate}
                onChange={(e) => setExpectedHarvestDate(e.target.value)}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-stone-400 mb-1">{t.irrigation}</label>
              <select
                value={irrigationType}
                onChange={(e) => setIrrigationType(e.target.value as any)}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 focus:outline-none"
              >
                <option value="FLOOD">Flood / Rãnh nước</option>
                <option value="DRIP">Drip / Nhỏ giọt</option>
                <option value="SPRINKLER">Sprinkler / Phun mưa</option>
                <option value="MANUAL">Manual / Thủ công</option>
              </select>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/40 hover:shadow-emerald-900/60 transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{t.saveBtn}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
