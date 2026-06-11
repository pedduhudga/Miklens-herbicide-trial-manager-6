import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../hooks/useAppState.jsx';
import TopBar from '../components/TopBar.jsx';
import Modal from '../components/Modal.jsx';
import { addProject, deleteProject, addBlock, deleteBlock, updateProject, addBatchTrials, deleteTrial } from '../services/dataLayer.js';
import {
  Plus, Trash2, Layers, Beaker, Activity, ChevronRight, ArrowLeft,
  Lock, Unlock, Download, FileText, RefreshCw, BarChart2, Shuffle,
  ClipboardList, Package, Sparkles, Save, Loader2, CheckCircle2,
  AlertTriangle, AlertCircle, ShieldAlert, LayoutGrid, TrendingUp,
  Sigma, Printer, MapPin, Thermometer, Droplets, CloudRain
} from 'lucide-react';
import Chart from 'chart.js/auto';
import { safeJsonParse } from '../utils/helpers.js';
import { AnalysisEngine } from '../utils/analysisUtils.js';
import PlotMap from '../components/PlotMap.jsx';
import { formatDate, formatDateTime, toDatetimeLocal } from '../utils/dateUtils.js';
import { getCategoryConfig, getPrimaryObservationField } from '../utils/categoryConfig.js';

// ── helpers ────────────────────────────────────────────────────────────────
const INPUT = 'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white';
const toast = (msg, type = 'success') =>
  window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg, type } }));

