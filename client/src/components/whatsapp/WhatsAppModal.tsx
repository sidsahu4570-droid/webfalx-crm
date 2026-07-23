import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { whatsAppService } from '../../services/whatsAppService';
import { MessageSquare, Send, CheckCircle2, FileText } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId?: string;
  clientId?: string;
  recipientName: string;
  companyName?: string;
  phone: string;
  onLogSaved?: () => void;
}

const TEMPLATES = [
  {
    id: 'welcome',
    title: '🌐 Demo Website',
    message: (name: string, company: string) =>
      `Hello ${company || name} 😊

Jaise discussion hua tha, ye raha hamara demo website.

https://jp-real-estate-mern.vercel.app/

Isme aap dekh sakte hain ki kis tarah:
• Saare projects ek hi jagah showcase hote hain.
• Property images, pricing, location aur project details properly dikhte hain.
• Direct enquiry aur WhatsApp contact ka option hota hai.
• Clients bina baar-baar details maange easily sab kuch explore kar sakte hain.

Demo dekhkar batayiye kaisa laga. Agar aap chahein to hum aapke business aur branding ke according bhi isi tarah ki professional website design kar sakte hain.`
  },
  {
    id: 'followup',
    title: '📞 Lead Follow-up Reminder',
    message: (name: string) =>
      `Hello ${name}, following up on our previous discussion. Are you available for a quick 5-minute call today?`
  },
  {
    id: 'meeting',
    title: '📅 Meeting Confirmation',
    message: (name: string) =>
      `Hi ${name}, confirming our scheduled meeting. Please let us know if you need to reschedule or have any questions beforehand.`
  },
  {
    id: 'invoice',
    title: '🧾 Payment Invoice Reminder',
    message: (name: string) =>
      `Hi ${name}, hope you are well. Here is a friendly reminder regarding your pending project payment. Let us know once completed.`
  },
  {
    id: 'progress',
    title: '🚀 Website / App Progress Update',
    message: (name: string) =>
      `Great news ${name}! We have posted a new development progress milestone on your project. Check out the updates!`
  }
];

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  leadId,
  clientId,
  recipientName,
  companyName = '',
  phone,
  onLogSaved
}) => {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState('welcome');
  const [customMessage, setCustomMessage] = useState(
    TEMPLATES[0].message(recipientName, companyName)
  );
  const [sending, setSending] = useState(false);

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const tmpl = TEMPLATES.find((t) => t.id === templateId);
    if (tmpl) {
      setCustomMessage(tmpl.message(recipientName, companyName));
    }
  };

  const handleSendWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMessage.trim()) return;

    setSending(true);
    try {
      // Log WhatsApp Communication
      await whatsAppService.logMessage({
        leadId,
        clientId,
        phone,
        message: customMessage,
        templateName: TEMPLATES.find((t) => t.id === selectedTemplate)?.title || 'Custom Message',
        status: 'Sent'
      });

      toast('WhatsApp Logged', `Message sent to ${recipientName} (${phone})`, 'success');

      // Launch WhatsApp Web / App directly
      const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(customMessage)}`;
      window.open(waUrl, '_blank');

      if (onLogSaved) onLogSaved();
      onClose();
    } catch (err: any) {
      toast('Error', err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Send WhatsApp to ${recipientName}`}
      subtitle={`Mobile: +${formattedPhone} • One-Click Quick Messaging & Logging`}
    >
      <form onSubmit={handleSendWhatsApp} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Select Message Template
          </label>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTemplateChange(t.id)}
                className={`w-full text-left p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  selectedTemplate === t.id
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                {t.title}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Message Preview / Edit Message *
          </label>
          <textarea
            rows={4}
            required
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold px-4 py-2 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={sending}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl shadow-md flex items-center space-x-1.5 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{sending ? 'Launching...' : 'Open WhatsApp & Log'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
