import React from 'react';
import { 
  Sprout, 
  Map, 
  Layers, 
  Truck, 
  ShieldAlert, 
  TrendingUp, 
  Mountain, 
  Plus, 
  Globe, 
  UserCheck,
  Search,
  Sparkles,
  QrCode,
  Bell
} from 'lucide-react';
import { UserRole } from '../../types';

interface HeaderProps {
  currentTab: 'map' | 'fields' | 'shipping' | 'alerts' | 'analytics' | 'terrain';
  setCurrentTab: (tab: 'map' | 'fields' | 'shipping' | 'alerts' | 'analytics' | 'terrain') => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  lang: 'en' | 'vi';
  setLang: (lang: 'en' | 'vi') => void;
  onOpenNewFieldModal: () => void;
  alertCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  userRole,
  setUserRole,
  lang,
  setLang,
  onOpenNewFieldModal,
  alertCount,
}) => {
  const navItems = [
    { id: 'map', label: lang === 'vi' ? 'Bản Đồ GIS' : 'GIS Map', icon: Map },
    { id: 'fields', label: lang === 'vi' ? 'Sổ Vùng Trồng' : 'Fields Register', icon: Sprout },
    { id: 'shipping', label: lang === 'vi' ? 'Xuất Kho & PUC' : 'Supply & PUC', icon: Truck },
    { id: 'alerts', label: lang === 'vi' ? 'Dịch Bệnh & AI' : 'Disease & AI', icon: ShieldAlert, badge: alertCount },
    { id: 'analytics', label: lang === 'vi' ? 'Báo Cáo & Thống Kê' : 'Analytics', icon: TrendingUp },
    { id: 'terrain', label: lang === 'vi' ? 'Địa Hình 3D' : '3D Terrain', icon: Mountain },
  ];

  return (
    <header className="sticky top-0 z-40 bg-stone-950/90 backdrop-blur-xl border-b border-stone-800 text-stone-100">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Branding & Tagline */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-900/30">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">AgriGIS</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800 uppercase">
                Vietnam
              </span>
            </div>
            <p className="text-[11px] text-stone-400 hidden sm:block">
              {lang === 'vi' ? 'Hệ Thống Số Hóa Vùng Trồng & Cấp Mã PUC Quốc Gia' : 'National Agricultural GIS & PUC Registry Platform'}
            </p>
          </div>
        </div>

        {/* Center: Navigation Bar Tabs */}
        <nav className="flex items-center gap-1 p-1 bg-stone-900/90 rounded-2xl border border-stone-800 overflow-x-auto max-w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap relative ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: User Role Switcher, Language Toggle, and New Field CTA */}
        <div className="flex items-center gap-2">
          {/* User Persona Switcher */}
          <div className="flex items-center gap-1 bg-stone-900 border border-stone-800 p-1 rounded-xl text-xs">
            <span className="text-stone-500 text-[10px] px-1 hidden md:inline">Role:</span>
            {(['FARMER', 'COOPERATIVE_HTX', 'GOV_OFFICER'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => setUserRole(r)}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  userRole === r
                    ? 'bg-stone-800 text-emerald-400 shadow'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                {r === 'FARMER' ? '👨‍🌾 Farmer' : r === 'COOPERATIVE_HTX' ? '🏢 HTX' : '🏛️ Officer'}
              </button>
            ))}
          </div>

          {/* Lang Toggle */}
          <button
            onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
            className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-xl text-xs font-bold text-stone-300 transition-colors"
          >
            {lang === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}
          </button>

          {/* Quick Add CTA */}
          <button
            onClick={onOpenNewFieldModal}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/40 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lang === 'vi' ? 'Thêm Thửa' : 'New Field'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
