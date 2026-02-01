import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area
} from 'recharts';
import apiService from '../services/apiService';

interface ForecastData {
  assetType: string;
  history: Array<{ date: string; count: number }>;
  forecast: Array<{ week: number; value: number }>;
  metrics: {
    avgDemand: number;
    stdDev: number;
    safetyStock: number;
    reorderPoint: number;
  };
  currentStock: number;
  shouldReorder: boolean;
}

interface AssetInventoryForecastProps {
  assetType?: string;
  onReorderStatusChange?: (shouldReorder: boolean) => void;
}

const AssetInventoryForecast: React.FC<AssetInventoryForecastProps> = ({ 
  assetType = 'Laptop',
  onReorderStatusChange 
}) => {
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        setLoading(true);
        // Using direct fetch if apiService update isn't ready, or assuming we added it.
        // For robustness, I'll use the apiService.getForecast if it exists, else direct.
        // Since I'm editing apiService next, I'll assume it's there.
        const result = await apiService.getForecast(assetType);
        setData(result);
        if (onReorderStatusChange) {
          onReorderStatusChange(result.shouldReorder);
        }
      } catch (err) {
        console.error('Failed to fetch forecast', err);
        setError('Unable to load forecast model. Not enough historical data.');
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [assetType]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 p-6 bg-white dark:bg-[#1a2632] rounded-2xl border border-[#dbe0e6] dark:border-gray-800 shadow-sm animate-pulse">
      <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-sm font-medium text-[#617589]">Training prediction model...</p>
    </div>
  );

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center h-64 p-6 bg-white dark:bg-[#1a2632] rounded-2xl border border-[#dbe0e6] dark:border-gray-800 shadow-sm">
       <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">query_stats</span>
       <p className="text-sm text-[#617589]">{error || 'No forecast data available'}</p>
    </div>
  );

  // Prepare chart data
  const chartData = [
    ...data.history.map(h => ({
      name: h.date,
      historical: h.count,
      forecast: null,
      isForecast: false
    })),
    // Connect the last history point to first forecast point for continuity (optional, skipping for simplicity)
    ...data.forecast.map((f, i) => {
        // Create a label for future weeks
        const d = new Date();
        d.setDate(d.getDate() + (f.week * 7));
        return {
            name: `Week +${f.week}`,
            historical: null,
            forecast: f.value,
            reorderPoint: data.metrics?.reorderPoint,
            isForecast: true
        };
    })
  ];

  return (
    <div className="bg-white dark:bg-[#1a2632] p-6 rounded-2xl border border-[#dbe0e6] dark:border-gray-800 shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-black text-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-500">auto_graph</span>
            AI Inventory Forecast
          </h3>
          <p className="text-[10px] font-bold text-[#617589] uppercase tracking-wider mt-1">
             {assetType} Demand Prediction
          </p>
        </div>
        {data.shouldReorder && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-full border border-red-100 animate-pulse">
            <span className="material-symbols-outlined text-sm">warning</span>
            <span className="text-xs font-bold uppercase tracking-wider">Reorder Needed</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
           <p className="text-[10px] text-[#617589] font-bold uppercase">Current Stock</p>
           <p className={`text-xl font-black ${data.shouldReorder ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'}`}>
             {data.currentStock}
           </p>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
           <p className="text-[10px] text-[#617589] font-bold uppercase">Reorder Point</p>
           <p className="text-xl font-black text-blue-500">{data.metrics?.reorderPoint || 0}</p>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
           <p className="text-[10px] text-[#617589] font-bold uppercase">Safety Stock</p>
           <p className="text-xl font-black text-emerald-500">{data.metrics?.safetyStock || 0}</p>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
           <p className="text-[10px] text-[#617589] font-bold uppercase">Avg Wk Demand</p>
           <p className="text-xl font-black text-purple-500">{data.metrics?.avgDemand || 0}</p>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10 }}
                interval="preserveStartEnd"
            />
            <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10 }}
            />
            <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            
            {data.metrics?.reorderPoint && (
                <ReferenceLine y={data.metrics.reorderPoint} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Reorder Point', fontSize: 10, fill: '#ef4444', position: 'insideRight' }} />
            )}

            <Line 
                type="monotone" 
                dataKey="historical" 
                name="Historical Usage" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
                connectNulls
            />
            <Line 
                type="monotone" 
                dataKey="forecast" 
                name="AI Forecast" 
                stroke="#8b5cf6" 
                strokeWidth={3} 
                strokeDasharray="5 5"
                dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 0 }}
                connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[9px] text-[#94a3b8] mt-4 text-center">
        * Prediction based on LSTM neural network analysis of usage history.
      </p>
    </div>
  );
};

export default AssetInventoryForecast;
