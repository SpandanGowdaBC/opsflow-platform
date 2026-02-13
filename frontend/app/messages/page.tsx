'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { messagesAPI } from '@/lib/api';
import { formatDistanceToNow, format } from 'date-fns';
import Link from 'next/link';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function InboxContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const targetId = searchParams.get('id');
    const { user, token, isLoading } = useAuthStore();
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [replyBody, setReplyBody] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [mounted, setMounted] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchConversations = async () => {
        try {
            const data = await messagesAPI.getConversations();
            setConversations(data);

            // Priority 1: ID from URL
            // Priority 2: Existing selectedId
            // Priority 3: First in list
            if (targetId) {
                setSelectedId(targetId);
            } else if (data.length > 0 && !selectedId) {
                setSelectedId(data[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted && !isLoading) {
            if (!token) {
                router.push('/login');
            } else {
                fetchConversations();
            }
        }
    }, [token, router, mounted, isLoading, targetId]);

    useEffect(() => {
        if (selectedId) {
            const fetchMessages = async () => {
                try {
                    const data = await messagesAPI.getMessages(selectedId);
                    setMessages(data);
                } catch (error) {
                    console.error('Failed to fetch messages:', error);
                }
            };
            fetchMessages();
            // Poll for new messages every 10 seconds
            const interval = setInterval(fetchMessages, 10000);
            return () => clearInterval(interval);
        }
    }, [selectedId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedId || !replyBody.trim() || sending) return;

        setSending(true);
        try {
            const newMessage = await messagesAPI.sendReply({
                conversationId: selectedId,
                body: replyBody,
                channel: 'EMAIL' // Default to email for now
            });
            setMessages([...messages, newMessage]);
            setReplyBody('');
            // Update conversation list last message
            setConversations(conversations.map(c =>
                c.id === selectedId
                    ? { ...c, lastMessageAt: new Date().toISOString(), messages: [newMessage], isAutomationPaused: true }
                    : c
            ));
        } catch (error) {
            alert('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
    const [customPrompt, setCustomPrompt] = useState('');

    const handleAIDraft = async () => {
        if (!selectedId || isGeneratingDraft) return;
        setIsGeneratingDraft(true);
        try {
            const { draft } = await messagesAPI.generateAIDraft(selectedId, customPrompt);
            setReplyBody(draft);
            setCustomPrompt('');
        } catch (error) {
            console.error('Failed to generate AI draft:', error);
        } finally {
            setIsGeneratingDraft(false);
        }
    };

    if (!mounted) return null;

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    const filteredConversations = conversations.filter(c => {
        const query = searchQuery.toLowerCase();
        return (
            (c.contactName || '').toLowerCase().includes(query) ||
            (c.contactEmail || '').toLowerCase().includes(query) ||
            (c.contactPhone || '').toLowerCase().includes(query)
        );
    });

    const activeConversation = conversations.find(c => c.id === selectedId);

    return (
        <div className="flex h-screen bg-[#0d1117] text-slate-200 overflow-hidden">
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
                    <SidebarItem icon="💬" label="Inbox" href="/messages" active />
                    <SidebarItem icon="📝" label="Forms" href="/forms" />
                    <SidebarItem icon="📦" label="Inventory" href="/inventory" />
                </nav>
            </aside>

            {/* Conversations List */}
            <aside className="w-80 border-r border-white/5 bg-[#0d1117] flex flex-col">
                <div className="p-6 border-b border-white/5">
                    <h1 className="text-xl font-black text-white mb-4 uppercase tracking-tighter">Unified Inbox</h1>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search contacts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-blue-500/50"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {filteredConversations.length > 0 ? filteredConversations.map((convo) => (
                        <div
                            key={convo.id}
                            onClick={() => setSelectedId(convo.id)}
                            className={`p-4 border-b border-white/5 cursor-pointer transition-all hover:bg-white/[0.02] ${selectedId === convo.id ? 'bg-blue-600/10 border-l-4 border-l-blue-500' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`font-bold text-sm ${selectedId === convo.id ? 'text-blue-400' : 'text-white'}`}>
                                    {convo.contactName || convo.contactEmail || convo.contactPhone}
                                </span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase">
                                    {formatDistanceToNow(new Date(convo.lastMessageAt), { addSuffix: false })}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate font-medium">
                                {convo.messages?.[0]?.body || 'No messages yet'}
                            </p>
                            {convo.isAutomationPaused && (
                                <span className="inline-block mt-2 px-1.5 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase rounded border border-amber-500/20 tracking-widest">
                                    Manual Mode
                                </span>
                            )}
                        </div>
                    )) : (
                        <div className="p-10 text-center text-slate-600 font-bold uppercase text-[10px] tracking-[0.2em]">Zero Activity.</div>
                    )}
                </div>
            </aside>

            {/* Message Thread */}
            <main className="flex-1 flex flex-col bg-[#0d1117]">
                {activeConversation ? (
                    <>
                        {/* Thread Header */}
                        <div className="p-4 border-b border-white/5 bg-[#0a0c10]/50 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-sm font-black text-white border border-white/10 shadow-lg shadow-black/20">
                                    {(activeConversation.contactName?.[0] || activeConversation.contactEmail?.[0] || '?').toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-white uppercase tracking-tight">{activeConversation.contactName || 'Active Contact'}</h2>
                                    <p className="text-[10px] text-slate-500 font-bold tracking-tight">{activeConversation.contactEmail || activeConversation.contactPhone}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-6">
                                <div className="text-right">
                                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-0.5">Flow Mode</p>
                                    <p className={`text-[11px] font-black uppercase tracking-widest ${activeConversation.isAutomationPaused ? 'text-amber-500' : 'text-blue-500'}`}>
                                        {activeConversation.isAutomationPaused ? 'Human' : 'AI Hybrid'}
                                    </p>
                                </div>
                                <button
                                    onClick={async () => {
                                        const newStatus = !activeConversation.isAutomationPaused;
                                        await messagesAPI.toggleAutomation(activeConversation.id, newStatus);
                                        setConversations(conversations.map(c => c.id === activeConversation.id ? { ...c, isAutomationPaused: newStatus } : c));
                                    }}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${activeConversation.isAutomationPaused
                                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20'
                                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                        }`}
                                >
                                    {activeConversation.isAutomationPaused ? 'Enable AI' : 'Set Manual'}
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                            {messages.map((msg, idx) => (
                                <div key={msg.id} className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] relative ${msg.direction === 'OUTBOUND' ? 'items-end' : 'items-start'}`}>
                                        <div className={`rounded-3xl px-6 py-4 shadow-xl ${msg.direction === 'OUTBOUND'
                                            ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-tr-none'
                                            : 'bg-white/[0.03] border border-white/5 text-slate-200 rounded-tl-none'
                                            }`}>
                                            <p className="text-sm leading-relaxed font-medium">{msg.body}</p>
                                        </div>
                                        <div className={`mt-2 text-[9px] font-bold uppercase tracking-widest flex items-center space-x-3 ${msg.direction === 'OUTBOUND' ? 'justify-end text-blue-400' : 'text-slate-500'}`}>
                                            <span>{format(new Date(msg.createdAt), 'h:mm a')}</span>
                                            {msg.direction === 'OUTBOUND' && msg.sent && <span className="flex items-center"><span className="w-1 h-1 bg-green-500 rounded-full mr-1"></span> Delivered</span>}
                                            {msg.direction === 'OUTBOUND' && msg.sentBy && <span>• {msg.sentBy.firstName}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Reply Box */}
                        <div className="p-8 border-t border-white/5 bg-[#0a0c10]/30 backdrop-blur-xl">
                            <form onSubmit={handleSend} className="relative">
                                <div className="absolute -top-12 left-0 right-0 flex items-center px-2 space-x-2">
                                    <input
                                        type="text"
                                        value={customPrompt}
                                        onChange={(e) => setCustomPrompt(e.target.value)}
                                        placeholder="Command AI (e.g. 'be formal', 'offer 10% off', 'keep it short')"
                                        className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-[10px] font-bold text-slate-300 focus:outline-none focus:border-indigo-500/50 transition-all"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAIDraft();
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAIDraft}
                                        disabled={isGeneratingDraft}
                                        className="flex items-center space-x-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50 whitespace-nowrap"
                                    >
                                        <span>{isGeneratingDraft ? 'Magic Thinking...' : '✨ AI Suggest'}</span>
                                    </button>
                                </div>
                                <textarea
                                    value={replyBody}
                                    onChange={(e) => setReplyBody(e.target.value)}
                                    placeholder="Compose your reply..."
                                    className="w-full bg-white/[0.02] border border-white/10 rounded-[32px] p-6 pr-20 text-sm font-medium focus:outline-none focus:border-blue-500/40 focus:bg-white/[0.04] transition-all resize-none h-32 custom-scrollbar shadow-inner shadow-black/40"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend(e);
                                        }
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={sending || !replyBody.trim()}
                                    className="absolute right-6 bottom-6 w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale group"
                                >
                                    {sending ? (
                                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                                    ) : (
                                        <span className="text-xl group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300">→</span>
                                    )}
                                </button>
                            </form>
                            <div className="mt-4 flex items-center justify-between">
                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">
                                    <span className="text-blue-500">PRO TIP:</span> Sending a manual message forces "Manual Mode" automatically.
                                </p>
                                <div className="flex space-x-1">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse delay-150"></div>
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse delay-300"></div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-4">
                        <div className="text-6xl text-white/5">💬</div>
                        <p className="text-sm font-medium">Select a conversation to start messaging</p>
                    </div>
                )}
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
            `}</style>
        </div>
    );
}

export default function InboxPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        }>
            <InboxContent />
        </Suspense>
    );
}

function SidebarItem({ icon, label, href, active = false }: { icon: string; label: string; href: string; active?: boolean }) {
    return (
        <Link
            href={href}
            className={`flex items-center space-x-3 px-3 py-3 rounded-xl transition-all ${active ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
        >
            <span className="text-lg leading-none">{icon}</span>
            <span className="hidden lg:block text-sm font-bold">{label}</span>
        </Link>
    );
}
