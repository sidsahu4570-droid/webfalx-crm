import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../common/Modal';
import { Lead, LeadStatus, LeadPriority, User, LeadCategory, City } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { categoryService } from '../../services/categoryService';
import { cityService } from '../../services/cityService';

const leadSchema = z.object({
  name: z.string().min(1, 'Prospect name is required'),
  company: z.string().optional(),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  source: z.string().default('Cold Call'),
  status: z.enum([
    'New',
    'Interested',
    'Follow-up',
    'Meeting Scheduled',
    'Converted',
    'Not Interested',
    'Closed',
    'Not Picked'
  ]),
  whatsAppSent: z.enum(['Yes', 'No', '']).optional(),
  priority: z.enum(['Low', 'Medium', 'High']),
  categoryId: z.string().min(1, 'Lead category is required'),
  cityId: z.string().min(1, 'Lead city is required'),
  nextFollowUpDate: z.string().optional(),
  initialNote: z.string().optional(),
  assignedUserId: z.string().optional()
});

type LeadFormData = z.infer<typeof leadSchema>;

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LeadFormData) => Promise<void>;
  lead?: Lead | null;
  callers?: User[];
  loading?: boolean;
}

export const LeadModal: React.FC<LeadModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  lead,
  callers = [],
  loading = false
}) => {
  const { user } = useAuth();
  const isEditing = !!lead;

  const [categories, setCategories] = useState<LeadCategory[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  useEffect(() => {
    if (isOpen) {
      categoryService.getCategories().then((res) => {
        if (res.success) {
          setCategories(res.categories);
        }
      });
      cityService.getCities().then((res) => {
        if (res.success) {
          setCities(res.cities);
        }
      });
    }
  }, [isOpen]);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors }
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: '',
      company: '',
      email: '',
      phone: '',
      address: '',
      source: 'Cold Call',
      status: 'New',
      priority: 'Medium',
      categoryId: '',
      cityId: '',
      nextFollowUpDate: '',
      initialNote: '',
      assignedUserId: ''
    }
  });

  useEffect(() => {
    if (lead) {
      reset({
        name: lead.name,
        company: lead.company || '',
        email: lead.email || '',
        phone: lead.phone || '',
        address: lead.address || '',
        source: lead.source || 'Cold Call',
        status: lead.status,
        priority: lead.priority,
        categoryId: lead.categoryId || '',
        cityId: lead.cityId || '',
        nextFollowUpDate: lead.nextFollowUpDate
          ? new Date(lead.nextFollowUpDate).toISOString().substring(0, 10)
          : '',
        assignedUserId: lead.userId
      });
    } else {
      reset({
        name: '',
        company: '',
        email: '',
        phone: '',
        address: '',
        source: 'Cold Call',
        status: 'New',
        priority: 'Medium',
        categoryId: '',
        cityId: '',
        nextFollowUpDate: '',
        initialNote: '',
        assignedUserId: ''
      });
    }
  }, [lead, reset, isOpen]);

  const isNewLeadCheck = lead ? (lead.isNewLead === true || lead.leadType === 'imported') : true;

  const handleFormSubmit = async (data: LeadFormData) => {
    if (isNewLeadCheck && !data.whatsAppSent) {
      setError('whatsAppSent', {
        type: 'manual',
        message: 'Please select whether a WhatsApp message was sent.'
      });
      return;
    }
    await onSubmit(data);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Prospect Details' : 'Add New Prospect'}
      subtitle={isEditing ? `Updating ${lead.name}` : 'Enter prospect information to assign to caller'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Admin Assign Caller Dropdown */}
        {user?.role === 'admin' && callers.length > 0 && !isEditing && (
          <div className="bg-indigo-50/60 dark:bg-indigo-950/40 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-800">
            <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1">
              Assign Lead to Caller
            </label>
            <select
              {...register('assignedUserId')}
              className="w-full bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Self (Default)</option>
              {callers.map((caller) => (
                <option key={caller.id} value={caller.id}>
                  {caller.name} ({caller.email})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Prospect Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Prospect / Contact Name *
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="e.g. John Doe"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name.message}</p>}
          </div>

          {/* Company */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Company Name
            </label>
            <input
              type="text"
              {...register('company')}
              placeholder="e.g. Acme Corp"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              {...register('phone')}
              placeholder="+1 (555) 000-0000"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              {...register('email')}
              placeholder="contact@company.com"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.email && <p className="text-[11px] text-rose-500 mt-1">{errors.email.message}</p>}
          </div>
        </div>

        {/* Address & Source */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Location / Address
            </label>
            <input
              type="text"
              {...register('address')}
              placeholder="City, State / Address"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Lead Source
            </label>
            <select
              {...register('source')}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Cold Call">Cold Call</option>
              <option value="Website Lead">Website Lead</option>
              <option value="LinkedIn Campaign">LinkedIn Campaign</option>
              <option value="Referral">Referral</option>
              <option value="Trade Show">Trade Show</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Status & Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Lead Status
            </label>
            <select
              {...register('status')}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="New">New</option>
              <option value="Interested">Interested</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Meeting Scheduled">Meeting Scheduled</option>
              <option value="Converted">Converted</option>
              <option value="Not Interested">Not Interested</option>
              <option value="Closed">Closed</option>
              <option value="Not Picked">Not Picked (Orange)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              WhatsApp Message Sent? {isNewLeadCheck ? <span className="text-rose-500">* (Required)</span> : <span className="text-slate-400 font-normal">(Optional)</span>}
            </label>
            <div className="flex items-center space-x-4 pt-1.5">
              <label className="inline-flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 cursor-pointer">
                <input
                  type="radio"
                  value="Yes"
                  {...register('whatsAppSent')}
                  className="form-radio text-emerald-600 focus:ring-emerald-500 mr-1.5"
                />
                Yes (Message Sent)
              </label>
              <label className="inline-flex items-center text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="radio"
                  value="No"
                  {...register('whatsAppSent')}
                  className="form-radio text-slate-600 focus:ring-slate-500 mr-1.5"
                />
                No
              </label>
            </div>
            {errors.whatsAppSent && (
              <p className="text-[11px] text-rose-500 mt-1 font-bold">{errors.whatsAppSent.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Priority Level
            </label>
            <select
              {...register('priority')}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Lead Category <span className="text-rose-500">*</span>
            </label>
            <select
              {...register('categoryId')}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Category...</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="text-[11px] text-rose-500 mt-1 font-bold">{errors.categoryId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              City / Coverage Area <span className="text-rose-500">*</span>
            </label>
            <select
              {...register('cityId')}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select City...</option>
              {cities.map((city) => (
                <option key={city._id} value={city._id}>
                  {city.name}
                </option>
              ))}
            </select>
            {errors.cityId && (
              <p className="text-[11px] text-rose-500 mt-1 font-bold">{errors.cityId.message}</p>
            )}
          </div>
        </div>

        {/* Next Follow-up Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Next Scheduled Follow-up Date
          </label>
          <input
            type="date"
            {...register('nextFollowUpDate')}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Initial Note (only on creation) */}
        {!isEditing && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Initial Call Note / Context
            </label>
            <textarea
              {...register('initialNote')}
              rows={2}
              placeholder="e.g. Spoke to gatekeeper. Scheduled follow-up with VP of Operations."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-md shadow-indigo-500/20 transition-all"
          >
            {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Prospect'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
