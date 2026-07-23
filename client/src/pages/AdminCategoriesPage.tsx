import React, { useState, useEffect } from 'react';
import { categoryService } from '../services/categoryService';
import { LeadCategory } from '../types';
import { useToast } from '../context/ToastContext';
import { Plus, Search, Trash2, Edit2, CheckCircle, XCircle, RotateCcw, AlertCircle } from 'lucide-react';

export const AdminCategoriesPage: React.FC = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<LeadCategory[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Form State for Add / Edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await categoryService.getCategories();
      if (res.success) {
        setCategories(res.categories);
      }
    } catch (err: any) {
      toast('Error', err.response?.data?.message || 'Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast('Validation Error', 'Category name is required', 'error');
      return;
    }

    try {
      if (editingId) {
        const res = await categoryService.updateCategory(editingId, categoryName);
        if (res.success) {
          toast('Success', res.message, 'success');
          setEditingId(null);
          setCategoryName('');
          fetchCategories();
        }
      } else {
        const res = await categoryService.createCategory(categoryName);
        if (res.success) {
          toast('Success', res.message, 'success');
          setShowAddForm(false);
          setCategoryName('');
          fetchCategories();
        }
      }
    } catch (err: any) {
      toast('Save Error', err.response?.data?.message || 'Failed to save category', 'error');
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      const res = await categoryService.toggleCategory(id, !currentStatus);
      if (res.success) {
        toast('Success', res.message, 'success');
        fetchCategories();
      }
    } catch (err: any) {
      toast('Status Update Error', err.response?.data?.message || 'Failed to update category status', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category? (Existing leads with this category will retain their category name)')) {
      return;
    }

    try {
      const res = await categoryService.deleteCategory(id);
      if (res.success) {
        toast('Success', res.message, 'success');
        fetchCategories();
      }
    } catch (err: any) {
      toast('Delete Error', err.response?.data?.message || 'Failed to delete category', 'error');
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center">
            📂 Lead Category Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure industry-specific categories for manual entry and lead imports.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setCategoryName('');
            setShowAddForm(!showAddForm);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Add / Edit Form Modal-Like Card */}
      {(showAddForm || editingId) && (
        <form
          onSubmit={handleSave}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-lg space-y-4"
        >
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {editingId ? '📝 Edit Category Name' : '📂 Create New Lead Category'}
          </h3>
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Category Name *
            </label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Interior Designer, Doctor, Real Estate"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex space-x-2 pt-2">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setEditingId(null);
                setCategoryName('');
              }}
              className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filters & Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="w-full bg-slate-50 dark:bg-slate-800 pl-9 pr-4 py-2 rounded-xl text-xs font-medium text-slate-900 dark:text-white border-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={fetchCategories}
            className="text-slate-400 hover:text-indigo-500 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading categories...</div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No categories found matching your search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3.5">Category Name</th>
                  <th className="p-3.5">Selection Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCategories.map((cat) => (
                  <tr key={cat._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                      {cat.name}
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggle(cat._id, cat.isEnabled)}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                          cat.isEnabled
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900'
                        }`}
                      >
                        {cat.isEnabled ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Active / Enabled</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Disabled / Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingId(cat._id);
                          setCategoryName(cat.name);
                          setShowAddForm(false);
                        }}
                        className="text-slate-400 hover:text-indigo-500 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat._id)}
                        className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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

      <div className="bg-indigo-50/40 dark:bg-indigo-950/10 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-950 flex items-start space-x-3 text-xs text-indigo-700 dark:text-indigo-400">
        <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-indigo-500" />
        <div>
          <span className="font-bold block">Important Administration Note:</span>
          <span>Disabling a category prevents callers from choosing it for new manually entered leads or freshly uploaded Excel sheets. However, existing prospects that are already assigned to that category will remain untouched.</span>
        </div>
      </div>
    </div>
  );
};
