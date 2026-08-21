import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, 
  Minus, 
  Compass, 
  Crosshair, 
  Maximize2, 
  Layers, 
  Sliders, 
  Search, 
  MapPin, 
  AlertOctagon, 
  ShieldCheck, 
  AlertTriangle,
  Info,
  Check,
  ChevronDown,
  Navigation
} from 'lucide-react';
import { 
  FarmField, 
  GeoPoint, 
  BaseMapLayer, 
  AgroOverlay, 
  DrawingPolygonState, 
  CropType, 
  RiskLevel 
} from '../../types';
import { 
  calculatePolygonArea, 
  calculatePolygonCentroid, 
  checkPolygonOverlap, 
  calculateDistanceMeters 
} from '../../utils/geoUtils';
import { DrawingToolbar } from './DrawingToolbar';
import { CROP_CONFIG } from '../../data/mockData';

interface GisMapProps {
  fields: FarmField[];
  selectedField: FarmField | null;
  onSelectField: (field: FarmField | null) => void;
  onSaveNewPolygon: (vertices: GeoPoint[], calculatedAreaM2: number, calculatedAreaHa: number) => void;
  onUpdateFieldPolygon?: (fieldId: string, newCoordinates: GeoPoint[]) => void;
  lang: 'en' | 'vi';
  theme: 'dark' | 'light';
  onQuickAddTrigger?: () => void;
}

// Fixed reference center for the agricultural cluster in the Mekong Delta
const MAP_CENTER_LAT = 10.598;
const MAP_CENTER_LNG = 105.875;

