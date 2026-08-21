import React, { useState } from 'react';
import { Header } from './components/layout/Header';
import { GisMap } from './components/gis/GisMap';
import { FieldDrawer } from './components/fields/FieldDrawer';
import { NewFieldModal } from './components/fields/NewFieldModal';
import { FieldListView } from './components/fields/FieldListView';
import { ShippingLogView } from './components/traceability/ShippingLogView';
import { DiseaseAlertHub } from './components/alerts/DiseaseAlertHub';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { Terrain3DViewer } from './components/terrain/Terrain3DViewer';
import { PucTraceabilityModal } from './components/traceability/PucTraceabilityModal';
import { WeatherWidget } from './components/dashboard/WeatherWidget';
import { StatCards } from './components/dashboard/StatCards';
import { INITIAL_FIELDS, INITIAL_WEATHER } from './data/mockData';
import { FarmField, UserRole, GeoPoint, ShippingBatch, DiseaseRecord, RiskLevel } from './types';
import { Sparkles, MapPin, QrCode, CloudSun } from 'lucide-react';

export function App() {
  const [fields, setFields] = useState<FarmField[]>(INITIAL_FIELDS);
  const [selectedField, setSelectedField] = useState<FarmField | null>(null);
  const [currentTab, setCurrentTab] = useState<'map' | 'fields' | 'shipping' | 'alerts' | 'analytics' | 'terrain'>('map');
  const [userRole, setUserRole] = useState<UserRole>('COOPERATIVE_HTX');
  const [lang, setLang] = useState<'en' | 'vi'>('vi');
  const [weather] = useState(INITIAL_WEATHER);

  // New Field Modal state
  const [isNewFieldModalOpen, setIsNewFieldModalOpen] = useState<boolean>(false);
  const [drawnVertices, setDrawnVertices] = useState<GeoPoint[]>([]);
  const [calculatedAreaM2, setCalculatedAreaM2] = useState<number>(0);
  const [calculatedAreaHa, setCalculatedAreaHa] = useState<number>(0);

  // Traceability Modal state
  const [isTraceabilityOpen, setIsTraceabilityOpen] = useState<boolean>(false);
  const [traceabilityField, setTraceabilityField] = useState<FarmField | null>(null);
  const [traceabilityBatch, setTraceabilityBatch] = useState<ShippingBatch | null>(null);

  // Handler when map finishes polygon drawing
  const handlePolygonDrawn = (coords: GeoPoint[], areaM2: number, areaHa: number) => {
    setDrawnVertices(coords);
    setCalculatedAreaM2(areaM2);
    setCalculatedAreaHa(areaHa);
    setIsNewFieldModalOpen(true);
  };

  // Handler to register a new field
  const handleSaveNewField = (newField: FarmField) => {
    setFields((prev) => [newField, ...prev]);
    setSelectedField(newField);
    setCurrentTab('map');
  };

  // Handler to update an existing field
  const handleUpdateField = (updatedField: FarmField) => {
    setFields((prev) => prev.map((f) => (f.id === updatedField.id ? updatedField : f)));
    setSelectedField(updatedField);
  };

  // Handler to delete a field
  const handleDeleteField = (fieldId: string) => {
    setFields((prev) => prev.filter((f) => f.id !== fieldId));
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
  };

  // Handler to add shipping batch
  const handleAddBatch = (fieldId: string, newBatch: ShippingBatch) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id === fieldId) {
          return {
            ...f,
            shippingLogs: [newBatch, ...f.shippingLogs],
          };
        }
        return f;
      })
    );
    if (selectedField && selectedField.id === fieldId) {
      setSelectedField({
        ...selectedField,
        shippingLogs: [newBatch, ...selectedField.shippingLogs],
      });
    }
  };

  // Handler to add disease alert to a field
  const handleAddDiseaseAlert = (fieldId: string, disease: DiseaseRecord, newRisk: RiskLevel) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id === fieldId) {
          return {
            ...f,
            riskLevel: newRisk,
            riskReason: disease.name,
            diseaseHistory: [disease, ...f.diseaseHistory],
          };
        }
        return f;
      })
    );
  };

  // Open Traceability modal
  const handleOpenTraceability = (field: FarmField, batch?: ShippingBatch) => {
    setTraceabilityField(field);
    setTraceabilityBatch(batch || null);
    setIsTraceabilityOpen(true);
  };

  // View on map action from other tabs
  const handleViewOnMap = (field: FarmField) => {
    setSelectedField(field);
    setCurrentTab('map');
  };

  const alertCount = fields.filter((f) => f.riskLevel !== 'BINH_THUONG').length;

  return (
    <div className={`w-full bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white ${
      currentTab === 'map' ? 'h-screen overflow-hidden' : 'min-h-screen'
    }`}>
      {/* Top Main Navigation Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        userRole={userRole}
        setUserRole={setUserRole}
        lang={lang}
        setLang={setLang}
        onOpenNewFieldModal={() => {
          setDrawnVertices([]);
          setCalculatedAreaHa(2.5);
          setCalculatedAreaM2(25000);
          setIsNewFieldModalOpen(true);
        }}
        alertCount={alertCount}
      />

      {/* Main Content Body */}
      <main className="flex-1 min-h-0 flex flex-col relative w-full overflow-hidden">
        {currentTab === 'map' && (
          <div className="flex-1 min-h-0 flex flex-col relative w-full h-full">
            {/* Top Compact KPI Row on Map View */}
            <div className="shrink-0 px-4 py-2 bg-stone-950/90 backdrop-blur-md border-b border-stone-800/80 z-10">
              <StatCards
                compact
                fields={fields}
                onFilterRisk={(risk) => {
                  if (risk !== 'ALL') {
                    const target = fields.find((f) => f.riskLevel === risk);
                    if (target) setSelectedField(target);
                  }
                }}
                lang={lang}
              />
            </div>

            {/* Interactive GIS Map Canvas */}
            <div className="flex-1 min-h-0 relative w-full h-full">
              <GisMap
                fields={fields}
                selectedField={selectedField}
                onSelectField={(field) => setSelectedField(field)}
                onSaveNewPolygon={handlePolygonDrawn}
                onUpdateFieldPolygon={(fieldId, newCoords) => {
                  setFields((prev) =>
                    prev.map((f) => {
                      if (f.id === fieldId) {
                        return { ...f, coordinates: newCoords };
                      }
                      return f;
                    })
                  );
                }}
                lang={lang}
                theme="dark"
              />
            </div>
          </div>
        )}

        {currentTab === 'fields' && (
          <div className="flex-1 min-h-0 overflow-y-auto py-4">
            <FieldListView
              fields={fields}
              onSelectField={(f) => {
                setSelectedField(f);
                setCurrentTab('map');
              }}
              onOpenNewFieldModal={() => {
                setDrawnVertices([]);
                setCalculatedAreaHa(2.5);
                setCalculatedAreaM2(25000);
                setIsNewFieldModalOpen(true);
              }}
              onOpenTraceability={handleOpenTraceability}
              onViewOnMap={handleViewOnMap}
              lang={lang}
            />
          </div>
        )}

        {currentTab === 'shipping' && (
          <div className="flex-1 min-h-0 overflow-y-auto py-4">
            <ShippingLogView
              fields={fields}
              onOpenTraceability={handleOpenTraceability}
              lang={lang}
            />
          </div>
        )}

        {currentTab === 'alerts' && (
          <div className="flex-1 min-h-0 overflow-y-auto py-4">
            <DiseaseAlertHub
              fields={fields}
              onSelectField={handleViewOnMap}
              onAddDiseaseAlert={handleAddDiseaseAlert}
              lang={lang}
            />
          </div>
        )}

        {currentTab === 'analytics' && (
          <div className="flex-1 min-h-0 overflow-y-auto py-4">
            <AnalyticsView fields={fields} lang={lang} />
          </div>
        )}

        {currentTab === 'terrain' && (
          <div className="flex-1 min-h-0 overflow-y-auto py-4">
            <Terrain3DViewer
              fields={fields}
              onSelectField={handleViewOnMap}
              lang={lang}
            />
          </div>
        )}
      </main>

      {/* Slide-over Contextual Field Drawer */}
      <FieldDrawer
        field={selectedField}
        isOpen={Boolean(selectedField)}
        onClose={() => setSelectedField(null)}
        onUpdateField={handleUpdateField}
        onDeleteField={handleDeleteField}
        onOpenTraceability={handleOpenTraceability}
        onAddBatch={handleAddBatch}
        userRole={userRole}
        lang={lang}
      />

      {/* New Field Registration Modal */}
      <NewFieldModal
        isOpen={isNewFieldModalOpen}
        onClose={() => setIsNewFieldModalOpen(false)}
        onSaveField={handleSaveNewField}
        drawnVertices={drawnVertices}
        calculatedAreaM2={calculatedAreaM2}
        calculatedAreaHa={calculatedAreaHa}
        lang={lang}
      />

      {/* Public PUC Traceability & Certificate Modal */}
      <PucTraceabilityModal
        field={traceabilityField}
        batch={traceabilityBatch}
        onClose={() => {
          setIsTraceabilityOpen(false);
          setTraceabilityField(null);
          setTraceabilityBatch(null);
        }}
        lang={lang}
      />
    </div>
  );
}

export default App;
