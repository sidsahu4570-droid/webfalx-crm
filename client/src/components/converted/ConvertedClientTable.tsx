import React from 'react';
import { ConvertedClient } from '../../types';
import { formatDate } from '../../utils/formatters';
import {
  Building,
  Phone,
  Mail,
  Calendar,
  Globe,
  DollarSign,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Edit2,
  PlusCircle,
  Eye,
  Trash2
} from 'lucide-react';

interface ConvertedClientTableProps {
  clients: ConvertedClient[];
  onSelectClient: (client: ConvertedClient) => void;
  onEditClient: (client: ConvertedClient) => void;
  onAddWebsiteUpdate?: (client: ConvertedClient) => void;
  onAddPayment?: (client: ConvertedClient) => void;
  onDeleteClient?: (client: ConvertedClient) => void;
  onApproveClient?: (client: ConvertedClient, status: 'Approved' | 'Rejected') => void;
  isAdmin?: boolean;
}

export const ConvertedClientTable: React.FC<ConvertedClientTableProps> = ({
  clients,
  onSelectClient,
  onEditClient,
  onAddWebsiteUpdate,
  onAddPayment,
  onDeleteClient,
  onApproveClient,
  isAdmin = false
}) => {
  const formatINR = (val: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getWebsiteStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
      case 'Website Done':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700';
      case 'Website In Making':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-700';
      case 'On Hold':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-700';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-700';
      case 'Website Had To Make':
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

  const getApprovalBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'Rejected':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'Pending Approval':
      default:
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 animate-pulse';
    }
  };

  if (clients.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-500 font-bold flex items-center justify-center mx-auto text-xl">
          💼
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          No Converted Clients Found
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          No converted client records match the current view or filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full text-left border-collapse min-w-[1200px]">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <th className="py-3.5 px-4 sticky left-0 bg-slate-50 dark:bg-slate-900 z-10">Client / Company</th>
            <th className="py-3.5 px-4">Project Type</th>
            {isAdmin && <th className="py-3.5 px-4">Caller</th>}
            <th className="py-3.5 px-4">Approval Status</th>
            <th className="py-3.5 px-4">Website Progress</th>
            <th className="py-3.5 px-4">Client Deal & Payment</th>
            {isAdmin && <th className="py-3.5 px-4">Expenses & Net Profit</th>}
            <th className="py-3.5 px-4">Dates & Meetings</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
          {clients.map((client) => (
            <tr
              key={client._id}
              onClick={() => onSelectClient(client)}
              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
            >
              {/* Client Name & Phone */}
              <td className="py-4 px-4 sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs border border-indigo-100 dark:border-indigo-800 shrink-0">
                    {client.clientName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block text-sm">
                      {client.clientName}
                    </span>
                    {client.company && (
                      <span className="text-[11px] text-slate-500 flex items-center">
                        <Building className="w-3 h-3 mr-1" />
                        {client.company}
                      </span>
                    )}
                    {client.phone && (
                      <span className="text-[10px] text-slate-400 flex items-center mt-0.5">
                        <Phone className="w-3 h-3 mr-1" />
                        {client.phone}
                      </span>
                    )}
                  </div>
                </div>
              </td>

              {/* Project Type */}
              <td className="py-4 px-4 font-sans font-bold">
                {client.projectType === 'app' ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] bg-purple-500/10 text-purple-600 border border-purple-500/20">
                    📱 App Project
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                    🌐 Website Project
                  </span>
                )}
              </td>

              {/* Caller (Admin view) */}
              {isAdmin && (
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{client.callerName}</span>
                  </div>
                </td>
              )}

              {/* Approval Status */}
              <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-col space-y-1 items-start">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getApprovalBadge(
                      client.approvalStatus
                    )}`}
                  >
                    {client.approvalStatus}
                  </span>
                  {isAdmin && client.approvalStatus === 'Pending Approval' && onApproveClient && (
                    <div className="flex items-center space-x-1 pt-1">
                      <button
                        onClick={() => onApproveClient(client, 'Approved')}
                        className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded hover:bg-emerald-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => onApproveClient(client, 'Rejected')}
                        className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded hover:bg-rose-700"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </td>

              {/* Website Status & Progress */}
              <td className="py-4 px-4">
                <div className="space-y-1 max-w-[200px]">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getWebsiteStatusBadge(
                      client.websiteStatus
                    )}`}
                  >
                    <Globe className="w-3 h-3 mr-1" />
                    {client.websiteStatus}
                  </span>
                  <p className="text-[11px] text-slate-500 italic line-clamp-2">
                    "{client.latestWebsiteUpdate || 'No website updates'}"
                  </p>
                </div>
              </td>

              {/* Client Deal & Payment */}
              <td className="py-4 px-4">
                <div className="space-y-0.5 font-mono">
                  <span className="font-extrabold text-slate-900 dark:text-white block text-sm">
                    {formatINR(client.totalClientAmount)}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block">
                    Paid: {formatINR(client.clientPaidAmount)}
                  </span>
                  <span className="text-[10px] font-semibold text-rose-500 block">
                    Pending: {formatINR(client.clientPendingAmount)}
                  </span>
                </div>
              </td>

              {/* Expenses & Net Profit (Admin) */}
              {isAdmin && (
                <td className="py-4 px-4">
                  <div className="space-y-0.5 font-mono">
                    <span
                      className={`font-extrabold text-xs block ${
                        client.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                      }`}
                    >
                      Profit: {formatINR(client.netProfit)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Expenses: {formatINR(client.totalExpenses)}
                    </span>
                  </div>
                </td>
              )}

              {/* Dates & Meetings */}
              <td className="py-4 px-4">
                <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
                  <span className="block">
                    Conv: {formatDate(client.conversionDate)}
                  </span>
                  {client.upcomingMeetingDate && (
                    <span className="block font-semibold text-amber-600 dark:text-amber-400">
                      📅 Meeting: {formatDate(client.upcomingMeetingDate)}
                    </span>
                  )}
                </div>
              </td>

              {/* Actions */}
              <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end space-x-1">
                  {onAddWebsiteUpdate && (
                    <button
                      onClick={() => onAddWebsiteUpdate(client)}
                      className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                      title="Add Daily Website Progress Update"
                    >
                      <Globe className="w-4 h-4" />
                    </button>
                  )}

                  {onAddPayment && (
                    <button
                      onClick={() => onAddPayment(client)}
                      className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                      title="Log Payment Transaction"
                    >
                      <DollarSign className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => onEditClient(client)}
                    className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Edit Record"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onSelectClient(client)}
                    className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="View Full Drawer & Financials"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {isAdmin && onDeleteClient && (
                    <button
                      onClick={() => onDeleteClient(client)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors font-bold"
                      title="Soft Delete & Archive Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
