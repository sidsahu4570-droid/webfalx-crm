import React, { useState, useEffect } from 'react';
import { resourceService } from '../services/resourceService';
import { userService } from '../services/userService';
import { ResourceNote, Resource, User, CallerAssignment } from '../types';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import { Plus, Trash2, Edit2, CheckCircle2, AlertCircle, FileText, Image as ImageIcon, Users, Upload, X, ArrowRight, ShieldAlert } from 'lucide-react';

export const AdminResourcesPage: React.FC = () => {
  const { toast } = useToast();
  const { socket } = useSocket();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'images' | 'notes' | 'assignments'>('images');

  // Master Data
  const [notes, setNotes] = useState<ResourceNote[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [callers, setCallers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<CallerAssignment[]>([]);
  const [loading, setLoading] = useState(false);

  // Note Modal / Form State
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [showNoteForm, setShowNoteForm] = useState(false);

  // Resource Modal / Form State
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceDesc, setResourceDesc] = useState('');
  const [imageUrl, setImageUrl] = useState(''); // Base64 data URL
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [showResourceForm, setShowResourceForm] = useState(false);

  // Assignment Section State
  const [selectedCallerId, setSelectedCallerId] = useState('');
  const [assignedNoteIds, setAssignedNoteIds] = useState<string[]>([]);
  const [assignedResourceIds, setAssignedResourceIds] = useState<string[]>([]);

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      fetchMasterData();
    };
    socket.on('resources_updated', handleUpdate);
    return () => {
      socket.off('resources_updated', handleUpdate);
    };
  }, [socket]);

  // Load Caller details on switching to assignment tab or selecting caller
  useEffect(() => {
    if (selectedCallerId) {
      const match = assignments.find((a) => a.callerId === selectedCallerId);
      if (match) {
        setAssignedNoteIds(match.assignedNotes || []);
        setAssignedResourceIds(match.assignedResources || []);
      } else {
        setAssignedNoteIds([]);
        setAssignedResourceIds([]);
      }
    }
  }, [selectedCallerId, assignments]);

  const fetchMasterData = async () => {
    setLoading(true);
    try {
      const [notesRes, resourcesRes, callersRes, assignmentsRes] = await Promise.all([
        resourceService.getNotes(),
        resourceService.getResources(),
        userService.getUsers(),
        resourceService.getAssignments()
      ]);

      if (notesRes.success) setNotes(notesRes.notes);
      if (resourcesRes.success) setResources(resourcesRes.resources);
      if (callersRes.success) {
        setCallers(callersRes.users.filter((u) => u.role === 'caller'));
      }
      if (assignmentsRes.success) setAssignments(assignmentsRes.assignments);
    } catch (err: any) {
      toast('Fetch Error', err.response?.data?.message || 'Failed to load master ledger', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Image Upload handler
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast('Format Error', 'Please select a JPG, PNG, or WEBP image format', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Save Note (Create / Edit)
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) {
      toast('Validation Warning', 'Please provide a title and script content body', 'error');
      return;
    }

    try {
      if (editingNoteId) {
        const res = await resourceService.updateNote(editingNoteId, noteTitle.trim(), noteContent.trim());
        if (res.success) {
          toast('Script Updated', res.message, 'success');
          setEditingNoteId(null);
          setNoteTitle('');
          setNoteContent('');
          setShowNoteForm(false);
          fetchMasterData();
        }
      } else {
        const res = await resourceService.createNote(noteTitle.trim(), noteContent.trim());
        if (res.success) {
          toast('Script Saved', res.message, 'success');
          setNoteTitle('');
          setNoteContent('');
          setShowNoteForm(false);
          fetchMasterData();
        }
      }
    } catch (err: any) {
      toast('Save Failed', err.response?.data?.message || 'Failed to save note', 'error');
    }
  };

  // Save Image Resource (Create / Edit)
  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceTitle.trim() || !imageUrl) {
      toast('Validation Warning', 'Please provide an image title and upload an image file', 'error');
      return;
    }

    try {
      if (editingResourceId) {
        const res = await resourceService.updateResource(editingResourceId, resourceTitle.trim(), resourceDesc.trim(), imageUrl);
        if (res.success) {
          toast('Resource Updated', res.message, 'success');
          setEditingResourceId(null);
          setResourceTitle('');
          setResourceDesc('');
          setImageUrl('');
          setShowResourceForm(false);
          fetchMasterData();
        }
      } else {
        const res = await resourceService.createResource(resourceTitle.trim(), resourceDesc.trim(), imageUrl);
        if (res.success) {
          toast('Resource Uploaded', res.message, 'success');
          setResourceTitle('');
          setResourceDesc('');
          setImageUrl('');
          setShowResourceForm(false);
          fetchMasterData();
        }
      }
    } catch (err: any) {
      toast('Upload Failed', err.response?.data?.message || 'Failed to save resource', 'error');
    }
  };

  // Delete Note
  const handleDeleteNote = async (id: string) => {
    if (!window.confirm('Delete script? Assigned callers will lose immediate access.')) return;
    try {
      const res = await resourceService.deleteNote(id);
      if (res.success) {
        toast('Deleted', res.message, 'success');
        fetchMasterData();
      }
    } catch (err: any) {
      toast('Delete Failed', err.response?.data?.message || 'Failed to delete note', 'error');
    }
  };

  // Delete Image Resource
  const handleDeleteResource = async (id: string) => {
    if (!window.confirm('Delete image? Callers will lose immediate access to this QR/photo.')) return;
    try {
      const res = await resourceService.deleteResource(id);
      if (res.success) {
        toast('Deleted', res.message, 'success');
        fetchMasterData();
      }
    } catch (err: any) {
      toast('Delete Failed', err.response?.data?.message || 'Failed to delete resource', 'error');
    }
  };

  // Save Caller Assignments
  const handleSaveAssignments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCallerId) {
      toast('Select Caller', 'Please select a caller from list first', 'error');
      return;
    }

    try {
      const res = await resourceService.saveAssignment(selectedCallerId, assignedNoteIds, assignedResourceIds);
      if (res.success) {
        toast('Saved Assignments', res.message, 'success');
        fetchMasterData();
      }
    } catch (err: any) {
      toast('Assign Error', err.response?.data?.message || 'Failed to save assignments', 'error');
    }
  };

  const handleToggleAssignNote = (id: string) => {
    if (assignedNoteIds.includes(id)) {
      setAssignedNoteIds(assignedNoteIds.filter((noteId) => noteId !== id));
    } else {
      setAssignedNoteIds([...assignedNoteIds, id]);
    }
  };

  const handleToggleAssignResource = (id: string) => {
    if (assignedResourceIds.includes(id)) {
      setAssignedResourceIds(assignedResourceIds.filter((resId) => resId !== id));
    } else {
      setAssignedResourceIds([...assignedResourceIds, id]);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
          <span>📚 Caller Notes & Resources Hub</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Upload QR codes, visiting cards, sales scripts, and Objection Sheets, and map them to targeted call representatives.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('images')}
          className={`pb-2.5 flex items-center space-x-1.5 border-b-2 transition-all ${
            activeTab === 'images' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Image Resources</span>
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`pb-2.5 flex items-center space-x-1.5 border-b-2 transition-all ${
            activeTab === 'notes' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Notes & Scripts</span>
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`pb-2.5 flex items-center space-x-1.5 border-b-2 transition-all ${
            activeTab === 'assignments' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Caller Assignments</span>
        </button>
      </div>

      {/* ==========================================
          TAB 1: IMAGE RESOURCES
          ========================================== */}
      {activeTab === 'images' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-slate-450 dark:text-slate-400 uppercase tracking-wider">
              Asset Gallery ({resources.length} Images Loaded)
            </h3>
            <button
              onClick={() => {
                setEditingResourceId(null);
                setResourceTitle('');
                setResourceDesc('');
                setImageUrl('');
                setShowResourceForm(!showResourceForm);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showResourceForm ? 'Close Editor' : 'Upload Image'}</span>
            </button>
          </div>

          {/* Form */}
          {showResourceForm && (
            <form onSubmit={handleSaveResource} className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-xl space-y-4 animate-fadeIn">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {editingResourceId ? 'Edit Image Meta' : 'New Image Asset'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Title * (e.g. PhonePe QR)
                    </label>
                    <input
                      type="text"
                      value={resourceTitle}
                      onChange={(e) => setResourceTitle(e.target.value)}
                      placeholder="Enter title..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Optional Description
                    </label>
                    <textarea
                      value={resourceDesc}
                      onChange={(e) => setResourceDesc(e.target.value)}
                      placeholder="Add descriptions details..."
                      rows={3}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-3 flex flex-col justify-center">
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300">
                    Upload File * (JPG, PNG, WEBP)
                  </label>
                  <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 text-center cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-900/30 flex flex-col items-center justify-center min-h-[140px]">
                    {imageUrl ? (
                      <div className="relative group w-full h-[120px] rounded-lg overflow-hidden flex items-center justify-center">
                        <img src={imageUrl} alt="preview" className="max-h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="absolute top-1 right-1 bg-red-650 hover:bg-red-750 text-white rounded-full p-1 shadow"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-450 mb-2" />
                        <span className="text-[11px] font-semibold text-slate-500">Choose file...</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleImageFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl"
                >
                  Save Resource
                </button>
              </div>
            </form>
          )}

          {/* Cards Grid */}
          {resources.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl text-center border border-slate-200 dark:border-slate-800 text-slate-450 text-xs flex flex-col items-center justify-center">
              <ImageIcon className="w-8 h-8 text-slate-300 mb-2" />
              <span>No image resources available in warehouse yet.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {resources.map((res) => (
                <div key={res._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    <div className="bg-slate-50 dark:bg-slate-800 h-44 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-100 dark:border-slate-800">
                      <img src={res.imageUrl} alt={res.title} className="max-h-full object-contain p-2" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">{res.title}</h4>
                      {res.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">{res.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-3">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(res.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingResourceId(res._id);
                          setResourceTitle(res.title);
                          setResourceDesc(res.description || '');
                          setImageUrl(res.imageUrl);
                          setShowResourceForm(true);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-600 transition-colors inline-flex items-center justify-center"
                        title="Edit Resource"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteResource(res._id)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600 transition-colors inline-flex items-center justify-center"
                        title="Delete Resource"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          TAB 2: NOTES & SCRIPTS
          ========================================== */}
      {activeTab === 'notes' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-slate-450 dark:text-slate-400 uppercase tracking-wider">
              Script Inventory ({notes.length} Notes Loaded)
            </h3>
            <button
              onClick={() => {
                setEditingNoteId(null);
                setNoteTitle('');
                setNoteContent('');
                setShowNoteForm(!showNoteForm);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showNoteForm ? 'Close Editor' : 'Add Note'}</span>
            </button>
          </div>

          {/* Form */}
          {showNoteForm && (
            <form onSubmit={handleSaveNote} className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-xl space-y-4 animate-fadeIn">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {editingNoteId ? 'Edit Script Details' : 'New Note/Script'}
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Script Title *
                  </label>
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="e.g. Website Sales Pitch script..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Script Content / Script Template *
                  </label>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Paste full script instructions here..."
                    rows={6}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl"
                >
                  Save Note
                </button>
              </div>
            </form>
          )}

          {/* List Grid */}
          {notes.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl text-center border border-slate-200 dark:border-slate-800 text-slate-450 text-xs flex flex-col items-center justify-center">
              <FileText className="w-8 h-8 text-slate-300 mb-2" />
              <span>No script guides available yet. Click "+ Add Note" to create one.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {notes.map((note) => (
                <div key={note._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="space-y-2">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>{note.title}</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-350 leading-relaxed font-mono whitespace-pre-line border-l-2 border-slate-100 dark:border-slate-800 pl-3 bg-slate-50/40 dark:bg-slate-900/40 py-2.5 rounded-r-xl line-clamp-6">
                      {note.content}
                    </p>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-3">
                    <span className="text-[10px] text-slate-400 font-mono">
                      Last edited {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingNoteId(note._id);
                          setNoteTitle(note.title);
                          setNoteContent(note.content);
                          setShowNoteForm(true);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-600 transition-colors inline-flex items-center justify-center"
                        title="Edit Note"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note._id)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600 transition-colors inline-flex items-center justify-center"
                        title="Delete Note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          TAB 3: ASSIGNMENTS
          ========================================== */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center space-x-3 max-w-xl">
            <ShieldAlert className="w-5 h-5 text-indigo-500 shrink-0" />
            <p className="text-[11px] text-slate-650 dark:text-slate-350 leading-relaxed font-semibold">
              Select a representative caller below to see their active assignments list, check or uncheck scripts and QR image cards, and click **Save Mapping** to commit.
            </p>
          </div>

          <form onSubmit={handleSaveAssignments} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-sm">
            <div className="max-w-xs space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Choose Targeted Caller *
              </label>
              <select
                value={selectedCallerId}
                onChange={(e) => setSelectedCallerId(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value="">Select a Caller...</option>
                {callers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>

            {selectedCallerId ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                {/* Images Assignment Column */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-850 dark:text-white uppercase tracking-wider flex items-center">
                    <ImageIcon className="w-4 h-4 text-indigo-500 mr-2" />
                    <span>Assign Image Cards</span>
                  </h4>
                  <div className="border border-slate-100 dark:border-slate-800 rounded-2xl max-h-80 overflow-y-auto p-2 space-y-1 bg-slate-50/20 dark:bg-slate-900/20">
                    {resources.length === 0 ? (
                      <p className="text-[11px] p-3 text-slate-400">No images created in inventory</p>
                    ) : (
                      resources.map((res) => {
                        const isAssigned = assignedResourceIds.includes(res._id);
                        return (
                          <button
                            key={res._id}
                            type="button"
                            onClick={() => handleToggleAssignResource(res._id)}
                            className={`w-full flex items-center space-x-3 p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                              isAssigned
                                ? 'bg-indigo-55/40 text-indigo-750 dark:bg-indigo-950/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                              <img src={res.imageUrl} alt="thumb" className="max-h-full object-contain" />
                            </div>
                            <div className="flex-1">
                              <p className="leading-tight truncate">{res.title}</p>
                              {res.description && <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{res.description}</p>}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Notes Assignment Column */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-850 dark:text-white uppercase tracking-wider flex items-center">
                    <FileText className="w-4 h-4 text-indigo-500 mr-2" />
                    <span>Assign Scripts & Guides</span>
                  </h4>
                  <div className="border border-slate-100 dark:border-slate-800 rounded-2xl max-h-80 overflow-y-auto p-2 space-y-1 bg-slate-50/20 dark:bg-slate-900/20">
                    {notes.length === 0 ? (
                      <p className="text-[11px] p-3 text-slate-400">No notes created in inventory</p>
                    ) : (
                      notes.map((note) => {
                        const isAssigned = assignedNoteIds.includes(note._id);
                        return (
                          <button
                            key={note._id}
                            type="button"
                            onClick={() => handleToggleAssignNote(note._id)}
                            className={`w-full flex items-center space-x-3 p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                              isAssigned
                                ? 'bg-indigo-55/40 text-indigo-750 dark:bg-indigo-950/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                            <div className="flex-1 truncate">
                              <p className="leading-tight truncate">{note.title}</p>
                              <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{note.content}</p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-2xl text-center border border-slate-200 dark:border-slate-850 text-xs text-slate-400">
                Please choose a representative account from dropdown selection.
              </div>
            )}

            {selectedCallerId && (
              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-md flex items-center space-x-1.5 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Mapping</span>
                </button>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};
