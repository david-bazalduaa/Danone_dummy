import React, { useState, useEffect } from 'react';
import Map, { Marker } from 'react-map-gl/mapbox';
import { Package, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import 'mapbox-gl/dist/mapbox-gl.css';

// ¡OJO! REEMPLAZA ESTO CON TU TOKEN DE MAPBOX O EL MAPA SE VERÁ NEGRO
const MAPBOX_TOKEN = "pk.eyJ1IjoiaW52YXNpdmVkYXZlIiwiYSI6ImNtazl0NHAzdDA5cDczZXNldjBvdXhkcWgifQ.kqMyQjnqAjvHG6hc0SVgyw"; 

const App = () => {
  const [factories, setFactories] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [selectedFactoryId, setSelectedFactoryId] = useState(null);
  const [selectedFactoryData, setSelectedFactoryData] = useState(null);

  // 1. Cargar datos desde la carpeta public/data
  useEffect(() => {
    fetch('/data/factories.json')
      .then(res => res.json())
      .then(data => setFactories(data))
      .catch(err => console.error("Error cargando factories:", err));

    fetch('/data/predictions_latest.json')
      .then(res => res.json())
      .then(data => setPredictions(data))
      .catch(err => console.error("Error cargando predictions:", err));
  }, []);

  // 2. Filtrar datos cuando seleccionas una fábrica
  useEffect(() => {
    if (selectedFactoryId && predictions) {
      const factoryDetail = predictions.factories.find(f => f.factory_id === selectedFactoryId);
      setSelectedFactoryData(factoryDetail);
    } else {
      setSelectedFactoryData(null);
    }
  }, [selectedFactoryId, predictions]);

  // Ayudante para colores según severidad
  const getSeverityColor = (severity) => {
    if (severity === 'RED') return 'bg-risk-high border-risk-high';
    if (severity === 'YELLOW') return 'bg-risk-medium border-risk-medium';
    return 'bg-risk-low border-risk-low';
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden font-sans text-gray-800">
      
      {/* LOGO (Simulado) */}
      <div className="absolute top-5 right-5 z-50 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm border border-gray-200">
         <span className="font-bold text-danone-blue text-xl tracking-tight">DANONE</span>
      </div>

      {/* --- SIDEBAR IZQUIERDO (Lista / Detalle) --- */}
      <div className="w-1/3 h-full flex flex-col bg-white shadow-2xl z-10 relative">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-white z-20">
          <h1 className="text-2xl font-bold text-danone-blue">Risk Intelligence</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-0.5 bg-blue-50 text-danone-blue text-xs font-semibold rounded">MX Pilot</span>
            <p className="text-xs text-gray-400">
              Horizonte: {predictions?.horizon_days || 7} días
            </p>
          </div>
        </div>

        {/* Contenido Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30 scroll-smooth">
          <AnimatePresence mode="wait">
            {!selectedFactoryId ? (
              // VISTA DE LISTA
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
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold text-white shadow-sm ${getSeverityColor(factory.severity).split(' ')[0]}`}>
                        {(factory.overall_risk_oos_7d * 100).toFixed(0)}%
                      </div>
                    </div>
                    
                    {/* Info Crítica */}
                    <div className="mt-3 flex items-start gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
                      <AlertCircle size={14} className="text-danone-red shrink-0 mt-0.5" />
                      <span>
                        Crítico: <strong className="text-gray-700">{factory.critical_sku.sku_name}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              // VISTA DE DETALLE
              <motion.div 
                key="detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <button 
                  onClick={() => setSelectedFactoryId(null)}
                  className="mb-4 text-sm font-semibold text-gray-400 hover:text-danone-blue flex items-center transition-colors"
                >
                  ← Volver al mapa
                </button>

                {selectedFactoryData && (
                  <div className="space-y-6 pb-10">
                    {/* Header Fábrica */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                      <h2 className="text-xl font-extrabold text-gray-800">{selectedFactoryData.factory_name}</h2>
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-center">
                          <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Riesgo Global</span>
                          <span className={`text-2xl font-black ${selectedFactoryData.overall_risk_oos_7d > 0.7 ? 'text-danone-red' : 'text-yellow-500'}`}>
                            {(selectedFactoryData.overall_risk_oos_7d * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-8 w-px bg-gray-100"></div>
                        <div className="text-center">
                          <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Top SKUs</span>
                          <span className="text-2xl font-black text-gray-800">{selectedFactoryData.top_10_skus.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Lista Top SKUs */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 pl-1">Top Riesgos (Próx. 7 días)</h3>
                      <div className="space-y-3">
                        {selectedFactoryData.top_10_skus.map((sku) => (
                          <div key={sku.sku_id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
                            {/* Borde izquierdo de color */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${sku.risk_oos_7d > 0.7 ? 'bg-danone-red' : 'bg-yellow-400'}`} />
                            
                            <div className="p-4 pl-5">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-bold text-gray-800 text-sm leading-tight">{sku.sku_name}</h4>
                                  <span className="text-[10px] font-mono text-gray-400">{sku.sku_id}</span>
                                </div>
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${sku.risk_oos_7d > 0.7 ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}`}>
                                  {(sku.risk_oos_7d * 100).toFixed(0)}%
                                </span>
                              </div>

                              {/* KPIs operativos */}
                              <div className="grid grid-cols-2 gap-2 mb-3">
                                <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
                                  <span className="block text-[10px] text-danone-blue font-bold uppercase">Cobertura</span>
                                  <span className="block text-sm font-bold text-gray-700">
                                    {sku.derived.days_of_supply?.toFixed(1)} días
                                  </span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                                  <span className="block text-[10px] text-gray-400 font-bold uppercase">Agotamiento</span>
                                  <span className="block text-sm font-bold text-gray-700">
                                    {sku.derived.stockout_date_est?.slice(5)} {/* Solo mes-dia */}
                                  </span>
                                </div>
                              </div>

                              {/* Drivers (Why?) */}
                              <div className="space-y-1.5 pt-2 border-t border-gray-50">
                                {sku.drivers.map((driver, dIdx) => (
                                  <div key={dIdx} className="flex items-center justify-between group">
                                    <span className="text-[11px] text-gray-500 font-medium capitalize truncate max-w-[120px]">
                                      {driver.feature.replace(/_/g, ' ')}
                                    </span>
                                    {/* Barra de impacto */}
                                    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-danone-blue/60 group-hover:bg-danone-blue transition-colors rounded-full" 
                                        style={{ width: `${Math.min(driver.impact * 250, 100)}%` }} 
                                      ></div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
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
            latitude: 20.0,
            zoom: 5
          }}
          style={{width: '100%', height: '100%'}}
          mapStyle="mapbox://styles/mapbox/light-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
        >
          {factories.map((factory) => (
            <Marker 
              key={factory.factory_id}
              longitude={factory.geo.lon}
              latitude={factory.geo.lat}
              anchor="bottom"
              onClick={e => {
                e.originalEvent.stopPropagation();
                setSelectedFactoryId(factory.factory_id);
              }}
            >
              <div className="group relative cursor-pointer hover:z-50">
                {/* Pin con animación de pulso si es crítico */}
                {factory.severity === 'RED' && (
                   <div className="absolute inset-0 rounded-full bg-danone-red animate-ping opacity-75"></div>
                )}
                <div className={`relative w-10 h-10 rounded-full border-4 border-white shadow-xl flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 ${getSeverityColor(factory.severity)}`}>
                  <Package size={16} className="text-white" />
                </div>
                
                {/* Tooltip flotante */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs font-bold py-1 px-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg pointer-events-none">
                  {factory.factory_name}
                </div>
              </div>
            </Marker>
          ))}
        </Map>
      </div>
    </div>
  );
};

export default App;