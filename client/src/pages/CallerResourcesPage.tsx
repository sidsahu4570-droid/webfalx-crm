import React, { useState, useEffect } from 'react';
import { resourceService } from '../services/resourceService';
import { ResourceNote, Resource } from '../types';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import { Search, Download, Copy, ChevronRight, Image as ImageIcon, FileText, AlertCircle, Maximize2, X, ClipboardCheck } from 'lucide-react';

export const CallerResourcesPage: React.FC = () => {
  const { toast } = useToast();
  const { socket } = useSocket();

  // Assigned Assets State
  const [notes, setNotes] = useState<ResourceNote[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  // Search Note filter
  const [searchQuery, setSearchQuery] = useState('');

  // Expand Note state mapping
  const [expandedNoteIds, setExpandedNoteIds] = useState<string[]>([]);
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Image zoom modal state
  const [zoomResource, setZoomResource] = useState<Resource | null>(null);

  useEffect(() => {
    fetchAssignedResources();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      fetchAssignedResources();
    };
    socket.on('resources_updated', handleUpdate);
    return () => {
      socket.off('resources_updated', handleUpdate);
    };
  }, [socket]);

  const fetchAssignedResources = async () => {
    try {
      const res = await resourceService.getCallerResources();
      if (res.success) {
        setNotes(res.notes || []);
        setResources(res.resources || []);
      }
    } catch (err: any) {
      toast('Error Loading', err.response?.data?.message || 'Failed to sync your resources', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Toggle single accordion note
  const toggleNoteExpand = (id: string) => {
    if (expandedNoteIds.includes(id)) {
      setExpandedNoteIds(expandedNoteIds.filter((noteId) => noteId !== id));
    } else {
      setExpandedNoteIds([...expandedNoteIds, id]);
    }
  };

  // Copy Note content helper
  const handleCopyNote = (note: ResourceNote) => {
    navigator.clipboard.writeText(note.content);
    setCopiedNoteId(note._id);
    toast('Copied to Clipboard', 'You can now paste the sales pitch script directly.', 'success');
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

  // Download image file helper
  const handleDownloadImage = (resource: Resource) => {
    const link = document.createElement('a');
    link.href = resource.imageUrl;
    link.download = `${resource.title.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('Download Started', `Downloading ${resource.title} asset file...`, 'success');
  };

  // Filter notes by title or content
  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
          <span>📂 Assigned Notes & Sales Resources</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Access QR codes, company cards, objection handling scripts, and pitching templates assigned to your workspace.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-450 animate-pulse">
          Loading assigned workspace assets...
        </div>
      ) : (
        <>
          {/* SECTION 1: ASSIGNED IMAGES */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-slate-450 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <ImageIcon className="w-4 h-4 text-indigo-500" />
              <span>Assigned Images ({resources.length})</span>
            </h3>

            {resources.length === 0 ? (
              <div className="bg-slate-50/40 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl text-center text-xs text-slate-450">
                No images or QR codes currently assigned to your account.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {resources.map((res) => (
                  <div key={res._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-3 flex flex-col justify-between space-y-3 shadow-sm hover:shadow transition-shadow group">
                    <div className="space-y-2">
                      <div className="bg-slate-50 dark:bg-slate-800/80 h-36 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-100 dark:border-slate-800 relative">
                        <img src={res.imageUrl} alt={res.title} className="max-h-full object-contain p-2" />
                        <button
                          onClick={() => setZoomResource(res)}
                          className="absolute bottom-2 right-2 p-1.5 bg-black/60 hover:bg-black/85 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Zoom / Preview"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight truncate">{res.title}</h4>
                        {res.description && (
                          <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{res.description}</p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownloadImage(res)}
                      className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-250 text-[11px] font-bold py-1.5 rounded-xl flex items-center justify-center space-x-1 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Image</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: ASSIGNED NOTES & SCRIPTS */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="text-xs font-extrabold text-slate-450 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-indigo-500" />
                <span>Assigned Notes & Scripts ({notes.length})</span>
              </h3>

              {notes.length > 0 && (
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-450 w-3.5 h-3.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search script content..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>

            {notes.length === 0 ? (
              <div className="bg-slate-50/40 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl text-center text-xs text-slate-450">
                No scripts or objectionable handling guides currently assigned to your account.
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl text-center text-xs text-slate-400 flex flex-col items-center">
                <AlertCircle className="w-6 h-6 text-slate-350 mb-1" />
                <span>No scripts match your search term.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotes.map((note) => {
                  const isExpanded = expandedNoteIds.includes(note._id);
                  const isCopied = copiedNoteId === note._id;

                  return (
                    <div key={note._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                      {/* Accordion Trigger */}
                      <button
                        onClick={() => toggleNoteExpand(note._id)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="flex items-center space-x-2.5">
                          <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90 text-indigo-550' : ''}`} />
                          <span className="text-xs font-bold text-slate-850 dark:text-slate-100">{note.title}</span>
                        </div>
                        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleCopyNote(note)}
                            className={`p-1.5 rounded-lg border text-[10px] font-bold transition-all flex items-center space-x-1 ${
                              isCopied
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900'
                                : 'bg-white dark:bg-slate-900 text-slate-500 hover:text-indigo-650 dark:text-slate-400 dark:hover:text-indigo-400 border-slate-200 dark:border-slate-800'
                            }`}
                            title="Copy script text"
                          >
                            {isCopied ? <ClipboardCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{isCopied ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </button>

                      {/* Accordion Content */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-950/20 animate-fadeIn">
                          <div className="font-mono text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800/60 shadow-inner">
                            {note.content}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Image Preview / Zoom Modal */}
      {zoomResource && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-2xl w-full relative space-y-4">
            <button
              onClick={() => setZoomResource(null)}
              className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full p-1.5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{zoomResource.title}</h3>
              {zoomResource.description && (
                <p className="text-xs text-slate-400 mt-0.5">{zoomResource.description}</p>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl h-96 overflow-hidden flex items-center justify-center border border-slate-100 dark:border-slate-800">
              <img src={zoomResource.imageUrl} alt={zoomResource.title} className="max-h-full object-contain p-2" />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => {
                  handleDownloadImage(zoomResource);
                  setZoomResource(null);
                }}
                className="bg-indigo-650 hover:bg-indigo-750 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Original</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
