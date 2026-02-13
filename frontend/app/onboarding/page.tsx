'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { servicesAPI, inventoryAPI, dashboardAPI } from '@/lib/api';
import Link from 'next/link';

export default function OnboardingPage() {
    const router = useRouter();
    const { token, user, business, isLoading } = useAuthStore();
    const [step, setStep] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const [magicText, setMagicText] = useState('');
    const [processing, setProcessing] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !isLoading) {
            if (!token) {
                router.push('/login');
            } else if (business?.onboardingComplete) {
                // If the workspace is already created, skip setup
                router.push('/dashboard');
            }
        }
    }, [token, router, mounted, business, isLoading]);

    const [manualForm, setManualForm] = useState({ industry: '', services: '', inventory: '' });

    const handleMagicSetup = () => {
        setIsListening(true);
        setMagicText('');

        const businessName = business?.name || 'My Business';
        const lowercaseName = businessName.toLowerCase();

        // Vary the script slightly each time "Train AI" is clicked
        const randomSeed = Math.random();

        let simulatedScript = "";
        if (lowercaseName.includes('clean') || lowercaseName.includes('wash')) {
            simulatedScript = randomSeed > 0.5
                ? `I run a professional cleaning service called '${businessName}'. We handle residential deep cleans and office sanitization. I need to track floor wax and microfiber cloths, usually ordered from supplies@cleanpro.com. Send a site checklist to everyone after they book.`
                : `We are '${businessName}'. We specialize in eco-friendly home care and window washing. We need to track biodegradable soap levels and squeegees. Our vendor is green-supplies@eco.com. I want a satisfaction survey sent after every job.`;
        } else if (lowercaseName.includes('spa') || lowercaseName.includes('beauty') || lowercaseName.includes('zen')) {
            simulatedScript = randomSeed > 0.5
                ? `I manage '${businessName}', a boutique wellness spa. We offer massages, facials, and aromatherapy. I need to monitor our essential oil stock and robes. My supplier is essence@spasupply.net. Make sure to send a relaxation preferences form to all clients.`
                : `We are a premium recovery center named '${businessName}'. We provide post-op care and physical therapy. We need to track medical sensors and sterile kits from labs@medicare.org. Send a clinical intake form to every new patient.`;
        } else {
            simulatedScript = `I run '${businessName}'. We provide high-end specialized services. I need to track our primary equipment and consumables. My main vendor is contact@industrialsupply.com. I want an automated intake form for every new booking.`;
        }

        // Simulating AI Listening & Intelligence
        setTimeout(() => {
            setMagicText(simulatedScript);

            setTimeout(() => {
                setIsListening(false);
                setProcessing(true);

                // Now actually update the business profile in background if possible
                // For demo, we just simulate the intelligence
                setTimeout(() => {
                    setProcessing(false);
                    setStep(1); // Move to review step
                }, 2000);
            }, 3000);
        }, 1200);
    };

    const handleConfirmLaunch = async () => {
        setProcessing(true);
        try {
            // This is the MAGIC moment: Trigger the Super Seed for the current business
            await dashboardAPI.seedDemo();
            router.push('/dashboard');
        } catch (error) {
            console.error('Failed to launch platform:', error);
            router.push('/dashboard'); // Go anyway for demo
        }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[120px] rounded-full"></div>

            <div className="max-w-3xl w-full z-10 transition-all duration-700">
                <header className="mb-12 text-center">
                    <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-6 text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">
                        <span>OpsFlow Intelligent Onboarding</span>
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-black tracking-tighter uppercase mb-4 leading-none">
                        Zero to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Scale</span>
                    </h1>
                    <p className="text-slate-400 font-medium max-w-xl mx-auto uppercase text-[10px] tracking-widest">
                        Setting up your business OS shouldn't take hours. With OpsFlow, it takes 5 minutes.
                    </p>
                </header>

                <div className="bg-white/[0.03] border border-white/10 rounded-[48px] p-12 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                    {step === 0 && (
                        <div className="text-center py-10">
                            <h2 className="text-3xl font-black uppercase tracking-tight mb-8">How do you want to start?</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <button
                                    onClick={handleMagicSetup}
                                    disabled={isListening || processing}
                                    className="group relative h-64 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] p-8 text-left transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20 active:scale-95 overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-8">
                                        <div className={`w-16 h-16 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center text-3xl transition-all ${isListening ? 'animate-ping' : 'group-hover:rotate-12'}`}>
                                            {isListening ? '🎙️' : '✨'}
                                        </div>
                                    </div>
                                    <div className="mt-auto">
                                        <div className="text-xs font-black uppercase tracking-widest text-white/60 mb-2">The Special Highlight</div>
                                        <h3 className="text-3xl font-black uppercase tracking-tighter leading-none mb-4">Magic Setup</h3>
                                        <p className="text-sm font-medium text-white/80 leading-relaxed">Turn on your mic and tell us about your business. Our AI will build your entire platform instantly.</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setStep(2)}
                                    className="group h-64 bg-white/5 border border-white/10 rounded-[32px] p-8 text-left transition-all hover:bg-white/10 hover:border-white/20 active:scale-95"
                                >
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-3xl mb-12">🛠️</div>
                                    <div className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Step-by-Step</div>
                                    <h3 className="text-3xl font-black uppercase tracking-tighter leading-none mb-4">Manual</h3>
                                    <p className="text-sm font-medium text-slate-400 leading-relaxed">Configure each module yourself through our intuitive wizard.</p>
                                </button>
                            </div>

                            {isListening && (
                                <div className="mt-12 p-8 border border-blue-500/30 bg-blue-500/5 rounded-3xl animate-pulse">
                                    <p className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-4">Listening for your business vibes...</p>
                                    <p className="text-lg font-medium text-slate-200 italic">"{magicText || '...'}"</p>
                                </div>
                            )}

                            {processing && (
                                <div className="mt-12 flex flex-col items-center">
                                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                                    <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400 animate-pulse">AI is architecting your business...</p>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 1 && (
                        <div>
                            <div className="flex justify-between items-center mb-10">
                                <h2 className="text-3xl font-black uppercase tracking-tight">AI Generated Blueprint</h2>
                                <span className="bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-green-500/20">Ready to Deploy</span>
                            </div>

                            <div className="space-y-6">
                                <BlueprintItem icon="🏢" title="Business" content={`${business?.name || 'Your Business'} (${business?.industry || 'Service Sector'})`} />
                                <BlueprintItem icon="🛠️" title="Primary Infrastructure" content="Core services and pricing models identified" />
                                <BlueprintItem icon="🧪" title="Inventory Matrix" content="Resources and vendor pipelines mapped" />
                                <BlueprintItem icon="📝" title="Automated Workflows" content="Intelligence-driven intake and follow-up sequences" />
                                <BlueprintItem icon="📅" title="Operational Hours" content="Standard business availability applied" />
                            </div>

                            <div className="mt-12 grid grid-cols-2 gap-4">
                                <button onClick={() => { setStep(0); handleMagicSetup(); }} className="py-4 bg-white/5 text-slate-400 font-bold uppercase tracking-widest text-xs rounded-2xl hover:bg-white/10">Re-Train AI</button>
                                <button
                                    onClick={handleConfirmLaunch}
                                    disabled={processing}
                                    className="py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:scale-105 transition-transform shadow-xl shadow-white/10 relative overflow-hidden"
                                >
                                    {processing ? (
                                        <div className="flex items-center justify-center space-x-2">
                                            <div className="w-3 h-3 bg-black rounded-full animate-bounce"></div>
                                            <div className="w-3 h-3 bg-black rounded-full animate-bounce [animation-delay:-.3s]"></div>
                                            <div className="w-3 h-3 bg-black rounded-full animate-bounce [animation-delay:-.5s]"></div>
                                        </div>
                                    ) : 'Confirm & Launch Platform →'}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="py-6">
                            <h2 className="text-3xl font-black uppercase tracking-tight mb-8 text-center text-blue-400">Manual Configuration</h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Target Industry</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Healthcare, Logistics, Beauty"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                        value={manualForm.industry}
                                        onChange={e => setManualForm({ ...manualForm, industry: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Core Services (Comma separated)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Assessment, Monitoring, Consultation"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                        value={manualForm.services}
                                        onChange={e => setManualForm({ ...manualForm, services: e.target.value })}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-500 text-center italic">Advanced logistics and automation will be configured sequentially.</p>
                            </div>
                            <div className="mt-10 flex flex-col space-y-4">
                                <button onClick={handleConfirmLaunch} className="py-5 bg-blue-600 text-white font-black uppercase tracking-widest text-xs rounded-3xl hover:bg-blue-500 shadow-lg shadow-blue-500/20">Initialize Business Engine</button>
                                <button onClick={() => setStep(0)} className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Cancel & Back to Selection</button>
                            </div>
                        </div>
                    )}
                </div>

                <footer className="mt-12 flex justify-center space-x-12">
                    <StatusDot label="Infrastructure" active />
                    <StatusDot label="Comm Gateway" active />
                    <StatusDot label="AI Core" active />
                </footer>
            </div>
        </div>
    );
}

function BlueprintItem({ icon, title, content }: { icon: string; title: string; content: string }) {
    return (
        <div className="flex items-start space-x-4 p-4 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-xl">{icon}</div>
            <div className="flex-1">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{title}</div>
                <div className="text-sm font-bold text-slate-200">{content}</div>
            </div>
            <div className="text-blue-500 text-xs self-center">✓</div>
        </div>
    );
}

function StatusDot({ label, active }: { label: string; active: boolean }) {
    return (
        <div className="flex items-center space-x-2">
            <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-700'}`}></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
        </div>
    );
}
