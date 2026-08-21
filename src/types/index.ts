export type RiskLevel = 'BINH_THUONG' | 'CANH_BAO_NHE' | 'NGUY_CO_CAO';

export type GrowthStage = 'GIEO_HAT' | 'PHAT_TRIEN' | 'RA_HOA' | 'THU_HOACH' | 'NGHI_CANH';

export type CropType = 
  | 'RICE' 
  | 'CORN' 
  | 'DRAGON_FRUIT' 
  | 'DURIAN' 
  | 'COFFEE' 
  | 'PEPPER' 
  | 'MANGO' 
  | 'TOMATO' 
  | 'TEA';

export type UserRole = 'FARMER' | 'COOPERATIVE_HTX' | 'GOV_OFFICER';

export type BaseMapLayer = 'satellite' | 'terrain' | 'street' | 'hybrid' | '3d';

export type AgroOverlay = 'none' | 'ndvi' | 'moisture' | 'risk_heat' | 'cadastral';

export interface GeoPoint {
  lat: number;
  lng: number;
  elevation?: number; // meters
}

export interface DiseaseRecord {
  id: string;
  name: string;
  nameVi: string;
  detectedDate: string;
  riskLevel: RiskLevel;
  confidence: number; // 0-100
  affectedAreaPct: number; // % of field
  symptoms: string;
  treatmentAdvice: string;
  imageUrl?: string;
  xaiHeatmapUrl?: string;
  resolved: boolean;
}

export interface ShippingBatch {
  id: string;
  batchCode: string;
  harvestDate: string;
  shipDate: string;
  quantityTons: number;
  destination: string;
  destinationCountry?: string;
  status: 'PREPARING' | 'IN_TRANSIT' | 'CUSTOMS_CLEARED' | 'DELIVERED';
  qrBatchUrl?: string;
  standard: 'VietGAP' | 'GlobalGAP' | 'Organic' | 'Standard';
  carrier: string;
  trackingNumber: string;
}

export interface SoilMetrics {
  ph: number;
  nitrogen: string; // High, Medium, Low
  phosphorus: string;
  potassium: string;
  moisturePercent: number;
  organicMatterPercent: number;
  temperatureC: number;
}

export interface FarmField {
  id: string;
  pucCode: string; // E.g., VN-ST-2026-000123
  name: string;
  farmerName: string;
  farmerPhone: string;
  htxName: string; // Cooperative name
  commune: string;
  district: string;
  province: string;
  cropType: CropType;
  cropVariety: string; // e.g. "ST25", "Cat Chu", "Arabica Cau Dat"
  plantingDate: string;
  expectedHarvestDate: string;
  growthStage: GrowthStage;
  growthProgressPercent: number; // 0-100
  riskLevel: RiskLevel;
  riskReason?: string;
  areaHa: number;
  areaM2: number;
  coordinates: GeoPoint[]; // Polygon boundary vertices
  center: GeoPoint;
  elevationAvgM: number;
  slopeDegrees: number;
  soil: SoilMetrics;
  ndviScore: number; // Normalized Difference Vegetation Index (0.1 to 0.95)
  irrigationType: 'DRIP' | 'SPRINKLER' | 'FLOOD' | 'MANUAL';
  certification: 'VietGAP' | 'GlobalGAP' | 'Organic' | 'In-Conversion';
  diseaseHistory: DiseaseRecord[];
  shippingLogs: ShippingBatch[];
  notes?: string;
  lastScannedAt: string;
  color?: string;
}

export interface WeatherData {
  tempC: number;
  feelsLikeC: number;
  humidityPercent: number;
  windSpeedKmh: number;
  windDirection: string;
  precipitationMm: number;
  pressureHpa: number;
  uvIndex: number;
  condition: 'Sunny' | 'Partly Cloudy' | 'Scattered Showers' | 'Rainy' | 'Thunderstorm' | 'Clear Night';
  conditionVi: string;
  agroAdvisory: string;
  agroAdvisoryVi: string;
  forecast: {
    day: string;
    dayVi: string;
    tempHighC: number;
    tempLowC: number;
    rainChancePct: number;
    icon: string;
  }[];
}

export interface DrawingPolygonState {
  isDrawing: boolean;
  isEditing: boolean;
  drawMode?: 'polygon' | 'rectangle';
  vertices: GeoPoint[];
  activeVertexIndex: number | null;
  calculatedAreaM2: number;
  calculatedAreaHa: number;
  hasCollisionWarning: boolean;
  collisionFieldNames: string[];
}

export interface FilterOptions {
  searchQuery: string;
  cropFilter: CropType | 'ALL';
  riskFilter: RiskLevel | 'ALL';
  stageFilter: GrowthStage | 'ALL';
  htxFilter: string | 'ALL';
  sortBy: 'name' | 'area' | 'risk' | 'plantingDate' | 'pucCode';
  sortOrder: 'asc' | 'desc';
}
