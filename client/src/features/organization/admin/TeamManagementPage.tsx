import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  UserCheck,
  Shield,
  UserPlus,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  Mail,
  Calendar,
  Users,
  Briefcase,
  Search,
  MapPin,
  ToggleLeft,
  ToggleRight,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Zone {
  id: string;
  name: string;
}

interface Organization {
  id: string;
  name: string;
}

interface UserProfile {
  fullName: string;
  mobile?: string | null;
  designation?: string | null;
}

interface TeamMember {
  id: string;
  email: string;
  role: 'admin' | 'zone' | 'student';
  employeeId?: string | null;
  isActive: boolean;
  createdAt: string;
  userProfile?: UserProfile | null;
  organization?: Organization | null;
  zone?: Zone | null;
}

interface FormData {
  fullName: string;
  email: string;
  role: 'admin' | 'zone';
  employeeId: string;
  mobile: string;
  designation: string;
  organizationId: string;
  zoneId: string;
}

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

// ─── Helper ───────────────────────────────────────────────────────────────────

const getAuthHeaders = () => {
  const token =
    localStorage.getItem('svms_token') ||
    localStorage.getItem('adminToken') ||
    localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getRoleBadge = (role: string) => {
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-100">
        <Shield size={10} /> Super Admin
      </span>
    );
  }
  if (role === 'zone') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
        <Briefcase size={10} /> Zone Incharge
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
      {role}
    </span>
  );
};

