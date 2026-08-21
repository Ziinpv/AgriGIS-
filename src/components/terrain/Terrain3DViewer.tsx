import React, { useState } from 'react';
import { 
  Mountain, 
  Sun, 
  Droplet, 
  Compass, 
  Maximize2, 
  Layers, 
  RotateCw,
  Sparkles,
  Info
} from 'lucide-react';
import { FarmField } from '../../types';
import { CROP_CONFIG } from '../../data/mockData';

interface Terrain3DViewerProps {
  fields: FarmField[];
  onSelectField: (field: FarmField) => void;
  lang: 'en' | 'vi';
}

export const Terrain3DViewer: React.FC<Terrain3DViewerProps> = ({
  fields,
  onSelectField,
  lang,
}) => {
  const [rotationAngle, setRotationAngle] = useState<number>(45);
  const [elevationExaggeration, setElevationExaggeration] = useState<number>(2.0);
  const [aspectMode, setAspectMode] = useState<'elevation' | 'slope' | 'solar' | 'runoff'>('elevation');
  const [selectedHillField, setSelectedHillField] = useState<FarmField>(fields[2] || fields[0]);

  const t = {
    title: lang === 'vi' ? 'Mô Phỏng Địa Hình Độ Cao 3D & Phân Tích Độ Dốc' : '3D Topographical Terrain & Slope Analysis',
    subtitle: lang === 'vi' ? 'Trực quan hóa độ dốc, hướng phơi sáng mặt trời và dòng chảy mặt cho các vùng cây công nghiệp đồi dốc.' : 'Highland relief modeling with slope gradient vectors, solar azimuth irradiance, and watershed runoff channels.',
    rotation: lang === 'vi' ? 'Góc xoay quan sát' : 'Relief Azimuth Rotation',
    exaggeration: lang === 'vi' ? 'Hệ số phóng đại độ cao' : 'Elevation Exaggeration',
    elevationMode: lang === 'vi' ? 'Độ Cao (m)' : 'Elevation (m)',
    slopeMode: lang === 'vi' ? 'Độ Dốc (°)' : 'Slope Angle (°)',
    solarMode: lang === 'vi' ? 'Bức Xạ Nắng' : 'Solar Exposure',
    runoffMode: lang === 'vi' ? 'Dòng Chảy Mặt' : 'Water Runoff',
    inspectField: lang === 'vi' ? 'Khảo Sát Thửa Đất' : 'Inspect Field Plot',
  };

  return (
    <div id="terrain-3d-visualizer-view" className="space-y-6 text-stone-100 p-4 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-100 flex items-center gap-2">
            <Mountain className="w-5 h-5 text-emerald-400" />
            <span>{t.title}</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">{t.subtitle}</p>
        </div>

        {/* View Modes */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-900 border border-stone-800 rounded-2xl text-xs">
          {[
            { id: 'elevation', label: t.elevationMode, icon: '⛰️' },
            { id: 'slope', label: t.slopeMode, icon: '📐' },
            { id: 'solar', label: t.solarMode, icon: '☀️' },
            { id: 'runoff', label: t.runoffMode, icon: '💧' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setAspectMode(m.id as any)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                aspectMode === m.id
                  ? 'bg-emerald-600 text-white font-bold shadow'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <span>{m.icon} {m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3D Visualizer Canvas Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 3D Interactive Isometric Landscape */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 border border-stone-800 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[460px]">
          {/* Controls Bar */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <span className="text-xs text-stone-400 font-semibold">{t.rotation}:</span>
              <input
                type="range"
                min="0"
                max="360"
                value={rotationAngle}
                onChange={(e) => setRotationAngle(parseInt(e.target.value))}
                className="w-32 h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-xs font-mono text-emerald-400">{rotationAngle}°</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400">{t.exaggeration}:</span>
              <span className="text-xs font-mono text-white font-bold bg-stone-800 px-2 py-0.5 rounded">
                {elevationExaggeration}x
              </span>
            </div>
          </div>

          {/* SVG Simulated 3D Isometric Mesh with Contours */}
          <div className="relative w-full h-80 flex items-center justify-center my-4">
            <svg
              className="w-full h-full"
              viewBox="0 0 600 350"
              style={{
                transform: `rotateX(52deg) rotateZ(${rotationAngle}deg)`,
                transformOrigin: '50% 50%',
                transition: 'transform 0.2s ease-out',
              }}
            >
              {/* Mountain Isometric Base Mesh */}
              <defs>
                <linearGradient id="slopeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.8" />
                  <stop offset="35%" stopColor="#059669" stopOpacity="0.85" />
                  <stop offset="70%" stopColor="#ca8a04" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity="0.95" />
                </linearGradient>
              </defs>

              {/* Base terrain contour layers */}
              <polygon points="100,280 300,320 500,280 300,200" fill="#0f172a" stroke="#334155" strokeWidth="1" />
              <polygon points="120,250 300,290 480,250 300,180" fill="#14532d" stroke="#22c55e" strokeWidth="1.5" opacity="0.8" />
              <polygon points="150,220 300,260 450,220 300,160" fill="#166534" stroke="#4ade80" strokeWidth="1.5" opacity="0.85" />
              <polygon points="190,180 300,220 410,180 300,130" fill="#15803d" stroke="#86efac" strokeWidth="1.5" opacity="0.9" />
              <polygon points="230,140 300,170 370,140 300,100" fill="#854d0e" stroke="#fbbf24" strokeWidth="2" opacity="0.95" />
              <polygon points="270,100 300,120 330,100 300,75" fill="#991b1b" stroke="#f87171" strokeWidth="2" />

              {/* Highland Plots Pins */}
              {fields.map((f, i) => {
                const posX = 200 + (i % 3) * 100;
                const posY = 150 + (i % 2) * 60;
                const isSelected = selectedHillField.id === f.id;

                return (
                  <g key={f.id} className="cursor-pointer" onClick={() => setSelectedHillField(f)}>
                    <circle
                      cx={posX}
                      cy={posY}
                      r={isSelected ? '10' : '6'}
                      fill={isSelected ? '#10b981' : '#38bdf8'}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <line x1={posX} y1={posY} x2={posX} y2={posY - 25} stroke="#ffffff" strokeWidth="1.5" strokeDasharray="2 2" />
                    <text
                      x={posX}
                      y={posY - 30}
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="bg-black drop-shadow"
                    >
                      {f.name.slice(0, 10)} ({f.elevationAvgM}m)
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Bottom Elevation Legend */}
          <div className="flex items-center justify-between z-10 pt-2 border-t border-stone-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-stone-400">Elevation Spectrum:</span>
              <div className="h-3 w-40 rounded-full bg-gradient-to-r from-blue-600 via-emerald-600 via-amber-500 to-rose-600 border border-stone-700" />
            </div>
            <div className="flex gap-3 font-mono text-[11px] text-stone-400">
              <span>0m (Valley)</span>
              <span>800m</span>
              <span className="text-rose-400">1600m (Peak)</span>
            </div>
          </div>
        </div>

        {/* Right: Selected Hillside Plot Telemetry */}
        <div className="lg:col-span-4 p-5 rounded-3xl bg-stone-900/80 border border-stone-800 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <h3 className="text-sm font-bold text-stone-200">{t.inspectField}</h3>
            <span className="text-xs font-mono text-emerald-400">{selectedHillField.pucCode}</span>
          </div>

          <div className="space-y-1">
            <div className="text-base font-bold text-stone-100">{selectedHillField.name}</div>
            <div className="text-xs text-stone-400">
              {CROP_CONFIG[selectedHillField.cropType]?.icon} {selectedHillField.cropVariety || selectedHillField.cropType}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800">
              <span className="text-stone-400 text-[11px]">Mean Elevation</span>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">
                {selectedHillField.elevationAvgM} m
              </div>
              <span className="text-[10px] text-stone-500">Above Sea Level</span>
            </div>

            <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800">
              <span className="text-stone-400 text-[11px]">Slope Incline</span>
              <div className="text-lg font-bold text-amber-400 mt-0.5">
                {selectedHillField.slopeDegrees}°
              </div>
              <span className="text-[10px] text-stone-500">Terraced Cultivation</span>
            </div>
          </div>

          {/* Microclimate Insights */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/50 space-y-1.5 text-xs text-emerald-200">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hillside Microclimate Advisory</span>
            </div>
            <p className="text-[11px] text-emerald-200/90 leading-relaxed">
              {selectedHillField.slopeDegrees > 10
                ? 'High slope angle requires contour trenching and vetiver grass planting to arrest topsoil erosion during monsoon showers.'
                : 'Gentle slope provides optimal natural gravity drainage, preventing waterlogging in the root rhizosphere.'}
            </p>
          </div>

          <button
            onClick={() => onSelectField(selectedHillField)}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all active:scale-95"
          >
            Open Full Field Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
