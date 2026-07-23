import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { User } from '../types';
import { UserTable } from '../components/admin/UserTable';
import { UserModal } from '../components/admin/UserModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { LoadingSpinner } from '../components/common/SkeletonLoader';
import { useToast } from '../context/ToastContext';
import { UserPlus, Users, KeyRound } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset password state
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [userToReset, setUserToReset] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  // Delete user state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.getUsers();
      if (res.success) setUsers(res.users);
    } catch (err: any) {
      toast('Error Loading Users', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSaveUser = async (formData: any) => {
    setSaving(true);
    try {
      if (editingUser) {
        const res = await userService.updateUser(editingUser.id, formData);
        if (res.success) {
          toast('Caller Account Updated', `Saved changes for ${res.user.name}`, 'success');
          fetchUsers();
        }
      } else {
        const res = await userService.createUser(formData);
        if (res.success) {
          toast('Caller Account Created', `Created caller profile for ${res.user.name}`, 'success');
          fetchUsers();
        }
      }
    } catch (err: any) {
      toast('Save Failed', err.response?.data?.message || err.message, 'error');
    } finally {
      setSaving(false);
      setEditingUser(null);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      const res = await userService.updateUser(user.id, { isActive: !user.isActive });
      if (res.success) {
        toast('Status Changed', `Caller ${user.name} is now ${!user.isActive ? 'Active' : 'Disabled'}`, 'success');
        fetchUsers();
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    }
  };

  const handleConfirmResetPassword = async () => {
    if (!userToReset || !newPassword) return;
    setResetting(true);
    try {
      const res = await userService.updateUser(userToReset.id, { password: newPassword });
      if (res.success) {
        toast('Password Reset', `Successfully reset password for ${userToReset.email}`, 'success');
        setResetModalOpen(false);
        setUserToReset(null);
        setNewPassword('');
      }
    } catch (err: any) {
      toast('Reset Error', err.message, 'error');
    } finally {
      setResetting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      const res = await userService.deleteUser(userToDelete.id);
      if (res.success) {
        toast('Caller Account Deleted', `Deleted ${userToDelete.name}`, 'success');
        setDeleteModalOpen(false);
        setUserToDelete(null);
        fetchUsers();
      }
    } catch (err: any) {
      toast('Delete Error', err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleApproveJoiningDate = async (user: User, status: 'Approved' | 'Rejected', date?: string) => {
    try {
      const res = await userService.approveJoiningDate(user.id, { status, joiningDate: date });
      if (res.success) {
        toast('Joining Date Approved', res.message, 'success');
        fetchUsers();
      }
    } catch (err: any) {
      toast('Approval Error', err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Caller & Agent Accounts System
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Admin tool to create caller credentials, enable/disable accounts, and reset passwords
          </p>
        </div>

        <button
          onClick={() => {
            setEditingUser(null);
            setModalOpen(true);
          }}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md shadow-indigo-500/20 transition-all shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Caller Account</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching caller team directory..." />
      ) : (
        <UserTable
          users={users}
          onEditUser={(u) => {
            setEditingUser(u);
            setModalOpen(true);
          }}
          onToggleActive={handleToggleActive}
          onResetPassword={(u) => {
            setUserToReset(u);
            setNewPassword('');
            setResetModalOpen(true);
          }}
          onDeleteUser={(u) => {
            setUserToDelete(u);
            setDeleteModalOpen(true);
          }}
          onApproveJoiningDate={handleApproveJoiningDate}
        />
      )}

      {/* User Create / Edit Modal */}
      <UserModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingUser(null);
        }}
        onSubmit={handleSaveUser}
        user={editingUser}
        loading={saving}
      />

      {/* Reset Password Dialog */}
      {userToReset && (
        <ConfirmDialog
          isOpen={resetModalOpen}
          onClose={() => {
            setResetModalOpen(false);
            setUserToReset(null);
          }}
          onConfirm={handleConfirmResetPassword}
          title={`Reset Password for ${userToReset.name}`}
          message="Specify the new password for this caller account below:"
          confirmText="Update Password"
          confirmVariant="primary"
          loading={resetting}
        >
          <div className="mt-3">
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (e.g. Caller@2026)"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white"
            />
          </div>
        </ConfirmDialog>
      )}

      {/* Delete User Dialog */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={handleDeleteUser}
        title="Delete Caller Account"
        message={`Are you sure you want to delete caller "${userToDelete?.name}" (${userToDelete?.email})?`}
        confirmText="Delete Account"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
};
