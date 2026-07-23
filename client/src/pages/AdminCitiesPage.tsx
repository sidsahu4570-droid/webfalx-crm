import React, { useState, useEffect } from 'react';
import { cityService } from '../services/cityService';
import { City } from '../types';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import { Plus, Search, Trash2, Edit2, CheckCircle, XCircle, RotateCcw, AlertCircle } from 'lucide-react';

export const AdminCitiesPage: React.FC = () => {
  const { toast } = useToast();
  const { socket } = useSocket();
  const [cities, setCities] = useState<City[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Form State for Add / Edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cityName, setCityName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleCityUpdate = () => {
      fetchCities();
    };
    socket.on('city_updated', handleCityUpdate);
    return () => {
      socket.off('city_updated', handleCityUpdate);
    };
  }, [socket]);

  const fetchCities = async () => {
    setLoading(true);
    try {
      const res = await cityService.getCities();
      if (res.success) {
        setCities(res.cities);
      }
    } catch (err: any) {
      toast('Error', err.response?.data?.message || 'Failed to load cities', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityName.trim()) {
      toast('Validation Error', 'City name is required', 'error');
      return;
    }

    try {
      if (editingId) {
        const res = await cityService.updateCity(editingId, cityName);
        if (res.success) {
          toast('Success', res.message, 'success');
          setEditingId(null);
          setCityName('');
          fetchCities();
        }
      } else {
        const res = await cityService.createCity(cityName);
        if (res.success) {
          toast('Success', res.message, 'success');
          setShowAddForm(false);
          setCityName('');
          fetchCities();
        }
      }
    } catch (err: any) {
      toast('Save Error', err.response?.data?.message || 'Failed to save city', 'error');
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      const res = await cityService.toggleCity(id, !currentStatus);
      if (res.success) {
        toast('Success', res.message, 'success');
        fetchCities();
      }
    } catch (err: any) {
      toast('Status Update Error', err.response?.data?.message || 'Failed to update city status', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this city? (Existing leads with this city will retain their city name)')) {
      return;
    }

    try {
      const res = await cityService.deleteCity(id);
      if (res.success) {
        toast('Success', res.message, 'success');
        fetchCities();
      }
    } catch (err: any) {
      toast('Delete Error', err.response?.data?.message || 'Failed to delete city', 'error');
    }
  };

  const filteredCities = cities.filter((city) =>
    city.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <span>🌆 City Management Portal</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure system cities, activate coverage areas, and manage leads routing.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setCityName('');
            setShowAddForm(!showAddForm);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center space-x-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Close Editor' : 'Add New City'}</span>
        </button>
      </div>

      {/* Editor Form */}
      {showAddForm && (
        <form onSubmit={handleSave} className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 max-w-md animate-fadeIn">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            {editingId ? 'Edit City Name' : 'Create New City'}
          </h3>
          <div className="flex space-x-3">
            <input
              type="text"
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              placeholder="e.g. Indore, Bhopal..."
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              Save
            </button>
          </div>
        </form>
      )}

      {/* Main Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        {/* Search & Stats Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cities..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={fetchCities}
            className="text-slate-400 hover:text-indigo-600 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {loading && cities.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-450">Loading cities ledger...</div>
        ) : filteredCities.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-2 flex flex-col items-center">
            <AlertCircle className="w-8 h-8 text-slate-350" />
            <span>No cities matched your query.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3.5">City Name</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredCities.map((city) => (
                  <tr key={city._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3.5 font-bold text-slate-800 dark:text-slate-100">
                      {city.name}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        city.isEnabled
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60'
                          : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60'
                      }`}>
                        {city.isEnabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleToggle(city._id, city.isEnabled)}
                        className={`p-1.5 rounded-lg border transition-colors inline-flex items-center justify-center ${
                          city.isEnabled
                            ? 'text-slate-400 hover:text-rose-500 border-slate-200 dark:border-slate-700'
                            : 'text-slate-400 hover:text-emerald-500 border-slate-200 dark:border-slate-700'
                        }`}
                        title={city.isEnabled ? 'Disable City' : 'Enable City'}
                      >
                        {city.isEnabled ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(city._id);
                          setCityName(city.name);
                          setShowAddForm(true);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 transition-colors inline-flex items-center justify-center"
                        title="Edit City"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(city._id)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 transition-colors inline-flex items-center justify-center"
                        title="Delete City"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
