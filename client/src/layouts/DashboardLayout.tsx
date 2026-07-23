import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { LeadModal } from '../components/leads/LeadModal';
import { leadService } from '../services/leadService';
import { userService } from '../services/userService';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';

export const DashboardLayout: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { toast, info } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [callers, setCallers] = useState<User[]>([]);
  const [savingLead, setSavingLead] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      userService.getUsers().then((res) => {
        if (res.success) setCallers(res.users);
      });
    }
  }, [user]);

  // Real-time Socket Event Listeners for Toast Alerts
  useEffect(() => {
    if (!socket) return;

    const handleLeadUpdated = (lead: any) => {
      info('Real-time Update', `Prospect "${lead.name}" was updated (${lead.status})`);
    };

    const handleLeadAssigned = (lead: any) => {
      toast('Lead Reassigned', `You have been assigned prospect "${lead.name}"`, 'success');
    };

    const handleLeadCreated = (lead: any) => {
      info('New Prospect', `Prospect "${lead.name}" added to pipeline`);
    };

    socket.on('lead_updated', handleLeadUpdated);
    socket.on('lead_assigned', handleLeadAssigned);
    socket.on('lead_created', handleLeadCreated);

    return () => {
      socket.off('lead_updated', handleLeadUpdated);
      socket.off('lead_assigned', handleLeadAssigned);
      socket.off('lead_created', handleLeadCreated);
    };
  }, [socket, toast, info]);

  const handleCreateLead = async (data: any) => {
    setSavingLead(true);
    try {
      const res = await leadService.createLead(data);
      if (res.success) {
        toast('Prospect Created', `Successfully added ${res.lead.name}`, 'success');
        window.dispatchEvent(new Event('leads_updated'));
      }
    } catch (err: any) {
      toast('Error Creating Prospect', err.message || 'Server error', 'error');
    } finally {
      setSavingLead(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar
        onOpenAddModal={() => setAddModalOpen(true)}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isSidebarOpen={sidebarOpen}
      />

      <div className="flex-1 flex w-full">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-hidden">
          <Outlet />
        </main>
      </div>

      {/* Global Quick Add Prospect Modal */}
      <LeadModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleCreateLead}
        callers={callers}
        loading={savingLead}
      />
    </div>
  );
};
