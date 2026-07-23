import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { ConvertedClient, WebsiteStatus, User, ProjectType } from '../../types';
import { Lock, Unlock, Send, DollarSign, Globe, Smartphone, Layers, CheckCircle } from 'lucide-react';
import { DirectCallButton } from '../common/DirectCallButton';

export interface PrefillFromLead {
  leadId: string;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  address?: string;
  callerName?: string;
  serialNumber?: number;
  categoryName?: string;
  source?: string;
}

interface ConvertedClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<ConvertedClient> & { leadId?: string }) => Promise<void>;
  initialClient?: ConvertedClient | null;
  prefillFromLead?: PrefillFromLead | null;
  isAdmin?: boolean;
  callers?: User[];
  loading?: boolean;
}

export const ConvertedClientModal: React.FC<ConvertedClientModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialClient,
  prefillFromLead,
  isAdmin = false,
  callers = [],
  loading = false
}) => {
  const [projectType, setProjectType] = useState<ProjectType>('website');
  const [clientName, setClientName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [targetUserId, setTargetUserId] = useState('');

  const [conversionDate, setConversionDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [meetingDate, setMeetingDate] = useState('');
  const [upcomingMeetingDate, setUpcomingMeetingDate] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');

  const [websiteStatus, setWebsiteStatus] = useState<WebsiteStatus>('Website Had To Make');
  const [websiteDeliveryDate, setWebsiteDeliveryDate] = useState('');

  const [totalClientAmount, setTotalClientAmount] = useState(0);
  const [clientPaidAmount, setClientPaidAmount] = useState(0);

  const [websiteMakingCost, setWebsiteMakingCost] = useState(0);
  const [domainCharges, setDomainCharges] = useState(0);
  const [otherExpenses, setOtherExpenses] = useState(0);

  const prevOpenRef = React.useRef(false);

  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      if (initialClient) {
        // Editing an existing converted client
        setProjectType(initialClient.projectType || 'website');
        setClientName(initialClient.clientName || '');
        setCompany(initialClient.company || '');
        setPhone(initialClient.phone || '');
        setEmail(initialClient.email || '');
        setAddress(initialClient.address || '');
        setTargetUserId(initialClient.userId || '');

        setConversionDate(
          initialClient.conversionDate
            ? new Date(initialClient.conversionDate).toISOString().substring(0, 10)
            : new Date().toISOString().substring(0, 10)
        );
        setMeetingDate(
          initialClient.meetingDate
            ? new Date(initialClient.meetingDate).toISOString().substring(0, 10)
            : ''
        );
        setUpcomingMeetingDate(
          initialClient.upcomingMeetingDate
            ? new Date(initialClient.upcomingMeetingDate).toISOString().substring(0, 10)
            : ''
        );
        setMeetingNotes(initialClient.meetingNotes || '');

        setWebsiteStatus(initialClient.websiteStatus || 'Website Had To Make');
        setWebsiteDeliveryDate(
          initialClient.websiteDeliveryDate
            ? new Date(initialClient.websiteDeliveryDate).toISOString().substring(0, 10)
            : ''
        );

        setTotalClientAmount(initialClient.totalClientAmount || 0);
        setClientPaidAmount(initialClient.clientPaidAmount || 0);

        setWebsiteMakingCost(initialClient.websiteMakingCost || 0);
        setDomainCharges(initialClient.domainCharges || 0);
        setOtherExpenses(initialClient.otherExpenses || 0);
      } else if (prefillFromLead) {
        // New converted client pre-filled from lead data
        setProjectType('website');
        setClientName(prefillFromLead.name || '');
        setCompany(prefillFromLead.company || '');
        setPhone(prefillFromLead.phone || '');
        setEmail(prefillFromLead.email || '');
        setAddress(prefillFromLead.address || '');
        setTargetUserId('');
        setConversionDate(new Date().toISOString().substring(0, 10));
        setMeetingDate('');
        setUpcomingMeetingDate('');
        setMeetingNotes('');
        setWebsiteStatus('Website Had To Make');
        setWebsiteDeliveryDate('');
        setTotalClientAmount(0);
        setClientPaidAmount(0);
        setWebsiteMakingCost(0);
        setDomainCharges(0);
        setOtherExpenses(0);
      } else {
        // Blank new client
        setProjectType('website');
        setClientName('');
        setCompany('');
        setPhone('');
        setEmail('');
        setAddress('');
        setTotalClientAmount(0);
        setClientPaidAmount(0);
        setWebsiteMakingCost(0);
        setDomainCharges(0);
        setOtherExpenses(0);
      }
    }
    prevOpenRef.current = isOpen;
  }, [initialClient, prefillFromLead, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectType) {
      alert('Please select a Project Type before saving the converted client.');
      return;
    }
    await onSubmit({
      projectType,
      clientName,
      company,
      phone,
      email,
      address,
      conversionDate: conversionDate as any,
      meetingDate: meetingDate ? (meetingDate as any) : undefined,
      upcomingMeetingDate: upcomingMeetingDate ? (upcomingMeetingDate as any) : undefined,
      meetingNotes,
      websiteStatus,
      websiteDeliveryDate: websiteDeliveryDate ? (websiteDeliveryDate as any) : undefined,
      totalClientAmount: Number(totalClientAmount),
      clientPaidAmount: Number(clientPaidAmount),
      websiteMakingCost: Number(websiteMakingCost),
      domainCharges: Number(domainCharges),
      otherExpenses: Number(otherExpenses),
      targetUserId: isAdmin && targetUserId ? targetUserId : undefined,
      // Pass leadId reference if converting from a lead
      leadId: prefillFromLead?.leadId
    } as any);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialClient ? 'Edit Converted Client' : 'Add New Converted Client'}
      subtitle="Full tracking for client payment, project type, expenses & profit"
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Pre-filled from Lead Info Banner */}
        {prefillFromLead && !initialClient && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl px-4 py-3 flex items-start space-x-3">
            <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                Auto-filled from Lead Record #{prefillFromLead.serialNumber || ''}
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                Client details have been pre-filled from <strong>{prefillFromLead.name}</strong>'s lead. Please enter the financial details below to complete conversion.
              </p>
              {prefillFromLead.categoryName && (
                <span className="inline-block mt-1 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-lg">
                  📂 {prefillFromLead.categoryName}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Mandatory Project Type Selection */}
        <div className="bg-indigo-50/70 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-2">
          <label className="block text-xs font-extrabold text-indigo-900 dark:text-indigo-200 flex items-center">
            <Layers className="w-4 h-4 mr-1.5 text-indigo-600" />
            Project Type * (Mandatory Classification)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setProjectType('website')}
              className={`p-3 rounded-xl border flex items-center justify-center space-x-2 text-xs font-bold transition-all ${
                projectType === 'website'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>🌐 Website Project</span>
            </button>

            <button
              type="button"
              onClick={() => setProjectType('app')}
              className={`p-3 rounded-xl border flex items-center justify-center space-x-2 text-xs font-bold transition-all ${
                projectType === 'app'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>📱 App Project</span>
            </button>
          </div>
        </div>

        {/* Basic Client Info */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Client Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Client / Contact Name *
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
                placeholder="Client Name"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company / Business Name"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Phone Number
                </label>
                {phone && <DirectCallButton phone={phone} size="xs" label="Call Now" />}
              </div>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@company.com"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>

            {isAdmin && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Caller (Admin Override)
                </label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white"
                >
                  <option value="">Keep Original Caller</option>
                  {callers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Client Payment Ledger */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Client Deal & Financial Ledger
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Total Deal Amount (₹) *
              </label>
              <input
                type="number"
                min="0"
                value={totalClientAmount}
                onChange={(e) => setTotalClientAmount(Number(e.target.value))}
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Client Paid Amount (Advance ₹)
              </label>
              <input
                type="number"
                min="0"
                value={clientPaidAmount}
                onChange={(e) => setClientPaidAmount(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-extrabold text-emerald-600 dark:text-emerald-400"
              />
            </div>
          </div>
        </div>

        {/* Form Footer Buttons */}
        <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md transition-all flex items-center space-x-1"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{loading ? 'Saving...' : initialClient ? 'Update Client' : 'Save Converted Client'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
