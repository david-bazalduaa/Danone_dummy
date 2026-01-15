import React, { useState, useEffect } from 'react';
import Map, { Marker } from 'react-map-gl/mapbox';
import { Package, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import 'mapbox-gl/dist/mapbox-gl.css';

// ¡RECUERDA PONER TU TOKEN DE MAPBOX AQUÍ!
const MAPBOX_TOKEN = "pk.eyJ1IjoiaW52YXNpdmVkYXZlIiwiYSI6ImNtazl0NHAzdDA5cDczZXNldjBvdXhkcWgifQ.kqMyQjnqAjvHG6hc0SVgyw"; 

const App = () => {
  const [factories, setFactories] = useState([]);
  const [predictionsData, setPredictionsData] = useState(null); // Guardamos el JSON crudo
  const [selectedFactoryId, setSelectedFactoryId] = useState(null);
  const [currentFactorySkus, setCurrentFactorySkus] = useState([]); // Los SKUs filtrados

  // 1. Cargar datos
  useEffect(() => {
    fetch('/data/factories.json')
      .then(res => res.json())
      .then(data => setFactories(data))
      .catch(err => console.error("Error loading factories:", err));

    // Nota: cambié el nombre a prediction_latest.json (singular) según tus archivos
    fetch('/data/prediction_latest.json')
      .then(res => res.json())
      .then(data => setPredictionsData(data))
      .catch(err => console.error("Error loading predictions:", err));
  }, []);

  // 2. Filtrar SKUs cuando se selecciona una fábrica
  useEffect(() => {
    if (selectedFactoryId && predictionsData?.rows) {
      // Tu nueva estructura es plana ("rows"), así que filtramos por factory_id
      const skus = predictionsData.rows.filter(row => row.factory_id === selectedFactoryId);
      // Ordenamos por riesgo descendente (por si acaso no viene ordenado)
      skus.sort((a, b) => b.risk_score - a.risk_score);
      setCurrentFactorySkus(skus);
    } else {
      setCurrentFactorySkus([]);
    }
  }, [selectedFactoryId, predictionsData]);

  // Helper para colores basado en tu "risk_band"
  const getSeverityColor = (riskBand) => {
    switch (riskBand) {
      case 'High': return 'bg-risk-high border-risk-high';     // Rojo
      case 'Medium': return 'bg-risk-medium border-risk-medium'; // Amarillo/Naranja
      case 'Low': return 'bg-risk-low border-risk-low';       // Verde
      default: return 'bg-gray-400 border-gray-400';
    }
  };

  // Helper para textos de color
  const getTextColor = (riskBand) => {
    if (riskBand === 'High') return 'text-danone-red';
    if (riskBand === 'Medium') return 'text-yellow-600';
    return 'text-green-600';
  };

  // Encontrar datos de la fábrica seleccionada para el encabezado del detalle
  const selectedFactoryInfo = factories.find(f => f.factory_id === selectedFactoryId);

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden font-sans text-gray-800">
      
      {/* LOGO */}
      <div className="absolute top-5 right-5 z-50 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm border border-gray-200">
         <span className="font-bold text-danone-blue text-xl tracking-tight">DANONE</span>
      </div>

      {/* --- SIDEBAR IZQUIERDO --- */}
      <div className="w-1/3 h-full flex flex-col bg-white shadow-2xl z-10 relative">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-white z-20">
          <h1 className="text-2xl font-bold text-danone-blue">Risk Intelligence</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-0.5 bg-blue-50 text-danone-blue text-xs font-semibold rounded">MX Pilot</span>
            <p className="text-xs text-gray-400">
              Data as of: {factories[0]?.as_of_date || 'Loading...'}
            </p>
          </div>
        </div>

        {/* Lista Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30 scroll-smooth">
          <AnimatePresence mode="wait">
            {!selectedFactoryId ? (
              // VISTA LISTA (Resumen)
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
                        <p className="text-sm text-gray-400 font-medium">{factory.city}, {factory.state}</p>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold text-white shadow-sm ${getSeverityColor(factory.risk_band).split(' ')[0]}`}>
                        {factory.global_risk_score}% Risk
                      </div>
                    </div>
                    
                    {/* Critical SKU Info */}
                    <div className="mt-3 flex items-start gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
                      <AlertCircle size={14} className="text-danone-red shrink-0 mt-0.5" />
                      <span>
                        Critical: <strong className="text-gray-700">{factory.critical_sku?.sku_name}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              // VISTA DETALLE (Drill-down)
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
                  ← Back to Map
                </button>

                {selectedFactoryInfo && (
                  <div className="space-y-6 pb-10">
                    {/* Factory Header Card */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                      <h2 className="text-xl font-extrabold text-gray-800">{selectedFactoryInfo.factory_name}</h2>
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-center">
                          <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Global Risk</span>
                          <span className={`text-2xl font-black ${getTextColor(selectedFactoryInfo.risk_band)}`}>
                            {selectedFactoryInfo.global_risk_score}%
                          </span>
                        </div>
                        <div className="h-8 w-px bg-gray-100"></div>
                        <div className="text-center">
                          <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">SKUs at Risk</span>
                          <span className="text-2xl font-black text-gray-800">{currentFactorySkus.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* SKU List */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 pl-1">Top Risks (Deep Dive)</h3>
                      <div className="space-y-3">
                        {currentFactorySkus.map((sku) => (
                          <div key={sku.sku_id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
                            {/* Color Border Indicator */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                              sku.risk_score > 70 ? 'bg-danone-red' : (sku.risk_score > 40 ? 'bg-yellow-400' : 'bg-green-500')
                            }`} />
                            
                            <div className="p-4 pl-5">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-bold text-gray-800 text-sm leading-tight">{sku.sku_name}</h4>
                                  <span className="text-[10px] font-mono text-gray-400">{sku.sku_id}</span>
                                </div>
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                  sku.risk_score > 70 ? 'bg-red-50 text-red-600' : (sku.risk_score > 40 ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600')
                                }`}>
                                  {sku.risk_score}%
                                </span>
                              </div>

                              {/* KPIs Operativos (Datos directos del JSON plano) */}
                              <div className="grid grid-cols-2 gap-2 mb-3">
                                <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
                                  <span className="block text-[10px] text-danone-blue font-bold uppercase">Days of Supply</span>
                                  <span className="block text-sm font-bold text-gray-700">
                                    {sku.days_of_supply?.toFixed(1)} days
                                  </span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                                  <span className="block text-[10px] text-gray-400 font-bold uppercase">Est. Stockout</span>
                                  <span className="block text-sm font-bold text-gray-700">
                                    {sku.expected_stockout_date?.slice(5)}
                                  </span>
                                </div>
                              </div>

                              {/* Drivers */}
                              <div className="space-y-1.5 pt-2 border-t border-gray-50">
                                {sku.drivers?.map((driver, dIdx) => (
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
            latitude: 21.0, // Ajustado un poco para ver mejor MX
            zoom: 5
          }}
          style={{width: '100%', height: '100%'}}
          mapStyle="mapbox://styles/mapbox/light-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
        >
          {factories.map((factory) => (
            <Marker 
              key={factory.factory_id}
              longitude={factory.location.lon} // NUEVO: location.lon
              latitude={factory.location.lat}  // NUEVO: location.lat
              anchor="bottom"
              onClick={e => {
                e.originalEvent.stopPropagation();
                setSelectedFactoryId(factory.factory_id);
              }}
            >
              <div className="group relative cursor-pointer hover:z-50">
                {/* Ping animation para High Risk */}
                {factory.risk_band === 'High' && (
                   <div className="absolute inset-0 rounded-full bg-danone-red animate-ping opacity-75"></div>
                )}
                
                <div className={`relative w-10 h-10 rounded-full border-4 border-white shadow-xl flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 ${getSeverityColor(factory.risk_band)}`}>
                  <Package size={16} className="text-white" />
                </div>
                
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