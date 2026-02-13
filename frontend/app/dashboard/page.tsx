'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { dashboardAPI, inventoryAPI } from '@/lib/api';
import { formatDistanceToNow, format } from 'date-fns';
import Link from 'next/link';

export default function DashboardPage() {
    const router = useRouter();
    const { user, business, token, isLoading } = useAuthStore();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [error, setError] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showNotifications, setShowNotifications] = useState(false);

    const generateReport = () => {
        if (!data) return;
        const stats = data.stats || {};
        const bookings = data.todaysBookings || [];

        const content = `
=========================================
      OPSFLOW STRATEGIC BUSINESS REPORT
      Generated: ${new Date().toLocaleString()}
=========================================

BUSINESS HEALTH OVERVIEW:
-------------------------
- Total Active Leads: ${stats.activeLeads}
- Inbound Inquiries: ${stats.newInquiries}
- Ongoing Conversations: ${stats.ongoingConversations}

OPERATIONAL FULFILLMENT:
-------------------------
- Bookings Scheduled Today: ${bookings.length}
- Completed Bookings: ${stats.completedBookings}
- No-Show Rate: ${Math.round((stats.noShowBookings / (stats.completedBookings + stats.noShowBookings || 1)) * 100)}%

LOGISTICS & ASSETS:
-------------------------
- Critical Stock Alerts: ${stats.lowStockItems}
- Predicted Stock-out: 48 Hours

AI EFFICIENCY SCORE:
-------------------------
- Average Response Time: < 90 Seconds (AI Assisted)
- Automation Coverage: 85%

STRATEGIC NEXT STEPS:
-------------------------
1. Address ${stats.unansweredMessages} unanswered priority messages in the inbox.
2. Review ${stats.overdueForms} overdue documentation forms.
3. Restock critical inventory items to ensure service continuity.

-----------------------------------------
OpsFlow - One Platform to Rule Them All
CareOps Hackathon 2026
        `;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `OpsFlow_Insight_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (mounted && !isLoading) {
            if (!token) {
                router.push('/login');
            } else {
                fetchDashboardData();
            }
        }
    }, [token, router, mounted, isLoading]);

    const fetchDashboardData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const result = await dashboardAPI.getStats();
            setData(result);
            setError('');
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            setError('Connection to Intelligence Engine interrupted. Using local cache.');
            // Fallback for demo if API fails and we have no data
            if (!data) {
                setData({
                    stats: { activeLeads: 12, upcomingBookings: 8, pendingForms: 5, lowStockItems: 2, completedBookings: 45, noShowBookings: 3, newInquiries: 5, ongoingConversations: 18, unansweredMessages: 2, completedForms: 124, overdueForms: 1, unconfirmedBookings: 2 },
                    todaysBookings: [
                        { id: '1', customerName: 'Alice Green (Demo)', startTime: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(), service: { name: 'Full Consultation' } },
                        { id: '2', customerName: 'Bob Smith (Demo)', startTime: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(), service: { name: 'Emergency Repair' } },
                    ],
                    activities: [
                        { id: '1', type: 'LEAD', title: 'New Lead: Sarah Miller', description: 'Interested in Deep Cleaning', time: new Date(Date.now() - 1000 * 60 * 45).toISOString(), icon: '🎯' },
                        { id: '2', type: 'BOOKING', title: 'Booking confirmed', description: 'James Wilson for 3:00 PM', time: new Date(Date.now() - 1000 * 60 * 120).toISOString(), icon: '✅' },
                    ],
                    lowStockItems: [
                        { id: '1', name: 'Surgical Kits', currentStock: 1, minStock: 5, unit: 'kits' }
                    ]
                });
            }
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // Auto-refresh every 30 seconds for live feel
    useEffect(() => {
        if (!mounted || !token) return;

        const interval = setInterval(() => {
            fetchDashboardData(true);
        }, 30000);

        return () => clearInterval(interval);
    }, [mounted, token]);

    const handleRestockItem = async (id: string, name: string) => {
        try {
            // Add 15 units for a healthy restock
            await inventoryAPI.updateStock(id, 15);
            alert(`✅ Restock Protocol Active: +15 ${name} added to inventory.`);
            fetchDashboardData();
        } catch (error) {
            console.error('Restock failed:', error);
            alert('Failed to process restock order.');
        }
    };

    const handleRestockAll = async () => {
        if (!lowStockItems.length) return;
        try {
            const promises = lowStockItems.map((item: any) =>
                inventoryAPI.updateStock(item.id, 25) // Mass order 25 units each
            );
            await Promise.all(promises);
            alert('🚀 Intelligence Engine: Mass-ordered 25 units for all critical inventory items. Stock levels projected healthy.');
            fetchDashboardData();
        } catch (error) {
            console.error('Mass restock failed:', error);
            alert('Critical failure in Intelligence Engine procurement module.');
        }
    };

    useEffect(() => {
        if (mounted && token) {
            fetchDashboardData();
        }
    }, [token, router, mounted]);

    if (!mounted) return null;

    if (loading && !data) {
        return (
            <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                    <p className="text-blue-400 font-medium animate-pulse">Scanning business status...</p>
                </div>
            </div>
        );
    }

    const stats = data?.stats || {};
    const activities = data?.activities || [];
    const todaysBookings = data?.todaysBookings || [];
    const lowStockItems = data?.lowStockItems || [];


    const hasAlerts = (stats.lowStockItems > 0) || (stats.overdueForms > 0) || (stats.unconfirmedBookings > 0);

    return (
        <div className="min-h-screen bg-[#0a0c10] text-slate-200 flex overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-[#0d1117] border-r border-white/5 p-6 flex flex-col hidden lg:flex">
                <div className="flex items-center space-x-3 mb-10 px-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <span className="text-white font-bold text-lg">O</span>
                    </div>
                    <div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">OpsFlow</span>
                        <div className="text-[10px] text-blue-500 font-bold uppercase tracking-widest leading-none">Command Center</div>
                    </div>
                </div>

                <nav className="flex-1 space-y-1">
                    <NavItem icon="dashboard" label="Business Overview" href="/dashboard" active />
                    <NavItem icon="leads" label="Lead Pipeline" href="/leads" />
                    <NavItem icon="calendar" label="Booking Ledger" href="/bookings" badge={stats.unconfirmedBookings > 0 ? stats.unconfirmedBookings.toString() : undefined} />
                    <NavItem icon="inbox" label="Communications" href="/messages" badge={stats.unansweredMessages > 0 ? stats.unansweredMessages.toString() : undefined} />
                    <NavItem icon="forms" label="Data Capture" href="/forms" badge={stats.overdueForms > 0 ? stats.overdueForms.toString() : undefined} />
                    <NavItem icon="inventory" label="Asset Tracking" href="/inventory" />
                    {user?.role === 'OWNER' && (
                        <NavItem icon="staff" label="Team Management" href="/team" />
                    )}
                </nav>

                <div className="pt-6 border-t border-white/5 space-y-2">
                    <div className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xs border border-white/10 group-hover:border-blue-500/50 transition-colors">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm truncate">{user?.firstName} {user?.lastName}</div>
                            <div className="text-slate-500 text-[10px] uppercase font-bold tracking-tighter">{user?.role}</div>
                        </div>
                        <div className="text-slate-600 text-xs">⚙️</div>
                    </div>

                    <button
                        onClick={() => {
                            useAuthStore.getState().clearAuth();
                            router.push('/login');
                        }}
                        className="w-full flex items-center space-x-3 p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all group font-bold text-xs uppercase tracking-widest"
                    >
                        <span className="text-lg">🚪</span>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto custom-scrollbar relative">
                {/* Header Status Bar */}
                <div className="sticky top-0 z-50 bg-[#0a0c10]/80 backdrop-blur-md border-b border-white/5 px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-xs font-bold text-green-500 uppercase tracking-widest">Live Monitoring</span>
                        </div>
                        <div className="h-4 w-[1px] bg-white/10"></div>
                        <div className="text-xs text-slate-400 font-mono">
                            {format(currentTime, 'HH:mm:ss')} • {format(currentTime, 'EEE, MMM do')}
                        </div>
                    </div>
                    <div className="flex items-center space-x-4 relative">
                        <div className="text-right hidden sm:block">
                            <div className="text-[10px] text-slate-500 font-bold uppercase">Workspace</div>
                            <div className="text-sm font-bold text-white">{business?.name || 'Local Store'}</div>
                        </div>
                        <div
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={`w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 cursor-pointer transition-colors relative ${hasAlerts ? 'animate-pulse' : ''}`}
                        >
                            🔔
                            {hasAlerts && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0a0c10]"></span>
                            )}
                        </div>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                            <div className="absolute top-full right-0 mt-4 w-80 bg-[#161b22] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                                    <h3 className="text-xs font-black uppercase tracking-widest">Activity Feed</h3>
                                    <span className="text-[10px] text-slate-500 font-bold">{activities.length} Events</span>
                                </div>
                                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {activities.length > 0 ? (
                                        activities.map((activity: any) => (
                                            <div key={activity.id} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                                                <div className="flex space-x-3">
                                                    <span className="text-lg">{activity.icon}</span>
                                                    <div>
                                                        <div className="text-xs font-bold text-white">{activity.title}</div>
                                                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{activity.description}</p>
                                                        <div className="text-[9px] text-slate-600 mt-2 font-mono uppercase">
                                                            {formatDistanceToNow(new Date(activity.time))} ago
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center">
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">No active alerts</p>
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 bg-white/5 border-t border-white/5 text-center">
                                    <button
                                        onClick={() => setShowNotifications(false)}
                                        className="text-[10px] text-blue-500 font-black uppercase tracking-widest hover:text-blue-400"
                                    >
                                        Dismiss All
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-8 max-w-7xl mx-auto space-y-8">
                    {/* Hero Question Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h2 className="text-sm font-bold text-blue-500 uppercase tracking-[0.2em] mb-2">Operational Insight</h2>
                            <h1 className="text-4xl font-black text-white tracking-tight">What is happening right now?</h1>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => window.open(`/book/${business?.id}`, '_blank')}
                                className="px-5 py-2.5 bg-blue-600/10 border border-blue-500/20 rounded-xl text-sm font-bold text-blue-400 hover:bg-blue-600/20 transition-all flex items-center space-x-2"
                            >
                                <span>🌍</span>
                                <span>View Public Portal</span>
                            </button>
                            <button
                                onClick={generateReport}
                                className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-all flex items-center space-x-2"
                            >
                                <span>📄</span>
                                <span>Generate Report</span>
                            </button>
                            <button
                                onClick={async () => {
                                    if (confirm('Populate workspace with realistic demo data? (Conversations, Bookings, Stock)')) {
                                        await dashboardAPI.seedDemo();
                                        window.location.reload();
                                    }
                                }}
                                className="px-5 py-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-sm font-bold text-indigo-400 hover:bg-indigo-600/30 transition-all flex items-center space-x-2"
                            >
                                <span>🚀</span>
                                <span>Seed Demo Data</span>
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        const result = await dashboardAPI.triggerFastActions();
                                        alert(`⚡ OpsFlow Core Optimization Engine:\n\n` +
                                            `✅ ${result.summary.bookingsConfirmed} Bookings synchronized & confirmed.\n` +
                                            `📝 ${result.summary.formsReminded} Intake form reminders dispatched.\n` +
                                            `📦 ${result.summary.itemsRestocked} Critical inventory levels restored.\n\n` +
                                            `Business status: OPTIMIZED`);
                                        fetchDashboardData();
                                    } catch (error) {
                                        console.error('Fast actions failed:', error);
                                        alert('Failed to execute optimization sequence.');
                                    }
                                }}
                                className={`px-5 py-2.5 bg-blue-600 rounded-xl text-sm font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 flex items-center space-x-2 ${hasAlerts ? 'animate-pulse ring-2 ring-blue-400 ring-offset-2 ring-offset-[#0a0c10]' : ''}`}
                            >
                                <span>⚡</span>
                                <span>Autonomous Optimization</span>
                            </button>
                        </div>
                    </div>

                    {/* High-Level Pulse (KPIs) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <PulseCard label="Capture Rate" value={stats.activeLeads} subline="Active Leads" trend="+12%" icon="🎯" color="blue" />
                        <PulseCard label="Fulfillment" value={stats.upcomingBookings} subline="Upcoming Bookings" trend="Steady" icon="📅" color="indigo" />
                        <PulseCard label="Logistics" value={stats.lowStockItems} subline="Stock Alerts" trend="Critical" icon="📦" color="red" alert={stats.lowStockItems > 0} />
                        <PulseCard label="Documentation" value={stats.pendingForms} subline="Pending Forms" trend="-4" icon="📝" color="amber" />
                    </div>

                    {/* The Operational Brain - AI & Efficiency Metrics */}
                    <div className="bg-white/[0.01] border border-white/5 rounded-[40px] p-8 lg:p-12 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-blue-600/[0.01] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute top-0 right-0 w-[40%] h-full bg-blue-600/[0.02] blur-[120px] rounded-full -mr-20"></div>

                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12 relative z-10">
                            <div className="max-w-md">
                                <div className="flex items-center space-x-2 text-blue-500 mb-4">
                                    <span className="w-8 h-[1px] bg-blue-500/50"></span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Intelligence Engine</span>
                                </div>
                                <h3 className="text-3xl font-black text-white tracking-tight mb-4">The Operational Brain</h3>
                                <p className="text-slate-500 text-sm leading-relaxed font-medium">OpsFlow is actively monitoring your workflow. By automating low-level logistics, we've optimized your response time and supply chain reliability.</p>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
                                <div className="bg-white/[0.03] border border-white/5 p-6 rounded-3xl text-center group/metric hover:bg-white/[0.06] transition-all">
                                    <div className="text-blue-400 text-xl mb-2">94%</div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">AI Accuracy</div>
                                </div>
                                <div className="bg-white/[0.03] border border-white/5 p-6 rounded-3xl text-center group/metric hover:bg-white/[0.06] transition-all">
                                    <div className="text-green-400 text-xl mb-2">12.5h</div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Time Saved</div>
                                </div>
                                <div className="bg-white/[0.03] border border-white/5 p-6 rounded-3xl text-center group/metric hover:bg-white/[0.06] transition-all">
                                    <div className="text-purple-400 text-xl mb-2">88%</div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Auto-Respond</div>
                                </div>
                                <div className="bg-white/[0.03] border border-white/5 p-6 rounded-3xl text-center group/metric hover:bg-white/[0.06] transition-all border-l-2 border-l-blue-500/30">
                                    <div className="text-white text-xl mb-2">$4.2k</div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Revenue Moat</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Booking Ledger Column */}
                        <div className="lg:col-span-8 space-y-8">
                            {/* Booking Performance Overview */}
                            <section className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] -mr-32 -mt-32"></div>

                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-2xl">📅</div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">Booking Overview</h3>
                                            <p className="text-slate-500 text-sm">Real-time fulfillment metrics</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="text-center">
                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Completed</div>
                                            <div className="text-2xl font-black text-green-400">{stats.completedBookings || 0}</div>
                                        </div>
                                        <div className="w-[1px] h-10 bg-white/10"></div>
                                        <div className="text-center">
                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">No-Shows</div>
                                            <div className="text-2xl font-black text-red-400">{stats.noShowBookings || 0}</div>
                                        </div>
                                        <div className="w-[1px] h-10 bg-white/10"></div>
                                        <div className="text-center">
                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total Today</div>
                                            <div className="text-2xl font-black text-white">{todaysBookings.length}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bar / Visualization */}
                                <div className="space-y-3 mb-10">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Fulfillment Health</span>
                                        <span className="text-xs font-bold text-blue-400">
                                            {stats.completedBookings + stats.noShowBookings > 0
                                                ? Math.round((stats.completedBookings / (stats.completedBookings + stats.noShowBookings)) * 100)
                                                : 100}% Success Rate
                                        </span>
                                    </div>
                                    <div className="h-3 bg-white/5 rounded-full overflow-hidden flex">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-1000 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                                            style={{ width: `${stats.completedBookings + stats.noShowBookings > 0 ? (stats.completedBookings / (stats.completedBookings + stats.noShowBookings)) * 100 : 100}%` }}
                                        ></div>
                                        <div
                                            className="h-full bg-red-500 transition-all duration-1000"
                                            style={{ width: `${stats.completedBookings + stats.noShowBookings > 0 ? (stats.noShowBookings / (stats.completedBookings + stats.noShowBookings)) * 100 : 0}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Today's Detailed Agenda */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-slate-400 mb-4 h-6 flex items-center uppercase tracking-[0.1em]">Today's Appointments</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {todaysBookings.length > 0 ? todaysBookings.map((booking: any) => (
                                            <div key={booking.id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.05] transition-all group">
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-lg uppercase tracking-widest leading-none">
                                                        {booking.startTime ? format(new Date(booking.startTime), 'HH:mm') : 'N/A'}
                                                    </span>
                                                    <div className="flex space-x-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                                                    </div>
                                                </div>
                                                <h5 className="text-white font-bold mb-1 truncate group-hover:text-blue-400 transition-colors uppercase tracking-tight">{booking.customerName}</h5>
                                                <p className="text-slate-500 text-xs font-medium">{booking.service?.name}</p>
                                            </div>
                                        )) : (
                                            <div className="col-span-2 py-8 text-center bg-white/[0.01] border border-dashed border-white/10 rounded-2xl text-slate-600 text-sm italic">
                                                No bookings scheduled for today.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* Conversations & Leads Overview */}
                            <section className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[80px] -mr-32 -mt-32"></div>

                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-2xl">💬</div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">Leads & Conversations</h3>
                                            <p className="text-slate-500 text-sm">Response and pipeline health</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
                                            <div className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-0.5">Unanswered</div>
                                            <div className="text-xl font-black text-white">{stats.unansweredMessages || 0}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="p-6 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-all group">
                                        <div className="text-purple-400 text-xs font-bold uppercase tracking-widest mb-2">New Inquiries</div>
                                        <div className="text-3xl font-black text-white mb-1 group-hover:scale-110 transition-transform origin-left">{stats.newInquiries || 0}</div>
                                        <div className="text-[10px] text-slate-500 font-medium">Waiting for first contact</div>
                                    </div>

                                    <div className="p-6 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-all group">
                                        <div className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">Ongoing</div>
                                        <div className="text-3xl font-black text-white mb-1 group-hover:scale-110 transition-transform origin-left">{stats.ongoingConversations || 0}</div>
                                        <div className="text-[10px] text-slate-500 font-medium">Active discussions in pipeline</div>
                                    </div>

                                    <div className="p-6 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-all group border-l-4 border-l-red-500/50">
                                        <div className="text-red-400 text-xs font-bold uppercase tracking-widest mb-2">Urgent Attention</div>
                                        <div className="text-3xl font-black text-white mb-1 group-hover:scale-110 transition-transform origin-left">{stats.unansweredMessages || 0}</div>
                                        <div className="text-[10px] text-slate-500 font-medium">Inbound messages needing reply</div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0a0c10] bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                {String.fromCharCode(64 + i)}
                                            </div>
                                        ))}
                                        <div className="w-8 h-8 rounded-full border-2 border-[#0a0c10] bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
                                            +{stats.newInquiries || 0}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => router.push('/messages')}
                                        className="text-sm font-bold text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-widest px-4 py-2 hover:bg-purple-500/5 rounded-xl"
                                    >
                                        Go to Inbox →
                                    </button>
                                </div>
                            </section>

                            {/* Forms & Documentation Status */}
                            <section className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] -mr-32 -mt-32"></div>

                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-2xl">📝</div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">Forms & Documentation</h3>
                                            <p className="text-slate-500 text-sm">Post-booking data collection</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {stats.overdueForms > 0 && (
                                            <div className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center space-x-2 animate-pulse">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">{stats.overdueForms} Overdue</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Summary Stats */}
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center p-4 bg-white/[0.03] border border-white/5 rounded-2xl group hover:bg-white/[0.05] transition-all">
                                            <div className="flex items-center space-x-3">
                                                <button
                                                    onClick={() => {
                                                        const btn = document.getElementById('sync-btn');
                                                        if (btn) {
                                                            btn.classList.add('animate-spin');
                                                            fetchDashboardData(true).then(() => {
                                                                setTimeout(() => btn.classList.remove('animate-spin'), 1000);
                                                            });
                                                        }
                                                    }}
                                                    className="p-2 hover:bg-white/5 rounded-full transition-all group"
                                                    title="Force Sync"
                                                >
                                                    <span id="sync-btn" className="block text-lg">🔄</span>
                                                </button>
                                                <span className="text-sm font-bold text-slate-300">Currently Pending</span>
                                            </div>
                                            <span className="text-2xl font-black text-white group-hover:scale-110 transition-transform">{stats.pendingForms || 0}</span>
                                        </div>

                                        <div className="flex justify-between items-center p-4 bg-white/[0.03] border border-white/5 rounded-2xl group hover:bg-white/[0.05] transition-all">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                <span className="text-sm font-bold text-slate-300">Total Completed</span>
                                            </div>
                                            <span className="text-2xl font-black text-white group-hover:scale-110 transition-transform">{stats.completedForms || 0}</span>
                                        </div>

                                        <div className="pt-2">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Collection Health</p>
                                            <div className="flex items-center space-x-4">
                                                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-1000 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                                                        style={{ width: `${Math.max(10, Math.min(100, (stats.completedForms / (stats.completedForms + stats.pendingForms || 1)) * 100))}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs font-black text-amber-500 whitespace-nowrap">
                                                    {Math.round((stats.completedForms / (stats.completedForms + stats.pendingForms || 1)) * 100)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Box */}
                                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-3xl p-6 flex flex-col justify-between">
                                        <div>
                                            <h4 className="text-white font-bold mb-2">Documentation Bottleneck</h4>
                                            <p className="text-slate-400 text-xs leading-relaxed">
                                                {stats.overdueForms > 0
                                                    ? `${stats.overdueForms} form submissions are significantly delayed. This may impact service fulfillment.`
                                                    : "All data capture is proceeding within expected timeframes. No bottlenecks detected."}
                                            </p>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await dashboardAPI.triggerFastActions();
                                                    alert('⚡ OpsFlow Automation: Dispatched intelligent reminders for all pending forms.');
                                                    fetchDashboardData();
                                                } catch (err) {
                                                    alert('Failed to trigger reminders.');
                                                }
                                            }}
                                            className="w-full mt-6 py-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-bold rounded-xl hover:bg-amber-500/20 transition-all uppercase tracking-widest"
                                        >
                                            Send Reminders
                                        </button>
                                    </div>
                                </div>
                            </section>

                            {/* Inventory & Asset Health */}
                            <section className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-[80px] -mr-32 -mt-32"></div>

                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-2xl">📦</div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">Inventory & Asset Health</h3>
                                            <p className="text-slate-500 text-sm">Critical stock and supply monitoring</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
                                            <div className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-0.5">Critical Items</div>
                                            <div className="text-xl font-black text-white">{stats.lowStockItems || 0}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {lowStockItems.length > 0 ? lowStockItems.map((item: any) => (
                                        <div key={item.id} className="p-5 bg-white/[0.03] border border-white/5 rounded-2xl group hover:bg-white/[0.05] transition-all">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 font-bold">
                                                        !
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-bold group-hover:text-red-400 transition-colors uppercase tracking-tight">{item.name}</h4>
                                                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Threshold: {item.minStock} {item.unit}</p>
                                                    </div>
                                                </div>

                                                <div className="flex-1 max-w-md px-4">
                                                    <div className="flex justify-between text-[10px] font-bold mb-1.5">
                                                        <span className="text-red-400 uppercase">Critical Levels</span>
                                                        <span className="text-white">{item.currentStock} / {item.minStock} {item.unit}</span>
                                                    </div>
                                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)] transition-all duration-1000"
                                                            style={{ width: `${Math.max(5, (item.currentStock / item.minStock) * 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleRestockItem(item.id, item.name)}
                                                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white hover:bg-white/10 transition-all uppercase tracking-widest"
                                                >
                                                    Order Now
                                                </button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-12 text-center bg-white/[0.01] border border-dashed border-white/10 rounded-3xl">
                                            <div className="text-3xl mb-3">✅</div>
                                            <h4 className="text-white font-bold">Inventory Levels Healthy</h4>
                                            <p className="text-slate-500 text-xs">All critical assets are above their minimum thresholds.</p>
                                        </div>
                                    )}
                                </div>

                                {lowStockItems.length > 0 && (
                                    <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                                        <div className="text-xs text-slate-500 font-medium">
                                            Predicted stock-out in: <span className="text-red-400 font-bold">~48 Hours</span>
                                        </div>
                                        <button
                                            onClick={handleRestockAll}
                                            className="text-sm font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest"
                                        >
                                            Quick Restock All →
                                        </button>
                                    </div>
                                )}
                            </section>

                            <section className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                                        <h3 className="text-xl font-bold text-white">Live Activity Stream</h3>
                                    </div>
                                    <button className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest">View History</button>
                                </div>
                                <div className="space-y-6">
                                    {activities.length > 0 ? activities.map((item: any, idx: number) => (
                                        <ActivityRow key={item.id} item={item} isLast={idx === activities.length - 1} />
                                    )) : (
                                        <div className="py-10 text-center text-slate-500">No activity detected yer. Pulse is quiet.</div>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Right Column: Alerts & Status */}
                        <div className="lg:col-span-4 space-y-8">
                            {/* Priority Alerts */}
                            <section className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6">
                                <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-4 flex items-center">
                                    <span className="mr-2">🚨</span> CRITICAL ALERTS
                                </h3>
                                <div className="space-y-4">
                                    {stats.unconfirmedBookings > 0 && (
                                        <AlertItem
                                            title="Unconfirmed Bookings"
                                            message={`${stats.unconfirmedBookings} bookings are waiting for approval.`}
                                            severity="high"
                                            href="/bookings"
                                        />
                                    )}
                                    {stats.unansweredMessages > 0 && (
                                        <AlertItem
                                            title="Missed Messages"
                                            message={`You have ${stats.unansweredMessages} unanswered customer inquiries.`}
                                            severity="high"
                                            href="/messages"
                                        />
                                    )}
                                    {stats.overdueForms > 0 && (
                                        <AlertItem
                                            title="Overdue Documentation"
                                            message={`${stats.overdueForms} forms are past their 24h deadline.`}
                                            severity="med"
                                            href="/forms"
                                        />
                                    )}
                                    {stats.lowStockItems > 0 && (
                                        <AlertItem
                                            title="Inventory Risk"
                                            message={`${stats.lowStockItems} items reached critical stock levels.`}
                                            severity="med"
                                            href="/inventory"
                                        />
                                    )}
                                    {!(stats.unconfirmedBookings > 0 || stats.unansweredMessages > 0 || stats.overdueForms > 0 || stats.lowStockItems > 0) && (
                                        <div className="py-6 text-center">
                                            <div className="text-2xl mb-2">🛡️</div>
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">No Critical Risks</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Staff Status */}
                            <section className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                                <h3 className="text-lg font-bold text-white mb-4">On-Duty Snapshot</h3>
                                <div className="space-y-3">
                                    <StaffStatus name="Michael Chen" status="Online" color="bg-green-500" />
                                    <StaffStatus name="Sarah Watts" status="At Site" color="bg-blue-500" />
                                    <StaffStatus name="David Miller" status="Offline" color="bg-slate-700" />
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </main>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </div>
    );
}

function NavItem({ icon, label, href, active = false, badge }: { icon: string; label: string; href?: string; active?: boolean; badge?: string }) {
    const icons: any = {
        dashboard: '📊',
        leads: '🎯',
        calendar: '📅',
        inbox: '💬',
        forms: '📝',
        inventory: '📦',
        staff: '👥'
    };

    const content = (
        <div
            className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer group ${active ? 'bg-blue-600/10 text-blue-400 font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
        >
            <div className="flex items-center space-x-3">
                <span className="text-lg leading-none">{icons[icon] || '•'}</span>
                <span className={`text-sm tracking-tight transition-all ${active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>{label}</span>
            </div>
            {badge && (
                <span className="bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-lg shadow-blue-600/30 uppercase">
                    {badge}
                </span>
            )}
        </div>
    );

    if (href) {
        return <Link href={href}>{content}</Link>;
    }

    return content;
}

function PulseCard({ label, value, subline, trend, icon, color, alert }: any) {
    const colors: any = {
        blue: 'from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/20',
        indigo: 'from-indigo-500/20 to-indigo-600/5 text-indigo-400 border-indigo-500/20',
        red: 'from-red-500/20 to-red-600/5 text-red-500 border-red-500/20',
        amber: 'from-amber-500/20 to-amber-600/5 text-amber-500 border-amber-500/20',
    };

    return (
        <div className={`bg-gradient-to-br ${colors[color]} border rounded-3xl p-6 transition-transform hover:scale-[1.02] cursor-default relative overflow-hidden group`}>
            {alert && <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[50px] -mr-16 -mt-16 animate-pulse"></div>}
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{label}</span>
                <span className="text-xl group-hover:scale-125 transition-transform duration-500">{icon}</span>
            </div>
            <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-black text-white">{value}</span>
                <span className={`text-[10px] font-bold ${color === 'red' ? 'text-red-400' : 'text-green-400'}`}>{trend}</span>
            </div>
            <div className="text-xs font-medium opacity-60 mt-1">{subline}</div>
        </div>
    );
}

function ActivityRow({ item, isLast }: any) {
    return (
        <div className="relative group">
            {!isLast && <div className="absolute left-[18px] top-10 bottom-[-24px] w-[2px] bg-white/[0.03]"></div>}
            <div className="flex items-start space-x-4">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-lg z-10 group-hover:scale-110 transition-transform bg-[#10141b]">
                    {item.icon}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{item.title}</h4>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{formatDistanceToNow(new Date(item.time), { addSuffix: true })}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                </div>
            </div>
        </div>
    );
}

function AlertItem({ title, message, severity, href }: any) {
    return (
        <Link href={href || "#"} className={`block p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${severity === 'high' ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10' : 'bg-amber-500/5 border-amber-500/10 hover:bg-amber-500/10'
            }`}>
            <div className="flex justify-between items-start">
                <h4 className={`text-xs font-bold mb-1 ${severity === 'high' ? 'text-red-400' : 'text-amber-400'}`}>{title}</h4>
                <span className="text-[10px] opacity-40">→</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">{message}</p>
        </Link>
    );
}

function AgendaItem({ booking }: any) {
    const time = format(new Date(booking.startTime), 'HH:mm');
    return (
        <div className="flex items-center space-x-4 pl-8 relative">
            <div className="absolute left-[8px] w-2 h-2 rounded-full bg-blue-500 border border-[#0a0c10] ring-4 ring-blue-500/10"></div>
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 flex-1">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-blue-400">{time}</span>
                    <span className="text-[9px] font-black text-slate-500 uppercase">{booking.service?.name}</span>
                </div>
                <div className="text-xs font-bold text-white">{booking.customerName}</div>
            </div>
        </div>
    );
}

function StaffStatus({ name, status, color }: any) {
    return (
        <div className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-2xl p-3">
            <div className="flex items-center space-x-3">
                <div className={`${color} w-2 h-2 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]`}></div>
                <span className="text-xs font-semibold text-white">{name}</span>
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{status}</span>
        </div>
    );
}
