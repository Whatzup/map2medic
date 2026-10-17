import React, { useState } from 'react';
import { Activity, HeartPulse, Wind, Thermometer, Droplet, TrendingUp, Calendar, Info } from 'lucide-react';

export interface VitalRecordPoint {
  id: string;
  bookingId: string;
  date: string;
  bpSys: number;
  bpDia: number;
  pulse: number;
  spo2: number;
  temp: number;
  glucose: number;
  notes?: string;
  providerName?: string;
}

interface VitalsTrendChartProps {
  vitalsData: VitalRecordPoint[];
  onSelectVisit?: (bookingId: string) => void;
}

export const VitalsTrendChart: React.FC<VitalsTrendChartProps> = ({
  vitalsData,
  onSelectVisit
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'bp' | 'pulse' | 'spo2' | 'glucose' | 'temp'>('bp');
  const [hoveredPoint, setHoveredPoint] = useState<VitalRecordPoint | null>(null);

  if (!vitalsData || vitalsData.length === 0) {
    return (
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl text-center space-y-2">
        <Activity className="w-8 h-8 text-slate-400 mx-auto" />
        <h4 className="text-sm font-bold text-slate-800">No Multi-Visit Vitals Charted Yet</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          As visiting clinicians record patient vitals during home visits, your interactive trend graph across all visits will render here automatically.
        </p>
      </div>
    );
  }

  // Sort vitals chronologically
  const sortedData = [...vitalsData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculations for chart bounding box
  const chartHeight = 180;
  const chartWidth = 580;
  const paddingX = 40;
  const paddingY = 25;
  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;

  // Compute positions
  const getX = (index: number) => {
    if (sortedData.length <= 1) return chartWidth / 2;
    return paddingX + (index / (sortedData.length - 1)) * innerWidth;
  };

  // Metric value helper for min/max
  const getVal = (p: VitalRecordPoint) => {
    switch (selectedMetric) {
      case 'bp': return p.bpSys;
      case 'pulse': return p.pulse;
      case 'spo2': return p.spo2;
      case 'glucose': return p.glucose;
      case 'temp': return p.temp;
    }
  };

  const values = sortedData.map(getVal);
  let minVal = Math.min(...values);
  let maxVal = Math.max(...values);

  if (selectedMetric === 'bp') {
    const diaValues = sortedData.map(p => p.bpDia);
    minVal = Math.min(minVal, ...diaValues);
    maxVal = Math.max(maxVal, ...sortedData.map(p => p.bpSys));
  }

  // Add margin to min/max
  const rangeMargin = (maxVal - minVal) * 0.25 || 10;
  minVal = Math.floor(minVal - rangeMargin);
  maxVal = Math.ceil(maxVal + rangeMargin);

  const getY = (val: number) => {
    if (maxVal === minVal) return chartHeight / 2;
    return chartHeight - paddingY - ((val - minVal) / (maxVal - minVal)) * innerHeight;
  };

  // Generate SVG path for primary line
  const pointsString = sortedData.map((p, idx) => `${getX(idx)},${getY(getVal(p))}`).join(' ');

  // For BP, generate secondary path for Diastolic
  const diaPointsString = selectedMetric === 'bp' 
    ? sortedData.map((p, idx) => `${getX(idx)},${getY(p.bpDia)}`).join(' ') 
    : '';

  // Calculate Averages
  const avgSys = Math.round(sortedData.reduce((acc, p) => acc + p.bpSys, 0) / sortedData.length);
  const avgDia = Math.round(sortedData.reduce((acc, p) => acc + p.bpDia, 0) / sortedData.length);
  const avgPulse = Math.round(sortedData.reduce((acc, p) => acc + p.pulse, 0) / sortedData.length);
  const avgSpo2 = Math.round(sortedData.reduce((acc, p) => acc + p.spo2, 0) / sortedData.length);
  const avgGlucose = Math.round(sortedData.reduce((acc, p) => acc + p.glucose, 0) / sortedData.length);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-5">
      {/* Header & Metric Switches */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-700" />
            <h3 className="text-base font-extrabold font-heading text-slate-900">
              Multi-Visit Clinical Vitals Trend Graph
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Plotted across all {sortedData.length} recorded patient home visits
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            onClick={() => setSelectedMetric('bp')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              selectedMetric === 'bp' 
                ? 'bg-teal-700 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Blood Pressure</span>
          </button>

          <button
            onClick={() => setSelectedMetric('pulse')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              selectedMetric === 'pulse' 
                ? 'bg-emerald-700 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Pulse (bpm)</span>
          </button>

          <button
            onClick={() => setSelectedMetric('spo2')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              selectedMetric === 'spo2' 
                ? 'bg-sky-700 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>SpO2 (%)</span>
          </button>

          <button
            onClick={() => setSelectedMetric('glucose')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              selectedMetric === 'glucose' 
                ? 'bg-purple-700 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Droplet className="w-3.5 h-3.5" />
            <span>Glucose</span>
          </button>

          <button
            onClick={() => setSelectedMetric('temp')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              selectedMetric === 'temp' 
                ? 'bg-amber-700 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>Temp (°F)</span>
          </button>
        </div>
      </div>

      {/* Summary Averages Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-teal-50 border border-teal-200/80 rounded-2xl">
          <span className="text-[10px] font-bold text-teal-800 uppercase block">Avg Blood Pressure</span>
          <p className="text-base font-extrabold text-teal-950 font-heading mt-0.5">{avgSys}/{avgDia} mmHg</p>
          <span className="text-[10px] text-teal-700">Normotensive Range</span>
        </div>

        <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl">
          <span className="text-[10px] font-bold text-emerald-800 uppercase block">Avg Pulse Rate</span>
          <p className="text-base font-extrabold text-emerald-950 font-heading mt-0.5">{avgPulse} bpm</p>
          <span className="text-[10px] text-emerald-700">Sinus Rhythm</span>
        </div>

        <div className="p-3 bg-sky-50 border border-sky-200/80 rounded-2xl">
          <span className="text-[10px] font-bold text-sky-800 uppercase block">Avg Oxygen SpO2</span>
          <p className="text-base font-extrabold text-sky-950 font-heading mt-0.5">{avgSpo2}%</p>
          <span className="text-[10px] text-sky-700">Optimal Oxygenation</span>
        </div>

        <div className="p-3 bg-purple-50 border border-purple-200/80 rounded-2xl">
          <span className="text-[10px] font-bold text-purple-800 uppercase block">Avg Glucose Level</span>
          <p className="text-base font-extrabold text-purple-950 font-heading mt-0.5">{avgGlucose} mg/dL</p>
          <span className="text-[10px] text-purple-700">Euglycemic Target</span>
        </div>
      </div>

      {/* SVG Interactive Trend Chart Area */}
      <div className="relative bg-slate-900 rounded-3xl p-4 sm:p-6 overflow-hidden text-white shadow-inner">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-bold text-teal-300 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-400" />
            {selectedMetric === 'bp' && 'Blood Pressure Trend (Systolic & Diastolic Line Graph)'}
            {selectedMetric === 'pulse' && 'Pulse & Heart Rate Trend (bpm)'}
            {selectedMetric === 'spo2' && 'SpO2 Oxygen Saturation Trend (%)'}
            {selectedMetric === 'glucose' && 'Blood Sugar / Glucose Trend (mg/dL)'}
            {selectedMetric === 'temp' && 'Body Temperature Trend (°F)'}
          </span>
          {selectedMetric === 'bp' && (
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-teal-400 inline-block"></span> Systolic</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span> Diastolic</span>
            </div>
          )}
        </div>

        <div className="w-full overflow-x-auto">
          <svg 
            viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
            className="w-full h-48 sm:h-56 overflow-visible"
          >
            {/* Background Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = paddingY + pct * innerHeight;
              const labelVal = Math.round(maxVal - pct * (maxVal - minVal));
              return (
                <g key={i}>
                  <line 
                    x1={paddingX} 
                    y1={y} 
                    x2={chartWidth - paddingX} 
                    y2={y} 
                    stroke="rgba(255,255,255,0.08)" 
                    strokeDasharray="4,4" 
                  />
                  <text 
                    x={paddingX - 8} 
                    y={y + 3} 
                    fill="rgba(255,255,255,0.4)" 
                    fontSize="9" 
                    textAnchor="end"
                  >
                    {labelVal}
                  </text>
                </g>
              );
            })}

            {/* Systolic or Primary Line */}
            {sortedData.length > 1 && (
              <polyline
                fill="none"
                stroke="#14b8a6"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pointsString}
              />
            )}

            {/* Diastolic Line for BP */}
            {selectedMetric === 'bp' && sortedData.length > 1 && (
              <polyline
                fill="none"
                stroke="#34d399"
                strokeWidth="2.5"
                strokeDasharray="3,3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={diaPointsString}
              />
            )}

            {/* Data Points */}
            {sortedData.map((p, idx) => {
              const cx = getX(idx);
              const cyPrimary = getY(getVal(p));
              const cyDia = getY(p.bpDia);
              const isHovered = hoveredPoint?.id === p.id;

              return (
                <g key={p.id || idx} className="cursor-pointer">
                  {/* Vertical guide line on hover */}
                  {isHovered && (
                    <line
                      x1={cx}
                      y1={paddingY}
                      x2={cx}
                      y2={chartHeight - paddingY}
                      stroke="rgba(45, 212, 191, 0.4)"
                      strokeWidth="1.5"
                      strokeDasharray="2,2"
                    />
                  )}

                  {/* Primary Point */}
                  <circle
                    cx={cx}
                    cy={cyPrimary}
                    r={isHovered ? 7 : 5}
                    fill="#14b8a6"
                    stroke="#ffffff"
                    strokeWidth={isHovered ? 3 : 2}
                    onMouseEnter={() => setHoveredPoint(p)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    onClick={() => onSelectVisit && onSelectVisit(p.bookingId)}
                  />

                  {/* Secondary Point for BP Diastolic */}
                  {selectedMetric === 'bp' && (
                    <circle
                      cx={cx}
                      cy={cyDia}
                      r={isHovered ? 6 : 4}
                      fill="#34d399"
                      stroke="#ffffff"
                      strokeWidth="2"
                      onMouseEnter={() => setHoveredPoint(p)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      onClick={() => onSelectVisit && onSelectVisit(p.bookingId)}
                    />
                  )}

                  {/* Date X-Axis Label */}
                  <text
                    x={cx}
                    y={chartHeight - 5}
                    fill="rgba(255,255,255,0.6)"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {p.date.split(',')[0] || p.date.split('T')[0]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div className="mt-3 p-3 bg-slate-800/90 border border-teal-500/40 rounded-2xl text-xs text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 animate-in fade-in duration-150">
            <div>
              <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wider block">
                Visit Record #{hoveredPoint.bookingId} • {hoveredPoint.date}
              </span>
              <p className="font-extrabold text-sm text-white mt-0.5">
                BP: {hoveredPoint.bpSys}/{hoveredPoint.bpDia} mmHg | Pulse: {hoveredPoint.pulse} bpm | SpO2: {hoveredPoint.spo2}% | Temp: {hoveredPoint.temp}°F | Glucose: {hoveredPoint.glucose} mg/dL
              </p>
              {hoveredPoint.notes && (
                <p className="text-[11px] text-teal-100/80 mt-0.5 italic">
                  &ldquo;{hoveredPoint.notes}&rdquo;
                </p>
              )}
            </div>

            {onSelectVisit && (
              <button
                onClick={() => onSelectVisit(hoveredPoint.bookingId)}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold rounded-xl shrink-0 cursor-pointer shadow-sm"
              >
                View Visit Details →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
