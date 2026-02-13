'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { businessAPI } from '@/lib/api';
import Link from 'next/link';

export default function TeamPage() {
    const router = useRouter();
    const { user, token, isLoading } = useAuthStore();
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Invite Form State
    const [inviteForm, setInviteForm] = useState({
        email: '',
        firstName: '',
        lastName: '',
        permissions: ['leads', 'messages']
    });
    const [inviting, setInviting] = useState(false);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const data = await businessAPI.getDetails();
            setStaff(data.users || []);
        } catch (error) {
            console.error('Failed to fetch staff:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !isLoading) {
            if (!token) {
                router.push('/login');
            } else {
                fetchStaff();
            }
        }
    }, [token, router, mounted, isLoading]);

    const handleToggleStatus = async (id: string) => {
        try {
            await businessAPI.toggleStaffStatus(id);
            fetchStaff();
        } catch (error: any) {
            alert(error.message || 'Failed to toggle status');
        }
    };

    const handleUpdateRole = async (id: string, newRole: string) => {
        try {
            await businessAPI.updateStaff(id, { role: newRole });
            fetchStaff();
        } catch (error: any) {
            alert(error.message || 'Failed to update role');
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviting(true);
        try {
            const result = await businessAPI.inviteStaff({
                email: inviteForm.email,
                firstName: inviteForm.firstName,
                lastName: inviteForm.lastName
            });
            alert(`⚡ Staff Invitation Sent!\n\n${inviteForm.firstName} ${inviteForm.lastName} has been added to the workspace.\nTemp Password: ${result.tempPassword}`);
            setShowInviteModal(false);
            setInviteForm({ email: '', firstName: '', lastName: '', permissions: ['leads', 'messages'] });
            fetchStaff(); // Refresh list
        } catch (error: any) {
            alert(error.message || 'Failed to invite colleague.');
        } finally {
            setInviting(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-[#0a0c10] text-slate-200 flex overflow-hidden font-sans">
            {/* Sidebar Navigation */}
            <aside className="w-20 lg:w-64 bg-[#0a0c10] border-r border-white/5 flex flex-col p-4">
                <Link href="/dashboard" className="flex items-center space-x-3 mb-10 px-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">O</div>
                    <span className="hidden lg:block text-xl font-bold text-white tracking-tighter uppercase leading-none">OpsFlow</span>
                </Link>

                <nav className="flex-1 space-y-2">
                    <SidebarItem icon="📊" label="Dashboard" href="/dashboard" />
                    <SidebarItem icon="🎯" label="Leads" href="/leads" />
                    <SidebarItem icon="📅" label="Bookings" href="/bookings" />
                    <SidebarItem icon="💬" label="Inbox" href="/messages" />
                    <SidebarItem icon="📝" label="Forms" href="/forms" />
                    <SidebarItem icon="📦" label="Inventory" href="/inventory" />
                    <SidebarItem icon="👥" label="Team" href="/team" active />
                </nav>
            </aside>

            <main className="flex-1 overflow-y-auto custom-scrollbar relative">
                <div className="p-8 lg:p-12 max-w-7xl mx-auto">
                    <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <div className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Workspace</div>
                            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase">Team Management</h1>
                            <p className="mt-2 text-slate-500 text-xs font-bold uppercase tracking-widest">Delegate operations and set granular permissions.</p>
                        </div>

                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="bg-white text-black px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl shadow-white/10"
                        >
                            + Invite Colleague
                        </button>
                    </header>

                    <div className="grid grid-cols-1 gap-4">
                        {loading ? (
                            [...Array(3)].map((_, i) => (
                                <div key={i} className="h-28 bg-[#0f1218] border border-white/5 rounded-3xl animate-pulse"></div>
                            ))
                        ) : staff.map((member) => (
                            <div key={member.id} className="bg-[#0f1218] border border-white/5 rounded-3xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all hover:border-white/10 group">
                                <div className="flex items-center space-x-6">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center text-xl font-black text-white group-hover:border-blue-500/50 transition-colors">
                                        {member.firstName?.[0]}{member.lastName?.[0]}
                                    </div>
                                    <div>
                                        <div className="flex items-center space-x-3 mb-1">
                                            <h3 className="text-lg font-bold text-white">{member.firstName} {member.lastName}</h3>
                                            {!member.isActive && <span className="bg-red-500/10 text-red-500 text-[8px] font-black uppercase px-2 py-0.5 rounded border border-red-500/20">Deactivated</span>}
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${member.role === 'OWNER' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                                                {member.role}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium">{member.email}</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {['leads', 'bookings', 'inventory', 'messages'].map((perm) => {
                                        const perms = typeof member.permissions === 'string'
                                            ? JSON.parse(member.permissions || '[]')
                                            : (member.permissions || []);
                                        return (
                                            <PermissionBadge
                                                key={perm}
                                                label={perm}
                                                enabled={member.role === 'OWNER' || perms.includes(perm)}
                                            />
                                        );
                                    })}
                                </div>

                                <div className="flex items-center space-x-4">
                                    {member.id !== user?.id && (
                                        <button
                                            onClick={() => handleUpdateRole(member.id, member.role === 'OWNER' ? 'STAFF' : 'OWNER')}
                                            className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                                        >
                                            {member.role === 'OWNER' ? 'Demote' : 'Promote'}
                                        </button>
                                    )}
                                    {member.id !== user?.id && (
                                        <button
                                            onClick={() => {
                                                if (confirm(`Are you sure you want to ${member.isActive ? 'deactivate' : 'reactivate'} ${member.firstName}?`)) {
                                                    handleToggleStatus(member.id);
                                                }
                                            }}
                                            className={`text-[10px] font-black uppercase tracking-widest transition-colors ${member.isActive ? 'text-red-500/50 hover:text-red-500' : 'text-green-500/50 hover:text-green-500'}`}
                                        >
                                            {member.isActive ? 'Deactivate' : 'Reactivate'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Invite Modal */}
                {showInviteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-[#0a0c10] border border-white/10 rounded-[40px] p-10 max-w-lg w-full shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl"></div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-8">Invite Staff Member</h2>

                            <form onSubmit={handleInvite} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">First Name</label>
                                        <input
                                            required
                                            value={inviteForm.firstName}
                                            onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-blue-500 transition-all text-white"
                                            placeholder="Jane"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Last Name</label>
                                        <input
                                            required
                                            value={inviteForm.lastName}
                                            onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-blue-500 transition-all text-white"
                                            placeholder="Smith"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Email Address</label>
                                    <input
                                        required
                                        type="email"
                                        value={inviteForm.email}
                                        onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-blue-500 transition-all text-white"
                                        placeholder="jane.smith@zencare.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Modular Permissions</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <PermissionToggle
                                            label="Leads Pipeline"
                                            isActive={inviteForm.permissions.includes('leads')}
                                            onClick={() => {
                                                const perms = inviteForm.permissions.includes('leads')
                                                    ? inviteForm.permissions.filter(p => p !== 'leads')
                                                    : [...inviteForm.permissions, 'leads'];
                                                setInviteForm({ ...inviteForm, permissions: perms });
                                            }}
                                        />
                                        <PermissionToggle
                                            label="Bookings & Schedule"
                                            isActive={inviteForm.permissions.includes('bookings')}
                                            onClick={() => {
                                                const perms = inviteForm.permissions.includes('bookings')
                                                    ? inviteForm.permissions.filter(p => p !== 'bookings')
                                                    : [...inviteForm.permissions, 'bookings'];
                                                setInviteForm({ ...inviteForm, permissions: perms });
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowInviteModal(false)}
                                        className="flex-1 py-4 bg-white/5 text-slate-400 font-bold uppercase tracking-widest text-[10px] rounded-2xl hover:bg-white/10 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={inviting}
                                        className="flex-1 py-4 bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-blue-500 shadow-xl shadow-blue-600/20 disabled:opacity-50"
                                    >
                                        {inviting ? 'Inviting...' : 'Send Live Invite'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function SidebarItem({ icon, label, href, active = false }: { icon: string; label: string; href: string; active?: boolean }) {
    return (
        <Link
            href={href}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
        >
            <span className="text-lg leading-none">{icon}</span>
            <span className="hidden lg:block text-sm font-bold uppercase tracking-tight">{label}</span>
        </Link>
    );
}

function PermissionBadge({ label, enabled }: { label: string; enabled: boolean }) {
    return (
        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-full border ${enabled
            ? 'bg-blue-500/5 border-blue-500/20 text-blue-400'
            : 'bg-white/5 border-white/5 text-slate-600'
            }`}>
            {label}
        </span>
    );
}

function PermissionToggle({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center justify-between p-4 bg-white/5 border rounded-2xl transition-all w-full ${isActive ? 'border-blue-500/30' : 'border-white/5'}`}
        >
            <span className={`text-[10px] font-bold ${isActive ? 'text-blue-400' : 'text-slate-500'} uppercase tracking-tighter`}>{label}</span>
            <div className={`w-8 h-5 rounded-full p-1 transition-all ${isActive ? 'bg-blue-600' : 'bg-slate-700'}`}>
                <div className={`w-3 h-3 bg-white rounded-full transition-all ${isActive ? 'translate-x-3' : 'translate-x-0'}`}></div>
            </div>
        </button>
    );
}
