'use client';

import { useEffect, useState, use } from 'react';
import { publicAPI } from '@/lib/api';

export default function PublicContactPage({ params }: { params: Promise<{ businessId: string }> }) {
    const { businessId } = use(params);
    const [business, setBusiness] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        serviceInterest: '',
        message: ''
    });

    useEffect(() => {
        const load = async () => {
            try {
                const data = await publicAPI.getBusinessProfile(businessId);
                setBusiness(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [businessId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;

        setSubmitting(true);
        try {
            await publicAPI.submitInquiry(businessId, formData);
            setSubmitted(true);
        } catch (err) {
            alert('Failed to send inquiry. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
    );

    if (!business) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
            Business not found.
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-slate-300 py-12 px-6 font-sans">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                {/* Header */}
                <header className="text-center mb-16">
                    {business.logo ? (
                        <img src={business.logo} alt={business.name} className="w-20 h-20 mx-auto mb-6 rounded-2xl object-cover border border-white/10" />
                    ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl mx-auto mb-6 flex items-center justify-center text-3xl font-black text-white shadow-2xl shadow-blue-500/20">
                            {business.name[0]}
                        </div>
                    )}
                    <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Connect with {business.name}</h1>
                    <p className="text-slate-500 font-medium">Have a question? We're here to help.</p>
                </header>

                {!submitted ? (
                    <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8 md:p-12 backdrop-blur-xl shadow-2xl overflow-hidden relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">First Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                                        placeholder="John"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Last Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                                    <input
                                        required
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                                    <input
                                        required
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">What are you interested in?</label>
                                <select
                                    value={formData.serviceInterest}
                                    onChange={(e) => setFormData({ ...formData, serviceInterest: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors appearance-none"
                                >
                                    <option value="" className="bg-[#050505]">Select a service...</option>
                                    {business.services.map((s: any) => (
                                        <option key={s.id} value={s.name} className="bg-[#050505]">{s.name}</option>
                                    ))}
                                    <option value="Other" className="bg-[#050505]">Something else</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">How can we help?</label>
                                <textarea
                                    required
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors h-40 resize-none"
                                    placeholder="Tell us a little more about what you need..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-5 rounded-3xl shadow-2xl shadow-blue-600/20 transition-all uppercase tracking-widest flex items-center justify-center space-x-2 disabled:opacity-50"
                            >
                                <span>{submitting ? 'Sending...' : 'Send Message'}</span>
                                {!submitting && <span className="text-xl">🚀</span>}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-12 text-center backdrop-blur-xl animate-in zoom-in duration-700">
                        <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center text-5xl mx-auto mb-8">📫</div>
                        <h2 className="text-4xl font-black text-white mb-4">Message Sent!</h2>
                        <p className="text-slate-400 mb-10 max-w-sm mx-auto leading-relaxed">
                            Thanks, <span className="text-white font-bold">{formData.firstName}</span>! We've received your inquiry and our team will get back to you shortly. Keep an eye on your inbox.
                        </p>
                        <button
                            onClick={() => setSubmitted(false)}
                            className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white hover:bg-white/10 transition-all tracking-widest uppercase"
                        >
                            Send another message
                        </button>
                    </div>
                )}

                <p className="mt-12 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Typical response time: <span className="text-blue-400">Under 2 hours</span>
                </p>
            </div>
        </div>
    );
}
