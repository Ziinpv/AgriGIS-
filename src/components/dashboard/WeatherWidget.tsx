import React from 'react';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  CloudRain, 
  Sun, 
  Compass, 
  Sparkles, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { WeatherData } from '../../types';

interface WeatherWidgetProps {
  weather: WeatherData;
  lang: 'en' | 'vi';
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ weather, lang }) => {
  const t = {
    title: lang === 'vi' ? 'Thời Tiết Nông Nghiệp & Cảnh Báo Vi Khí Hậu' : 'Agro-Meteorology & Microclimate',
    feelsLike: lang === 'vi' ? 'Cảm nhận' : 'Feels like',
    humidity: lang === 'vi' ? 'Độ ẩm' : 'Humidity',
    wind: lang === 'vi' ? 'Gió' : 'Wind',
    precipitation: lang === 'vi' ? 'Lượng mưa' : 'Precipitation',
    pressure: lang === 'vi' ? 'Khí áp' : 'Pressure',
    uvIndex: lang === 'vi' ? 'Chỉ số UV' : 'UV Index',
    advisoryTitle: lang === 'vi' ? 'Khuyến Cáo Canh Tác Trong Ngày' : 'Daily Agro-Spraying & Irrigation Advisory',
    fiveDayForecast: lang === 'vi' ? 'Dự báo 5 ngày tới' : '5-Day Agro Forecast',
  };

  return (
    <div 
      id="agro-weather-widget"
      className="p-5 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-stone-900/90 to-stone-900/90 border border-stone-800 shadow-xl backdrop-blur-xl space-y-4 text-stone-100"
    >
      {/* Top Header & Main Temperature Readout */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-400 animate-spin-slow" />
            <h3 className="text-sm font-bold text-stone-100">{t.title}</h3>
          </div>
          <p className="text-xs text-stone-400">
            {lang === 'vi' ? weather.conditionVi : weather.condition} • Sóc Trăng / Mekong Delta Station
          </p>
        </div>

        <div className="flex items-baseline gap-2 bg-stone-950/60 px-4 py-2 rounded-2xl border border-stone-800">
          <span className="text-3xl font-extrabold text-white tracking-tight">{weather.tempC}°C</span>
          <span className="text-xs text-stone-400 font-medium">
            ({t.feelsLike} {weather.feelsLikeC}°C)
          </span>
        </div>
      </div>

      {/* 4 Metric Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-stone-950/50 border border-stone-800/80 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-sky-950/80 text-sky-400 border border-sky-800/50">
            <Droplets className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-stone-400 block">{t.humidity}</span>
            <span className="text-sm font-bold text-stone-100">{weather.humidityPercent}%</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-stone-950/50 border border-stone-800/80 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-950/80 text-teal-400 border border-teal-800/50">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-stone-400 block">{t.wind}</span>
            <span className="text-sm font-bold text-stone-100">{weather.windSpeedKmh} km/h</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-stone-950/50 border border-stone-800/80 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-800/50">
            <CloudRain className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-stone-400 block">{t.precipitation}</span>
            <span className="text-sm font-bold text-stone-100">{weather.precipitationMm} mm</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-stone-950/50 border border-stone-800/80 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-950/80 text-amber-400 border border-amber-800/50">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-stone-400 block">{t.uvIndex}</span>
            <span className="text-sm font-bold text-stone-100">{weather.uvIndex} (High)</span>
          </div>
        </div>
      </div>

      {/* Smart Agro Advisory Banner */}
      <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-800/60 flex items-start gap-2.5 text-xs text-emerald-200">
        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-emerald-300">{t.advisoryTitle}:</span>
          <p className="text-[11px] text-emerald-200/90 leading-relaxed">
            {lang === 'vi' ? weather.agroAdvisoryVi : weather.agroAdvisory}
          </p>
        </div>
      </div>

      {/* 5-Day Forecast Row */}
      <div className="pt-2 border-t border-stone-800/80 space-y-2">
        <span className="text-[11px] font-semibold text-stone-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-stone-500" />
          {t.fiveDayForecast}
        </span>

        <div className="grid grid-cols-5 gap-1.5 text-center">
          {weather.forecast.map((fc, i) => (
            <div key={i} className="p-2 rounded-xl bg-stone-950/40 border border-stone-800/50 space-y-1">
              <span className="text-[11px] font-bold text-stone-300 block">
                {lang === 'vi' ? fc.dayVi : fc.day}
              </span>
              <div className="text-xs font-semibold text-stone-100">
                {fc.tempHighC}° <span className="text-stone-500 font-normal text-[10px]">{fc.tempLowC}°</span>
              </div>
              <div className="text-[10px] text-sky-400 font-medium flex items-center justify-center gap-0.5">
                <CloudRain className="w-2.5 h-2.5" />
                <span>{fc.rainChancePct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