export const GisMap: React.FC<GisMapProps> = ({
  fields,
  selectedField,
  onSelectField,
  onSaveNewPolygon,
  onUpdateFieldPolygon,
  lang,
  theme,
}) => {
  // Map Viewport state (pan & zoom)
  const [zoom, setZoom] = useState<number>(14.5);
  const [center, setCenter] = useState<GeoPoint>({ lat: MAP_CENTER_LAT, lng: MAP_CENTER_LNG });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mapDimensions, setMapDimensions] = useState<{ width: number; height: number }>({ width: 1000, height: 700 });
  const [is3DMode, setIs3DMode] = useState<boolean>(false);
  const [tiltAngle, setTiltAngle] = useState<number>(32);

  // Layers & Overlays state
  const [baseLayer, setBaseLayer] = useState<BaseMapLayer>('satellite');
  const [overlay, setOverlay] = useState<AgroOverlay>('none');
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.75);
  const [isLayersDrawerOpen, setIsLayersDrawerOpen] = useState<boolean>(false);

  // Drawing & Editing state
  const [drawMode, setDrawMode] = useState<'polygon' | 'rectangle'>('polygon');
  const [rectAnchor, setRectAnchor] = useState<GeoPoint | null>(null);

  const [drawingState, setDrawingState] = useState<DrawingPolygonState>({
    isDrawing: false,
    isEditing: false,
    drawMode: 'polygon',
    vertices: [],
    activeVertexIndex: null,
    calculatedAreaM2: 0,
    calculatedAreaHa: 0,
    hasCollisionWarning: false,
    collisionFieldNames: [],
  });

  const [mouseMapPos, setMouseMapPos] = useState<GeoPoint | null>(null);
  const [mouseSvgPos, setMouseSvgPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredField, setHoveredField] = useState<FarmField | null>(null);
  const [draggingVertexIdx, setDraggingVertexIdx] = useState<number | null>(null);
  const [isEditingExistingField, setIsEditingExistingField] = useState<string | null>(null);
  const [editableVertices, setEditableVertices] = useState<GeoPoint[]>([]);
  const [isHoveringFirstVertex, setIsHoveringFirstVertex] = useState<boolean>(false);

  // Measurement tool state
  const [measureMode, setMeasureMode] = useState<boolean>(false);
  const [measurePoints, setMeasurePoints] = useState<GeoPoint[]>([]);

  // Search & Filter within Map
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'ALL'>('ALL');

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Measure container size on mount & resize with ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        if (w > 0 && h > 0) {
          setMapDimensions({
            width: w,
            height: h,
          });
        }
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });
    resizeObserver.observe(el);

    window.addEventListener('resize', updateDimensions);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Coordinate Projection Helper (Lat/Lng -> SVG Pixels)
  const latLngToPoint = useCallback(
    (pt: GeoPoint) => {
      const scale = Math.pow(2, zoom) * 12;
      const x = mapDimensions.width / 2 + (pt.lng - center.lng) * scale * Math.cos((center.lat * Math.PI) / 180) * 111320 * (1 / 1000);
      const y = mapDimensions.height / 2 - (pt.lat - center.lat) * scale * 111320 * (1 / 1000);
      return { x, y };
    },
    [zoom, center, mapDimensions]
  );

  // Reverse Projection Helper (SVG Pixels -> Lat/Lng)
  const pointToLatLng = useCallback(
    (x: number, y: number): GeoPoint => {
      const scale = Math.pow(2, zoom) * 12;
      const dX = x - mapDimensions.width / 2;
      const dY = y - mapDimensions.height / 2;

      const metersY = -dY / (scale * (1 / 1000));
      const metersX = dX / (scale * Math.cos((center.lat * Math.PI) / 180) * (1 / 1000));

      const dLat = metersY / 111320;
      const dLng = metersX / 111320;

      return {
        lat: Number((center.lat + dLat).toFixed(6)),
        lng: Number((center.lng + dLng).toFixed(6)),
      };
    },
    [zoom, center, mapDimensions]
  );

  // Recalculate area and overlap whenever drawing vertices change
  useEffect(() => {
    if (drawingState.vertices.length >= 3) {
      const { areaM2, areaHa } = calculatePolygonArea(drawingState.vertices);
      const overlap = checkPolygonOverlap(drawingState.vertices, fields);
      setDrawingState((prev) => ({
        ...prev,
        calculatedAreaM2: areaM2,
        calculatedAreaHa: areaHa,
        hasCollisionWarning: overlap.hasOverlap,
        collisionFieldNames: overlap.overlappingFieldNames,
      }));
    } else {
      setDrawingState((prev) => ({
        ...prev,
        calculatedAreaM2: 0,
        calculatedAreaHa: 0,
        hasCollisionWarning: false,
        collisionFieldNames: [],
      }));
    }
  }, [drawingState.vertices, fields]);

  // Global mouseup listener for dragging vertices & panning
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsPanning(false);
      setDraggingVertexIdx(null);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Keyboard Shortcuts for Drawing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!drawingState.isDrawing) return;

      if (e.key === 'Escape') {
        handleCancelDrawing();
      } else if (e.key === 'Backspace' || (e.key === 'z' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        handleUndoVertex();
      } else if (e.key === 'Enter') {
        if (drawingState.vertices.length >= 3) {
          handleCompleteAndSave();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawingState.isDrawing, drawingState.vertices]);

  // Zoom handlers
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.5, 18));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.5, 11));
  const handleResetView = () => {
    setCenter({ lat: MAP_CENTER_LAT, lng: MAP_CENTER_LNG });
    setZoom(14.5);
  };

  // Center on selected field when changed
  useEffect(() => {
    if (selectedField && selectedField.center) {
      setCenter(selectedField.center);
    }
  }, [selectedField]);

  // Get mouse coordinates relative to SVG
  const getSvgCoordinates = (e: React.MouseEvent<SVGSVGElement> | MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Handle Map Mouse Down (Panning vs Drawing vs Dragging Vertex)
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    // Right click (button 2) or Middle click (button 1) always pans
    if (e.button === 1 || e.button === 2) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (e.button !== 0) return; // Only primary mouse button

    const { x: clickX, y: clickY } = getSvgCoordinates(e);
    const geoPos = pointToLatLng(clickX, clickY);

    // If in measurement mode
    if (measureMode) {
      setMeasurePoints((prev) => [...prev, geoPos]);
      return;
    }

    // If drawing a new polygon or rectangle
    if (drawingState.isDrawing) {
      if (drawMode === 'rectangle') {
        if (!rectAnchor) {
          // Set first anchor corner
          setRectAnchor(geoPos);
          setDrawingState((prev) => ({
            ...prev,
            vertices: [geoPos],
          }));
        } else {
          // Second corner clicked: lock the 4 vertices of rectangle and save
          const lat1 = rectAnchor.lat;
          const lng1 = rectAnchor.lng;
          const lat2 = geoPos.lat;
          const lng2 = geoPos.lng;

          const rectVertices: GeoPoint[] = [
            { lat: lat1, lng: lng1 },
            { lat: lat1, lng: lng2 },
            { lat: lat2, lng: lng2 },
            { lat: lat2, lng: lng1 },
          ];

          const { areaM2, areaHa } = calculatePolygonArea(rectVertices);
          onSaveNewPolygon(rectVertices, areaM2, areaHa);
          handleCancelDrawing();
        }
        return;
      }

      // In Polygon Mode (Point by point):
      // If clicking near first vertex and points >= 3, snap & close
      if (drawingState.vertices.length >= 3) {
        const firstPt = latLngToPoint(drawingState.vertices[0]);
        const distFromFirst = Math.hypot(clickX - firstPt.x, clickY - firstPt.y);
        if (distFromFirst < 22) {
          handleCompleteAndSave();
          return;
        }
      }

      // Add vertex to polygon
      setDrawingState((prev) => ({
        ...prev,
        vertices: [...prev.vertices, geoPos],
      }));
      return;
    }

    // Normal map interaction: start panning
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
  };

  // Handle Double Click to Auto-Close and Complete
  const handleDoubleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (drawingState.isDrawing && drawingState.vertices.length >= 3) {
      handleCompleteAndSave();
    }
  };

  // Handle Map Mouse Move
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const { x: currentX, y: currentY } = getSvgCoordinates(e);
    const geoPos = pointToLatLng(currentX, currentY);
    setMouseMapPos(geoPos);
    setMouseSvgPos({ x: currentX, y: currentY });

    // Check if hovering near first vertex in polygon mode
    if (drawingState.isDrawing && drawMode === 'polygon' && drawingState.vertices.length >= 3) {
      const firstPt = latLngToPoint(drawingState.vertices[0]);
      const distFromFirst = Math.hypot(currentX - firstPt.x, currentY - firstPt.y);
      setIsHoveringFirstVertex(distFromFirst < 22);
    } else {
      setIsHoveringFirstVertex(false);
    }

    // Dynamic Rectangle Preview while moving
    if (drawingState.isDrawing && drawMode === 'rectangle' && rectAnchor) {
      const lat1 = rectAnchor.lat;
      const lng1 = rectAnchor.lng;
      const lat2 = geoPos.lat;
      const lng2 = geoPos.lng;

      const dynamicRectVertices: GeoPoint[] = [
        { lat: lat1, lng: lng1 },
        { lat: lat1, lng: lng2 },
        { lat: lat2, lng: lng2 },
        { lat: lat2, lng: lng1 },
      ];
      setDrawingState((prev) => ({
        ...prev,
        vertices: dynamicRectVertices,
      }));
      return;
    }

    // Vertex dragging during drawing
    if (drawingState.isDrawing && draggingVertexIdx !== null) {
      setDrawingState((prev) => {
        const updated = [...prev.vertices];
        updated[draggingVertexIdx] = geoPos;
        return { ...prev, vertices: updated };
      });
      return;
    }

    // Vertex dragging during existing field editing
    if (isEditingExistingField && draggingVertexIdx !== null) {
      setEditableVertices((prev) => {
        const updated = [...prev];
        updated[draggingVertexIdx] = geoPos;
        return updated;
      });
      return;
    }

    // Panning the map view
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;

      const scale = Math.pow(2, zoom) * 12;
      const metersY = dy / (scale * (1 / 1000));
      const metersX = -dx / (scale * Math.cos((center.lat * Math.PI) / 180) * (1 / 1000));

      const dLat = metersY / 111320;
      const dLng = metersX / 111320;

      setCenter({
        lat: Number((center.lat + dLat).toFixed(6)),
        lng: Number((center.lng + dLng).toFixed(6)),
      });
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  // Handle Map Mouse Up
  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingVertexIdx(null);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(z + 0.25, 18));
    } else {
      setZoom((z) => Math.max(z - 0.25, 11));
    }
  };

  // Start Drawing Action
  const handleStartDrawing = (mode: 'polygon' | 'rectangle' = 'polygon') => {
    // When drawing starts, switch off 3D perspective to guarantee 100% geometric projection precision
    if (is3DMode) {
      setIs3DMode(false);
    }
    setDrawMode(mode);
    setRectAnchor(null);
    setDrawingState({
      isDrawing: true,
      isEditing: false,
      drawMode: mode,
      vertices: [],
      activeVertexIndex: null,
      calculatedAreaM2: 0,
      calculatedAreaHa: 0,
      hasCollisionWarning: false,
      collisionFieldNames: [],
    });
    setMeasureMode(false);
    setIsEditingExistingField(null);
  };

  // Cancel Drawing Action
  const handleCancelDrawing = () => {
    setRectAnchor(null);
    setDrawingState({
      isDrawing: false,
      isEditing: false,
      drawMode: 'polygon',
      vertices: [],
      activeVertexIndex: null,
      calculatedAreaM2: 0,
      calculatedAreaHa: 0,
      hasCollisionWarning: false,
      collisionFieldNames: [],
    });
  };

  // Undo last vertex
  const handleUndoVertex = () => {
    setDrawingState((prev) => ({
      ...prev,
      vertices: prev.vertices.slice(0, -1),
    }));
  };

  // Clear all vertices
  const handleClearVertices = () => {
    setRectAnchor(null);
    setDrawingState((prev) => ({
      ...prev,
      vertices: [],
    }));
  };

  // Complete and trigger save modal
  const handleCompleteAndSave = () => {
    if (drawingState.vertices.length < 3) return;
    const { areaM2, areaHa } = calculatePolygonArea(drawingState.vertices);
    onSaveNewPolygon(drawingState.vertices, areaM2, areaHa);
    handleCancelDrawing();
  };

  // Add Quick 1.5-Hectare Sample Plot at Center
  const handleAddQuickTemplate = () => {
    const lat = center.lat;
    const lng = center.lng;
    const deltaLat = 0.0011;
    const deltaLng = 0.0013;

    const sampleVertices: GeoPoint[] = [
      { lat: Number((lat + deltaLat).toFixed(6)), lng: Number((lng - deltaLng).toFixed(6)) },
      { lat: Number((lat + deltaLat).toFixed(6)), lng: Number((lng + deltaLng).toFixed(6)) },
      { lat: Number((lat - deltaLat).toFixed(6)), lng: Number((lng + deltaLng).toFixed(6)) },
      { lat: Number((lat - deltaLat).toFixed(6)), lng: Number((lng - deltaLng).toFixed(6)) },
    ];

    const { areaM2, areaHa } = calculatePolygonArea(sampleVertices);
    onSaveNewPolygon(sampleVertices, areaM2, areaHa);
  };

  // Toggle Edit Mode on existing field
  const handleToggleEditMode = () => {
    if (selectedField) {
      if (isEditingExistingField === selectedField.id) {
        // Save changes
        if (onUpdateFieldPolygon && editableVertices.length >= 3) {
          onUpdateFieldPolygon(selectedField.id, editableVertices);
        }
        setIsEditingExistingField(null);
      } else {
        setIsEditingExistingField(selectedField.id);
        setEditableVertices([...selectedField.coordinates]);
      }
    } else {
      alert(lang === 'vi' ? 'Vui lòng chọn 1 thửa đất trên bản đồ trước khi chỉnh sửa đỉnh.' : 'Please select a field on the map first to edit its vertices.');
    }
  };

  // Filtered fields based on search and risk filter
  const filteredFields = useMemo(() => {
    return fields.filter((field) => {
      const matchSearch = 
        !searchQuery ||
        field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        field.pucCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        field.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        field.cropType.toLowerCase().includes(searchQuery.toLowerCase());

      const matchRisk = riskFilter === 'ALL' || field.riskLevel === riskFilter;

      return matchSearch && matchRisk;
    });
  }, [fields, searchQuery, riskFilter]);

  // Text translations
  const t = {
    searchPlaceholder: lang === 'vi' ? 'Tìm theo tên thửa, mã PUC, nông dân...' : 'Search field, PUC code, farmer...',
    satellite: lang === 'vi' ? 'Vệ Tinh HD' : 'Satellite HD',
    terrain: lang === 'vi' ? 'Địa Hình Độ Cao' : 'Terrain Contour',
    street: lang === 'vi' ? 'Địa Chính & Giao Thông' : 'Cadastral & Roads',
    tilt3d: lang === 'vi' ? 'Góc Nhìn 3D Nghiêng' : '3D Perspective Tilt',
    ndviLayer: lang === 'vi' ? 'Chỉ Số Thực Vật (NDVI)' : 'Vegetation Index (NDVI)',
    moistureLayer: lang === 'vi' ? 'Độ Ẩm Đất' : 'Soil Moisture Heatmap',
    riskLayer: lang === 'vi' ? 'Vùng Cảnh Báo Dịch Bệnh' : 'Disease Contagion Risk',
    allRisks: lang === 'vi' ? 'Tất cả mức độ' : 'All Risk Levels',
    normal: lang === 'vi' ? 'Bình Thường' : 'Normal',
    warning: lang === 'vi' ? 'Cảnh Báo Nhẹ' : 'Warning',
    critical: lang === 'vi' ? 'Nguy Cơ Cao' : 'Critical',
    locateMe: lang === 'vi' ? 'Vị Trí Của Tôi' : 'My GPS Location',
    resetView: lang === 'vi' ? 'Xem Toàn Bộ Vùng' : 'Reset View Extent',
    layers: lang === 'vi' ? 'Lớp Bản Đồ' : 'Map Layers',
    measureDistance: lang === 'vi' ? 'Đo Khoảng Cách' : 'Measure Distance',
    totalDistance: lang === 'vi' ? 'Khoảng cách tổng' : 'Total Distance',
    clearMeasure: lang === 'vi' ? 'Xóa đo' : 'Clear Measure',
    measuringPrompt: lang === 'vi' ? 'Nhấp 2 điểm trên bản đồ để đo khoảng cách thực tế.' : 'Click 2 points on map to measure real geodesic distance.',
    snapToClose: lang === 'vi' ? 'Nhấp để khép góc đa giác!' : 'Click to close polygon!',
    distanceLabel: lang === 'vi' ? 'Khoảng cách đoạn:' : 'Segment distance:',
  };

  // Convert polygon coordinates to SVG path string
  const getPolygonPath = (coords: GeoPoint[]) => {
    if (!coords || coords.length === 0) return '';
    return coords
      .map((pt, i) => {
        const p = latLngToPoint(pt);
        return `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
      })
      .concat('Z')
      .join(' ');
  };

  // Get color and stroke for risk level
  const getRiskColor = (risk: RiskLevel) => {
    switch (risk) {
      case 'NGUY_CO_CAO':
        return {
          fill: 'rgba(239, 68, 68, 0.42)',
          stroke: '#ef4444',
          glow: 'rgba(239, 68, 68, 0.8)',
          badge: 'bg-rose-600 text-white',
        };
      case 'CANH_BAO_NHE':
        return {
          fill: 'rgba(234, 179, 8, 0.40)',
          stroke: '#eab308',
          glow: 'rgba(234, 179, 8, 0.6)',
          badge: 'bg-amber-500 text-stone-900',
        };
      case 'BINH_THUONG':
      default:
        return {
          fill: 'rgba(34, 197, 94, 0.35)',
          stroke: '#22c55e',
          glow: 'rgba(34, 197, 94, 0.5)',
          badge: 'bg-emerald-600 text-white',
        };
    }
  };

  // Calculate measured distance
  const totalMeasuredMeters = useMemo(() => {
    if (measurePoints.length < 2) return 0;
    let dist = 0;
    for (let i = 0; i < measurePoints.length - 1; i++) {
      dist += calculateDistanceMeters(measurePoints[i], measurePoints[i + 1]);
    }
    return dist;
  }, [measurePoints]);

  // Calculate current dynamic segment distance while drawing
  const currentSegmentDistance = useMemo(() => {
    if (!drawingState.isDrawing || drawingState.vertices.length === 0 || !mouseMapPos) return 0;
    const lastVertex = drawingState.vertices[drawingState.vertices.length - 1];
    return calculateDistanceMeters(lastVertex, mouseMapPos);
  }, [drawingState.isDrawing, drawingState.vertices, mouseMapPos]);

  return (
    <div 
      id="agri-gis-map-engine" 
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none ${
        theme === 'dark' ? 'bg-stone-950 text-stone-100' : 'bg-stone-100 text-stone-800'
      }`}
      style={{
        perspective: is3DMode ? '1000px' : 'none',
      }}
      onContextMenu={(e) => e.preventDefault()} // Prevent context menu to allow right-click pan/vertex manipulation
    >
      {/* Top Floating Action Bar: Search, Filters & Layer Switcher Button */}
      <div 
        id="map-top-bar"
        className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none"
      >
        {/* Search & Risk Quick Filter */}
        <div className="flex items-center gap-2 pointer-events-auto bg-stone-950/90 backdrop-blur-2xl p-1.5 rounded-2xl border border-stone-800 shadow-2xl max-w-md w-full sm:w-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-900/90 rounded-xl flex-1 border border-stone-700/60">
            <Search className="w-4 h-4 text-stone-400 shrink-0" />
            <input
              id="map-field-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="bg-transparent text-xs text-stone-100 placeholder-stone-400 focus:outline-none w-full"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-stone-400 hover:text-stone-200 text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Risk Level Filter Pill */}
          <select
            id="map-risk-filter-select"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as any)}
            className="bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded-xl px-2.5 py-2 focus:outline-none cursor-pointer hover:border-emerald-500 transition-colors"
          >
            <option value="ALL">{t.allRisks}</option>
            <option value="BINH_THUONG">🟢 {t.normal}</option>
            <option value="CANH_BAO_NHE">🟡 {t.warning}</option>
            <option value="NGUY_CO_CAO">🔴 {t.critical}</option>
          </select>
        </div>

        {/* Right Controls: Layer Drawer Toggle & 3D Mode Toggle */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* 3D Perspective Mode Button */}
          <button
            id="btn-toggle-3d-map"
            onClick={() => setIs3DMode(!is3DMode)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold backdrop-blur-xl border transition-all shadow-lg ${
              is3DMode
                ? 'bg-amber-600 text-white border-amber-400 shadow-amber-900/40'
                : 'bg-stone-950/85 hover:bg-stone-900 text-stone-200 border-stone-800'
            }`}
            title="Toggle 3D Elevation Perspective View"
          >
            <span className="font-mono text-[11px] px-1 bg-black/40 rounded">3D</span>
            <span className="hidden sm:inline">{t.tilt3d}</span>
          </button>

          {/* Layer Selector Toggle */}
          <button
            id="btn-toggle-layer-drawer"
            onClick={() => setIsLayersDrawerOpen(!isLayersDrawerOpen)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold backdrop-blur-xl border transition-all shadow-lg ${
              isLayersDrawerOpen || overlay !== 'none'
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-900/40'
                : 'bg-stone-950/85 hover:bg-stone-900 text-stone-200 border-stone-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">{t.layers}</span>
            {overlay !== 'none' && (
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Layer Selector Flyout Panel */}
      {isLayersDrawerOpen && (
        <div 
          id="map-layers-panel"
          className="absolute top-18 right-4 z-30 w-72 bg-stone-950/95 backdrop-blur-2xl border border-stone-800 p-4 rounded-2xl shadow-2xl space-y-4 text-stone-200 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <h4 className="text-xs font-bold text-stone-100 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              {t.layers}
            </h4>
            <button 
              onClick={() => setIsLayersDrawerOpen(false)}
              className="text-stone-400 hover:text-stone-100 text-xs p-1"
            >
              ✕
            </button>
          </div>

          {/* Base Layer Switcher */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-stone-400">Base Map Style</span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'satellite', label: t.satellite, icon: '🛰️' },
                { id: 'terrain', label: t.terrain, icon: '⛰️' },
                { id: 'street', label: t.street, icon: '🗺️' },
              ].map((layer) => (
                <button
                  key={layer.id}
                  id={`btn-layer-${layer.id}`}
                  onClick={() => setBaseLayer(layer.id as BaseMapLayer)}
                  className={`p-2 rounded-xl text-[11px] flex flex-col items-center gap-1 border transition-all text-center ${
                    baseLayer === layer.id
                      ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 font-semibold'
                      : 'bg-stone-900/60 border-stone-800 hover:bg-stone-900 text-stone-400'
                  }`}
                >
                  <span className="text-base">{layer.icon}</span>
                  <span className="truncate w-full">{layer.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Agricultural Overlays */}
          <div className="space-y-2 pt-2 border-t border-stone-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-stone-400">Agro Analytics Overlays</span>
              {overlay !== 'none' && (
                <button 
                  onClick={() => setOverlay('none')} 
                  className="text-[10px] text-emerald-400 hover:underline"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="space-y-1">
              {[
                { id: 'none', label: 'None (Standard Borders)' },
                { id: 'ndvi', label: `🌱 ${t.ndviLayer}` },
                { id: 'moisture', label: `💧 ${t.moistureLayer}` },
                { id: 'risk_heat', label: `⚠️ ${t.riskLayer}` },
              ].map((ov) => (
                <button
                  key={ov.id}
                  id={`btn-overlay-${ov.id}`}
                  onClick={() => setOverlay(ov.id as AgroOverlay)}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between border transition-all ${
                    overlay === ov.id
                      ? 'bg-emerald-900/40 border-emerald-500 text-emerald-300 font-semibold'
                      : 'border-transparent hover:bg-stone-900 text-stone-300'
                  }`}
                >
                  <span>{ov.label}</span>
                  {overlay === ov.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              ))}
            </div>

            {/* Overlay Opacity Slider */}
            {overlay !== 'none' && (
              <div className="pt-2 space-y-1">
                <div className="flex justify-between text-[10px] text-stone-400">
                  <span>Overlay Opacity</span>
                  <span className="font-mono">{Math.round(overlayOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Interactive SVG Map Canvas */}
      <div 
        className="w-full h-full cursor-crosshair transition-transform duration-300"
        style={{
          transform: is3DMode ? `rotateX(${tiltAngle}deg) scale(0.95)` : 'none',
          transformOrigin: '50% 60%',
        }}
      >
        <svg
          id="gis-interactive-canvas-svg"
          ref={svgRef}
          className="w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          onWheel={handleWheel}
        >
          <defs>
            {/* Satellite Background Farmland Grid Pattern */}
            <pattern id="satellite-farmland-grid" width="160" height="160" patternUnits="userSpaceOnUse">
              <rect width="160" height="160" fill="#132415" />
              {/* Field strips & textures */}
              <rect x="0" y="0" width="78" height="78" fill="#1c331f" opacity="0.8" />
              <rect x="82" y="0" width="78" height="78" fill="#162e19" opacity="0.9" />
              <rect x="0" y="82" width="78" height="78" fill="#203d24" opacity="0.85" />
              <rect x="82" y="82" width="78" height="78" fill="#182d1c" opacity="0.75" />
              {/* Crop planting row lines */}
              <line x1="0" y1="20" x2="78" y2="20" stroke="#164e22" strokeWidth="0.8" strokeDasharray="3 3" />
              <line x1="0" y1="40" x2="78" y2="40" stroke="#164e22" strokeWidth="0.8" strokeDasharray="3 3" />
              <line x1="0" y1="60" x2="78" y2="60" stroke="#164e22" strokeWidth="0.8" strokeDasharray="3 3" />
              <line x1="100" y1="0" x2="100" y2="78" stroke="#1f4b23" strokeWidth="0.8" strokeDasharray="3 3" />
              <line x1="120" y1="0" x2="120" y2="78" stroke="#1f4b23" strokeWidth="0.8" strokeDasharray="3 3" />
              <line x1="140" y1="0" x2="140" y2="78" stroke="#1f4b23" strokeWidth="0.8" strokeDasharray="3 3" />
              {/* Irrigation Canals & rural roads */}
              <line x1="0" y1="80" x2="160" y2="80" stroke="#1e3a8a" strokeWidth="3" opacity="0.7" />
              <line x1="80" y1="0" x2="80" y2="160" stroke="#475569" strokeWidth="2.5" opacity="0.5" strokeDasharray="6 2" />
            </pattern>

            {/* Terrain Elevation Contour Lines Pattern */}
            <pattern id="terrain-contour-grid" width="200" height="200" patternUnits="userSpaceOnUse">
              <rect width="200" height="200" fill="#1c1917" />
              <path d="M 0 50 Q 50 20 100 60 T 200 40" fill="none" stroke="#78716c" strokeWidth="1" opacity="0.35" />
              <path d="M 0 100 Q 60 140 120 90 T 200 120" fill="none" stroke="#78716c" strokeWidth="1.2" opacity="0.4" />
              <path d="M 0 150 Q 80 120 140 170 T 200 150" fill="none" stroke="#78716c" strokeWidth="1" opacity="0.35" />
              <circle cx="100" cy="100" r="35" fill="none" stroke="#a8a29e" strokeWidth="1.5" opacity="0.5" strokeDasharray="4 2" />
              <text x="105" y="98" fill="#a8a29e" fontSize="9" opacity="0.6">120m</text>
            </pattern>

            {/* Street / Cadastral Grid Pattern */}
            <pattern id="street-grid" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="100" height="100" fill="#0f172a" />
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#334155" strokeWidth="1" opacity="0.4" />
              <path d="M 50 0 L 50 100 M 0 50 L 100 50" fill="none" stroke="#1e293b" strokeWidth="0.75" />
            </pattern>

            {/* Pulsing Red Hazard Glow Filter */}
            <filter id="hazard-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Base Layer Background */}
          <rect
            width="100%"
            height="100%"
            fill={
              baseLayer === 'satellite'
                ? 'url(#satellite-farmland-grid)'
                : baseLayer === 'terrain'
                ? 'url(#terrain-contour-grid)'
                : 'url(#street-grid)'
            }
          />

          {/* Agricultural Overlays layer */}
          {overlay === 'ndvi' && (
            <g id="ndvi-overlay-layer" opacity={overlayOpacity}>
              {fields.map((f) => {
                const ndviColor = f.ndviScore > 0.8 ? '#15803d' : f.ndviScore > 0.65 ? '#84cc16' : '#eab308';
                return (
                  <path
                    key={`ndvi-${f.id}`}
                    d={getPolygonPath(f.coordinates)}
                    fill={ndviColor}
                    opacity="0.85"
                    stroke="#4ade80"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />
                );
              })}
            </g>
          )}

          {overlay === 'moisture' && (
            <g id="moisture-overlay-layer" opacity={overlayOpacity}>
              {fields.map((f) => {
                const moist = f.soil.moisturePercent;
                const mColor = moist > 85 ? '#0284c7' : moist > 65 ? '#38bdf8' : '#ca8a04';
                return (
                  <path
                    key={`moist-${f.id}`}
                    d={getPolygonPath(f.coordinates)}
                    fill={mColor}
                    opacity="0.75"
                    stroke="#0284c7"
                    strokeWidth="1.5"
                  />
                );
              })}
            </g>
          )}

          {overlay === 'risk_heat' && (
            <g id="risk-heat-overlay-layer" opacity={overlayOpacity}>
              {fields
                .filter((f) => f.riskLevel !== 'BINH_THUONG')
                .map((f) => {
                  const centerPt = latLngToPoint(f.center);
                  const isCritical = f.riskLevel === 'NGUY_CO_CAO';
                  return (
                    <circle
                      key={`heat-${f.id}`}
                      cx={centerPt.x}
                      cy={centerPt.y}
                      r={isCritical ? '120' : '80'}
                      fill={isCritical ? '#ef4444' : '#f59e0b'}
                      opacity="0.3"
                      filter="url(#hazard-glow)"
                    />
                  );
                })}
            </g>
          )}

          {/* Render All Registered Farm Field Polygons */}
          <g 
            id="farm-fields-layer"
            style={{
              pointerEvents: drawingState.isDrawing || measureMode ? 'none' : 'auto',
            }}
          >
            {filteredFields.map((field) => {
              const isSelected = selectedField?.id === field.id;
              const isHovered = hoveredField?.id === field.id;
              const isBeingEdited = isEditingExistingField === field.id;
              const coords = isBeingEdited ? editableVertices : field.coordinates;
              const pathD = getPolygonPath(coords);
              const colors = getRiskColor(field.riskLevel);
              const centerPt = latLngToPoint(field.center);
              const cropCfg = CROP_CONFIG[field.cropType] || { name: field.cropType, icon: '🌱' };

              return (
                <g 
                  key={field.id} 
                  id={`field-polygon-group-${field.id}`}
                  className="cursor-pointer transition-all group"
                  onClick={(e) => {
                    if (drawingState.isDrawing || measureMode) return;
                    e.stopPropagation();
                    onSelectField(field);
                  }}
                  onMouseEnter={() => setHoveredField(field)}
                  onMouseLeave={() => setHoveredField(null)}
                >
                  {/* Critical Risk Pulsing Rings */}
                  {field.riskLevel === 'NGUY_CO_CAO' && (
                    <circle
                      cx={centerPt.x}
                      cy={centerPt.y}
                      r="40"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2.5"
                      opacity="0.8"
                      className="animate-ping"
                      style={{ transformOrigin: `${centerPt.x}px ${centerPt.y}px` }}
                    />
                  )}

                  {/* Main Polygon Fill & Stroke */}
                  <path
                    d={pathD}
                    fill={isSelected ? 'rgba(16, 185, 129, 0.55)' : colors.fill}
                    stroke={isSelected ? '#10b981' : colors.stroke}
                    strokeWidth={isSelected ? 3.5 : isHovered ? 2.5 : 1.8}
                    strokeDasharray={isBeingEdited ? '6 3' : 'none'}
                    filter={field.riskLevel === 'NGUY_CO_CAO' ? 'url(#hazard-glow)' : 'none'}
                    className="transition-all duration-200"
                  />

                  {/* Vertices handles if this existing field is currently being edited */}
                  {isBeingEdited &&
                    editableVertices.map((v, vIdx) => {
                      const vPt = latLngToPoint(v);
                      return (
                        <circle
                          key={`v-edit-${vIdx}`}
                          cx={vPt.x}
                          cy={vPt.y}
                          r="8"
                          fill="#f59e0b"
                          stroke="#ffffff"
                          strokeWidth="2.5"
                          className="cursor-grab active:cursor-grabbing hover:scale-125 transition-transform"
                          style={{ pointerEvents: 'auto' }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDraggingVertexIdx(vIdx);
                          }}
                        />
                      );
                    })}

                  {/* Centered Field Marker / Badge */}
                  <foreignObject
                    x={centerPt.x - 65}
                    y={centerPt.y - 24}
                    width="130"
                    height="50"
                    className="pointer-events-none overflow-visible"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div 
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-xl text-[11px] font-bold shadow-xl border backdrop-blur-md transition-all ${
                          isSelected
                            ? 'bg-emerald-900/95 text-emerald-200 border-emerald-400 scale-105 shadow-emerald-950/60'
                            : field.riskLevel === 'NGUY_CO_CAO'
                            ? 'bg-rose-950/95 text-rose-200 border-rose-500 shadow-rose-950/60'
                            : field.riskLevel === 'CANH_BAO_NHE'
                            ? 'bg-amber-950/95 text-amber-200 border-amber-500'
                            : 'bg-stone-900/90 text-stone-200 border-stone-700/80'
                        }`}
                      >
                        <span>{cropCfg.icon}</span>
                        <span className="truncate max-w-[80px]">{field.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-stone-300 drop-shadow-md mt-0.5 bg-black/60 px-1.5 py-0.2 rounded">
                        {field.areaHa} ha
                      </span>
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </g>

          {/* Currently Drawing Polygon Layer (Live Digitization) */}
          {drawingState.isDrawing && (
            <g id="live-drawing-polygon-layer">
              {/* Completed segments of polygon being drawn */}
              {drawingState.vertices.length > 1 && (
                <path
                  d={
                    drawingState.vertices
                      .map((pt, i) => {
                        const p = latLngToPoint(pt);
                        return `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
                      })
                      .join(' ') + (drawingState.vertices.length >= 3 ? ' Z' : '')
                  }
                  fill={
                    drawingState.hasCollisionWarning
                      ? 'rgba(245, 158, 11, 0.45)'
                      : 'rgba(16, 185, 129, 0.35)'
                  }
                  stroke={drawingState.hasCollisionWarning ? '#f59e0b' : '#10b981'}
                  strokeWidth="2.5"
                  strokeDasharray="6 3"
                />
              )}

              {/* Dynamic Guide Line from last vertex to mouse position */}
              {drawingState.vertices.length > 0 && mouseSvgPos && drawMode === 'polygon' && (
                <g>
                  {/* Dashed line to cursor */}
                  <line
                    x1={latLngToPoint(drawingState.vertices[drawingState.vertices.length - 1]).x}
                    y1={latLngToPoint(drawingState.vertices[drawingState.vertices.length - 1]).y}
                    x2={mouseSvgPos.x}
                    y2={mouseSvgPos.y}
                    stroke="#34d399"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />

                  {/* Live distance badge on dynamic segment */}
                  {currentSegmentDistance > 0 && (
                    <foreignObject
                      x={(latLngToPoint(drawingState.vertices[drawingState.vertices.length - 1]).x + mouseSvgPos.x) / 2 - 35}
                      y={(latLngToPoint(drawingState.vertices[drawingState.vertices.length - 1]).y + mouseSvgPos.y) / 2 - 20}
                      width="70"
                      height="30"
                      className="pointer-events-none"
                    >
                      <div className="flex items-center justify-center">
                        <span className="px-1.5 py-0.5 rounded-md bg-stone-900/95 border border-emerald-500/60 font-mono text-[10px] text-emerald-300 shadow-md">
                          {currentSegmentDistance} m
                        </span>
                      </div>
                    </foreignObject>
                  )}
                </g>
              )}

              {/* Placed Vertex Handles */}
              {drawingState.vertices.map((v, idx) => {
                const pt = latLngToPoint(v);
                const isFirst = idx === 0;
                return (
                  <g key={`draw-v-${idx}`}>
                    {/* Pulsing target on first vertex to indicate closing */}
                    {isFirst && drawingState.vertices.length >= 3 && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHoveringFirstVertex ? "22" : "16"}
                        fill="none"
                        stroke="#34d399"
                        strokeWidth={isHoveringFirstVertex ? "3" : "2"}
                        className="animate-ping"
                      />
                    )}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isFirst ? 9 : 7}
                      fill={isFirst ? '#10b981' : '#38bdf8'}
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      className="cursor-grab active:cursor-grabbing hover:scale-125 transition-transform"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        // If clicking first vertex when >= 3 points, close & save
                        if (isFirst && drawingState.vertices.length >= 3) {
                          handleCompleteAndSave();
                          return;
                        }
                        setDraggingVertexIdx(idx);
                      }}
                    />
                    <text
                      x={pt.x + 10}
                      y={pt.y - 8}
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="bold"
                      className="drop-shadow bg-black"
                    >
                      P{idx + 1}
                    </text>
                  </g>
                );
              })}

              {/* Snapping Close Tooltip when hovering near start point */}
              {isHoveringFirstVertex && drawingState.vertices.length >= 3 && (
                <foreignObject
                  x={latLngToPoint(drawingState.vertices[0]).x - 65}
                  y={latLngToPoint(drawingState.vertices[0]).y - 42}
                  width="130"
                  height="35"
                  className="pointer-events-none"
                >
                  <div className="flex items-center justify-center">
                    <span className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold shadow-xl border border-emerald-400 animate-bounce">
                      {t.snapToClose}
                    </span>
                  </div>
                </foreignObject>
              )}
            </g>
          )}

          {/* Measurement Distance Tool Line & Label */}
          {measureMode && measurePoints.length > 0 && (
            <g id="measure-tool-layer">
              {measurePoints.map((pt, i) => {
                const p = latLngToPoint(pt);
                return (
                  <circle
                    key={`m-pt-${i}`}
                    cx={p.x}
                    cy={p.y}
                    r="6"
                    fill="#38bdf8"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                );
              })}
              {measurePoints.length > 1 && (
                <path
                  d={measurePoints
                    .map((pt, i) => {
                      const p = latLngToPoint(pt);
                      return `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeDasharray="5 3"
                />
              )}
            </g>
          )}
        </svg>
      </div>

      {/* Measurement HUD banner */}
      {measureMode && (
        <div 
          id="measure-hud-banner"
          className="absolute top-18 left-4 z-20 flex items-center gap-3 px-4 py-2 rounded-2xl bg-sky-950/90 backdrop-blur-xl border border-sky-600/50 shadow-xl text-sky-200 text-xs font-medium"
        >
          <span>{measurePoints.length < 2 ? t.measuringPrompt : `${t.totalDistance}:`}</span>
          {measurePoints.length >= 2 && (
            <span className="font-mono text-sm font-bold text-white px-2 py-0.5 rounded bg-sky-900">
              {totalMeasuredMeters > 1000
                ? `${(totalMeasuredMeters / 1000).toFixed(2)} km`
                : `${totalMeasuredMeters} m`}
            </span>
          )}
          <button
            onClick={() => setMeasurePoints([])}
            className="text-[11px] text-sky-400 hover:text-white underline ml-1"
          >
            {t.clearMeasure}
          </button>
        </div>
      )}

      {/* Primary Floating Digitization Toolbar (Bottom Center) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
        <DrawingToolbar
          drawingState={drawingState}
          drawMode={drawMode}
          onChangeDrawMode={(mode) => {
            setDrawMode(mode);
            setRectAnchor(null);
            setDrawingState((prev) => ({ ...prev, vertices: [], drawMode: mode }));
          }}
          onStartDrawing={handleStartDrawing}
          onCancelDrawing={handleCancelDrawing}
          onUndoVertex={handleUndoVertex}
          onClearVertices={handleClearVertices}
          onCompleteAndSave={handleCompleteAndSave}
          onToggleEditMode={handleToggleEditMode}
          isEditMode={!!isEditingExistingField}
          measureMode={measureMode}
          onToggleMeasureMode={() => {
            setMeasureMode(!measureMode);
            setMeasurePoints([]);
          }}
          onAddQuickTemplate={handleAddQuickTemplate}
          lang={lang}
        />
      </div>

      {/* Map Navigation Controls HUD (Bottom Right) */}
      <div 
        id="map-navigation-controls"
        className="absolute bottom-6 right-4 z-20 flex flex-col items-center gap-1.5 p-1 rounded-2xl bg-stone-950/85 backdrop-blur-xl border border-stone-800 shadow-2xl text-stone-200"
      >
        {/* Zoom In */}
        <button
          id="btn-map-zoom-in"
          onClick={handleZoomIn}
          className="p-2.5 rounded-xl hover:bg-stone-800 text-stone-200 hover:text-white transition-colors"
          title="Zoom In (+)"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Zoom Out */}
        <button
          id="btn-map-zoom-out"
          onClick={handleZoomOut}
          className="p-2.5 rounded-xl hover:bg-stone-800 text-stone-200 hover:text-white transition-colors"
          title="Zoom Out (-)"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="w-5 h-px bg-stone-800 my-0.5" />

        {/* Reset View */}
        <button
          id="btn-map-reset-view"
          onClick={handleResetView}
          className="p-2.5 rounded-xl hover:bg-stone-800 text-stone-200 hover:text-white transition-colors"
          title={t.resetView}
        >
          <Compass className="w-4 h-4 text-emerald-400" />
        </button>

        {/* Locate Me (Simulation) */}
        <button
          id="btn-map-locate-me"
          onClick={() => {
            setCenter({ lat: 10.605, lng: 105.895 });
            setZoom(15.5);
          }}
          className="p-2.5 rounded-xl hover:bg-stone-800 text-stone-200 hover:text-white transition-colors"
          title={t.locateMe}
        >
          <Crosshair className="w-4 h-4 text-sky-400" />
        </button>
      </div>

      {/* Geospatial Coordinates & Scale Bar HUD (Bottom Left) */}
      <div 
        id="map-coordinates-hud"
        className="absolute bottom-6 left-4 z-20 flex items-center gap-3 px-3 py-1.5 rounded-xl bg-stone-950/80 backdrop-blur-md border border-stone-800/80 text-[11px] font-mono text-stone-400 shadow-lg pointer-events-none"
      >
        <span>
          Lat: <strong className="text-stone-200">{mouseMapPos?.lat || center.lat}</strong>
        </span>
        <span>
          Lng: <strong className="text-stone-200">{mouseMapPos?.lng || center.lng}</strong>
        </span>
        <span className="hidden sm:inline border-l border-stone-800 pl-2">
          Zoom: <strong className="text-stone-200">{zoom.toFixed(1)}x</strong>
        </span>
        <span className="hidden md:inline border-l border-stone-800 pl-2 text-emerald-400 font-sans">
          WGS 84 / VN-2000
        </span>
      </div>
    </div>
  );
};
