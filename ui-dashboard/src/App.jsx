import React, { useState, useEffect } from 'react';
import Map, { Marker } from 'react-map-gl/mapbox';
import { 
  Package, 
  AlertCircle, 
  Factory, 
  TrendingUp, 
  ClipboardCheck, 
  X, 
  AlertTriangle, 
  ArrowRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import 'mapbox-gl/dist/mapbox-gl.css';

// ¡TU TOKEN DE MAPBOX AQUÍ!
const MAPBOX_TOKEN = "pk.eyJ1IjoiaW52YXNpdmVkYXZlIiwiYSI6ImNtazl0NHAzdDA5cDczZXNldjBvdXhkcWgifQ.kqMyQjnqAjvHG6hc0SVgyw"; 

const App = () => {
  // --- STATE ---
  const [factories, setFactories] = useState([]);
  const [predictionsData, setPredictionsData] = useState(null);
  const [optimizerData, setOptimizerData] = useState(null); // Nuevo estado para el optimizer
  
  const [selectedFactoryId, setSelectedFactoryId] = useState(null);
  const [currentFactorySkus, setCurrentFactorySkus] = useState([]);
  const [showOptimizer, setShowOptimizer] = useState(false); // Toggle para la vista de Stock/Producción

  // --- DATA LOADING ---
  useEffect(() => {
    // 1. Datos básicos
    fetch('/data/factories.json')
      .then(res => res.json())
      .then(data => setFactories(data))
      .catch(err => console.error("Error loading factories:", err));

    // 2. Predicciones (Risk)
    fetch('/data/prediction_latest.json')
      .then(res => res.json())
      .then(data => setPredictionsData(data))
      .catch(err => console.error("Error loading predictions:", err));

    // 3. NUEVO: Production Optimizer
    fetch('/data/production_optimizer_payload.json')
      .then(res => res.json())
      .then(data => setOptimizerData(data))
      .catch(err => console.error("Error loading optimizer:", err));
  }, []);

  // --- LOGIC ---
  useEffect(() => {
    if (selectedFactoryId && predictionsData?.rows) {
      const skus = predictionsData.rows.filter(row => row.factory_id === selectedFactoryId);
      skus.sort((a, b) => b.risk_score - a.risk_score);
      setCurrentFactorySkus(skus);
    } else {
      setCurrentFactorySkus([]);
    }
  }, [selectedFactoryId, predictionsData]);

  // Helpers de Color
  const getSeverityColor = (riskBand) => {
    switch (riskBand) {
      case 'Critical': return 'bg-purple-600 border-purple-600 text-white';
      case 'High': return 'bg-risk-high border-risk-high text-white';
      case 'Medium': return 'bg-risk-medium border-risk-medium text-white';
      case 'Low': return 'bg-risk-low border-risk-low text-white';
      default: return 'bg-gray-400 border-gray-400 text-white';
    }
  };

  const getRiskTextColor = (score) => {
    if (score > 80) return 'text-danone-red';
    if (score > 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Datos actuales
  const selectedFactoryInfo = factories.find(f => f.factory_id === selectedFactoryId);
  
  // Buscar datos del Optimizer para la fábrica seleccionada
  const selectedFactoryOptimizer = optimizerData?.factories?.find(f => f.factory_id === selectedFactoryId);

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden font-sans text-gray-800 relative">
      
      {/* LOGO */}
      <div className="absolute top-5 right-5 z-50 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm border border-gray-200 flex items-center gap-2">
         {/* Puedes poner tu img tag aquí */}
         <span className="font-bold text-danone-blue text-xl tracking-tight">DANONE</span>
      </div>

      {/* --- LEFT SIDEBAR --- */}
      <div className="w-1/3 h-full flex flex-col bg-white shadow-2xl z-20 relative border-r border-gray-200">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-white z-20">
          <h1 className="text-2xl font-bold text-danone-blue">Risk Intelligence</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-0.5 bg-blue-50 text-danone-blue text-xs font-semibold rounded">MX Pilot</span>
            <p className="text-xs text-gray-400">
              Horizon: {optimizerData?.meta?.horizon_days || 7} days
            </p>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30 scroll-smooth">
          <AnimatePresence mode="wait">
            {!selectedFactoryId ? (
              // LIST VIEW
              <motion.div 
                key="list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                {factories.map(factory => (
                  <div 
                    key={factory.factory_id}
                    onClick={() => setSelectedFactoryId(factory.factory_id)}
                    className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all border border-gray-100 group hover:border-blue-200"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-700 group-hover:text-danone-blue transition-colors">
                          {factory.factory_name}
                        </h3>
                        <p className="text-sm text-gray-400 font-medium">{factory.city}</p>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold shadow-sm ${getSeverityColor(factory.risk_band).split(' ')[0]}`}>
                        {factory.global_risk_score}% Risk
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              // DETAIL VIEW
              <motion.div 
                key="detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <button 
                  onClick={() => {
                    setSelectedFactoryId(null);
                    setShowOptimizer(false);
                  }}
                  className="mb-4 text-sm font-semibold text-gray-400 hover:text-danone-blue flex items-center transition-colors"
                >
                  ← Back to Map
                </button>

                {selectedFactoryInfo && (
                  <div className="space-y-6 pb-10">
                    
                    {/* Factory Header Card */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                      <h2 className="text-xl font-extrabold text-gray-800">{selectedFactoryInfo.factory_name}</h2>
                      
                      {/* --- NUEVO BOTÓN PRINCIPAL --- */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowOptimizer(true)}
                        className="mt-4 w-full bg-danone-blue text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10 hover:bg-blue-800 transition-colors"
                      >
                        <Factory size={18} />
                        View Production Plan
                        <ArrowRight size={16} className="opacity-70" />
                      </motion.button>

                    </div>

                    {/* Simple SKU List (Resumen) */}
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 pl-1">Top Critical SKUs</h3>
                      <div className="space-y-3">
                        {currentFactorySkus.slice(0, 3).map((sku) => (
                          <div key={sku.sku_id} className="bg-white p-3 rounded-lg border border-gray-100 flex justify-between items-center">
                            <div>
                               <p className="text-sm font-bold text-gray-700">{sku.sku_name}</p>
                               <p className="text-[10px] text-gray-400">{sku.sku_id}</p>
                            </div>
                            <span className={`text-sm font-bold ${getRiskTextColor(sku.risk_score)}`}>
                              {sku.risk_score}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* --- MAPA --- */}
      <div className="w-2/3 h-full relative bg-gray-200">
        <Map
          initialViewState={{
            longitude: -100.0,
            latitude: 21.0,
            zoom: 5
          }}
          style={{width: '100%', height: '100%'}}
          mapStyle="mapbox://styles/mapbox/light-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
        >
          {factories.map((factory) => (
            <Marker 
              key={factory.factory_id}
              longitude={factory.location.lon}
              latitude={factory.location.lat}
              anchor="bottom"
              onClick={e => {
                e.originalEvent.stopPropagation();
                setSelectedFactoryId(factory.factory_id);
              }}
            >
              <div className="group relative cursor-pointer hover:z-50">
                {/* Ping animation */}
                {factory.risk_band === 'High' && (
                   <div className="absolute inset-0 rounded-full bg-danone-red animate-ping opacity-75"></div>
                )}
                <div className={`relative w-10 h-10 rounded-full border-4 border-white shadow-xl flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 ${getSeverityColor(factory.risk_band).split(' ')[0]}`}>
                  <Package size={16} className="text-white" />
                </div>
              </div>
            </Marker>
          ))}
        </Map>
      </div>

      {/* --- OVERLAY: PRODUCTION OPTIMIZER (La parte nueva y "padre") --- */}
      <AnimatePresence>
        {showOptimizer && selectedFactoryOptimizer && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-50 bg-gray-50 flex flex-col"
          >
            {/* Header del Overlay */}
            <div className="bg-white border-b border-gray-200 p-6 flex justify-between items-center shadow-sm">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-black text-gray-800 tracking-tight">
                    {selectedFactoryOptimizer.factory_name}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${getSeverityColor(selectedFactoryOptimizer.risk_band)}`}>
                    {selectedFactoryOptimizer.risk_band} Risk
                  </span>
                </div>
                <p className="text-gray-500 mt-1 flex items-center gap-2">
                  <ClipboardCheck size={16} />
                  Production & Stock Optimizer Engine
                </p>
              </div>
              <button 
                onClick={() => setShowOptimizer(false)}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Contenido Principal Grid */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-6xl mx-auto space-y-8">
                
                {/* 1. SECCIÓN DE CAPACIDAD (Barra Visual) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Weekly Production Capacity</h3>
                      <p className="text-sm text-gray-400">Used vs. Remaining Units</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-danone-blue">
                        {Math.round((selectedFactoryOptimizer.capacity_used_units / selectedFactoryOptimizer.capacity_week_units) * 100)}%
                      </span>
                      <span className="text-xs text-gray-400 block font-bold uppercase">Utilization</span>
                    </div>
                  </div>
                  
                  {/* Barra de Progreso */}
                  <div className="h-6 w-full bg-gray-100 rounded-full overflow-hidden relative">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(selectedFactoryOptimizer.capacity_used_units / selectedFactoryOptimizer.capacity_week_units) * 100}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-danone-blue rounded-full relative"
                    >
                      {/* Pattern overlay opcional */}
                      <div className="absolute inset-0 bg-white/10" style={{backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem'}}></div>
                    </motion.div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs font-mono text-gray-500">
                    <span>0 Units</span>
                    <span>{selectedFactoryOptimizer.capacity_used_units.toLocaleString()} Used</span>
                    <span>{selectedFactoryOptimizer.capacity_week_units.toLocaleString()} Max</span>
                  </div>
                </div>

                {/* 2. PLAN DE PRODUCCIÓN (Tarjetas SKU) */}
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-danone-blue"/>
                    Optimized Production Plan ({selectedFactoryOptimizer.plan.length} SKUs)
                  </h3>

                  {selectedFactoryOptimizer.plan.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                      No critical production needed for this week. Capacity fully available.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {selectedFactoryOptimizer.plan.map((sku) => (
                        <motion.div 
                          key={sku.sku_id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col"
                        >
                          <div className="p-5 border-b border-gray-50 flex justify-between items-start bg-gray-50/50">
                            <div>
                              <h4 className="font-bold text-gray-800 text-lg leading-tight">{sku.sku_name}</h4>
                              <span className="text-xs font-mono text-gray-400">{sku.sku_id}</span>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${sku.risk_band === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {sku.risk_band} Risk
                            </span>
                          </div>

                          <div className="p-5 grid grid-cols-2 gap-6 flex-1">
                            {/* Stock Analysis */}
                            <div className="space-y-3">
                              <p className="text-xs font-bold text-gray-400 uppercase">Stock Analysis</p>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Available:</span>
                                <span className="font-bold">{sku.available_units.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Forecast (7d):</span>
                                <span className="font-bold">{sku.forecast_demand_7d_units.toLocaleString()}</span>
                              </div>
                              <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-600 flex items-center gap-1 font-semibold">
                                <AlertTriangle size={12}/> Stockout: {sku.stockout_date_est}
                              </div>
                            </div>

                            {/* Recommendation */}
                            <div className="space-y-3">
                              <p className="text-xs font-bold text-danone-blue uppercase">Recommendation</p>
                              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-center">
                                <span className="block text-xs text-blue-400 mb-1">PRODUCE</span>
                                <span className="block text-xl font-black text-danone-blue">
                                  {sku.recommended_production_7d_units.toLocaleString()}
                                </span>
                                <span className="block text-[10px] text-blue-400">UNITS</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Items Footer */}
                          <div className="bg-yellow-50/50 p-4 border-t border-yellow-100">
                             <p className="text-xs font-bold text-yellow-700 uppercase mb-2">Recommended Actions</p>
                             <ul className="space-y-1">
                               {sku.recommended_actions.map((action, idx) => (
                                 <li key={idx} className="flex items-center gap-2 text-xs text-gray-700">
                                   <div className="w-4 h-4 rounded-full border border-yellow-400 flex items-center justify-center bg-white text-yellow-600 text-[8px]">✓</div>
                                   {action}
                                 </li>
                               ))}
                             </ul>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;