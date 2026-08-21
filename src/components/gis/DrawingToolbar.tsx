import React from 'react';
import { 
  Pencil, 
  Hand, 
  Trash2, 
  Save, 
  X, 
  RotateCcw, 
  Ruler, 
  AlertTriangle,
  Sparkles,
  Square,
  Pentagon,
  Wand2,
  CheckCircle2
} from 'lucide-react';
import { DrawingPolygonState } from '../../types';

interface DrawingToolbarProps {
  drawingState: DrawingPolygonState;
  drawMode: 'polygon' | 'rectangle';
  onChangeDrawMode: (mode: 'polygon' | 'rectangle') => void;
  onStartDrawing: (mode?: 'polygon' | 'rectangle') => void;
  onCancelDrawing: () => void;
  onUndoVertex: () => void;
  onClearVertices: () => void;
  onCompleteAndSave: () => void;
  onToggleEditMode: () => void;
  isEditMode: boolean;
  measureMode: boolean;
  onToggleMeasureMode: () => void;
  onAddQuickTemplate: () => void;
  lang: 'en' | 'vi';
}

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  drawingState,
  drawMode,
  onChangeDrawMode,
  onStartDrawing,
  onCancelDrawing,
  onUndoVertex,
  onClearVertices,
  onCompleteAndSave,
  onToggleEditMode,
  isEditMode,
  measureMode,
  onToggleMeasureMode,
  onAddQuickTemplate,
  lang,
}) => {
  const { isDrawing, vertices, calculatedAreaHa, calculatedAreaM2, hasCollisionWarning, collisionFieldNames } = drawingState;

  const t = {
    drawPolygon: lang === 'vi' ? 'Vẽ Ranh Giới' : 'Digitize Polygon',
    polygonMode: lang === 'vi' ? 'Đa giác tự do' : 'Polygon (Points)',
    rectangleMode: lang === 'vi' ? 'Hình chữ nhật' : 'Rectangle (Box)',
    quickTemplate: lang === 'vi' ? 'Thửa mẫu 1.5ha' : 'Sample 1.5ha',
    drawingActive: lang === 'vi' ? 'Đang số hóa' : 'Digitizing Active',
    editPolygon: lang === 'vi' ? 'Chỉnh Đỉnh' : 'Edit Vertices',
    editingActive: lang === 'vi' ? 'Đang sửa đỉnh' : 'Editing Mode',
    measureTool: lang === 'vi' ? 'Đo Khoảng Cách' : 'Measure Distance',
    undoPoint: lang === 'vi' ? 'Hoàn tác (Ctrl+Z)' : 'Undo Point (Ctrl+Z)',
    clearAll: lang === 'vi' ? 'Xóa vẽ' : 'Clear All',
    saveField: lang === 'vi' ? 'Lưu Thửa Đất' : 'Save Field Plot',
    cancel: lang === 'vi' ? 'Hủy (Esc)' : 'Cancel (Esc)',
    pointsCount: lang === 'vi' ? 'điểm' : 'points',
    overlapAlert: lang === 'vi' 
      ? `Cảnh báo: Trùng lấn với ${collisionFieldNames.join(', ')}` 
      : `Warning: Overlapping with ${collisionFieldNames.join(', ')}`,
    drawPrompt: lang === 'vi'
      ? drawMode === 'rectangle'
        ? 'Nhấp chuột điểm 1 rồi nhấp điểm 2 để tạo thửa hình chữ nhật.'
        : 'Nhấp trên bản đồ để thêm đỉnh (hoặc nhấp đúp để khép góc).'
      : drawMode === 'rectangle'
      ? 'Click point 1 then click point 2 to create rectangular plot.'
      : 'Click on map to add vertices (double-click to close).',
    readyToSave: lang === 'vi'
      ? 'Đã khép góc! Nhấp "Lưu Thửa Đất" hoặc Nhấp đúp để hoàn tất.'
      : 'Polygon ready! Click "Save Field Plot" or double-click.',
  };

  return (
    <div id="gis-drawing-toolbar-container" className="flex flex-col items-center gap-2 pointer-events-auto">
      {/* Real-time Guidance Banner */}
      {isDrawing && (
        <div 
          id="drawing-status-banner"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium backdrop-blur-xl shadow-2xl border transition-all ${
            hasCollisionWarning
              ? 'bg-amber-950/90 text-amber-200 border-amber-500/80 animate-pulse'
              : vertices.length >= 3
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/80 shadow-emerald-950/50'
              : 'bg-stone-950/90 text-stone-200 border-stone-800'
          }`}
        >
          {hasCollisionWarning ? (
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          ) : vertices.length >= 3 ? (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
          )}
          <span className="font-medium">
            {hasCollisionWarning
              ? t.overlapAlert
              : vertices.length >= 3
              ? t.readyToSave
              : t.drawPrompt}
          </span>
          <span className="ml-1 px-2 py-0.5 rounded-md bg-stone-900 border border-stone-700 font-mono text-[11px] text-emerald-400">
            {vertices.length} {t.pointsCount}
          </span>
        </div>
      )}

      {/* Main Floating Tool Strip */}
      <div 
        id="gis-drawing-toolbar"
        className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-stone-950/95 backdrop-blur-2xl border border-stone-800 shadow-2xl text-stone-200"
      >
        {/* Draw Mode Trigger & Mode Switcher */}
        {!isDrawing && !isEditMode ? (
          <div className="flex items-center gap-1">
            {/* Start Digitize Polygon */}
            <button
              id="btn-start-draw-polygon"
              onClick={() => onStartDrawing('polygon')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/50 transition-all active:scale-95"
              title="Digitize polygon point by point"
            >
              <Pentagon className="w-4 h-4" />
              <span>{t.drawPolygon}</span>
            </button>

            {/* Quick Rectangle Tool */}
            <button
              id="btn-start-draw-rect"
              onClick={() => onStartDrawing('rectangle')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-stone-900 text-stone-300 hover:text-white border border-stone-800/80 text-xs font-medium transition-all"
              title={t.rectangleMode}
            >
              <Square className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">{t.rectangleMode}</span>
            </button>

            {/* Quick Sample Template Plot */}
            <button
              id="btn-quick-sample-template"
              onClick={onAddQuickTemplate}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-stone-900 text-emerald-400 hover:text-emerald-300 border border-stone-800/80 text-xs font-medium transition-all"
              title="Add sample 1.5ha plot at center"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t.quickTemplate}</span>
            </button>
          </div>
        ) : isDrawing ? (
          <div className="flex items-center gap-1">
            {/* Mode Switcher inside drawing */}
            <div className="flex items-center bg-stone-900/90 rounded-xl p-0.5 border border-stone-800 mr-1">
              <button
                onClick={() => onChangeDrawMode('polygon')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  drawMode === 'polygon'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Polygon mode"
              >
                <Pentagon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Đa giác</span>
              </button>
              <button
                onClick={() => onChangeDrawMode('rectangle')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  drawMode === 'rectangle'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Rectangle mode"
              >
                <Square className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hình chữ nhật</span>
              </button>
            </div>

            {/* Undo Vertex */}
            <button
              id="btn-undo-vertex"
              onClick={onUndoVertex}
              disabled={vertices.length === 0}
              className="p-2 rounded-xl hover:bg-stone-800 text-stone-300 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
              title={t.undoPoint}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Clear All */}
            <button
              id="btn-clear-vertices"
              onClick={onClearVertices}
              disabled={vertices.length === 0}
              className="p-2 rounded-xl hover:bg-stone-800 text-stone-300 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
              title={t.clearAll}
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
            </button>

            {/* Save / Complete Polygon */}
            <button
              id="btn-save-polygon"
              onClick={onCompleteAndSave}
              disabled={vertices.length < 3}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-md active:scale-95 ${
                vertices.length >= 3
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60 ring-2 ring-emerald-400/50 animate-pulse'
                  : 'bg-stone-900 text-stone-600 border border-stone-800 cursor-not-allowed'
              }`}
              title={t.saveField}
            >
              <Save className="w-4 h-4" />
              <span>{t.saveField}</span>
            </button>

            {/* Cancel */}
            <button
              id="btn-cancel-draw"
              onClick={onCancelDrawing}
              className="p-2 rounded-xl hover:bg-rose-950/60 text-rose-400 transition-all border border-transparent hover:border-rose-800/60"
              title={t.cancel}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : null}

        {/* Edit Vertices of Selected Field */}
        {!isDrawing && (
          <button
            id="btn-toggle-edit-mode"
            onClick={onToggleEditMode}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              isEditMode
                ? 'bg-amber-600 text-white shadow-md shadow-amber-950/50'
                : 'hover:bg-stone-900 text-stone-300'
            }`}
            title={t.editPolygon}
          >
            <Hand className="w-4 h-4" />
            <span>{isEditMode ? t.editingActive : t.editPolygon}</span>
          </button>
        )}

        {/* Measure Distance Tool */}
        {!isDrawing && (
          <button
            id="btn-measure-tool"
            onClick={onToggleMeasureMode}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              measureMode
                ? 'bg-sky-600 text-white shadow-md shadow-sky-950/50'
                : 'hover:bg-stone-900 text-stone-300'
            }`}
            title={t.measureTool}
          >
            <Ruler className="w-4 h-4" />
            <span className="hidden sm:inline">{t.measureTool}</span>
          </button>
        )}

        {/* Real-time Dynamic Area Badge */}
        {(isDrawing || isEditMode) && calculatedAreaHa > 0 && (
          <div 
            id="digitized-area-badge"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-semibold ml-1 shadow-inner"
          >
            <span className="text-stone-400 font-sans font-normal text-[11px]">Diện tích:</span>
            <span className="text-sm font-bold text-white">{calculatedAreaHa} ha</span>
            <span className="text-stone-400 text-[10px]">({calculatedAreaM2.toLocaleString()} m²)</span>
          </div>
        )}
      </div>
    </div>
  );
};