// ─── Confirm Modal ────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmClass?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmClass = 'bg-red-600 hover:bg-red-700',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-xl p-6 max-w-sm w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-black text-[#111827]">{title}</h3>
          <button onClick={onCancel} className="text-[#76777d] hover:text-[#111827] ml-4 cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-[#45464c] font-medium mb-5">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-9 border border-[#E5E7EB] rounded-xl text-xs font-black text-[#45464c] hover:bg-[#FCF8FA] cursor-pointer transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 h-9 rounded-xl text-xs font-black text-white cursor-pointer transition-all ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const TeamManagementPage: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'zone'>('all');

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'deactivate' | 'activate' | null;
    memberId: string;
    memberName: string;
  }>({ isOpen: false, type: null, memberId: '', memberName: '' });

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    role: 'zone',
    employeeId: '',
    mobile: '',
    designation: '',
    organizationId: '',
    zoneId: '',
  });

  // ── Fetch Zones ──────────────────────────────────────────────────────────────
  const fetchZones = useCallback(async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/v1/zones`, {
        headers: getAuthHeaders(),
      });
      if (response.data?.data) {
        setZones(response.data.data);
      }
    } catch {
      // Non-critical – zones list for dropdown
    }
  }, []);

  // ── Fetch Team ───────────────────────────────────────────────────────────────
  const fetchTeam = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = { limit: '100' };
      if (roleFilter !== 'all') params.role = roleFilter;

      const response = await axios.get(`${backendUrl}/api/v1/users`, {
        headers: getAuthHeaders(),
        params,
      });

      const members: TeamMember[] = (response.data?.data || []).filter(
        (u: TeamMember) => u.role === 'admin' || u.role === 'zone'
      );
      setTeam(members);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load team directory.');
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    fetchTeam();
    fetchZones();
  }, [fetchTeam, fetchZones]);

  // ── Input Handlers ───────────────────────────────────────────────────────────
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      role: 'zone',
      employeeId: '',
      mobile: '',
      designation: '',
      organizationId: '',
      zoneId: '',
    });
  };

  // ── Provision User ───────────────────────────────────────────────────────────
  const handleProvisionUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) {
      toast.warn('Please fill in the Full Name and Email fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, string> = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
      };
      if (formData.employeeId.trim()) payload.employeeId = formData.employeeId.trim();
      if (formData.mobile.trim()) payload.mobile = formData.mobile.trim();
      if (formData.designation.trim()) payload.designation = formData.designation.trim();
      if (formData.zoneId) payload.zoneId = formData.zoneId;

      await axios.post(`${backendUrl}/api/v1/users`, payload, {
        headers: getAuthHeaders(),
      });

      toast.success(`Account provisioned! A temporary password has been sent to ${formData.email}.`);
      resetForm();
      fetchTeam();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Account provisioning failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Toggle Activation ────────────────────────────────────────────────────────
  const handleToggleActivation = (member: TeamMember) => {
    setConfirmModal({
      isOpen: true,
      type: member.isActive ? 'deactivate' : 'activate',
      memberId: member.id,
      memberName: member.userProfile?.fullName || member.email,
    });
  };

  const executeToggle = async () => {
    const { type, memberId } = confirmModal;
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    setIsSubmitting(true);
    try {
      const endpoint =
        type === 'deactivate'
          ? `${backendUrl}/api/v1/users/${memberId}/deactivate`
          : `${backendUrl}/api/v1/users/${memberId}/activate`;

      await axios.patch(endpoint, {}, { headers: getAuthHeaders() });

      toast.success(
        type === 'deactivate'
          ? 'Account deactivated successfully.'
          : 'Account activated successfully.'
      );
      fetchTeam();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Action failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Derived Stats ─────────────────────────────────────────────────────────────
  const adminsCount = team.filter((u) => u.role === 'admin').length;
  const zoneCount = team.filter((u) => u.role === 'zone').length;
  const activeCount = team.filter((u) => u.isActive).length;

  // ── Filtered Roster ──────────────────────────────────────────────────────────
  const filteredRoster = team.filter((user) => {
    const name = user.userProfile?.fullName || '';
    const matchesSearch =
      name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
      (user.employeeId || '').toLowerCase().includes(searchFilter.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCF8FA] text-[#76777d] font-bold text-xs uppercase tracking-widest gap-2">
        <RefreshCw className="animate-spin text-[#D4AF37]" size={16} />
        Loading team directory...
      </div>
    );
  }

  return (
    <>
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={
          confirmModal.type === 'deactivate'
            ? 'Deactivate Account'
            : 'Activate Account'
        }
        message={
          confirmModal.type === 'deactivate'
            ? `Are you sure you want to deactivate ${confirmModal.memberName}'s account? They will no longer be able to log in.`
            : `Are you sure you want to re-activate ${confirmModal.memberName}'s account?`
        }
        confirmLabel={confirmModal.type === 'deactivate' ? 'Deactivate' : 'Activate'}
        confirmClass={
          confirmModal.type === 'deactivate'
            ? 'bg-red-600 hover:bg-red-700'
            : 'bg-green-600 hover:bg-green-700'
        }
        onConfirm={executeToggle}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      <div className="p-6 space-y-6 font-sans max-w-7xl mx-auto min-h-screen select-none">

        {/* ── HEADER ──────────────────────────────────────────────────────────── */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-luxury flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#FEF3C7] text-[#D97706]">
              <Users size={22} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">
                Team Management
              </h2>
              <p className="text-xs text-[#76777d] font-semibold mt-0.5">
                Provision and manage Super Admin and Zone Incharge credentials.
              </p>
            </div>
          </div>
          <button
            onClick={fetchTeam}
            disabled={isLoading}
            className="p-3 bg-[#FCF8FA] hover:bg-[#F0EDEE] text-[#76777d] hover:text-[#D4AF37] rounded-xl border border-[#E5E7EB] cursor-pointer transition-all disabled:opacity-50"
            title="Refresh Directory"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* ── STAT CARDS ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Members */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-luxury flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#FEF3C7] text-[#D97706]">
              <Users size={20} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#111827]">{team.length}</p>
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#76777d]">
                Total Members
              </p>
            </div>
          </div>

          {/* Super Admins */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-luxury flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600">
              <Shield size={20} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#111827]">{adminsCount}</p>
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#76777d]">
                Super Admins
              </p>
            </div>
          </div>

          {/* Zone Incharges */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-luxury flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
              <Briefcase size={20} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#111827]">{zoneCount}</p>
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#76777d]">
                Zone Incharges
              </p>
            </div>
          </div>

          {/* Active Accounts */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-luxury flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-50 text-green-600">
              <UserCheck size={20} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#111827]">{activeCount}</p>
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#76777d]">
                Active Accounts
              </p>
            </div>
          </div>
        </div>

        {/* ── MAIN WORKSPACE ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* ── PROVISION PANEL ─────────────────────────────────────────────── */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-luxury flex flex-col space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-4">
              <UserPlus size={18} className="text-[#D4AF37]" />
              <div>
                <h3 className="font-extrabold text-sm text-[#111827] tracking-tight">
                  Provision Account
                </h3>
                <p className="text-[10px] text-[#76777d] font-medium mt-0.5">
                  A temporary password will be emailed upon creation.
                </p>
              </div>
            </div>

            <form onSubmit={handleProvisionUser} className="space-y-3 text-xs font-bold pt-1">
              {/* Full Name */}
              <div>
                <label className="block text-[9px] font-black text-[#76777d] uppercase tracking-wider mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  className="w-full h-10 px-3 bg-[#FCF8FA] border border-[#E5E7EB] rounded-xl text-xs font-bold outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 transition-all"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[9px] font-black text-[#76777d] uppercase tracking-wider mb-1">
                  Corporate Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="name@maatram.org"
                  className="w-full h-10 px-3 bg-[#FCF8FA] border border-[#E5E7EB] rounded-xl text-xs font-bold outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 transition-all lowercase"
                  required
                />
              </div>

              {/* Employee ID */}
              <div>
                <label className="block text-[9px] font-black text-[#76777d] uppercase tracking-wider mb-1">
                  Employee ID <span className="text-[#76777d] normal-case font-medium">(optional)</span>
                </label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  placeholder="e.g. EMP-001"
                  className="w-full h-10 px-3 bg-[#FCF8FA] border border-[#E5E7EB] rounded-xl text-xs font-bold outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 transition-all"
                />
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-[9px] font-black text-[#76777d] uppercase tracking-wider mb-1">
                  Mobile Number <span className="text-[#76777d] normal-case font-medium">(optional)</span>
                </label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  placeholder="10-digit number"
                  className="w-full h-10 px-3 bg-[#FCF8FA] border border-[#E5E7EB] rounded-xl text-xs font-bold outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 transition-all"
                />
              </div>

              {/* Designation */}
              <div>
                <label className="block text-[9px] font-black text-[#76777d] uppercase tracking-wider mb-1">
                  Designation <span className="text-[#76777d] normal-case font-medium">(optional)</span>
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  placeholder="e.g. Field Coordinator"
                  className="w-full h-10 px-3 bg-[#FCF8FA] border border-[#E5E7EB] rounded-xl text-xs font-bold outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 transition-all"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-[9px] font-black text-[#76777d] uppercase tracking-wider mb-1">
                  Clearance Level <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full h-10 px-2 bg-[#FCF8FA] border border-[#E5E7EB] rounded-xl text-xs font-bold outline-none cursor-pointer focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 transition-all"
                >
                  <option value="zone">Zone Incharge (Field Manager)</option>
                  <option value="admin">Super Admin (Full Access)</option>
                </select>
              </div>

              {/* Zone (only for zone role) */}
              {formData.role === 'zone' && zones.length > 0 && (
                <div>
                  <label className="block text-[9px] font-black text-[#76777d] uppercase tracking-wider mb-1">
                    Assign Zone <span className="text-[#76777d] normal-case font-medium">(optional)</span>
                  </label>
                  <select
                    name="zoneId"
                    value={formData.zoneId}
                    onChange={handleInputChange}
                    className="w-full h-10 px-2 bg-[#FCF8FA] border border-[#E5E7EB] rounded-xl text-xs font-bold outline-none cursor-pointer focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 transition-all"
                  >
                    <option value="">— No Zone Assigned —</option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 h-10 border border-[#E5E7EB] rounded-xl text-xs font-black text-[#45464c] hover:bg-[#FCF8FA] cursor-pointer transition-all"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-10 bg-[#D4AF37] hover:bg-[#b8972e] text-white rounded-xl font-black text-xs uppercase tracking-widest cursor-pointer shadow-md shadow-[#D4AF37]/20 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <><RefreshCw size={12} className="animate-spin" /> Creating…</>
                  ) : (
                    <><UserPlus size={12} /> Deploy Member</>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* ── ROSTER TABLE ────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-luxury flex flex-col space-y-4">
            {/* Table Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-[#D4AF37]" />
                <div>
                  <h3 className="font-extrabold text-sm text-[#111827] tracking-tight">
                    Active Management Directory
                  </h3>
                  <p className="text-[10px] text-[#76777d] font-medium mt-0.5">
                    {filteredRoster.length} of {team.length} members shown
                  </p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Role filter tabs */}
                <div className="flex rounded-xl border border-[#E5E7EB] overflow-hidden">
                  {(['all', 'admin', 'zone'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRoleFilter(r)}
                      className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        roleFilter === r
                          ? 'bg-[#D4AF37] text-white'
                          : 'bg-white text-[#76777d] hover:bg-[#FCF8FA]'
                      }`}
                    >
                      {r === 'all' ? 'All' : r === 'admin' ? 'Admins' : 'Zone'}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative flex items-center">
                  <Search size={13} className="absolute left-3 text-[#76777d]" />
                  <input
                    type="text"
                    placeholder="Search name, email..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full sm:w-48 h-9 pl-9 pr-3 bg-[#FCF8FA] border border-[#E5E7EB] rounded-xl text-xs font-bold outline-none focus:border-[#D4AF37] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto rounded-xl border border-[#E5E7EB]">
              <table className="w-full text-left text-xs font-bold border-collapse">
                <thead>
                  <tr className="bg-[#FCF8FA] text-[#76777d] uppercase text-[9px] font-black tracking-wider border-b border-[#E5E7EB]">
                    <th className="p-3">Member</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Zone</th>
                    <th className="p-3">Employee ID</th>
                    <th className="p-3">Joined</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] text-[#111827]">
                  {filteredRoster.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center p-10 text-[#76777d] italic font-semibold"
                      >
                        {searchFilter
                          ? 'No team members match your search.'
                          : 'No team accounts provisioned yet.'}
                      </td>
                    </tr>
                  ) : (
                    filteredRoster.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-[#FCF8FA]/60 transition-colors"
                      >
                        {/* Member */}
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center text-[10px] font-black flex-shrink-0">
                              {getInitials(user.userProfile?.fullName || user.email || '??')}
                            </div>
                            <div>
                              <p className="font-extrabold text-[#111827] text-xs leading-tight">
                                {user.userProfile?.fullName || '—'}
                              </p>
                              <p className="text-[10px] text-[#76777d] font-mono font-medium flex items-center gap-1 mt-0.5">
                                <Mail size={10} />
                                {user.email}
                              </p>
                              {user.userProfile?.designation && (
                                <p className="text-[9px] text-[#76777d] font-medium mt-0.5">
                                  {user.userProfile.designation}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="p-3">{getRoleBadge(user.role)}</td>

                        {/* Zone */}
                        <td className="p-3">
                          {user.zone ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FEF3C7]/60 text-[#D97706] rounded-md text-[11px] font-bold">
                              <MapPin size={10} />
                              {user.zone.name}
                            </span>
                          ) : (
                            <span className="text-[#76777d] font-medium text-[11px]">—</span>
                          )}
                        </td>

                        {/* Employee ID */}
                        <td className="p-3 font-mono text-[#45464c] text-[11px]">
                          {user.employeeId || '—'}
                        </td>

                        {/* Joined Date */}
                        <td className="p-3 text-[#76777d] font-medium">
                          <div className="flex items-center gap-1 text-[11px]">
                            <Calendar size={11} />
                            {new Date(user.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-3">
                          {user.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded-lg text-[10px] font-black uppercase">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded-lg text-[10px] font-black uppercase">
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Action: Toggle activation */}
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleActivation(user)}
                            disabled={isSubmitting}
                            title={user.isActive ? 'Deactivate account' : 'Activate account'}
                            className={`p-2 rounded-xl transition-all cursor-pointer disabled:opacity-40 ${
                              user.isActive
                                ? 'text-[#76777d] hover:text-red-600 hover:bg-red-50'
                                : 'text-[#76777d] hover:text-green-600 hover:bg-green-50'
                            }`}
                          >
                            {user.isActive ? (
                              <ToggleRight size={18} />
                            ) : (
                              <ToggleLeft size={18} />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer note */}
            {team.length > 0 && (
              <p className="text-[10px] text-[#76777d] font-medium text-right">
                A temporary password is automatically generated and emailed when an account is provisioned.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
