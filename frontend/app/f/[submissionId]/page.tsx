'use client';

import { useEffect, useState, use } from 'react';
import { publicAPI } from '@/lib/api';

export default function PublicFormPage({ params }: { params: Promise<{ submissionId: string }> }) {
    const { submissionId } = use(params);
    const [submission, setSubmission] = useState<any>(null);
    const [responses, setResponses] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await publicAPI.getFormSubmission(submissionId);
                setSubmission(data);
                // Initialize responses
                if (data.form.fields) {
                    const fields = typeof data.form.fields === 'string' ? JSON.parse(data.form.fields) : data.form.fields;
                    const initial: Record<string, any> = {};
                    fields.forEach((f: any) => initial[f.label] = f.defaultValue || '');
                    setResponses(initial);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [submissionId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;

        setSubmitting(true);
        try {
            await publicAPI.submitFormResponse(submissionId, responses);
            setCompleted(true);
        } catch (err) {
            alert('Failed to submit form. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
    );

    if (!submission) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
            Form not found or link expired.
        </div>
    );

    const fields = typeof submission.form.fields === 'string' ? JSON.parse(submission.form.fields) : (submission.form.fields || []);

    return (
        <div className="min-h-screen bg-[#050505] text-slate-300 py-12 px-6 font-sans">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full"></div>
            </div>

            <div className="max-w-2xl mx-auto relative z-10">
                <header className="text-center mb-12">
                    <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl mx-auto mb-6 flex items-center justify-center text-2xl font-bold">
                        📝
                    </div>
                    <h1 className="text-3xl font-black text-white mb-2">{submission.form.name}</h1>
                    <p className="text-slate-500">{submission.form.description || 'Please complete the details below.'}</p>
                </header>

                {!completed ? (
                    <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 md:p-10 backdrop-blur-xl">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center space-x-3 mb-8">
                                <span className="text-xl">👋</span>
                                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                                    Filling as: {submission.customerName}
                                </p>
                            </div>

                            {fields.map((field: any, idx: number) => (
                                <div key={idx} className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                        {field.label} {field.required && <span className="text-red-500">*</span>}
                                    </label>
                                    {field.type === 'textarea' ? (
                                        <textarea
                                            required={field.required}
                                            value={responses[field.label] || ''}
                                            onChange={(e) => setResponses({ ...responses, [field.label]: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors h-32 resize-none"
                                            placeholder={field.placeholder || 'Type here...'}
                                        />
                                    ) : (
                                        <input
                                            required={field.required}
                                            type={field.type || 'text'}
                                            value={responses[field.label] || ''}
                                            onChange={(e) => setResponses({ ...responses, [field.label]: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                                            placeholder={field.placeholder || 'Enter value...'}
                                        />
                                    )}
                                </div>
                            ))}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-600/20 transition-all uppercase tracking-widest disabled:opacity-50 mt-10"
                            >
                                {submitting ? 'Submitting...' : 'Submit Documentation →'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-12 text-center backdrop-blur-xl animate-in zoom-in duration-700">
                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-4xl mx-auto mb-8">✅</div>
                        <h2 className="text-3xl font-black text-white mb-4">Submission Received</h2>
                        <p className="text-slate-400 mb-0 leading-relaxed">
                            Thank you for completing the documentation. Our team has been notified and your profile has been updated.
                        </p>
                    </div>
                )}

                <footer className="mt-12 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Secure data capture powered by <span className="text-blue-500">OpsFlow</span>
                </footer>
            </div>
        </div>
    );
}
