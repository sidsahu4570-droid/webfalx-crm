import React, { useState, useEffect } from 'react';
import { convertedClientService } from '../services/convertedClientService';
import { ConvertedClient } from '../types';
import { formatDate } from '../utils/formatters';
import { LoadingSpinner } from '../components/common/SkeletonLoader';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, Building, Phone, UserCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

export const MeetingsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<ConvertedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'today' | 'missed' | 'completed'>('upcoming');

  const fetchMeetings = async () => {
    try {
      const res = await convertedClientService.getMeetings(filter);
      if (res.success) setMeetings(res.meetings);
    } catch (err: any) {
      toast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [filter]);

  if (loading) {
    return <LoadingSpinner text="Loading Meetings Command Center..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30">
            Meetings & Discovery Demos
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2">
            Client Meeting Command Center
          </h2>
          <p className="text-purple-200 text-xs md:text-sm mt-1 max-w-xl">
            Track upcoming, today's, missed, and completed client meetings.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-1 bg-white/10 p-1.5 rounded-2xl border border-white/20">
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'upcoming'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-white/80 hover:text-white'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'today'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-white/80 hover:text-white'
            }`}
          >
            Today's Meetings
          </button>
          <button
            onClick={() => setFilter('missed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'missed'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-white/80 hover:text-white'
            }`}
          >
            Missed Meetings
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'completed'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-white/80 hover:text-white'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Meetings List Grid */}
      {meetings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {meetings.map((item) => (
            <div
              key={item._id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 font-bold flex items-center justify-center text-sm border border-purple-100">
                    {item.clientName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      {item.clientName}
                    </h4>
                    {item.company && (
                      <span className="text-xs text-slate-500 flex items-center mt-0.5">
                        <Building className="w-3 h-3 mr-1" />
                        {item.company}
                      </span>
                    )}
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                    filter === 'missed'
                      ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                      : filter === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                  }`}
                >
                  {filter.toUpperCase()}
                </span>
              </div>

              {/* Meeting Date & Location */}
              <div className="bg-purple-50/50 dark:bg-purple-950/20 p-3 rounded-2xl border border-purple-200/60 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 space-y-1">
                <div className="flex items-center font-bold">
                  <Calendar className="w-4 h-4 mr-2 text-purple-600" />
                  <span>
                    Meeting Date: {item.upcomingMeetingDate ? formatDate(item.upcomingMeetingDate) : 'N/A'}
                  </span>
                </div>
                {item.meetingTime && (
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 block font-medium">
                    ⏰ Time: {item.meetingTime}
                  </span>
                )}
                {item.meetingLocation && (
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 block font-medium">
                    📍 Location / Link: {item.meetingLocation}
                  </span>
                )}
              </div>

              {/* Contact & Caller */}
              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pt-1">
                {item.phone && (
                  <div className="flex items-center">
                    <Phone className="w-3.5 h-3.5 mr-2 text-slate-400" />
                    <span>{item.phone}</span>
                  </div>
                )}
                {user?.role === 'admin' && (
                  <div className="flex items-center">
                    <UserCheck className="w-3.5 h-3.5 mr-2 text-indigo-500" />
                    <span>Caller: {item.callerName}</span>
                  </div>
                )}
              </div>

              {item.meetingNotes && (
                <p className="text-[11px] text-slate-500 italic bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/60">
                  "{item.meetingNotes}"
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3">
          <Calendar className="w-10 h-10 text-purple-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No Meetings Found ({filter.toUpperCase()})
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No meetings found for the selected filter criteria.
          </p>
        </div>
      )}
    </div>
  );
};
