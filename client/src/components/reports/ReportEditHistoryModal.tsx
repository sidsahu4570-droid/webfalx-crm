import React from 'react';
import { Modal } from '../common/Modal';
import { ReportEditHistory } from '../../types';
import { formatDateTime, formatTimeAgo } from '../../utils/formatters';
import { History, UserCheck, Clock } from 'lucide-react';

interface ReportEditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ReportEditHistory[];
  loading?: boolean;
}

export const ReportEditHistoryModal: React.FC<ReportEditHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  loading = false
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Edit Audit Trail"
      subtitle="Complete chronological history of changes made to this daily report"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading edit history...</div>
        ) : history.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 italic">
            No edits have been made to this report yet.
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {history.map((item) => (
              <div
                key={item._id}
                className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      Edited by {item.editorName}
                    </span>
                    <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold px-2 py-0.5 rounded text-[10px]">
                      {item.editReason || 'Updated Metrics'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatDateTime(item.editedAt)} ({formatTimeAgo(item.editedAt)})
                  </span>
                </div>

                <div className="space-y-1 pt-1 border-t border-slate-200/60 dark:border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Modified Fields: {item.editedFields.join(', ')}
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono mt-1 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <div>
                      <span className="text-rose-500 font-bold block">Previous Data:</span>
                      <pre className="text-[10px] whitespace-pre-wrap">
                        {JSON.stringify(item.previousData, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <span className="text-emerald-500 font-bold block">New Data:</span>
                      <pre className="text-[10px] whitespace-pre-wrap">
                        {JSON.stringify(item.newData, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