function MiniBar({ value, max, color = 'bg-emerald-500' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// Inline bar chart — no external lib
function InlineBarChart({ data, color = '#10b981', height = 120 }) {
  if (!data || data.length === 0) return <p className="text-xs text-slate-400 text-center py-4">No data</p>;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group min-w-0">
          <span className="text-[8px] text-slate-400 hidden group-hover:block truncate">{d.value.toFixed(1)}</span>
          <div
            className="w-full rounded-t transition-all hover:opacity-80"
            style={{ height: `${Math.max(4, (d.value / max) * (height - 20))}px`, background: color }}
            title={`${d.label}: ${d.value.toFixed(1)}`}
          />
          <span className="text-[8px] text-slate-400 truncate w-full text-center leading-tight">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Plot mini card ─────────────────────────────────────────────────────────
function PlotMiniCard({ trial, activeCategory = 'herbicide', onClick }) {
  const isControl = String(trial.IsControl).toLowerCase() === 'true';
  const isCheck = String(trial.IsStandardCheck).toLowerCase() === 'true';
  const isCompleted = String(trial.IsCompleted).toLowerCase() === 'true';

  const bg = isControl ? 'bg-orange-50 border-orange-300' : isCheck ? 'bg-purple-50 border-purple-300' : 'bg-blue-50 border-blue-200';
  const ribbon = isControl ? 'bg-orange-500' : isCheck ? 'bg-purple-500' : 'bg-blue-500';
  const badge = isControl
    ? <span className="text-[7px] font-extrabold bg-orange-500 text-white px-1 py-0.5 rounded uppercase">Control</span>
    : isCheck
      ? <span className="text-[7px] font-extrabold bg-purple-500 text-white px-1 py-0.5 rounded uppercase">Standard</span>
      : <span className="text-[7px] font-extrabold bg-blue-500 text-white px-1 py-0.5 rounded uppercase">Exptl</span>;

  const categoryId = trial.Category || activeCategory;
  const projectConfig = getCategoryConfig(categoryId);
  const primaryObsField = getPrimaryObservationField(categoryId);

  const efficacy = safeJsonParse(trial.EfficacyDataJSON, []);
  const latest = efficacy.length ? efficacy[efficacy.length - 1] : null;
  const plotNum = trial.RandomizationOrder || trial.PlotNumber || '?';

  const metricVal = latest ? latest[primaryObsField] : null;

  return (
    <div onClick={onClick} className={`w-40 flex-shrink-0 border-2 rounded-lg p-3 shadow-sm hover:shadow-md transition relative overflow-hidden cursor-pointer ${bg}`}>
      <div className={`absolute top-0 left-0 w-1 h-full ${ribbon}`} />
      <div className="flex justify-between items-start mb-1">
        <span className="text-[9px] font-bold text-slate-400">PLOT {plotNum}</span>
        {badge}
      </div>
      <p className="font-bold text-xs text-slate-800 truncate mb-0.5" title={trial.FormulationName}>{trial.FormulationName || '—'}</p>
      <p className="text-[9px] text-slate-500 truncate">{trial.Dosage || '—'}</p>
      {metricVal !== undefined && metricVal !== null && (
        <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-50 border border-green-200 rounded text-[8px]">
          <span className="font-bold text-green-700">{metricVal}{projectConfig.primaryMetric.unit || ''} {projectConfig.primaryMetric.key}</span>
        </div>
      )}
      <div className="mt-1.5 flex justify-end">
        <span className={`text-[9px] font-bold ${isCompleted ? 'text-emerald-600' : 'text-amber-500'}`}>
          {isCompleted ? 'DONE' : 'ACTIVE'}
        </span>
      </div>
    </div>
  );
}

// ── Block card ─────────────────────────────────────────────────────────────
function BlockCard({ block, trials, activeCategory, onPlotClick, onDeleteBlock, onAddPlot, isLocked }) {
  const projectConfig = getCategoryConfig(activeCategory);
  const controls = trials.filter(t => String(t.IsControl).toLowerCase() === 'true');
  const hasControl = controls.length > 0;
  const tooMany = controls.length > 1;
  const icon = tooMany
    ? <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" title="Multiple controls!" />
    : hasControl
      ? <CheckCircle2 className="w-4 h-4 text-emerald-500" title="Control present" />
      : <AlertTriangle className="w-4 h-4 text-amber-500" title="Missing control!" />;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="bg-slate-50 px-4 py-3 flex justify-between items-center border-b">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 text-white w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs">
            R{block.ReplicationNum || '?'}
          </div>
          <span className="font-bold text-slate-800 text-sm">{block.Name}</span>
          {icon}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{trials.length} plot{trials.length !== 1 ? 's' : ''}</span>
          {!isLocked && onAddPlot && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddPlot(block.ID); }}
              className="p-1 rounded hover:bg-emerald-100 text-emerald-600 transition" title="Add plot to this block"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
          {!isLocked && onDeleteBlock && (
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteBlock(block.ID, block.Name); }}
              className="p-1 rounded hover:bg-red-100 text-red-400 hover:text-red-600 transition" title="Delete block"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="p-3 overflow-x-auto">
        {trials.length > 0 ? (
          <div className="flex gap-3 min-w-max pb-1">
            {[...trials].sort((a, b) => (parseInt(a.RandomizationOrder) || 999) - (parseInt(b.RandomizationOrder) || 999))
              .map(t => <PlotMiniCard key={t.ID} trial={t} activeCategory={activeCategory} onClick={() => onPlotClick && onPlotClick(t.ID)} />)}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic py-3">No plots in this block.</p>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function Projects({ onMenuClick }) {
  const { state, updateState, getAppState } = useAppState();
  const navigate = useNavigate();
  const activeCategory = state.activeCategory || 'herbicide';
  const config = getCategoryConfig(activeCategory);

  // list view state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    Name: '', 
    Metric: config.primaryMetric.label, 
    TargetWeed: '', 
    Crop: '', 
    Location: '', 
    Investigator: '', 
    StartDate: '',
    Lat: '',
    Lon: '',
    WeatherTemp: '',
    WeatherHumidity: '',
    WeatherWind: '',
    WeatherRain: '',
    WeatherDetails: ''
  });

  const [isFetchingGeo, setIsFetchingGeo] = useState(false);
  const [isFetchingGeoProtocol, setIsFetchingGeoProtocol] = useState(false);

  const handleAutofetchLocationAndWeather = () => {
    if (!navigator.geolocation) {
      toast('Geolocation is not supported by this browser', 'error');
      return;
    }
    setIsFetchingGeo(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lon = position.coords.longitude.toFixed(6);
        
        setFormData(prev => ({
          ...prev,
          Location: prev.Location || `Lat: ${lat}, Lon: ${lon}`
        }));
        
        try {
          const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation&wind_speed_unit=kmh`);
          const data = await response.json();
          if (data && data.current) {
            const temp = data.current.temperature_2m;
            const hum = data.current.relative_humidity_2m;
            const wind = data.current.wind_speed_10m;
            const rain = data.current.precipitation;
            
            setFormData(prev => ({
              ...prev,
              Lat: lat,
              Lon: lon,
              WeatherTemp: temp,
              WeatherHumidity: hum,
              WeatherWind: wind,
              WeatherRain: rain,
              WeatherDetails: `${temp}°C, Hum: ${hum}%, Wind: ${wind} km/h, Rain: ${rain}mm`
            }));
            
            toast('Location & current weather fetched successfully!');
          }
        } catch (err) {
          console.warn('Weather fetch failed:', err);
          toast('Location fetched, but weather details could not be retrieved', 'warning');
        } finally {
          setIsFetchingGeo(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast(`Failed to get location: ${error.message}`, 'error');
        setIsFetchingGeo(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleAutofetchLocationAndWeatherForProtocol = () => {
    if (!navigator.geolocation) {
      toast('Geolocation is not supported by this browser', 'error');
      return;
    }
    setIsFetchingGeoProtocol(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lon = position.coords.longitude.toFixed(6);
        
        setProtocolForm(prev => ({
          ...prev,
          Location: prev.Location || `Lat: ${lat}, Lon: ${lon}`
        }));
        
        try {
          const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation&wind_speed_unit=kmh`);
          const data = await response.json();
          if (data && data.current) {
            const temp = data.current.temperature_2m;
            const hum = data.current.relative_humidity_2m;
            const wind = data.current.wind_speed_10m;
            const rain = data.current.precipitation;
            
            setProtocolForm(prev => ({
              ...prev,
              Lat: lat,
              Lon: lon,
              WeatherTemp: temp,
              WeatherHumidity: hum,
              WeatherWind: wind,
              WeatherRain: rain,
              WeatherDetails: `${temp}°C, Hum: ${hum}%, Wind: ${wind} km/h, Rain: ${rain}mm`
            }));
            
            toast('Location & current weather fetched successfully!');
          }
        } catch (err) {
          console.warn('Weather fetch failed:', err);
          toast('Location fetched, but weather details could not be retrieved', 'warning');
        } finally {
          setIsFetchingGeoProtocol(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast(`Failed to get location: ${error.message}`, 'error');
        setIsFetchingGeoProtocol(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Reset/sync Metric default when activeCategory changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, Metric: config.primaryMetric.label }));
  }, [activeCategory, config.primaryMetric.label]);

  // dashboard state
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [postHocMethod, setPostHocMethod] = useState('lsd');
  const [narrative, setNarrative] = useState('');
  const [isSavingNarrative, setIsSavingNarrative] = useState(false);
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [blockForm, setBlockForm] = useState({ Name: '', ReplicationNum: '' });
  const [showMap, setShowMap] = useState(false);
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' | 'report'

  const wceChartRef = useRef(null);
  const perfChartRef = useRef(null);
  const speciesChartRef = useRef(null);
  const radarChartRef = useRef(null);
  const yieldChartRef = useRef(null);

  const [randomizeForm, setRandomizeForm] = useState({
    investigatorName: '',
    dosage: '',
    weedSpecies: '',
    date: new Date().toISOString().split('T')[0],
    replications: '4'
  });
  const [selectedTreatments, setSelectedTreatments] = useState({});
  const [randomizeTreatments, setRandomizeTreatments] = useState([]);

  const activeFormulations = useMemo(() => {
    return (state.formulations || []).filter(f => f.Category === activeCategory || (!f.Category && activeCategory === 'herbicide'));
  }, [state.formulations, activeCategory]);

  const projects = useMemo(() => {
    return (state.projects || []).filter(p => p.Category === activeCategory || (!p.Category && activeCategory === 'herbicide'));
  }, [state.projects, activeCategory]);

  const activeProject = activeProjectId ? projects.find(p => String(p.ID) === String(activeProjectId)) : null;

  // ── Design completeness ─────────────────────────────────────────────────
  const designCheck = useMemo(() => {
    if (!activeProject) return null;
    const blocks = (state.blocks || []).filter(b => String(b.ProjectID) === String(activeProject.ID));
    const trials = (state.trials || []).filter(t => String(t.ProjectID) === String(activeProject.ID));
    const treatmentKeys = [...new Set(trials.map(t => t.FormulationName || t.FormulationID || 'Unknown'))];
    const expectedCells = blocks.length * treatmentKeys.length;

    const blockTrtCounts = {};
    blocks.forEach(b => { blockTrtCounts[b.ID] = {}; });
    const duplicates = [];
    trials.forEach(t => {
      if (!t.BlockID) return;
      const key = t.FormulationName || t.FormulationID || 'Unknown';
      if (!blockTrtCounts[t.BlockID]) blockTrtCounts[t.BlockID] = {};
      blockTrtCounts[t.BlockID][key] = (blockTrtCounts[t.BlockID][key] || 0) + 1;
      if (blockTrtCounts[t.BlockID][key] > 1) duplicates.push({ blockId: t.BlockID, key });
    });

    const missing = [];
    let observed = 0;
    blocks.forEach(b => {
      treatmentKeys.forEach(k => {
        const count = blockTrtCounts[b.ID]?.[k] || 0;
        if (count > 0) observed++;
        else missing.push({ blockName: b.Name || b.ID, key: k });
      });
    });
    const coveragePct = expectedCells > 0 ? Math.round((observed / expectedCells) * 100) : 0;
    const isBalanced = missing.length === 0 && duplicates.length === 0;

    // control integrity
    const blockControlChecks = blocks.map(b => {
      const bt = trials.filter(t => t.BlockID === b.ID);
      const count = bt.filter(t => String(t.IsControl).toLowerCase() === 'true').length;
      return { blockName: b.Name || b.ID, count };
    });
    const noControl = blockControlChecks.filter(x => x.count === 0);
    const multiControl = blockControlChecks.filter(x => x.count > 1);

    return { blocks, trials, treatmentKeys, expectedCells, observed, coveragePct, isBalanced, missing, duplicates, noControl, multiControl };
  }, [activeProject, state.blocks, state.trials]);

  // ── Per-treatment WCE over time ─────────────────────────────────────────
  const wceTimelineData = useMemo(() => {
    if (!activeProject) return { daas: [], series: [] };
    const trials = (state.trials || []).filter(t => String(t.ProjectID) === String(activeProject.ID));
    const daaSet = new Set();
    trials.forEach(t => safeJsonParse(t.EfficacyDataJSON, []).forEach(e => { if (e.daa > 0) daaSet.add(e.daa); }));
    const daas = [...daaSet].sort((a, b) => a - b);
    const treatmentNames = [...new Set(trials.map(t => t.FormulationName).filter(Boolean))];
    const primaryObsField = getPrimaryObservationField(activeCategory);

    // Find UTC for WCE calc
    const utcName = treatmentNames.find(n => /control|untreated|check/i.test(n));

    const series = treatmentNames.map(name => {
      const trtTrials = trials.filter(t => t.FormulationName === name);
      const values = daas.map(daa => {
        const covers = trtTrials.map(t => {
          const eff = safeJsonParse(t.EfficacyDataJSON, []);
          const obs = eff.find(e => e.daa === daa);
          return obs ? parseFloat(obs[primaryObsField] ?? obs.weedCover ?? 0) : null;
        }).filter(v => v !== null);
        if (covers.length === 0) return null;
        const meanCover = covers.reduce((s, v) => s + v, 0) / covers.length;

        if (utcName && utcName !== name) {
          const utcTrials = trials.filter(t => t.FormulationName === utcName);
          const utcCovers = utcTrials.map(t => {
            const eff = safeJsonParse(t.EfficacyDataJSON, []);
            const obs = eff.find(e => e.daa === daa);
            return obs ? parseFloat(obs[primaryObsField] ?? obs.weedCover ?? 0) : null;
          }).filter(v => v !== null);
          if (utcCovers.length > 0) {
            const utcMean = utcCovers.reduce((s, v) => s + v, 0) / utcCovers.length;
            if (utcMean > 0) {
              if (activeCategory === 'nutrition' || activeCategory === 'biostimulant') {
                return parseFloat(((meanCover / utcMean - 1) * 100).toFixed(1));
              } else {
                return parseFloat(((1 - meanCover / utcMean) * 100).toFixed(1));
              }
            }
            return 0;
          }
        }
        return parseFloat(meanCover.toFixed(1));
      });
      return { name, values };
    });
    return { daas: daas.map(d => `DAA ${d}`), series };
  }, [activeProject, state.trials, activeCategory]);

  // ── Treatment performance chart data ───────────────────────────────────
  const perfChartData = useMemo(() => {
    if (!analysisResults?.means) return [];
    return Object.entries(analysisResults.means)
      .map(([name, mean]) => ({ label: name.length > 12 ? name.slice(0, 10) + '…' : name, value: isFinite(mean) ? mean : 0 }))
      .sort((a, b) => b.value - a.value);
  }, [analysisResults]);

  // ── Per-treatment stats (Mean, SD, CV, WCE) ────────────────────────────
  const treatmentStats = useMemo(() => {
    if (!activeProject || !analysisResults?.means) return [];
    const trials = (state.trials || []).filter(t => String(t.ProjectID) === String(activeProject.ID));
    const utcName = Object.keys(analysisResults.means).find(n => /control|untreated|check/i.test(n));
    const utcMean = utcName ? (analysisResults.means[utcName] ?? 0) : 0;
    const primaryObsField = getPrimaryObservationField(activeCategory);

    return (analysisResults.grouping || []).map(g => {
      const trtTrials = trials.filter(t => t.FormulationName === g.name);
      const repValues = trtTrials.map(t => {
        const eff = safeJsonParse(t.EfficacyDataJSON, []);
        if (!eff.length) return null;
        const last = eff.sort((a, b) => b.daa - a.daa)[0];
        return last ? parseFloat(last[primaryObsField] ?? last.weedCover ?? 0) : null;
      }).filter(v => v !== null);

      const n = repValues.length;
      const mean = n > 0 ? repValues.reduce((s, v) => s + v, 0) / n : 0;
      const variance = n > 1 ? repValues.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (n - 1) : 0;
      const sd = Math.sqrt(variance);
      const cv = mean > 0 ? (sd / mean) * 100 : 0;
      let wce = 0;
      if (utcMean > 0) {
        if (activeCategory === 'nutrition' || activeCategory === 'biostimulant') {
          wce = Math.max(0, (mean / utcMean - 1) * 100);
        } else {
          wce = Math.max(0, (1 - mean / utcMean) * 100);
        }
      }
      return { name: g.name, n, mean, sd, cv, wce, grouping: g.grouping, repValues };
    });
  }, [activeProject, analysisResults, state.trials, activeCategory]);

  // ── Open project dashboard ──────────────────────────────────────────────
  const openProject = (id) => {
    setActiveProjectId(id);
    setViewMode('dashboard');
    setAnalysisResults(null);
    setPostHocMethod('lsd');
    const p = projects.find(x => String(x.ID) === String(id));
    setNarrative(p?.Narrative || '');
  };

  // ── Run analysis ────────────────────────────────────────────────────────
  const runAnalysis = useCallback(async (method = postHocMethod) => {
    if (!activeProjectId) return;
    setIsAnalyzing(true);
    try {
      const engine = new AnalysisEngine(activeProjectId, state, getAppState);
      // Detect primary metric: prefer yield if any trial has yield data, otherwise use category's primary observation field
      const hasYield = (state.trials || []).filter(t => String(t.ProjectID) === String(activeProjectId)).some(t => parseFloat(t.Yield || t.YieldValue) > 0);
      const primaryMetric = hasYield ? 'yield' : getPrimaryObservationField(activeCategory);
      const results = await engine.analyze(primaryMetric, null, null, { postHoc: method, persist: true });
      setAnalysisResults(results);
    } catch (e) {
      toast('Analysis failed: ' + e.message, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  }, [activeProjectId, state, postHocMethod, activeCategory]);

  // Auto-run analysis when project opens
  useEffect(() => {
    if (activeProjectId) runAnalysis(postHocMethod);
  }, [activeProjectId, postHocMethod, runAnalysis]); // eslint-disable-line

  // Initialize and update Chart.js instances for the Scientific Report
  useEffect(() => {
    if (viewMode !== 'report' || !activeProject || !analysisResults) return;

    const projectCategory = activeProject?.Category || activeCategory;
    const projectConfig = getCategoryConfig(projectCategory);
    const chartInstances = [];

    const safeDestroy = (instance) => {
      if (instance) instance.destroy();
    };

    // 1. WCE Over Time (Line Chart)
    const ctxWce = wceChartRef.current;
    if (ctxWce && wceTimelineData.daas.length > 0 && wceTimelineData.series.length > 0) {
      const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
      const datasets = wceTimelineData.series.map((s, index) => ({
        label: s.name,
        data: s.values,
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length],
        fill: false,
        tension: 0.1
      }));
      const chart = new Chart(ctxWce, {
        type: 'line',
        data: {
          labels: wceTimelineData.daas,
          datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } }
          },
          scales: {
            y: { beginAtZero: true, title: { display: true, text: `% ${projectConfig.primaryMetric.key}` } }
          }
        }
      });
      chartInstances.push(chart);
    }

    // 2. Final Performance (Bar Chart)
    const ctxPerf = perfChartRef.current;
    if (ctxPerf && perfChartData.length > 0) {
      const chart = new Chart(ctxPerf, {
        type: 'bar',
        data: {
          labels: perfChartData.map(d => d.label),
          datasets: [{
            label: `Mean ${activeProject.Metric}`,
            data: perfChartData.map(d => d.value),
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderColor: '#3b82f6',
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Mean' } }
          }
        }
      });
      chartInstances.push(chart);
    }

    // 3. Species Cover (Stacked Bar)
    const ctxSpecies = speciesChartRef.current;
    if (ctxSpecies) {
      const engine = new AnalysisEngine(activeProject.ID, state, getAppState);
      const allSpecies = new Set();
      const projectTrials = (state.trials || []).filter(t => String(t.ProjectID) === String(activeProject.ID));
      projectTrials.forEach(t => {
        const eff = safeJsonParse(t.EfficacyDataJSON, []);
        eff.forEach(e => {
          if (e.weedDetails && Array.isArray(e.weedDetails)) {
            e.weedDetails.forEach(w => {
              if (w.species && w.species.toLowerCase() !== 'total') {
                allSpecies.add(w.species);
              }
            });
          }
        });
      });

      const speciesList = [...allSpecies];
      const treatments = engine.treatments;

      if (speciesList.length > 0 && treatments.length > 0) {
        const datasets = speciesList.map((species, i) => {
          const data = treatments.map(tName => {
            const repValues = engine.getData('cover', species, null)[tName] || [];
            return repValues.length > 0 ? (repValues.reduce((s, v) => s + v, 0) / repValues.length) : 0;
          });
          const colors = ['#059669', '#d97706', '#7c3aed', '#db2777', '#2563eb', '#dc2626', '#0891b2', '#ea580c'];
          return {
            label: species,
            data: data,
            backgroundColor: colors[i % colors.length],
            borderColor: colors[i % colors.length],
            borderWidth: 1
          };
        });

        const chart = new Chart(ctxSpecies, {
          type: 'bar',
          data: {
            labels: treatments.map(t => t.length > 12 ? t.slice(0, 10) + '…' : t),
            datasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              tooltip: { mode: 'index', intersect: false },
              legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } }
            },
            scales: {
              x: { stacked: true },
              y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Cover (%)' } }
            }
          }
        });
        chartInstances.push(chart);
      } else {
        const ctx = ctxSpecies.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, ctxSpecies.width, ctxSpecies.height);
          ctx.font = '12px sans-serif';
          ctx.fillStyle = '#94a3b8';
          ctx.textAlign = 'center';
          ctx.fillText(`No ${projectConfig.targetLabel.toLowerCase()} data recorded`, ctxSpecies.width / 2, ctxSpecies.height / 2);
        }
      }
    }

    // 4. Radar (Control Spectrum)
    const ctxRadar = radarChartRef.current;
    if (ctxRadar) {
      const engine = new AnalysisEngine(activeProject.ID, state, getAppState);
      const utcName = engine.utcName;
      const treatments = engine.treatments;

      const allSpecies = new Set();
      const projectTrials = (state.trials || []).filter(t => String(t.ProjectID) === String(activeProject.ID));
      projectTrials.forEach(t => {
        const eff = safeJsonParse(t.EfficacyDataJSON, []);
        eff.forEach(e => {
          if (e.weedDetails && Array.isArray(e.weedDetails)) {
            e.weedDetails.forEach(w => {
              if (w.species && w.species.toLowerCase() !== 'total') {
                allSpecies.add(w.species);
              }
            });
          }
        });
      });
      const speciesList = [...allSpecies];

      if (treatments.length > 0 && speciesList.length >= 3) {
        const utcMeans = {};
        if (utcName) {
          speciesList.forEach(s => {
            const vals = engine.getData('cover', s, null)[utcName] || [];
            utcMeans[s] = vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
          });
        }

        const datasets = treatments.filter(t => t !== utcName).map((tName, i) => {
          const data = speciesList.map(s => {
            const tVals = engine.getData('cover', s, null)[tName] || [];
            const tMean = tVals.length > 0 ? (tVals.reduce((a, b) => a + b, 0) / tVals.length) : 0;
            let control = 0;
            if (utcName && utcMeans[s] > 0) {
              control = ((utcMeans[s] - tMean) / utcMeans[s]) * 100;
            } else if (!utcName) {
              control = Math.max(0, 100 - tMean);
            }
            return Math.min(100, Math.max(0, control));
          });

          const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
          return {
            label: tName,
            data,
            borderColor: colors[i % colors.length],
            backgroundColor: colors[i % colors.length] + '22',
            fill: true,
            pointRadius: 2
          };
        });

        const chart = new Chart(ctxRadar, {
          type: 'radar',
          data: { labels: speciesList, datasets },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } }
            },
            scales: {
              r: {
                min: 0,
                max: 100,
                ticks: { display: false, stepSize: 20 },
                pointLabels: { font: { size: 9 } }
              }
            }
          }
        });
        chartInstances.push(chart);
      } else {
        const ctx = ctxRadar.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, ctxRadar.width, ctxRadar.height);
          ctx.font = '12px sans-serif';
          ctx.fillStyle = '#94a3b8';
          ctx.textAlign = 'center';
          ctx.fillText(`Need 3+ ${projectConfig.targetLabel.toLowerCase()} species for Radar`, ctxRadar.width / 2, ctxRadar.height / 2);
        }
      }
    }

    // 5. Yield Chart (Bar)
    const ctxYield = yieldChartRef.current;
    if (ctxYield) {
      const engine = new AnalysisEngine(activeProject.ID, state, getAppState);
      const yieldData = engine.getData('yield');
      const hasYield = Object.values(yieldData).some(arr => arr.some(v => v > 0));

      if (hasYield) {
        const container = document.getElementById('project-yield-container');
        if (container) container.classList.remove('hidden');

        const labels = engine.treatments;
        const means = labels.map(t => {
          const vals = yieldData[t] || [];
          return vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
        });

        const colors = labels.map((t, i) => ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5]);

        const chart = new Chart(ctxYield, {
          type: 'bar',
          data: {
            labels: labels.map(t => t.length > 12 ? t.slice(0, 10) + '…' : t),
            datasets: [{
              label: 'Mean Yield',
              data: means,
              backgroundColor: colors,
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, title: { display: true, text: 'Yield' } }
            }
          }
        });
        chartInstances.push(chart);
      } else {
        const container = document.getElementById('project-yield-container');
        if (container) container.classList.add('hidden');
      }
    }

    return () => {
      chartInstances.forEach(safeDestroy);
    };
  }, [viewMode, activeProject, analysisResults, wceTimelineData, perfChartData, state.trials, state.formulations, activeCategory]);

  // Re-run when post-hoc method changes
  const handlePostHocChange = (method) => {
    setPostHocMethod(method);
    runAnalysis(method);
  };

  // ── Significance formatter ─────────────────────────────────────────────
  const sigStars = (p) => {
    if (!isFinite(p)) return 'N/A';
    if (p < 0.001) return '*** (p<0.001)';
    if (p < 0.01)  return '**  (p<0.01)';
    if (p < 0.05)  return '*   (p<0.05)';
    return 'ns  (p≥0.05)';
  };

  // ── Add block ───────────────────────────────────────────────────────────
  const handleAddBlock = async (e) => {
    e.preventDefault();
    if (!activeProjectId || !blockForm.Name.trim()) return;
    const payload = {
      ID: Date.now().toString(),
      ProjectID: activeProjectId,
      Name: blockForm.Name.trim(),
      ReplicationNum: blockForm.ReplicationNum || String((state.blocks || []).filter(b => String(b.ProjectID) === String(activeProjectId)).length + 1),
      CreatedAt: new Date().toISOString(),
      Category: activeCategory,
    };
    updateState({ blocks: [...(state.blocks || []), payload] });
    setBlockForm({ Name: '', ReplicationNum: '' });
    setIsAddingBlock(false);
    try {
      await addBlock(payload, getAppState);
      toast('Block added');
    } catch { toast('Failed to save block', 'error'); }
  };

  // ── Delete block ────────────────────────────────────────────────────────
  const handleDeleteBlock = async (blockId, blockName) => {
    if (!activeProjectId) return;
    const blockTrials = (state.trials || []).filter(t => String(t.BlockID) === String(blockId));
    const confirmMsg = blockTrials.length > 0
      ? `Delete block "${blockName}" and its ${blockTrials.length} plot(s)? This cannot be undone.`
      : `Delete block "${blockName}"? This cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;

    // Remove block and its trials from state
    const updatedBlocks = (state.blocks || []).filter(b => String(b.ID) !== String(blockId));
    const updatedTrials = (state.trials || []).filter(t => String(t.BlockID) !== String(blockId));
    updateState({ blocks: updatedBlocks, trials: updatedTrials });

    try {
      await deleteBlock({ ID: blockId }, getAppState);
      // Also delete associated trials from Firebase
      for (const t of blockTrials) {
        try {
          const { deleteTrial } = await import('../services/dataLayer.js');
          await deleteTrial({ ID: t.ID }, getAppState);
        } catch { /* best effort */ }
      }
      toast(`Block "${blockName}" deleted`);
    } catch { toast('Failed to delete block', 'error'); }
  };

  // ── Add plot to block (navigate to Trials page with block pre-selected) ──
  const handleAddPlotToBlock = (blockId) => {
    navigate(`/trials?addNew=true&projectId=${activeProjectId}&blockId=${blockId}`);
  };

  // ── Lock / Unlock ───────────────────────────────────────────────────────
  const handleLockToggle = async () => {
    if (!activeProject) return;
    const newStatus = activeProject.Status === 'Locked' ? 'Draft' : 'Locked';
    const updated = (state.projects || []).map(p => String(p.ID) === String(activeProject.ID) ? { ...p, Status: newStatus } : p);
    updateState({ projects: updated });
    try {
      await updateProject({ ID: activeProject.ID, Status: newStatus }, getAppState);
      toast(`Project ${newStatus === 'Locked' ? 'locked' : 'unlocked'}`);
    } catch { toast('Failed to update project', 'error'); }
  };

  // ── Save narrative ──────────────────────────────────────────────────────
  const handleSaveNarrative = async () => {
    if (!narrative.trim()) { toast('Narrative is empty', 'error'); return; }
    setIsSavingNarrative(true);
    try {
      await updateProject({ ID: activeProjectId, Narrative: narrative }, getAppState);
      const updated = projects.map(p => String(p.ID) === String(activeProjectId) ? { ...p, Narrative: narrative } : p);
      updateState({ projects: updated });
      toast('Narrative saved');
    } catch { toast('Failed to save narrative', 'error'); }
    finally { setIsSavingNarrative(false); }
  };

  // ── Generate AI narrative ───────────────────────────────────────────────
  const handleGenerateNarrative = async () => {
    if (!analysisResults) { toast('Run analysis first', 'error'); return; }
    setIsGeneratingNarrative(true);
    try {
      const rawKey = state.settings?.geminiApiKeys?.[0] || state.settings?.geminiApiKey || (state.settings?.apiKeys || [])[0] || '';
      const geminiKey = typeof rawKey === 'object' ? rawKey?.key : rawKey;
      if (!geminiKey) throw new Error('No Gemini API key configured in Settings');
      const groupingText = (analysisResults.grouping || [])
        .map(g => `- ${g.name}: mean=${isFinite(g.mean) ? g.mean.toFixed(2) : 'N/A'} (Group ${g.grouping})`)
        .join('\n');
      const prompt = `Act as an Agronomist. Analyze trial data for '${activeProject?.Name}'.
Metric: ${activeProject?.Metric}
Treatments & Means:
${groupingText}
Post-hoc: ${postHocMethod === 'tukey' ? 'Tukey HSD' : "Fisher's LSD"} (alpha=0.05)
ANOVA P-Value: ${isFinite(analysisResults.anova?.pVal) ? analysisResults.anova.pVal.toFixed(5) : 'N/A'}
Write a 3-paragraph Narrative covering Methodology, Results and Conclusions.`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!text) throw new Error('No response from AI');
      setNarrative(text);
    } catch (e) {
      toast('AI error: ' + e.message, 'error');
    } finally {
      setIsGeneratingNarrative(false);
    }
  };

  const getTrialMetricValue = (t) => {
    const primaryObsField = getPrimaryObservationField(activeCategory);
    if (config.primaryMetric.key === 'Yield' || config.primaryMetric.key === 'YieldValue') {
      return parseFloat(t.Yield || t.YieldValue || 0);
    }
    const eff = safeJsonParse(t.EfficacyDataJSON, []);
    if (!eff.length) return 0;
    const latest = eff.sort((a, b) => b.daa - a.daa)[0];
    return latest ? parseFloat(latest[primaryObsField] ?? latest.weedCover ?? 0) : 0;
  };

  // ── Recalculate DAA for project trials ──────────────────────────────────
  const handleRecalcDAA = async () => {
    if (!activeProject) return;
    const pTrials = (state.trials || []).filter(t => String(t.ProjectID) === String(activeProject.ID));
    let updated = 0;
    const newTrials = (state.trials || []).map(t => {
      if (String(t.ProjectID) !== String(activeProject.ID) || !t.Date) return t;
      const appDate = new Date(t.Date);
      const eff = safeJsonParse(t.EfficacyDataJSON, []);
      const recalculated = eff.map(obs => {
        if (!obs.date) return obs;
        const obsDate = new Date(obs.date);
        const daa = Math.round((obsDate - appDate) / (1000 * 60 * 60 * 24));
        return { ...obs, daa: Math.max(0, daa) };
      });
      const changed = JSON.stringify(recalculated) !== JSON.stringify(eff);
      if (changed) updated++;
      return { ...t, EfficacyDataJSON: JSON.stringify(recalculated) };
    });
    
    // Save to local state first
    updateState({ trials: newTrials });
    
    try {
      const modifiedTrials = newTrials.filter(t => String(t.ProjectID) === String(activeProject.ID));
      await addBatchTrials({ trials: modifiedTrials }, getAppState);
      toast(`Recalculated and saved DAA for ${updated} trial(s)`, 'success');
      if (updated > 0) runAnalysis(postHocMethod);
    } catch (err) {
      console.error(err);
      toast('Failed to save recalculated DAA to database.', 'error');
    }
  };

  // ── Randomize Layout ────────────────────────────────────────────────────
  const [isRandomizeModalOpen, setIsRandomizeModalOpen] = useState(false);

  const handleRandomizeLayout = () => {
    if (!activeProject) return;
    const pBlocks = (state.blocks || []).filter(b => String(b.ProjectID) === String(activeProject.ID));
    
    // Auto-populate treatments list scientifically
    const initialTreatments = [
      { id: 'control_' + Date.now(), name: 'Untreated Control', formulationId: '', dosage: '', role: 'control' }
    ];
    activeFormulations.forEach((f, idx) => {
      initialTreatments.push({
        id: f.ID + '_' + idx,
        name: f.Name,
        formulationId: f.ID,
        dosage: '',
        role: f.Name.toLowerCase().includes('check') || f.Name.toLowerCase().includes('standard') ? 'standard' : 'experimental'
      });
    });
    setRandomizeTreatments(initialTreatments);
    
    setRandomizeForm({
      investigatorName: activeProject.Investigator || '',
      dosage: '',
      weedSpecies: activeProject.TargetWeed || '',
      date: activeProject.StartDate ? activeProject.StartDate.split('T')[0] : new Date().toISOString().split('T')[0],
      replications: String(pBlocks.length || 4)
    });
    
    setIsRandomizeModalOpen(true);
  };

  const addTreatmentRow = () => {
    setRandomizeTreatments(prev => [
      ...prev,
      {
        id: 'trt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        name: '',
        formulationId: '',
        dosage: '',
        role: 'experimental'
      }
    ]);
  };

  const updateTreatmentRow = (id, field, value) => {
    setRandomizeTreatments(prev => prev.map(t => {
      if (t.id !== id) return t;
      const updated = { ...t, [field]: value };
      
      if (field === 'formulationId') {
        const form = activeFormulations.find(f => String(f.ID) === String(value));
        if (form) {
          updated.name = form.Name;
          updated.role = form.Name.toLowerCase().includes('check') || form.Name.toLowerCase().includes('standard') ? 'standard' : 'experimental';
        } else if (value === '') {
          updated.name = 'Untreated Control';
          updated.role = 'control';
        }
      }
      return updated;
    }));
  };

  const deleteTreatmentRow = (id) => {
    const row = randomizeTreatments.find(t => t.id === id);
    const rowName = row && row.name ? `"${row.name}"` : 'this row';
    if (!window.confirm(`Delete ${rowName}?`)) return;
    setRandomizeTreatments(prev => prev.filter(t => t.id !== id));
  };

  const applyRandomization = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    // Get list of treatments
    const trtList = randomizeTreatments.map(t => {
      const f = activeFormulations.find(form => String(form.ID) === String(t.formulationId));
      return {
        fid: t.formulationId || '',
        name: t.name.trim() || f?.Name || 'Unnamed Treatment',
        role: t.role,
        dosage: t.dosage || ''
      };
    });
      
    if (trtList.length === 0) {
      toast('Please add at least one treatment.', 'error');
      return;
    }
    
    const controls = trtList.filter(t => t.role === 'control');
    if (controls.length !== 1) {
      toast('You must have exactly ONE Untreated Control.', 'error');
      return;
    }
    
    setIsRandomizeModalOpen(false);
    toast('Generating randomized layout and blocks...');

    // Generate new Blocks based on the chosen number of replications
    const numReps = parseInt(randomizeForm.replications) || 4;
    const blocksToSave = [];
    const trialsToSave = [];

    for (let r = 1; r <= numReps; r++) {
      const blockId = 'block_' + Date.now() + '_' + r + '_' + Math.random().toString(36).substring(2, 7);
      const blockName = `Rep ${String.fromCharCode(64 + r)}`; // Rep A, Rep B, Rep C, etc.
      blocksToSave.push({
        ID: blockId,
        ProjectID: activeProject.ID,
        Name: blockName,
        ReplicationNum: String(r),
        CreatedAt: new Date().toISOString(),
        Category: activeCategory
      });
    }

    // Generate plots (trials) randomized within each block
    blocksToSave.forEach(block => {
      const blockTreatments = trtList.map(t => ({
        FormulationID: t.fid,
        FormulationName: t.name,
        IsControl: t.role === 'control',
        IsStandardCheck: t.role === 'standard',
        dosage: t.dosage
      }));

      // Fisher-Yates Shuffle
      for (let i = blockTreatments.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [blockTreatments[i], blockTreatments[j]] = [blockTreatments[j], blockTreatments[i]];
      }

      blockTreatments.forEach((t, index) => {
        const trialId = (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
        const targetField = config.targetField || 'WeedSpecies';

        const tToSave = {
          ID: trialId,
          ProjectID: activeProject.ID,
          BlockID: block.ID,
          FormulationID: t.FormulationID,
          FormulationName: t.FormulationName,
          InvestigatorName: randomizeForm.investigatorName || '',
          Dosage: t.dosage || randomizeForm.dosage || '',
          Date: randomizeForm.date || new Date().toISOString().split('T')[0],
          Replication: block.ReplicationNum || '1',
          RandomizationOrder: index + 1,
          IsControl: t.IsControl,
          IsStandardCheck: t.IsStandardCheck,
          Status: 'Draft',
          IsLive: true,
          EfficacyDataJSON: '[]',
          PhotoURLs: '[]',
          WeedPhotosJSON: '[]',
          PlotNumber: index + 1,
          AISummariesJSON: JSON.stringify({ plotNum: index + 1 }),
          Category: activeCategory,
          [targetField]: randomizeForm.weedSpecies || ''
        };
        trialsToSave.push(tToSave);
      });
    });

    // Remove old blocks and trials from local state
    const currentBlocks = state.blocks || [];
    const otherBlocks = currentBlocks.filter(b => String(b.ProjectID) !== String(activeProject.ID));
    const currentTrials = state.trials || [];
    const otherTrials = currentTrials.filter(t => String(t.ProjectID) !== String(activeProject.ID));

    updateState({
      blocks: [...otherBlocks, ...blocksToSave],
      trials: [...otherTrials, ...trialsToSave]
    });

    // Sync with Firebase
    const oldBlocks = currentBlocks.filter(b => String(b.ProjectID) === String(activeProject.ID));
    const oldTrials = currentTrials.filter(t => String(t.ProjectID) === String(activeProject.ID));

    try {
      // 1. Delete old trials
      for (const t of oldTrials) {
        try { await deleteTrial({ ID: t.ID }, getAppState); } catch (e) { console.error(e); }
      }
      // 2. Delete old blocks
      for (const b of oldBlocks) {
        try { await deleteBlock({ ID: b.ID }, getAppState); } catch (e) { console.error(e); }
      }
      // 3. Save new blocks
      for (const b of blocksToSave) {
        try { await addBlock(b, getAppState); } catch (e) { console.error(e); }
      }
      // 4. Save new trials in batch
      await addBatchTrials({ trials: trialsToSave }, getAppState);
      toast('Randomized layout generated successfully!', 'success');
      runAnalysis(postHocMethod);
    } catch (err) {
      console.error(err);
      toast('Failed to save randomized layout to database.', 'error');
    }
  };

  // ── Protocol Settings ───────────────────────────────────────────────────
  const [isProtocolModalOpen, setIsProtocolModalOpen] = useState(false);
  const [protocolForm, setProtocolForm] = useState({ 
    Name: '',
    TargetWeed: '', 
    Crop: '', 
    Metric: 'Weed Control Efficiency', 
    ApplicationTiming: '', 
    SprayVolume: '', 
    Notes: '',
    Location: '',
    Investigator: '',
    Lat: '',
    Lon: '',
    WeatherTemp: '',
    WeatherHumidity: '',
    WeatherWind: '',
    WeatherRain: '',
    WeatherDetails: ''
  });

  const openProtocolSettings = () => {
    if (!activeProject) return;
    setProtocolForm({
      Name: activeProject.Name || '',
      TargetWeed: activeProject.TargetWeed || '',
      Crop: activeProject.Crop || '',
      Metric: activeProject.Metric || 'Weed Control Efficiency',
      ApplicationTiming: activeProject.ApplicationTiming || '',
      SprayVolume: activeProject.SprayVolume || '',
      Notes: activeProject.Notes || '',
      Location: activeProject.Location || '',
      Investigator: activeProject.Investigator || '',
      Lat: activeProject.Lat || '',
      Lon: activeProject.Lon || '',
      WeatherTemp: activeProject.WeatherTemp || '',
      WeatherHumidity: activeProject.WeatherHumidity || '',
      WeatherWind: activeProject.WeatherWind || '',
      WeatherRain: activeProject.WeatherRain || '',
      WeatherDetails: activeProject.WeatherDetails || ''
    });
    setIsProtocolModalOpen(true);
  };

  const saveProtocolSettings = async () => {
    if (!activeProject) return;
    const updated = projects.map(p => p.ID === activeProject.ID ? { ...p, ...protocolForm } : p);
    updateState({ projects: updated });
    try {
      await updateProject({ ID: activeProject.ID, ...protocolForm }, getAppState);
      toast('Project & protocol settings saved');
      setIsProtocolModalOpen(false);
    } catch { toast('Failed to save', 'error'); }
  };

  // ── Scientific Report ─────────────────────────────────────────────────────
  const handleScientificReport = () => {
    if (!activeProject || !analysisResults) { toast('Run analysis first', 'error'); return; }
    setViewMode('report');
    toast('Scientific report view loaded');
  };

  // ── Regulatory DOCX Export ────────────────────────────────────────────────
  const handleRegulatoryDOCX = () => {
    if (!activeProject || !analysisResults) { toast('Run analysis first', 'error'); return; }
    const projectCategory = activeProject?.Category || activeCategory;
    const projectConfig = getCategoryConfig(projectCategory);
    // Generate a simple HTML-based DOCX-compatible document
    const header = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>Regulatory Report</title></head><body>`;
    const footer = `</body></html>`;
    const content = `<h1>RCBD Regulatory Report: ${activeProject.Name}</h1>
<p><strong>Project:</strong> ${activeProject.Name}<br>
<strong>Location:</strong> ${activeProject.Location || 'N/A'}<br>
<strong>Investigator:</strong> ${activeProject.Investigator || 'N/A'}<br>
<strong>Crop:</strong> ${activeProject.Crop || 'N/A'}<br>
<strong>Metric:</strong> ${activeProject.Metric}<br>
<strong>Generated:</strong> ${formatDateTime(new Date())}</p>
<h2>Treatment Means & Grouping (${postHocMethod === 'tukey' ? 'Tukey HSD' : "Fisher's LSD"})</h2>
<table border="1" cellpadding="6" cellspacing="0">
<tr><th>Treatment</th><th>Mean</th><th>SD</th><th>CV%</th><th>${projectConfig.primaryMetric.key}${projectConfig.primaryMetric.unit || ''}</th><th>Group</th></tr>
${(analysisResults.grouping || []).map(g => {
      const ts = treatmentStats.find(x => x.name === g.name);
      return `<tr><td>${g.name}</td><td>${isFinite(g.mean) ? g.mean.toFixed(2) : '-'}</td><td>${ts ? ts.sd.toFixed(2) : '-'}</td><td>${ts ? ts.cv.toFixed(1) : '-'}%</td><td>${ts ? ts.wce.toFixed(1) : '-'}${projectConfig.primaryMetric.unit || ''}</td><td><strong>${g.grouping}</strong></td></tr>`;
    }).join('')}
</table>
<p>Means sharing the same letter are not significantly different (α=0.05).</p>
<h2>ANOVA Summary</h2>
<p>F-Ratio: ${isFinite(analysisResults.anova?.fVal) ? analysisResults.anova.fVal.toFixed(2) : '-'}<br>
P-Value: ${isFinite(analysisResults.anova?.pVal) ? analysisResults.anova.pVal.toFixed(4) : '-'}<br>
CV: ${isFinite(analysisResults.anova?.cv) ? analysisResults.anova.cv.toFixed(1) : '-'}%<br>
LSD/HSD (0.05): ${isFinite(analysisResults.postHoc?.value) ? analysisResults.postHoc.value.toFixed(2) : '-'}</p>
<p><em>Generated by HerbiRice RCBD Analysis System</em></p>`;
    const blob = new Blob([header + content + footer], { type: 'application/msword' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${activeProject.Name.replace(/[^a-z0-9]/gi, '_')}_RegulatoryReport.doc`;
    a.click();
    toast('DOCX report downloaded');
  };

  // ── Regulatory PDF ────────────────────────────────────────────────────
  const handleRegulatoryPDF = () => {
    if (!activeProject || !analysisResults) { toast('Run analysis first', 'error'); return; }
    const projectCategory = activeProject?.Category || activeCategory;
    const projectConfig = getCategoryConfig(projectCategory);
    const pTrials = (state.trials || []).filter(t => String(t.ProjectID) === String(activeProject.ID));
    const pBlocks = (state.blocks || []).filter(b => String(b.ProjectID) === String(activeProject.ID));
    const cv = isFinite(analysisResults.anova?.cv) ? analysisResults.anova.cv.toFixed(1) : 'N/A';
    const rows = (analysisResults.grouping || []).map(g => {
      const ts = treatmentStats.find(x => x.name === g.name);
      return `<tr><td style="padding:6px 10px;border:1px solid #ddd">${g.name}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:center">${isFinite(g.mean) ? g.mean.toFixed(2) : '-'}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:center">${ts ? ts.sd.toFixed(2) : '-'}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:center">${ts ? ts.cv.toFixed(1) : '-'}%</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:center">${ts ? ts.wce.toFixed(1) : '-'}${projectConfig.primaryMetric.unit || ''}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;font-weight:bold;color:#059669">${g.grouping}</td></tr>`;
    }).join('');
    const html = `<!DOCTYPE html><html><head><title>Regulatory Report - ${activeProject.Name}</title>
<style>body{font-family:Arial,sans-serif;margin:40px;color:#1e293b}h1{color:#065f46}h2{color:#334155;margin-top:24px;font-size:14px;text-transform:uppercase;letter-spacing:1px}table{border-collapse:collapse;width:100%}th{background:#f1f5f9;padding:8px 10px;border:1px solid #ddd;text-align:left;font-size:11px;text-transform:uppercase}td{font-size:12px}.meta{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;font-size:12px;color:#475569}.meta span{font-weight:600;color:#1e293b}.sig{background:#dcfce7;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:600;color:#166534}</style></head>
<body><h1>RCBD Trial Report: ${activeProject.Name}</h1>
<div class="meta"><div>Location: <span>${activeProject.Location || 'N/A'}</span></div><div>Investigator: <span>${activeProject.Investigator || 'N/A'}</span></div>
<div>Crop: <span>${activeProject.Crop || 'N/A'}</span></div><div>Metric: <span>${activeProject.Metric}</span></div>
<div>Blocks: <span>${pBlocks.length}</span></div><div>Plots: <span>${pTrials.length}</span></div>
<div>Start Date: <span>${formatDateTime(activeProject.StartDate) || 'N/A'}</span></div><div>Generated: <span>${formatDateTime(new Date())}</span></div></div>
<h2>Treatment Means & Statistical Grouping</h2>
<table><thead><tr><th>Treatment</th><th>Mean</th><th>SD</th><th>CV%</th><th>${projectConfig.primaryMetric.key}%</th><th>Group (${postHocMethod === 'tukey' ? 'Tukey' : 'LSD'})</th></tr></thead><tbody>${rows}</tbody></table>
<p style="font-size:11px;color:#64748b;margin-top:6px">Means sharing the same letter are not significantly different (${postHocMethod === 'tukey' ? 'Tukey HSD' : "Fisher's LSD"}, α=0.05). ${postHocMethod === 'tukey' ? 'HSD' : 'LSD'} (0.05): ${isFinite(analysisResults.postHoc?.value) ? analysisResults.postHoc.value.toFixed(2) : 'N/A'}</p>
<h2>ANOVA Table</h2>
<table><thead><tr><th>Source</th><th>DF</th><th>SS</th><th>MS</th><th>F</th><th>P</th><th>Sig</th></tr></thead><tbody>
<tr><td style="padding:6px 10px;border:1px solid #ddd">Treatment</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:right">${analysisResults.anova?.dfTreat ?? '-'}</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:right">${isFinite(analysisResults.anova?.ssTreat) ? analysisResults.anova.ssTreat.toFixed(2) : '-'}</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:right">${isFinite(analysisResults.anova?.msTreat) ? analysisResults.anova.msTreat.toFixed(2) : '-'}</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:right;font-weight:bold">${isFinite(analysisResults.anova?.fVal) ? analysisResults.anova.fVal.toFixed(2) : '-'}</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:right">${isFinite(analysisResults.anova?.pVal) ? analysisResults.anova.pVal.toFixed(4) : '-'}</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:center" class="sig">${sigStars(analysisResults.anova?.pVal)}</td></tr>
<tr><td style="padding:6px 10px;border:1px solid #ddd">Block</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:right">${analysisResults.anova?.dfBlock ?? '-'}</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:right">${isFinite(analysisResults.anova?.ssBlock) ? analysisResults.anova.ssBlock.toFixed(2) : '-'}</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:right">${isFinite(analysisResults.anova?.msBlock) ? analysisResults.anova.msBlock.toFixed(2) : '-'}</td><td style="padding:6px 10px;border:1px solid #ddd"></td><td style="padding:6px 10px;border:1px solid #ddd"></td><td style="padding:6px 10px;border:1px solid #ddd"></td></tr>
<tr><td style="padding:6px 10px;border:1px solid #ddd">Error</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:right">${analysisResults.anova?.dfError ?? '-'}</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:right">${isFinite(analysisResults.anova?.ssError) ? analysisResults.anova.ssError.toFixed(2) : '-'}</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:right">${isFinite(analysisResults.anova?.msError) ? analysisResults.anova.msError.toFixed(2) : '-'}</td><td style="padding:6px 10px;border:1px solid #ddd"></td><td style="padding:6px 10px;border:1px solid #ddd"></td><td style="padding:6px 10px;border:1px solid #ddd"></td></tr>
<tr style="font-weight:bold;background:#f8fafc"><td style="padding:6px 10px;border:1px solid #ddd">Total</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:right">${analysisResults.anova?.dfTotal ?? '-'}</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:right">${isFinite(analysisResults.anova?.ssTotal) ? analysisResults.anova.ssTotal.toFixed(2) : '-'}</td><td colspan="4" style="padding:6px 10px;border:1px solid #ddd"></td></tr>
</tbody></table>
<p style="font-size:11px;color:#64748b;margin-top:6px">CV: ${cv}% · Design: ${analysisResults.balance?.isBalanced ? 'Balanced RCBD' : 'Unbalanced RCBD'}</p>
${narrative ? `<h2>Agronomist Narrative</h2><p style="font-size:13px;line-height:1.6;white-space:pre-wrap">${narrative}</p>` : ''}
</body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
    toast('Regulatory report opened for printing');
  };

  // ── Export helpers ──────────────────────────────────────────────────────
  const exportCSV = (filename, rows, headers) => {
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = filename; a.click();
  };

  const handleExportR = () => {
    if (!activeProject) return;
    const key = config.primaryMetric.key;
    const trials = (state.trials || []).filter(t => String(t.ProjectID) === String(activeProject.ID));
    exportCSV(`${activeProject.Name}_R.csv`, trials.map(t => {
      const val = getTrialMetricValue(t);
      return {
        Treatment: t.FormulationName,
        Block: t.Replication || t.BlockID || '1',
        [key]: val,
        Result: t.Result || val
      };
    }), ['Treatment', 'Block', key, 'Result']);
    toast('Exported for R');
  };

  const handleExportSAS = () => {
    if (!activeProject) return;
    const key = config.primaryMetric.key;
    const keyLower = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    const trials = (state.trials || []).filter(t => String(t.ProjectID) === String(activeProject.ID));
    const lines = ['data rcbd;', `input trt $ block ${keyLower};`, 'datalines;',
      ...trials.map(t => `${(t.FormulationName || 'T').replace(/\s/g, '_')} ${t.Replication || t.BlockID || 1} ${getTrialMetricValue(t)}`),
      ';', 'run;', '', 'proc glm data=rcbd;', '  class trt block;', `  model ${keyLower}=block trt;`, '  lsmeans trt / pdiff adjust=tukey;', 'run;'
    ];
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' }));
    a.download = `${activeProject.Name}_SAS.sas`; a.click();
    toast('Exported for SAS');
  };

  const handleExportBundle = () => {
    if (!activeProject || !analysisResults) { toast('Run analysis first', 'error'); return; }
    const json = JSON.stringify({ project: activeProject, analysis: analysisResults }, null, 2);
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    a.download = `${activeProject.Name}_analysis_bundle.json`; a.click();
    toast('Analysis bundle exported');
  };

  // ── Create project ──────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      Category: activeCategory,
      ID: Date.now().toString(),
      Status: 'Draft',
      CreatedAt: new Date().toISOString(),
      BlocksJSON: '[]',
      AnalysisResultsJSON: '{}',
      Narrative: '',
      CreatedBy: state.auth?.user?.id || 'system',
    };
    updateState({ projects: [...(state.projects || []), payload] });
    setIsModalOpen(false);
    try {
      await addProject(payload, getAppState);
      toast('Project created');
    } catch { toast('Failed to create project', 'error'); }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    const proj = (state.projects || []).find(p => String(p.ID) === String(id));
    const projectName = proj ? proj.Name : 'this project';
    if (!window.confirm(`Are you sure you want to delete "${projectName}"? This will permanently delete the project and all its associated blocks and plots/trials. This cannot be undone.`)) return;
    
    // Find all blocks and trials associated with this project
    const projectBlocks = (state.blocks || []).filter(b => String(b.ProjectID) === String(id));
    const projectTrials = (state.trials || []).filter(t => String(t.ProjectID) === String(id));

    // Update state to remove project, blocks, and trials
    updateState({ 
      projects: (state.projects || []).filter(p => String(p.ID) !== String(id)),
      blocks: (state.blocks || []).filter(b => String(b.ProjectID) !== String(id)),
      trials: (state.trials || []).filter(t => String(t.ProjectID) !== String(id))
    });

    try {
      await deleteProject({ ID: id }, getAppState);
      
      // Delete associated blocks
      for (const b of projectBlocks) {
        try {
          await deleteBlock({ ID: b.ID }, getAppState);
        } catch (err) {
          console.error('Failed to delete block', b.ID, err);
        }
      }
      
      // Delete associated trials
      for (const t of projectTrials) {
        try {
          const { deleteTrial } = await import('../services/dataLayer.js');
          await deleteTrial({ ID: t.ID }, getAppState);
        } catch (err) {
          console.error('Failed to delete trial', t.ID, err);
        }
      }
      
      toast('Project and all associated blocks and trials deleted');
    } catch { 
      toast('Failed to delete project', 'error'); 
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // PROJECT DASHBOARD VIEW
  // ══════════════════════════════════════════════════════════════════════════
  if (activeProject) {
    const projectBlocks = (state.blocks || []).filter(b => String(b.ProjectID) === String(activeProject.ID));
    const projectTrials = (state.trials || []).filter(t => String(t.ProjectID) === String(activeProject.ID));
    const treatments = [...new Set(projectTrials.map(t => t.FormulationName).filter(Boolean))];
    const isLocked = activeProject.Status === 'Locked';
    const projectCategory = activeProject?.Category || activeCategory;
    const projectConfig = getCategoryConfig(projectCategory);

    if (viewMode === 'report') {
      const temps = projectTrials.map(t => parseFloat(t.Temperature)).filter(n => isFinite(n));
      const hums = projectTrials.map(t => parseFloat(t.Humidity)).filter(n => isFinite(n));
      const rains = projectTrials.map(t => parseFloat(t.Rain)).filter(n => isFinite(n));
      const avg = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : 'N/A';
      const sum = arr => arr.length ? arr.reduce((a, b) => a + b, 0).toFixed(1) : 'N/A';

      return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
          <TopBar title={`Scientific Report - ${activeProject.Name}`} onMenuClick={onMenuClick} />
          <div className="flex-1 overflow-y-auto">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4">
              <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button onClick={() => setViewMode('dashboard')} className="p-2 rounded-full hover:bg-slate-100 transition">
                    <ArrowLeft className="h-6 w-6 text-slate-600" />
                  </button>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-800">Scientific Trial Report</h1>
                    <p className="text-xs text-slate-500">{activeProject.Name} — Metric: {activeProject.Metric}</p>
                  </div>
                </div>
                <button
                  onClick={handleGenerateNarrative}
                  disabled={isGeneratingNarrative}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md hover:bg-indigo-700 transition text-sm font-bold disabled:opacity-50"
                >
                  {isGeneratingNarrative ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate AI Narrative
                </button>
              </div>
            </div>

            <div className="max-w-7xl mx-auto p-6 space-y-6">
              {/* 1. Protocol & Conditions Summary */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 border-b pb-2 mb-4 flex items-center gap-2 text-sm">
                  <ClipboardList className="h-4 w-4 text-emerald-600" />
                  Trial Conditions & Protocol
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
                  <div>
                    <h4 className="font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Site Information</h4>
                    <p><span className="text-slate-400">Location:</span> <span className="font-semibold text-slate-700">{activeProject.Location || '—'}</span></p>
                    <p><span className="text-slate-400">Investigator:</span> <span className="font-semibold text-slate-700">{activeProject.Investigator || '—'}</span></p>
                    <p><span className="text-slate-400">Design:</span> <span className="font-semibold text-slate-700">{activeProject.Design || 'RCBD'} ({projectTrials.length} plots)</span></p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Application Details</h4>
                    <p><span className="text-slate-400">Crop:</span> <span className="font-semibold text-slate-700">{activeProject.Crop || '—'}</span></p>
                    <p><span className="text-slate-400">Spray Volume:</span> <span className="font-semibold text-slate-700">{activeProject.SprayVolume ? `${activeProject.SprayVolume} L/ha` : '—'}</span></p>
                    <p><span className="text-slate-400">Start Date:</span> <span className="font-semibold text-slate-700">{activeProject.StartDate ? formatDate(activeProject.StartDate) : '—'}</span></p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Avg. Weather Conditions</h4>
                    {temps.length > 0 ? (
                      <div className="flex gap-3 mt-1">
                        <div className="text-center bg-orange-50 p-2 rounded-lg border border-orange-100 flex-1">
                          <Thermometer className="h-4 w-4 mx-auto text-orange-500 mb-1" />
                          <span className="font-bold text-orange-700 text-xs">{avg(temps)}°C</span>
                        </div>
                        <div className="text-center bg-blue-50 p-2 rounded-lg border border-blue-100 flex-1">
                          <Droplets className="h-4 w-4 mx-auto text-blue-500 mb-1" />
                          <span className="font-bold text-blue-700 text-xs">{avg(hums)}%</span>
                        </div>
                        <div className="text-center bg-slate-50 p-2 rounded-lg border border-slate-200 flex-1">
                          <CloudRain className="h-4 w-4 mx-auto text-slate-500 mb-1" />
                          <span className="font-bold text-slate-700 text-xs">{sum(rains)}mm</span>
                        </div>
                      </div>
                    ) : <p className="text-slate-400 italic">No weather data recorded.</p>}
                  </div>
                </div>
              </div>

              {/* 2. Visual Analysis Charts */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 border-b pb-2 mb-6 flex items-center gap-2 text-sm">
                  <BarChart2 className="h-4 w-4 text-emerald-600" />
                  Visual Analysis
                </h3>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 mb-3 text-center">{projectConfig.primaryMetric.key} % Over Time (per Treatment)</h4>
                    <div className="h-[260px] relative">
                      <canvas ref={wceChartRef}></canvas>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 mb-3 text-center">Final Treatment Performance</h4>
                    <div className="h-[260px] relative">
                      <canvas ref={perfChartRef}></canvas>
                    </div>
                  </div>
                </div>

                {/* Stacked Species, Radar & Yield Charts */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8 border-t pt-8">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 mb-3 text-center">Mean Target Cover by {projectConfig.targetLabel} (Final)</h4>
                    <div className="h-[260px] relative">
                      <canvas ref={speciesChartRef}></canvas>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 mb-3 text-center">{projectConfig.primaryMetric.key} Spectrum (Radar)</h4>
                    <div className="h-[260px] relative">
                      <canvas ref={radarChartRef}></canvas>
                    </div>
                  </div>
                </div>

                {/* Yield Chart Container */}
                <div id="project-yield-container" className="mt-8 border-t pt-8 hidden">
                  <h4 className="text-xs font-semibold text-slate-500 mb-3 text-center">Crop Yield Analysis</h4>
                  <div className="h-[260px] relative max-w-xl mx-auto">
                    <canvas ref={yieldChartRef}></canvas>
                  </div>
                </div>
              </div>

              {/* 3. Detailed Efficacy & Statistical Separation */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Tables */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Means Table */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">Treatment Means & Significance</h3>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {postHocMethod === 'tukey'
                            ? "Tukey HSD controls family-wise error (more conservative)."
                            : "Fisher's LSD is more powerful but less conservative."}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Post-hoc test</label>
                        <select value={postHocMethod} onChange={e => handlePostHocChange(e.target.value)} className="text-xs border rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400">
                          <option value="lsd">Fisher's LSD</option>
                          <option value="tukey">Tukey HSD</option>
                        </select>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                          <tr>
                            <th className="p-3">Treatment</th>
                            <th className="p-3 text-center">Mean</th>
                            <th className="p-3 text-center">Group ({postHocMethod === 'tukey' ? 'Tukey' : 'LSD'})</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {analysisResults && (analysisResults.grouping || []).map((g, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="p-3 font-medium text-slate-700">{g.name}</td>
                              <td className="p-3 text-center">{isFinite(g.mean) ? g.mean.toFixed(2) : '—'}</td>
                              <td className="p-3 text-center font-bold text-emerald-700">{g.grouping}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-4 text-[10px] text-slate-400">
                      Means sharing the same letter are not significantly different ({postHocMethod === 'tukey' ? 'Tukey HSD' : "Fisher's LSD"}, α=0.05).
                      {analysisResults?.postHoc?.value && <span className="ml-2 font-semibold">{postHocMethod === 'tukey' ? 'HSD' : 'LSD'} (0.05) = {analysisResults.postHoc.value.toFixed(2)}</span>}
                    </p>
                  </div>

                  {/* ANOVA Table */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 text-sm">ANOVA Results</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                          <tr>
                            <th className="p-3">Source</th>
                            <th className="p-3 text-right">DF</th>
                            <th className="p-3 text-right">SS</th>
                            <th className="p-3 text-right">MS</th>
                            <th className="p-3 text-right">F</th>
                            <th className="p-3 text-right">P</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {analysisResults?.anova && (
                            <>
                              <tr>
                                <td className="p-3 font-medium">Treatment</td>
                                <td className="p-3 text-right">{analysisResults.anova.dfTreat ?? '—'}</td>
                                <td className="p-3 text-right">{isFinite(analysisResults.anova.ssTreat) ? analysisResults.anova.ssTreat.toFixed(2) : '—'}</td>
                                <td className="p-3 text-right">{isFinite(analysisResults.anova.msTreat) ? analysisResults.anova.msTreat.toFixed(2) : '—'}</td>
                                <td className="p-3 text-right font-bold">{isFinite(analysisResults.anova.fVal) ? analysisResults.anova.fVal.toFixed(2) : '—'}</td>
                                <td className={`p-3 text-right ${(analysisResults.anova.pVal ?? 1) < 0.05 ? 'text-emerald-600 font-bold' : ''}`}>
                                  {isFinite(analysisResults.anova.pVal) ? analysisResults.anova.pVal.toFixed(4) : '—'}
                                </td>
                              </tr>
                              {isFinite(analysisResults.anova.ssBlock) && (
                                <tr>
                                  <td className="p-3 font-medium">Block</td>
                                  <td className="p-3 text-right">{analysisResults.anova.dfBlock ?? '—'}</td>
                                  <td className="p-3 text-right">{analysisResults.anova.ssBlock.toFixed(2)}</td>
                                  <td className="p-3 text-right">{analysisResults.anova.msBlock.toFixed(2)}</td>
                                  <td className="p-3 text-right"></td>
                                  <td className="p-3 text-right"></td>
                                </tr>
                              )}
                              <tr>
                                <td className="p-3 font-medium">Error</td>
                                <td className="p-3 text-right">{analysisResults.anova.dfError ?? '—'}</td>
                                <td className="p-3 text-right">{isFinite(analysisResults.anova.ssError) ? analysisResults.anova.ssError.toFixed(2) : '—'}</td>
                                <td className="p-3 text-right">{isFinite(analysisResults.anova.msError) ? analysisResults.anova.msError.toFixed(2) : '—'}</td>
                                <td className="p-3 text-right"></td>
                                <td className="p-3 text-right"></td>
                              </tr>
                              {isFinite(analysisResults.anova.ssTotal) && (
                                <tr className="bg-slate-50 font-semibold">
                                  <td className="p-3">Total</td>
                                  <td className="p-3 text-right">{analysisResults.anova.dfTotal ?? '—'}</td>
                                  <td className="p-3 text-right">{analysisResults.anova.ssTotal.toFixed(2)}</td>
                                  <td className="p-3 text-right"></td>
                                  <td className="p-3 text-right"></td>
                                  <td className="p-3 text-right"></td>
                                </tr>
                              )}
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Right Column: Narrative & Stats Summary */}
                <div className="space-y-6">
                  {/* AI narrative */}
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100">
                    <h3 className="font-bold text-indigo-900 mb-1 flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4" /> Agronomist Narrative
                    </h3>
                    <p className="text-[10px] text-indigo-700 mb-3">AI-generated summary of findings.</p>
                    <textarea
                      value={narrative}
                      onChange={e => setNarrative(e.target.value)}
                      rows={12}
                      className="w-full p-3 rounded-lg border-0 shadow-inner bg-white/80 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y"
                      placeholder="Type narrative or generate using AI..."
                    />
                    <button
                      onClick={handleSaveNarrative}
                      disabled={isSavingNarrative}
                      className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-bold transition text-xs flex items-center justify-center gap-2"
                    >
                      {isSavingNarrative ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Save Narrative
                    </button>
                  </div>

                  {/* Trial Statistics Summary Panel */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 text-xs uppercase tracking-wider">Trial Statistics</h3>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-slate-500">CV (%)</span>
                        <span className="font-bold text-slate-800">
                          {analysisResults?.anova?.cv ? `${analysisResults.anova.cv.toFixed(2)}%` : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-slate-500">{postHocMethod === 'tukey' ? 'HSD (0.05)' : 'LSD (0.05)'}</span>
                        <span className="font-bold text-slate-800">
                          {analysisResults?.postHoc?.value ? analysisResults.postHoc.value.toFixed(2) : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Design</span>
                        <span className="font-bold text-slate-800">
                          {analysisResults?.balance?.isBalanced ? 'Balanced RCBD' : 'Unbalanced RCBD (robust)'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
        <TopBar title={activeProject.Name} onMenuClick={onMenuClick} />

        <div className="flex-1 overflow-y-auto">
          {/* ── Header ── */}
          <div className="bg-white border-b px-4 py-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={() => setActiveProjectId(null)} className="p-2 rounded-lg border hover:bg-slate-50 transition shrink-0">
                  <ArrowLeft className="w-4 h-4 text-slate-600" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-800 truncate">{activeProject.Name}</h2>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${isLocked ? 'bg-slate-800 text-white' : 'bg-amber-100 text-amber-700'}`}>
                      {activeProject.Status || 'Draft'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Metric: {activeProject.Metric} · {projectBlocks.length} blocks · {projectTrials.length} plots · {treatments.length} treatments</p>
                </div>
                <button
                  onClick={() => setShowMap(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition shrink-0"
                >
                  <MapPin className="w-4 h-4" />
                  Map
                </button>
                <button
                  onClick={() => runAnalysis(postHocMethod)}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-bold transition shrink-0"
                >
                  {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart2 className="w-4 h-4" />}
                  {isAnalyzing ? 'Analyzing…' : 'Run Analysis'}
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto p-4 space-y-5">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">

              {/* ── LEFT: main content ── */}
              <div className="xl:col-span-3 space-y-5">

                {/* ── Design Completeness + Control Integrity ── */}
                {designCheck && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Design Completeness */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                            <LayoutGrid className="w-4 h-4 text-emerald-600" /> Design Completeness
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">Every block has every treatment (RCBD).</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${designCheck.isBalanced ? 'bg-emerald-100 text-emerald-700' : designCheck.missing.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                          {designCheck.isBalanced ? 'Balanced' : designCheck.missing.length > 0 ? 'Incomplete' : 'Check'}
                        </span>
                      </div>
                      <MiniBar value={designCheck.coveragePct} max={100} color={designCheck.isBalanced ? 'bg-emerald-500' : 'bg-amber-500'} />
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        {[['Coverage', `${designCheck.coveragePct}%`], ['Expected cells', designCheck.expectedCells],
                          ['Missing cells', designCheck.missing.length], ['Duplicates', designCheck.duplicates.length]
                        ].map(([label, val]) => (
                          <div key={label} className="flex justify-between">
                            <span className="text-slate-500">{label}</span>
                            <span className={`font-bold ${(label === 'Missing cells' || label === 'Duplicates') && Number(val) > 0 ? 'text-amber-700' : 'text-slate-700'}`}>{val}</span>
                          </div>
                        ))}
                      </div>
                      {designCheck.missing.length > 0 && (
                        <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg p-2 text-xs text-amber-800">
                          <div className="font-bold flex items-center gap-1 mb-1"><AlertTriangle className="w-3 h-3" /> Missing cells:</div>
                          {designCheck.missing.slice(0, 4).map((m, i) => (
                            <div key={i} className="flex justify-between"><span>{m.blockName}</span><span className="font-semibold truncate ml-2">{m.key}</span></div>
                          ))}
                          {designCheck.missing.length > 4 && <div className="text-amber-600 mt-1">+{designCheck.missing.length - 4} more</div>}
                        </div>
                      )}
                      {designCheck.isBalanced && (
                        <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-lg p-2 text-xs text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> All blocks contain all treatments.
                        </div>
                      )}
                    </div>

                    {/* Control Integrity */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                            <ShieldAlert className="w-4 h-4 text-emerald-600" /> Control Integrity
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">Checks untreated control count per block.</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${(designCheck.noControl.length === 0 && designCheck.multiControl.length === 0) ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {(designCheck.noControl.length === 0 && designCheck.multiControl.length === 0) ? 'OK' : 'Attention'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div className="flex justify-between"><span className="text-slate-500">Blocks w/o control</span><span className={`font-bold ${designCheck.noControl.length > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>{designCheck.noControl.length}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Blocks {'>'} 1 control</span><span className={`font-bold ${designCheck.multiControl.length > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>{designCheck.multiControl.length}</span></div>
                      </div>
                      {(designCheck.noControl.length > 0 || designCheck.multiControl.length > 0) ? (
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-2 text-xs text-amber-800 space-y-1">
                          {designCheck.noControl.length > 0 && <div><span className="font-bold">No control: </span>{designCheck.noControl.map(b => b.blockName).join(', ')}</div>}
                          {designCheck.multiControl.length > 0 && <div><span className="font-bold">Multiple controls: </span>{designCheck.multiControl.map(b => `${b.blockName}(${b.count})`).join(', ')}</div>}
                        </div>
                      ) : (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2 text-xs text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Each block has exactly one control.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Blocks ── */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><Layers className="w-4 h-4 text-emerald-600" /> Blocks & Plots</h3>
                    {!isLocked && (
                      <button onClick={() => setIsAddingBlock(v => !v)} className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold transition">
                        <Plus className="w-3.5 h-3.5" /> Add Block
                      </button>
                    )}
                  </div>

                  {isAddingBlock && (
                    <form onSubmit={handleAddBlock} className="mb-4 flex flex-wrap gap-2 items-end bg-slate-50 p-3 rounded-lg border">
                      <div className="flex-1 min-w-36">
                        <label className="text-xs font-bold text-slate-500 block mb-1">Block Name</label>
                        <input required value={blockForm.Name} onChange={e => setBlockForm(v => ({ ...v, Name: e.target.value }))} className={INPUT} placeholder="e.g. Block 1 / Rep A" />
                      </div>
                      <div className="w-28">
                        <label className="text-xs font-bold text-slate-500 block mb-1">Rep #</label>
                        <input type="number" min="1" value={blockForm.ReplicationNum} onChange={e => setBlockForm(v => ({ ...v, ReplicationNum: e.target.value }))} className={INPUT} placeholder="1" />
                      </div>
                      <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold">Save</button>
                      <button type="button" onClick={() => setIsAddingBlock(false)} className="px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                    </form>
                  )}

                  {projectBlocks.length > 0 ? (
                    <div className="space-y-4">
                      {projectBlocks.map(b => (
                        <BlockCard key={b.ID} block={b} trials={projectTrials.filter(t => String(t.BlockID) === String(b.ID))} activeCategory={activeCategory} onPlotClick={(trialId) => navigate(`/trials?focus=${trialId}`)} onDeleteBlock={handleDeleteBlock} onAddPlot={handleAddPlotToBlock} isLocked={isLocked} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      No blocks yet. {!isLocked && <button onClick={() => setIsAddingBlock(true)} className="text-emerald-600 font-semibold hover:underline">Add the first block →</button>}
                    </div>
                  )}
                </div>

                {/* ── Analysis Results ── */}
                {analysisResults && (
                  <div className="space-y-4">
                    {/* Post-hoc selector + Treatment Means Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm">Treatment Means & Significance</h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {postHocMethod === 'tukey'
                              ? "Tukey HSD — conservative; recommended for many treatments."
                              : "Fisher's LSD — more powerful; use when ANOVA is significant."}
                          </p>
                        </div>
                        <div className="shrink-0">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Post-hoc test</label>
                          <select value={postHocMethod} onChange={e => handlePostHocChange(e.target.value)} className="text-xs border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400">
                            <option value="lsd">Fisher's LSD</option>
                            <option value="tukey">Tukey HSD</option>
                          </select>
                        </div>
                      </div>
                      <div className="overflow-x-auto -mx-5 px-5">
                        <table className="w-full text-sm text-left min-w-[360px]">
                          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                            <tr>
                              <th className="p-3">Treatment</th>
                              <th className="p-3 text-center">Mean</th>
                              <th className="p-3 text-center">Group ({postHocMethod === 'tukey' ? 'Tukey' : 'LSD'})</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(analysisResults.grouping || []).map((g, i) => (
                              <tr key={i} className="hover:bg-slate-50">
                                <td className="p-3 font-medium text-slate-700">{g.name}</td>
                                <td className="p-3 text-center">{isFinite(g.mean) ? g.mean.toFixed(2) : '—'}</td>
                                <td className="p-3 text-center font-bold text-emerald-700">{g.grouping}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="mt-3 text-xs text-slate-400">
                        Means sharing the same letter are not significantly different ({postHocMethod === 'tukey' ? 'Tukey HSD' : "Fisher's LSD"}, α=0.05).
                        {isFinite(analysisResults.postHoc?.value) && <span className="ml-2 font-semibold">{postHocMethod === 'tukey' ? 'HSD' : 'LSD'} (0.05): {analysisResults.postHoc.value.toFixed(2)}</span>}
                      </p>
                    </div>

                    {/* Per-treatment stats table */}
                    {treatmentStats.length > 0 && (
                      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                        <h3 className="font-bold text-slate-800 mb-1 text-sm flex items-center gap-2"><Sigma className="w-4 h-4 text-blue-500" /> Treatment Statistics (Final Observation)</h3>
                        <p className="text-xs text-slate-400 mb-3">Mean {config.primaryMetric.label.toLowerCase()} ± SD from last observation per replicate. {config.primaryMetric.key}% vs untreated control.</p>
                        <div className="overflow-x-auto -mx-5 px-5">
                          <table className="w-full text-sm text-left min-w-[480px]">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                              <tr>
                                {['Treatment','n','Mean','±SD','CV%',`${config.primaryMetric.key}%`,`Group (${postHocMethod === 'tukey' ? 'Tukey' : 'LSD'})`].map(h => (
                                  <th key={h} className="p-3 text-right first:text-left">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {treatmentStats.map((ts, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                  <td className="p-3 font-medium text-slate-700 max-w-[140px] truncate" title={ts.name}>{ts.name}</td>
                                  <td className="p-3 text-right text-slate-500">{ts.n}</td>
                                  <td className="p-3 text-right font-semibold text-slate-800">{ts.mean.toFixed(2)}</td>
                                  <td className="p-3 text-right text-slate-500">{ts.sd.toFixed(2)}</td>
                                  <td className="p-3 text-right">
                                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${ts.cv < 15 ? 'bg-emerald-50 text-emerald-700' : ts.cv < 30 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                                      {ts.cv.toFixed(1)}%
                                    </span>
                                  </td>
                                  <td className={`p-3 text-right font-bold ${ts.wce >= 80 ? 'text-emerald-600' : ts.wce >= 60 ? 'text-amber-600' : 'text-red-500'}`}>{ts.wce.toFixed(1)}{config.primaryMetric.unit || ''}</td>
                                  <td className="p-3 text-right font-black text-emerald-700 tracking-widest">{ts.grouping}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <p className="mt-2 text-xs text-slate-400">
                          Means sharing the same letter are not significantly different ({postHocMethod === 'tukey' ? 'Tukey HSD' : "Fisher's LSD"}, α=0.05).
                          {isFinite(analysisResults.postHoc?.value) && <span className="ml-2 font-semibold text-slate-500">{postHocMethod === 'tukey' ? 'HSD' : 'LSD'} (0.05) = {analysisResults.postHoc.value.toFixed(2)}</span>}
                        </p>
                      </div>
                    )}

                    {/* ANOVA Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                      <h3 className="font-bold text-slate-800 mb-4 text-sm">ANOVA Results (Two-way RCBD)</h3>
                      <div className="overflow-x-auto -mx-5 px-5">
                        <table className="w-full text-sm text-left min-w-[460px]">
                          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                            <tr>
                              {['Source', 'DF', 'SS', 'MS', 'F', 'P', 'Sig'].map(h => <th key={h} className="p-3 text-right first:text-left">{h}</th>)}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            <tr>
                              <td className="p-3 font-medium">Treatment</td>
                              <td className="p-3 text-right">{analysisResults.anova?.dfTreat ?? '—'}</td>
                              <td className="p-3 text-right">{isFinite(analysisResults.anova?.ssTreat) ? analysisResults.anova.ssTreat.toFixed(2) : '—'}</td>
                              <td className="p-3 text-right">{isFinite(analysisResults.anova?.msTreat) ? analysisResults.anova.msTreat.toFixed(2) : '—'}</td>
                              <td className="p-3 text-right font-bold">{isFinite(analysisResults.anova?.fVal) ? analysisResults.anova.fVal.toFixed(2) : '—'}</td>
                              <td className={`p-3 text-right ${(analysisResults.anova?.pVal ?? 1) < 0.05 ? 'text-emerald-600 font-bold' : ''}`}>
                                {isFinite(analysisResults.anova?.pVal) ? analysisResults.anova.pVal.toFixed(4) : '—'}
                              </td>
                              <td className="p-3 text-right">
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${ (analysisResults.anova?.pVal ?? 1) < 0.05 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                  {sigStars(analysisResults.anova?.pVal)}
                                </span>
                              </td>
                            </tr>
                            {isFinite(analysisResults.anova?.ssBlock) && (
                              <tr>
                                <td className="p-3 font-medium">Block</td>
                                <td className="p-3 text-right">{analysisResults.anova?.dfBlock ?? '—'}</td>
                                <td className="p-3 text-right">{isFinite(analysisResults.anova?.ssBlock) ? analysisResults.anova.ssBlock.toFixed(2) : '—'}</td>
                                <td className="p-3 text-right">{isFinite(analysisResults.anova?.msBlock) ? analysisResults.anova.msBlock.toFixed(2) : '—'}</td>
                                <td className="p-3 text-right"></td><td className="p-3 text-right"></td><td className="p-3 text-right"></td>
                              </tr>
                            )}
                            <tr>
                              <td className="p-3 font-medium">Error</td>
                              <td className="p-3 text-right">{analysisResults.anova?.dfError ?? '—'}</td>
                              <td className="p-3 text-right">{isFinite(analysisResults.anova?.ssError) ? analysisResults.anova.ssError.toFixed(2) : '—'}</td>
                              <td className="p-3 text-right">{isFinite(analysisResults.anova?.msError) ? analysisResults.anova.msError.toFixed(2) : '—'}</td>
                              <td className="p-3 text-right"></td><td className="p-3 text-right"></td><td className="p-3 text-right"></td>
                            </tr>
                            {isFinite(analysisResults.anova?.ssTotal) && (
                              <tr className="bg-slate-50 font-semibold">
                                <td className="p-3">Total</td>
                                <td className="p-3 text-right">{analysisResults.anova?.dfTotal ?? '—'}</td>
                                <td className="p-3 text-right">{analysisResults.anova.ssTotal.toFixed(2)}</td>
                                <td className="p-3 text-right"></td><td className="p-3 text-right"></td><td className="p-3 text-right"></td><td className="p-3 text-right"></td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                        {isFinite(analysisResults.anova?.cv) && <span>CV: <strong className="text-slate-700">{analysisResults.anova.cv.toFixed(1)}%</strong></span>}
                        {isFinite(analysisResults.postHoc?.value) && <span>{postHocMethod === 'tukey' ? 'HSD' : 'LSD'} (0.05): <strong className="text-slate-700">{analysisResults.postHoc.value.toFixed(2)}</strong></span>}
                        <span>Design: <strong className="text-slate-700">{analysisResults.balance?.isBalanced ? 'Balanced RCBD' : 'Unbalanced RCBD (robust)'}</strong></span>
                        {isFinite(analysisResults.anova?.grandMean) && <span>Grand Mean: <strong className="text-slate-700">{analysisResults.anova.grandMean.toFixed(2)}</strong></span>}
                      </div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Per-treatment WCE timeline */}
                      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                        <h4 className="font-bold text-sm text-slate-700 mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500" /> {config.primaryMetric.key} % Over Time (per Treatment)</h4>
                        {wceTimelineData.daas.length > 0 && wceTimelineData.series.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="text-xs w-full min-w-max">
                              <thead>
                                <tr className="bg-slate-50">
                                  <th className="p-2 text-left font-semibold text-slate-500">Treatment</th>
                                  {wceTimelineData.daas.map(d => <th key={d} className="p-2 text-center font-semibold text-slate-500">{d}</th>)}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {wceTimelineData.series.map((s, i) => (
                                  <tr key={i} className="hover:bg-slate-50">
                                    <td className="p-2 font-medium text-slate-700 max-w-[120px] truncate" title={s.name}>{s.name}</td>
                                    {s.values.map((v, j) => (
                                      <td key={j} className={`p-2 text-center font-semibold ${
                                        v === null ? 'text-slate-300' : v >= 80 ? 'text-emerald-600' : v >= 60 ? 'text-amber-600' : 'text-red-500'
                                      }`}>{v !== null ? `${v}` : '—'}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : <p className="text-xs text-slate-400 py-4 text-center">No observation data yet</p>}
                      </div>
                      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                        <h4 className="font-bold text-sm text-slate-700 mb-4 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-blue-500" /> Final Treatment Means</h4>
                        <InlineBarChart data={perfChartData} color="#3b82f6" height={120} />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Agronomist Narrative ── */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-bold text-indigo-900 flex items-center gap-2"><FileText className="w-4 h-4" /> Agronomist Narrative</h3>
                      <p className="text-xs text-indigo-600 mt-0.5">AI-generated summary. Edit and save.</p>
                    </div>
                    <button onClick={handleGenerateNarrative} disabled={isGeneratingNarrative}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-bold transition">
                      {isGeneratingNarrative ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {isGeneratingNarrative ? 'Generating…' : 'Generate AI Narrative'}
                    </button>
                  </div>
                  <textarea
                    value={narrative}
                    onChange={e => setNarrative(e.target.value)}
                    rows={8}
                    className="w-full p-3 rounded-lg border-0 shadow-inner bg-white/80 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y"
                    placeholder="Click 'Generate AI Narrative' or type your narrative here…"
                  />
                  <button onClick={handleSaveNarrative} disabled={isSavingNarrative}
                    className="mt-3 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-bold transition">
                    {isSavingNarrative ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSavingNarrative ? 'Saving…' : 'Save Narrative'}
                  </button>
                </div>

              </div>

              {/* ── RIGHT: sidebar ── */}
              <div className="xl:col-span-1 space-y-4">

                {/* Project Scope */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                  <h3 className="font-bold text-slate-800 mb-4 text-sm">Project Scope</h3>
                  <ul className="space-y-2.5 text-sm">
                    {[
                      ['Blocks', projectBlocks.length],
                      ['Treatments', treatments.length],
                      ['Total Plots', projectTrials.length],
                      ['Crop', activeProject.Crop || 'N/A'],
                      ['Location', activeProject.Location || 'N/A'],
                      activeProject.WeatherTemp ? ['Weather Temp', `${activeProject.WeatherTemp}°C`] : null,
                      activeProject.WeatherHumidity ? ['Humidity', `${activeProject.WeatherHumidity}%`] : null,
                      activeProject.WeatherWind ? ['Wind Speed', `${activeProject.WeatherWind} km/h`] : null,
                      activeProject.WeatherRain ? ['Rain', `${activeProject.WeatherRain} mm`] : null,
                      ['Investigator', activeProject.Investigator || 'N/A'],
                      ['Metric', activeProject.Metric],
                    ].filter(Boolean).map(([label, val]) => (
                      <li key={label} className="flex justify-between border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                        <span className="text-slate-500">{label}</span>
                        <span className="font-bold text-slate-800 truncate max-w-[120px] text-right" title={String(val)}>{val}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                  <h3 className="font-bold text-slate-800 mb-3 text-sm">Actions</h3>
                  <div className="space-y-1">
                    <button onClick={() => runAnalysis(postHocMethod)}
                      className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition text-emerald-700 hover:bg-emerald-50">
                      <BarChart2 className="w-4 h-4 shrink-0" /> {isLocked ? 'Refresh Report' : 'Run Analysis'}
                    </button>
                    <button onClick={handleRecalcDAA}
                      className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition text-amber-700 hover:bg-amber-50">
                      <RefreshCw className="w-4 h-4 shrink-0" /> Recalculate DAA
                    </button>
                    <button onClick={handleRandomizeLayout} disabled={isLocked}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition text-emerald-700 hover:bg-emerald-50 ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}`}>
                      <Shuffle className="w-4 h-4 shrink-0" /> Randomize Layout
                    </button>
                    <button onClick={openProtocolSettings} disabled={isLocked}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition text-blue-700 hover:bg-blue-50 ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}`}>
                      <ClipboardList className="w-4 h-4 shrink-0" /> Protocol Settings
                    </button>
                    <hr className="my-2 border-slate-100" />
                    <button onClick={handleExportR} className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium text-blue-700 hover:bg-blue-50 transition">
                      <Download className="w-4 h-4" /> Export to R (CSV)
                    </button>
                    <button onClick={handleExportSAS} className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium text-green-700 hover:bg-green-50 transition">
                      <Download className="w-4 h-4" /> Export to SAS
                    </button>
                    <button onClick={handleExportBundle} className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 transition">
                      <Package className="w-4 h-4" /> Export Analysis Bundle
                    </button>
                    <button onClick={handleScientificReport} className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium text-cyan-700 hover:bg-cyan-50 transition">
                      <FileText className="w-4 h-4" /> Scientific Report
                    </button>
                    <button onClick={handleRegulatoryPDF} className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium text-purple-700 hover:bg-purple-50 transition">
                      <Printer className="w-4 h-4" /> Regulatory Report (PDF)
                    </button>
                    <button onClick={handleRegulatoryDOCX} className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium text-fuchsia-700 hover:bg-fuchsia-50 transition">
                      <FileText className="w-4 h-4" /> Export DOCX
                    </button>
                    <hr className="my-2 border-slate-100" />
                    <button onClick={handleLockToggle}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition ${isLocked ? 'text-amber-700 hover:bg-amber-50' : 'text-red-700 hover:bg-red-50'}`}>
                      {isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      {isLocked ? 'Unlock Project' : 'Lock Project'}
                    </button>
                  </div>
                </div>

                {/* Weather conditions from trials */}
                {(() => {
                  const temps = projectTrials.map(t => parseFloat(t.Temperature)).filter(n => isFinite(n));
                  const hums = projectTrials.map(t => parseFloat(t.Humidity)).filter(n => isFinite(n));
                  const rains = projectTrials.map(t => parseFloat(t.Rain)).filter(n => isFinite(n));
                  if (temps.length === 0) return null;
                  const avg = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : 'N/A';
                  return (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                      <h3 className="font-bold text-slate-800 mb-3 text-sm">Avg Weather Conditions</h3>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-orange-50 rounded-lg p-2 border border-orange-100"><div className="font-bold text-orange-700">{avg(temps)}°C</div><div className="text-slate-400">Temp</div></div>
                        <div className="bg-blue-50 rounded-lg p-2 border border-blue-100"><div className="font-bold text-blue-700">{avg(hums)}%</div><div className="text-slate-400">Humidity</div></div>
                        <div className="bg-slate-50 rounded-lg p-2 border border-slate-200"><div className="font-bold text-slate-700">{avg(rains)}mm</div><div className="text-slate-400">Rain</div></div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── Randomize Layout Modal ── */}
                <Modal isOpen={isRandomizeModalOpen} onClose={() => setIsRandomizeModalOpen(false)} title="Randomize & Generate Layout" maxWidth="max-w-4xl">
                  <form onSubmit={applyRandomization} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                      <p className="text-xs font-bold text-emerald-600 uppercase">Target Project</p>
                      <p className="text-base font-bold text-emerald-900">{activeProject?.Name}</p>
                    </div>
                    <p className="text-xs text-slate-500">Configure treatment rows to distribute across all blocks. You can map multiple rows to the same active formulation (e.g. testing different rates) and leave the formulation blank for untreated control treatments.</p>
                    
                    {/* Default Plot Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-xl border">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Replications (Blocks)</label>
                        <select 
                          value={randomizeForm.replications} 
                          onChange={e => setRandomizeForm(p => ({ ...p, replications: e.target.value }))} 
                          className={INPUT}
                        >
                          {[2, 3, 4, 5, 6, 7, 8].map(n => (
                            <option key={n} value={String(n)}>{n} Replications</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Investigator</label>
                        <input 
                          type="text" 
                          placeholder="Investigator" 
                          value={randomizeForm.investigatorName} 
                          onChange={e => setRandomizeForm(p => ({ ...p, investigatorName: e.target.value }))} 
                          className={INPUT} 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Default Dosage</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 100 mL/ha" 
                          value={randomizeForm.dosage} 
                          onChange={e => setRandomizeForm(p => ({ ...p, dosage: e.target.value }))} 
                          className={INPUT} 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target {config.targetLabel}</label>
                        <input 
                          type="text" 
                          placeholder={`Target ${config.targetLabel}`} 
                          value={randomizeForm.weedSpecies} 
                          onChange={e => setRandomizeForm(p => ({ ...p, weedSpecies: e.target.value }))} 
                          className={INPUT} 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Start Date</label>
                        <input 
                          type="date" 
                          value={randomizeForm.date} 
                          onChange={e => setRandomizeForm(p => ({ ...p, date: e.target.value }))} 
                          className={INPUT} 
                        />
                      </div>
                    </div>

                    {/* Tabular Treatments Setup */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="block text-sm font-semibold text-slate-700">Treatments Setup</label>
                        <button
                          type="button"
                          onClick={addTreatmentRow}
                          className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold transition"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Treatment Row
                        </button>
                      </div>
                      
                      <div className="overflow-x-auto border rounded-xl bg-slate-50">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-100 text-slate-600 font-bold uppercase border-b border-slate-200">
                            <tr>
                              <th className="p-3">Treatment Name *</th>
                              <th className="p-3">Active Formulation</th>
                              <th className="p-3">Dosage / Rate</th>
                              <th className="p-3">Role</th>
                              <th className="p-3 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            {randomizeTreatments.map((t) => (
                              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-2">
                                  <input
                                    required
                                    type="text"
                                    placeholder="Treatment Name (e.g. UTC, T1, T2)"
                                    value={t.name}
                                    onChange={e => updateTreatmentRow(t.id, 'name', e.target.value)}
                                    className="w-full px-2 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                                  />
                                </td>
                                <td className="p-2">
                                  <select
                                    value={t.formulationId}
                                    onChange={e => updateTreatmentRow(t.id, 'formulationId', e.target.value)}
                                    className="w-full px-2 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                                  >
                                    <option value="">None (Untreated Control)</option>
                                    {activeFormulations.map(f => (
                                      <option key={f.ID} value={f.ID}>{f.Name}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    placeholder="e.g. 100 mL/ha"
                                    value={t.dosage}
                                    onChange={e => updateTreatmentRow(t.id, 'dosage', e.target.value)}
                                    className="w-full px-2 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                                  />
                                </td>
                                <td className="p-2">
                                  <select
                                    value={t.role}
                                    onChange={e => updateTreatmentRow(t.id, 'role', e.target.value)}
                                    className="w-full px-2 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                                  >
                                    <option value="experimental">Experimental</option>
                                    <option value="standard">Standard Check</option>
                                    <option value="control">Untreated Control</option>
                                  </select>
                                </td>
                                <td className="p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => deleteTreatmentRow(t.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="Delete row"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {randomizeTreatments.length === 0 && (
                              <tr>
                                <td colSpan="5" className="text-center py-6 text-slate-400 italic bg-white animate-pulse">
                                  No treatments added yet. Click "+ Add Treatment Row" to begin.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800">
                      <strong>Warning:</strong> Generating a new randomized layout will replace any existing plots/trials for this project.
                    </div>
                    <div className="pt-4 flex justify-end gap-3 border-t">
                      <button type="button" onClick={() => setIsRandomizeModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">Cancel</button>
                      <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                        <Shuffle className="w-4 h-4" /> Generate & Randomize
                      </button>
                    </div>
                  </form>
                </Modal>

                {/* ── Protocol Settings Modal ── */}
                <Modal isOpen={isProtocolModalOpen} onClose={() => setIsProtocolModalOpen(false)} title="Protocol Settings">
                  <form onSubmit={(e) => { e.preventDefault(); saveProtocolSettings(); }} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Project Name *</label>
                        <input required value={protocolForm.Name} onChange={e => setProtocolForm(v => ({ ...v, Name: e.target.value }))} className={INPUT} placeholder="e.g., Study Name" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Investigator</label>
                        <input value={protocolForm.Investigator} onChange={e => setProtocolForm(v => ({ ...v, Investigator: e.target.value }))} className={INPUT} placeholder="Lead researcher" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-sm font-semibold text-slate-700">Location</label>
                          <button
                            type="button"
                            onClick={handleAutofetchLocationAndWeatherForProtocol}
                            disabled={isFetchingGeoProtocol}
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 disabled:opacity-50"
                          >
                            {isFetchingGeoProtocol ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" /> Fetching...
                              </>
                            ) : (
                              <>
                                <MapPin className="w-3 h-3" /> Auto-fetch
                              </>
                            )}
                          </button>
                        </div>
                        <input value={protocolForm.Location} onChange={e => setProtocolForm(v => ({ ...v, Location: e.target.value }))} className={INPUT} placeholder="e.g., North Field" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Target {config.targetLabel}</label>
                        <input value={protocolForm.TargetWeed} onChange={e => setProtocolForm(v => ({ ...v, TargetWeed: e.target.value }))} className={INPUT} placeholder={`e.g., Target ${config.targetLabel}`} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Crop</label>
                        <input value={protocolForm.Crop} onChange={e => setProtocolForm(v => ({ ...v, Crop: e.target.value }))} className={INPUT} placeholder="e.g., Rice (Oryza sativa)" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Primary Metric</label>
                      <select value={protocolForm.Metric} onChange={e => setProtocolForm(v => ({ ...v, Metric: e.target.value }))} className={INPUT}>
                        {activeCategory === 'herbicide' && (
                          <>
                            <option value="Weed Control Efficiency">Weed Control Efficiency (%)</option>
                            <option value="Crop Injury">Crop Injury / Phytotoxicity (%)</option>
                            <option value="Yield">Yield (kg/ha)</option>
                            <option value="Biomass Reduction">Biomass Reduction (%)</option>
                          </>
                        )}
                        {activeCategory === 'fungicide' && (
                          <>
                            <option value="Disease Control Efficiency">Disease Control Efficiency (%)</option>
                            <option value="Crop Injury">Crop Injury / Phytotoxicity (%)</option>
                            <option value="Yield">Yield (kg/ha)</option>
                            <option value="Green Leaf Area">Green Leaf Area (%)</option>
                          </>
                        )}
                        {activeCategory === 'pesticide' && (
                          <>
                            <option value="Pest Reduction Efficiency">Pest Reduction Efficiency (%)</option>
                            <option value="Crop Injury">Crop Injury / Phytotoxicity (%)</option>
                            <option value="Yield">Yield (kg/ha)</option>
                            <option value="Damage Rating">Damage Rating (0-9)</option>
                          </>
                        )}
                        {activeCategory === 'nutrition' && (
                          <>
                            <option value="Yield Improvement">Yield Improvement (%)</option>
                            <option value="Chlorophyll Index">Chlorophyll Index (SPAD)</option>
                            <option value="Biomass Weight">Biomass Weight (g/m²)</option>
                            <option value="Plant Height">Plant Height (cm)</option>
                          </>
                        )}
                        {activeCategory === 'biostimulant' && (
                          <>
                            <option value="Growth Enhancement Index">Growth Enhancement Index</option>
                            <option value="Root Biomass">Root Biomass (g)</option>
                            <option value="Shoot Biomass">Shoot Biomass (g)</option>
                            <option value="Chlorophyll Index">Chlorophyll Index (SPAD)</option>
                          </>
                        )}
                      </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Application Timing</label>
                        <select value={protocolForm.ApplicationTiming} onChange={e => setProtocolForm(v => ({ ...v, ApplicationTiming: e.target.value }))} className={INPUT}>
                          <option value="">Select timing...</option>
                          {config.applicationTimings?.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Spray Volume (L/ha)</label>
                        <input type="number" min="0" step="10" value={protocolForm.SprayVolume} onChange={e => setProtocolForm(v => ({ ...v, SprayVolume: e.target.value }))} className={INPUT} placeholder="e.g., 200" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Protocol Notes</label>
                      <textarea rows={4} value={protocolForm.Notes} onChange={e => setProtocolForm(v => ({ ...v, Notes: e.target.value }))} className={`${INPUT} resize-y`} placeholder="Additional protocol details, application methods, timing constraints..." />
                    </div>
                    <div className="pt-4 flex justify-end gap-3 border-t">
                      <button type="button" onClick={() => setIsProtocolModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">Cancel</button>
                      <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                        <Save className="w-4 h-4" /> Save Protocol Settings
                      </button>
                    </div>
                  </form>
                </Modal>

                {/* Plot Map Modal */}
                {showMap && activeProject && (
                  <PlotMap 
                    projectId={activeProject.ID}
                    onClose={() => setShowMap(false)}
                  />
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      <TopBar title="Projects (RCBD)" onMenuClick={onMenuClick} />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
          <h2 className="text-xl font-bold text-slate-800">All RCBD Projects</h2>
          <button onClick={() => { setFormData({ Name: '', Metric: config.primaryMetric.label, TargetWeed: '', Crop: '', Location: '', Investigator: '', StartDate: '' }); setIsModalOpen(true); }}
            style={{ backgroundColor: config.color.hex }}
            className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition hover:opacity-90">
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.length > 0 ? projects.map(p => {
            const pb = (state.blocks || []).filter(b => String(b.ProjectID) === String(p.ID));
            const pt = (state.trials || []).filter(t => String(t.ProjectID) === String(p.ID));
            const treats = [...new Set(pt.map(t => t.FormulationName).filter(Boolean))];
            const statusClass = p.Status === 'Locked' ? 'bg-slate-800 text-white' : p.Status === 'Finalized' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';

            return (
              <div key={p.ID} onClick={() => openProject(p.ID)}
                className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition cursor-pointer active:scale-[0.99]">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 truncate">{p.Name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusClass}`}>{p.Status || 'Draft'}</span>
                  </div>
                  <button onClick={(e) => handleDelete(e, p.ID)} className="text-slate-300 hover:text-red-500 transition p-1 shrink-0 ml-2">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2 mb-4 text-sm text-slate-500">
                  <div className="flex items-center gap-2"><Layers className="h-3.5 w-3.5" /><span>{pb.length} Block{pb.length !== 1 ? 's' : ''}</span></div>
                  <div className="flex items-center gap-2"><Beaker className="h-3.5 w-3.5" /><span>{pt.length} Plot{pt.length !== 1 ? 's' : ''} · {treats.length} Treatment{treats.length !== 1 ? 's' : ''}</span></div>
                  <div className="flex items-center gap-2"><Activity className="h-3.5 w-3.5" /><span className="truncate">Metric: {p.Metric || 'WCE'}</span></div>
                  {p.Crop && <div className="flex items-center gap-2 text-xs"><span className="text-slate-400">Crop:</span><span>{p.Crop}</span></div>}
                  {p.Location && <div className="flex items-center gap-2 text-xs"><span className="text-slate-400">Location:</span><span className="truncate">{p.Location}</span></div>}
                </div>

                <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-[10px] text-slate-400">{formatDateTime(p.CreatedAt) || '—'}</span>
                  <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">View Dashboard <ChevronRight className="h-3.5 w-3.5" /></span>
                </div>
              </div>
            );
          }) : (
            <div className="col-span-full text-center py-14 bg-white rounded-xl border-2 border-dashed border-slate-200">
              <Layers className="w-10 h-10 mx-auto text-slate-200 mb-3" />
              <p className="text-slate-500 mb-3">No RCBD Projects yet.</p>
              <button onClick={() => setIsModalOpen(true)} className="text-emerald-600 font-bold hover:underline text-sm">Create your first project →</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Create Project Modal ── */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New RCBD Project">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Project Name *</label>
            <input required value={formData.Name} onChange={e => setFormData(v => ({ ...v, Name: e.target.value }))} className={INPUT} placeholder="e.g., 2024 Pre-Emergent Corn Study" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-semibold text-slate-700">Location</label>
                <button
                  type="button"
                  onClick={handleAutofetchLocationAndWeather}
                  disabled={isFetchingGeo}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 disabled:opacity-50"
                >
                  {isFetchingGeo ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" /> Fetching...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3 h-3" /> Auto-fetch
                    </>
                  )}
                </button>
              </div>
              <input value={formData.Location} onChange={e => setFormData(v => ({ ...v, Location: e.target.value }))} className={INPUT} placeholder="e.g., North Field" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Crop</label>
              <input value={formData.Crop} onChange={e => setFormData(v => ({ ...v, Crop: e.target.value }))} className={INPUT} placeholder="e.g., Corn" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Investigator</label>
              <input value={formData.Investigator} onChange={e => setFormData(v => ({ ...v, Investigator: e.target.value }))} className={INPUT} placeholder="Lead researcher name" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Start Date</label>
              <input type="datetime-local" value={toDatetimeLocal(formData.StartDate)} onChange={e => setFormData(v => ({ ...v, StartDate: e.target.value }))} className={INPUT} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Target {config.targetLabel}</label>
            <input value={formData.TargetWeed} onChange={e => setFormData(v => ({ ...v, TargetWeed: e.target.value }))} className={INPUT} placeholder={`e.g. Target ${config.targetLabel}`} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Primary Metric</label>
            <select value={formData.Metric} onChange={e => setFormData(v => ({ ...v, Metric: e.target.value }))} className={INPUT}>
              {activeCategory === 'herbicide' && (
                <>
                  <option value="Weed Control Efficiency">Weed Control Efficiency (%)</option>
                  <option value="Crop Injury">Crop Injury / Phytotoxicity (%)</option>
                  <option value="Yield">Yield (kg/ha)</option>
                  <option value="Biomass Reduction">Biomass Reduction (%)</option>
                </>
              )}
              {activeCategory === 'fungicide' && (
                <>
                  <option value="Disease Control Efficiency">Disease Control Efficiency (%)</option>
                  <option value="Crop Injury">Crop Injury / Phytotoxicity (%)</option>
                  <option value="Yield">Yield (kg/ha)</option>
                  <option value="Green Leaf Area">Green Leaf Area (%)</option>
                </>
              )}
              {activeCategory === 'pesticide' && (
                <>
                  <option value="Pest Reduction Efficiency">Pest Reduction Efficiency (%)</option>
                  <option value="Crop Injury">Crop Injury / Phytotoxicity (%)</option>
                  <option value="Yield">Yield (kg/ha)</option>
                  <option value="Damage Rating">Damage Rating (0-9)</option>
                </>
              )}
              {activeCategory === 'nutrition' && (
                <>
                  <option value="Yield Improvement">Yield Improvement (%)</option>
                  <option value="Chlorophyll Index">Chlorophyll Index (SPAD)</option>
                  <option value="Biomass Weight">Biomass Weight (g/m²)</option>
                  <option value="Plant Height">Plant Height (cm)</option>
                </>
              )}
              {activeCategory === 'biostimulant' && (
                <>
                  <option value="Growth Enhancement Index">Growth Enhancement Index</option>
                  <option value="Root Biomass">Root Biomass (g)</option>
                  <option value="Shoot Biomass">Shoot Biomass (g)</option>
                  <option value="Chlorophyll Index">Chlorophyll Index (SPAD)</option>
                </>
              )}
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">Cancel</button>
            <button type="submit" style={{ backgroundColor: config.color.hex }} className="text-white px-5 py-2 rounded-lg text-sm font-bold hover:opacity-90">Create Project</button>
          </div>
        </form>
      </Modal>

      {/* ── Randomize Layout Modal ── */}
      <Modal isOpen={isRandomizeModalOpen} onClose={() => setIsRandomizeModalOpen(false)} title="Randomize & Generate Layout" maxWidth="max-w-4xl">
        <form onSubmit={applyRandomization} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
            <p className="text-xs font-bold text-emerald-600 uppercase">Target Project</p>
            <p className="text-base font-bold text-emerald-900">{activeProject?.Name}</p>
          </div>
          <p className="text-xs text-slate-500">Configure treatment rows to distribute across all blocks. You can map multiple rows to the same active formulation (e.g. testing different rates) and leave the formulation blank for untreated control treatments.</p>
          
          {/* Default Plot Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-xl border">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Replications (Blocks)</label>
              <select 
                value={randomizeForm.replications} 
                onChange={e => setRandomizeForm(p => ({ ...p, replications: e.target.value }))} 
                className={INPUT}
              >
                {[2, 3, 4, 5, 6, 7, 8].map(n => (
                  <option key={n} value={String(n)}>{n} Replications</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Investigator</label>
              <input 
                type="text" 
                placeholder="Investigator" 
                value={randomizeForm.investigatorName} 
                onChange={e => setRandomizeForm(p => ({ ...p, investigatorName: e.target.value }))} 
                className={INPUT} 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Default Dosage</label>
              <input 
                type="text" 
                placeholder="e.g. 100 mL/ha" 
                value={randomizeForm.dosage} 
                onChange={e => setRandomizeForm(p => ({ ...p, dosage: e.target.value }))} 
                className={INPUT} 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target {config.targetLabel}</label>
              <input 
                type="text" 
                placeholder={`Target ${config.targetLabel}`} 
                value={randomizeForm.weedSpecies} 
                onChange={e => setRandomizeForm(p => ({ ...p, weedSpecies: e.target.value }))} 
                className={INPUT} 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Start Date</label>
              <input 
                type="date" 
                value={randomizeForm.date} 
                onChange={e => setRandomizeForm(p => ({ ...p, date: e.target.value }))} 
                className={INPUT} 
              />
            </div>
          </div>

          {/* Tabular Treatments Setup */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-semibold text-slate-700">Treatments Setup</label>
              <button
                type="button"
                onClick={addTreatmentRow}
                className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Treatment Row
              </button>
            </div>
            
            <div className="overflow-x-auto border rounded-xl bg-slate-50">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3">Treatment Name *</th>
                    <th className="p-3">Active Formulation</th>
                    <th className="p-3">Dosage / Rate</th>
                    <th className="p-3">Role</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {randomizeTreatments.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2">
                        <input
                          required
                          type="text"
                          placeholder="Treatment Name (e.g. UTC, T1, T2)"
                          value={t.name}
                          onChange={e => updateTreatmentRow(t.id, 'name', e.target.value)}
                          className="w-full px-2 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={t.formulationId}
                          onChange={e => updateTreatmentRow(t.id, 'formulationId', e.target.value)}
                          className="w-full px-2 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                        >
                          <option value="">None (Untreated Control)</option>
                          {activeFormulations.map(f => (
                            <option key={f.ID} value={f.ID}>{f.Name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="e.g. 100 mL/ha"
                          value={t.dosage}
                          onChange={e => updateTreatmentRow(t.id, 'dosage', e.target.value)}
                          className="w-full px-2 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={t.role}
                          onChange={e => updateTreatmentRow(t.id, 'role', e.target.value)}
                          className="w-full px-2 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                        >
                          <option value="experimental">Experimental</option>
                          <option value="standard">Standard Check</option>
                          <option value="control">Untreated Control</option>
                        </select>
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => deleteTreatmentRow(t.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {randomizeTreatments.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-6 text-slate-400 italic bg-white animate-pulse">
                        No treatments added yet. Click "+ Add Treatment Row" to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800">
            <strong>Warning:</strong> Generating a new randomized layout will replace any existing plots/trials for this project.
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t">
            <button type="button" onClick={() => setIsRandomizeModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">Cancel</button>
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
              <Shuffle className="w-4 h-4" /> Generate & Randomize
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Protocol Settings Modal ── */}
      <Modal isOpen={isProtocolModalOpen} onClose={() => setIsProtocolModalOpen(false)} title="Protocol Settings">
        <form onSubmit={(e) => { e.preventDefault(); saveProtocolSettings(); }} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Project Name *</label>
              <input required value={protocolForm.Name} onChange={e => setProtocolForm(v => ({ ...v, Name: e.target.value }))} className={INPUT} placeholder="e.g., Study Name" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Investigator</label>
              <input value={protocolForm.Investigator} onChange={e => setProtocolForm(v => ({ ...v, Investigator: e.target.value }))} className={INPUT} placeholder="Lead researcher" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-semibold text-slate-700">Location</label>
                <button
                  type="button"
                  onClick={handleAutofetchLocationAndWeatherForProtocol}
                  disabled={isFetchingGeoProtocol}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 disabled:opacity-50"
                >
                  {isFetchingGeoProtocol ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" /> Fetching...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3 h-3" /> Auto-fetch
                    </>
                  )}
                </button>
              </div>
              <input value={protocolForm.Location} onChange={e => setProtocolForm(v => ({ ...v, Location: e.target.value }))} className={INPUT} placeholder="e.g., North Field" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Target {config.targetLabel}</label>
              <input value={protocolForm.TargetWeed} onChange={e => setProtocolForm(v => ({ ...v, TargetWeed: e.target.value }))} className={INPUT} placeholder={`e.g., Target ${config.targetLabel}`} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Crop</label>
              <input value={protocolForm.Crop} onChange={e => setProtocolForm(v => ({ ...v, Crop: e.target.value }))} className={INPUT} placeholder="e.g., Rice (Oryza sativa)" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Primary Metric</label>
            <select value={protocolForm.Metric} onChange={e => setProtocolForm(v => ({ ...v, Metric: e.target.value }))} className={INPUT}>
              {activeCategory === 'herbicide' && (
                <>
                  <option value="Weed Control Efficiency">Weed Control Efficiency (%)</option>
                  <option value="Crop Injury">Crop Injury / Phytotoxicity (%)</option>
                  <option value="Yield">Yield (kg/ha)</option>
                  <option value="Biomass Reduction">Biomass Reduction (%)</option>
                </>
              )}
              {activeCategory === 'fungicide' && (
                <>
                  <option value="Disease Control Efficiency">Disease Control Efficiency (%)</option>
                  <option value="Crop Injury">Crop Injury / Phytotoxicity (%)</option>
                  <option value="Yield">Yield (kg/ha)</option>
                  <option value="Green Leaf Area">Green Leaf Area (%)</option>
                </>
              )}
              {activeCategory === 'pesticide' && (
                <>
                  <option value="Pest Reduction Efficiency">Pest Reduction Efficiency (%)</option>
                  <option value="Crop Injury">Crop Injury / Phytotoxicity (%)</option>
                  <option value="Yield">Yield (kg/ha)</option>
                  <option value="Damage Rating">Damage Rating (0-9)</option>
                </>
              )}
              {activeCategory === 'nutrition' && (
                <>
                  <option value="Yield Improvement">Yield Improvement (%)</option>
                  <option value="Chlorophyll Index">Chlorophyll Index (SPAD)</option>
                  <option value="Biomass Weight">Biomass Weight (g/m²)</option>
                  <option value="Plant Height">Plant Height (cm)</option>
                </>
              )}
              {activeCategory === 'biostimulant' && (
                <>
                  <option value="Growth Enhancement Index">Growth Enhancement Index</option>
                  <option value="Root Biomass">Root Biomass (g)</option>
                  <option value="Shoot Biomass">Shoot Biomass (g)</option>
                  <option value="Chlorophyll Index">Chlorophyll Index (SPAD)</option>
                </>
              )}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Application Timing</label>
              <select value={protocolForm.ApplicationTiming} onChange={e => setProtocolForm(v => ({ ...v, ApplicationTiming: e.target.value }))} className={INPUT}>
                <option value="">Select timing...</option>
                {config.applicationTimings?.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Spray Volume (L/ha)</label>
              <input type="number" min="0" step="10" value={protocolForm.SprayVolume} onChange={e => setProtocolForm(v => ({ ...v, SprayVolume: e.target.value }))} className={INPUT} placeholder="e.g., 200" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Protocol Notes</label>
            <textarea rows={4} value={protocolForm.Notes} onChange={e => setProtocolForm(v => ({ ...v, Notes: e.target.value }))} className={`${INPUT} resize-y`} placeholder="Additional protocol details, application methods, timing constraints..." />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t">
            <button type="button" onClick={() => setIsProtocolModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">Cancel</button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
              <Save className="w-4 h-4" /> Save Protocol Settings
            </button>
          </div>
        </form>
      </Modal>

      {/* Plot Map Modal */}
      {showMap && activeProject && (
        <PlotMap 
          projectId={activeProject.ID}
          onClose={() => setShowMap(false)}
        />
      )}
    </div>
  );
}