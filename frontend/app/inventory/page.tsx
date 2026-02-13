'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { inventoryAPI } from '@/lib/api';
import Link from 'next/link';

export default function InventoryPage() {
    const router = useRouter();
    const { token, isLoading } = useAuthStore();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', minStock: 5, currentStock: 10, unit: 'pcs', vendorName: '', vendorEmail: '' });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !isLoading) {
            if (!token) {
                router.push('/login');
            } else {
                fetchInventory();
            }
        }
    }, [token, router, mounted, isLoading]);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const data = await inventoryAPI.getAll();
            setItems(data);
        } catch (error) {
            console.error('Fetch inventory error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStockUpdate = async (id: string, change: number) => {
        try {
            const updatedItem = await inventoryAPI.updateStock(id, change);
            setItems(items.map(item => item.id === id ? updatedItem : item));
        } catch (error) {
            alert('Failed to update stock');
        }
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await inventoryAPI.add(newItem);
            setShowAddModal(false);
            setNewItem({ name: '', minStock: 5, currentStock: 10, unit: 'pcs', vendorName: '', vendorEmail: '' });
            fetchInventory();
        } catch (error) {
            alert('Failed to add item');
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0c10] text-slate-200 flex overflow-hidden font-sans">
            <aside className="w-20 lg:w-64 bg-[#0a0c10] border-r border-white/5 flex flex-col p-4">
                <Link href="/dashboard" className="flex items-center space-x-3 mb-10 px-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">O</div>
                    <span className="hidden lg:block text-xl font-bold text-white uppercase tracking-tighter">OpsFlow</span>
                </Link>

                <nav className="flex-1 space-y-2">
                    <SidebarItem icon="📊" label="Dashboard" href="/dashboard" />
                    <SidebarItem icon="🎯" label="Leads" href="/leads" />
                    <SidebarItem icon="📅" label="Bookings" href="/bookings" />
                    <SidebarItem icon="💬" label="Inbox" href="/messages" />
                    <SidebarItem icon="📝" label="Forms" href="/forms" />
                    <SidebarItem icon="📦" label="Inventory" href="/inventory" active />
                    <SidebarItem icon="👥" label="Team" href="/team" />
                </nav>
            </aside>

            <main className="flex-1 overflow-y-auto custom-scrollbar relative">
                <div className="p-8 lg:p-12 max-w-7xl mx-auto">
                    <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <div className="text-red-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Logistics</div>
                            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase">Asset Tracking</h1>
                        </div>

                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-white text-black px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:scale-105 transition-transform shadow-xl shadow-white/10"
                        >
                            + List Item
                        </button>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            [...Array(6)].map((_, i) => (
                                <div key={i} className="h-48 bg-white/[0.02] border border-white/5 rounded-3xl animate-pulse"></div>
                            ))
                        ) : items.length > 0 ? items.map((item) => (
                            <div key={item.id} className={`relative bg-white/[0.02] border rounded-[32px] p-8 transition-all group overflow-hidden ${item.currentStock <= item.minStock ? 'border-red-500/30 bg-red-500/[0.02]' : 'border-white/5'
                                }`}>
                                {item.currentStock <= item.minStock && (
                                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-widest">Low Stock</div>
                                )}

                                <div className="flex justify-between items-start mb-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${item.currentStock <= item.minStock ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-400'
                                        }`}>
                                        📦
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-black text-white">{item.currentStock}</div>
                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.unit}</div>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-1">{item.name}</h3>
                                <p className="text-xs font-medium text-slate-400 mb-1 uppercase tracking-widest">Min Threshold: {item.minStock}</p>
                                {item.vendorEmail && (
                                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-6">Auto-Restock: {item.vendorName || 'Active'}</p>
                                )}

                                <div className="flex items-center space-x-2 bg-white/5 p-1 rounded-xl border border-white/5">
                                    <button
                                        onClick={() => handleStockUpdate(item.id, -1)}
                                        className="flex-1 py-2 hover:bg-white/10 rounded-lg text-white font-bold transition-colors"
                                    >
                                        -
                                    </button>
                                    <div className="w-[1px] h-4 bg-white/10"></div>
                                    <button
                                        onClick={() => handleStockUpdate(item.id, 1)}
                                        className="flex-1 py-2 hover:bg-white/10 rounded-lg text-white font-bold transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full py-20 text-center bg-white/[0.01] border border-dashed border-white/10 rounded-[40px]">
                                <div className="text-6xl mb-6">📦</div>
                                <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">Inventory Empty</h3>
                                <p className="text-slate-500 text-sm max-w-xs mx-auto">Start by listing your key assets and supplies.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Add Item Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-[#0a0c10] border border-white/10 rounded-[40px] p-10 max-w-lg w-full shadow-2xl relative">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-8">List New Asset</h2>
                            <form onSubmit={handleAddItem} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Item Name</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                            placeholder="e.g. Surgical Masks"
                                            value={newItem.name}
                                            onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Current Stock</label>
                                        <input
                                            type="number"
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                            value={newItem.currentStock}
                                            onChange={e => setNewItem({ ...newItem, currentStock: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Min Threshold</label>
                                        <input
                                            type="number"
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                            value={newItem.minStock}
                                            onChange={e => setNewItem({ ...newItem, minStock: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Vendor Restock Email (Optional)</label>
                                        <input
                                            type="email"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                            placeholder="orders@vendor.com"
                                            value={newItem.vendorEmail}
                                            onChange={e => setNewItem({ ...newItem, vendorEmail: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Measurement Unit</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                                        value={newItem.unit}
                                        onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                                    >
                                        <option value="pcs">Pieces (pcs)</option>
                                        <option value="kg">Kilograms (kg)</option>
                                        <option value="L">Liters (L)</option>
                                        <option value="box">Boxes</option>
                                    </select>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 py-3 bg-white/5 text-slate-400 font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-white/10 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-blue-600 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
                                    >
                                        Save Asset
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
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-red-500/10 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
        >
            <span className="text-lg leading-none">{icon}</span>
            <span className="hidden lg:block text-sm font-bold uppercase tracking-tight">{label}</span>
        </Link>
    );
}
