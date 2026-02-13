import { Suspense } from 'react';
import MessagesClient from './MessagesClient';

export const dynamic = 'force-dynamic';

export default function InboxPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        }>
            <MessagesClient />
        </Suspense>
    );
}
