'use client';

import { useEffect, useState, use } from 'react';
import { publicAPI } from '@/lib/api';
import { format, addDays, startOfDay, addMinutes } from 'date-fns';

export default function PublicBookingPage({ params }: { params: Promise<{ businessId: string }> }) {
    const { businessId } = use(params);
    const [business, setBusiness] = useState<any>(null);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Selection state
    const [selectedService, setSelectedService] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        notes: ''
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

    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedService || !selectedTime || submitting) return;

        setSubmitting(true);
        try {
            const [hours, minutes] = selectedTime.split(':');
            const bookingDate = new Date(selectedDate);
            bookingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            await publicAPI.bookAppointment(businessId, {
                serviceId: selectedService.id,
                customerName: formData.name,
                customerEmail: formData.email,
                customerPhone: formData.phone,
                startTime: bookingDate.toISOString(),
                notes: formData.notes
            });
            setStep(4); // Success step
        } catch (err) {
            alert('Failed to book. Please try again.');
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
                    <h1 className="text-4xl font-black text-white mb-2 tracking-tight">{business.name}</h1>
                    <p className="text-slate-500 font-medium">Secure your appointment in seconds</p>
                </header>

                {/* Progress Steps */}
                <div className="flex justify-center mb-12 space-x-4">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className={`w-12 h-1.5 rounded-full transition-all duration-500 ${step >= s ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-white/5'}`}></div>
                    ))}
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8 md:p-12 backdrop-blur-xl shadow-2xl overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <h2 className="text-2xl font-bold text-white mb-8 flex items-center">
                                <span className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mr-3 text-sm">01</span>
                                Select a Service
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {business.services.map((service: any) => (
                                    <button
                                        key={service.id}
                                        onClick={() => { setSelectedService(service); setStep(2); }}
                                        className="text-left p-6 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 hover:border-white/10 transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors uppercase tracking-tight">{service.name}</h3>
                                            <span className="text-blue-400 font-black">${service.price}</span>
                                        </div>
                                        <p className="text-sm text-slate-500 mb-6 line-clamp-2 leading-relaxed">{service.description}</p>
                                        <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <span className="mr-2">⏱️</span> {service.duration} Minutes
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-700">
                            <button onClick={() => setStep(1)} className="text-sm font-bold text-slate-500 mb-8 hover:text-white transition-colors">← Change Service</button>
                            <h2 className="text-2xl font-bold text-white mb-8 flex items-center">
                                <span className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mr-3 text-sm">02</span>
                                Choose Date & Time
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div>
                                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Available Days</p>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[...Array(12)].map((_, i) => {
                                            const d = addDays(new Date(), i);
                                            const isSelected = format(d, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => setSelectedDate(d)}
                                                    className={`p-3 rounded-2xl flex flex-col items-center transition-all ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                                                >
                                                    <span className="text-[10px] font-bold uppercase mb-1">{format(d, 'EEE')}</span>
                                                    <span className="text-lg font-black">{format(d, 'd')}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Available Times</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['09:00', '10:00', '11:30', '13:00', '14:30', '16:00', '17:30'].map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => { setSelectedTime(t); setStep(3); }}
                                                className={`p-3 rounded-xl font-bold text-xs transition-all ${selectedTime === t ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-700">
                            <button onClick={() => setStep(2)} className="text-sm font-bold text-slate-500 mb-8 hover:text-white transition-colors">← Back to Time</button>
                            <h2 className="text-2xl font-bold text-white mb-8 flex items-center">
                                <span className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mr-3 text-sm">03</span>
                                Confirm Details
                            </h2>

                            <form onSubmit={handleBooking} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                                            placeholder="Enter your name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                                        <input
                                            required
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                                            placeholder="name@example.com"
                                        />
                                    </div>
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
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Special Notes (Optional)</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors h-32 resize-none"
                                        placeholder="Anything we should know?"
                                    />
                                </div>

                                <div className="pt-6">
                                    <div className="p-6 bg-blue-600/10 border border-blue-600/20 rounded-3xl mb-8 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Appointment Summary</p>
                                            <p className="text-white font-bold">{selectedService?.name} • {format(selectedDate, 'MMM d')} at {selectedTime}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-white">${selectedService?.price}</p>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-600/20 transition-all uppercase tracking-widest disabled:opacity-50"
                                    >
                                        {submitting ? 'Confirming...' : 'Finalize Booking →'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="text-center py-12 animate-in zoom-in duration-700">
                            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 animate-bounce">✨</div>
                            <h2 className="text-4xl font-black text-white mb-4">You're all set!</h2>
                            <p className="text-slate-400 mb-12 max-w-sm mx-auto leading-relaxed">
                                We've sent a confirmation email to <span className="text-white font-bold">{formData.email}</span> with your appointment details and intake forms.
                            </p>
                            <button
                                onClick={() => setStep(1)}
                                className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white hover:bg-white/10 transition-all tracking-widest uppercase"
                            >
                                Done
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <footer className="mt-12 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Powered by <span className="text-blue-500">OpsFlow Observatory</span> • Enterprise Grade Security
                </footer>
            </div>
        </div>
    );
}
