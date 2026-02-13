// API configuration
let API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
// Remove trailing slash if present to prevent double slashes in paths
API_BASE_URL = API_BASE_URL.replace(/\/$/, '');

// Get auth token from localStorage
const getToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('token');
    }
    return null;
};

// API client with auth
const apiClient = {
    async request(endpoint: string, options: RequestInit = {}) {
        const token = getToken();

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return response.json();
    },

    get(endpoint: string) {
        return this.request(endpoint, { method: 'GET' });
    },

    post(endpoint: string, data: any) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    put(endpoint: string, data: any) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete(endpoint: string) {
        return this.request(endpoint, { method: 'DELETE' });
    },
};

// Auth API
export const authAPI = {
    register: (data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        businessName: string;
        industry?: string;
    }) => apiClient.post('/api/auth/register', data),

    login: (data: { email: string; password: string }) =>
        apiClient.post('/api/auth/login', data),

    getCurrentUser: () => apiClient.get('/api/auth/me'),
};

// Business API
export const businessAPI = {
    getDetails: () => apiClient.get('/api/business'),

    updateProfile: (data: any) => apiClient.put('/api/business/profile', data),

    completeOnboarding: (data: any) =>
        apiClient.post('/api/business/onboarding/complete', data),

    getOnboardingStatus: () => apiClient.get('/api/business/onboarding/status'),

    inviteStaff: (data: { email: string; firstName: string; lastName: string }) =>
        apiClient.post('/api/business/invite-staff', data),

    getBookingLink: () => apiClient.get('/api/business/booking-link'),

    updateStaff: (id: string, data: any) =>
        apiClient.request(`/api/business/staff/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

    toggleStaffStatus: (id: string) =>
        apiClient.request(`/api/business/staff/${id}/toggle-status`, { method: 'PATCH' }),
};

// Services API
export const servicesAPI = {
    getAll: () => apiClient.get('/api/services'),
    create: (data: any) => apiClient.post('/api/services', data),
    update: (id: string, data: any) => apiClient.put(`/api/services/${id}`, data),
    delete: (id: string) => apiClient.delete(`/api/services/${id}`),
};

// Leads API
export const leadsAPI = {
    getAll: () => apiClient.get('/api/leads'),
    getById: (id: string) => apiClient.get(`/api/leads/${id}`),
    create: (data: any) => apiClient.post('/api/leads', data),
    update: (id: string, data: any) => apiClient.put(`/api/leads/${id}`, data),
    updateStatus: (id: string, status: string) => apiClient.request(`/api/leads/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

// Bookings API
export const bookingsAPI = {
    getAll: (params?: any) => apiClient.request('/api/bookings', { method: 'GET', ...params }),
    create: (data: any) => apiClient.post('/api/bookings', data),
    updateStatus: (id: string, status: string) => apiClient.request(`/api/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    assignStaff: (id: string, staffId: string) => apiClient.request(`/api/bookings/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ staffId }) }),
};

// Forms API
export const formsAPI = {
    getAll: () => apiClient.get('/api/forms'),
    getSubmissions: (params?: any) => apiClient.request('/api/forms/submissions', { method: 'GET', ...params }),
    getSubmission: (id: string) => apiClient.get(`/api/forms/submissions/${id}`),
};

// Dashboard API
export const dashboardAPI = {
    getStats: () => apiClient.get('/api/dashboard'),
    seedDemo: () => apiClient.post('/api/dashboard/seed-demo', {}),
    triggerFastActions: () => apiClient.post('/api/dashboard/fast-actions', {}),
};

// Messages API
export const messagesAPI = {
    getConversations: () => apiClient.get('/api/messages/conversations'),
    getMessages: (id: string) => apiClient.get(`/api/messages/conversations/${id}`),
    sendReply: (data: any) => apiClient.post('/api/messages/reply', data),
    toggleAutomation: (id: string, paused: boolean) =>
        apiClient.post(`/api/messages/conversations/${id}/toggle-automation`, { paused }),
    generateAIDraft: (id: string, prompt?: string) =>
        apiClient.post(`/api/messages/conversations/${id}/ai-draft`, { prompt }),
    findOrCreate: (data: { email: string; name?: string; phone?: string }) => apiClient.post('/api/messages/find-or-create', data),
};

// Inventory API
export const inventoryAPI = {
    getAll: () => apiClient.get('/api/inventory'),
    add: (data: any) => apiClient.post('/api/inventory', data),
    updateStock: (id: string, change: number) => apiClient.request(`/api/inventory/${id}`, { method: 'PATCH', body: JSON.stringify({ change }) }),
};

// Public API (No Auth)
export const publicAPI = {
    getBusinessProfile: (businessId: string) => apiClient.request(`/api/public/business/${businessId}`, { method: 'GET' }),
    submitInquiry: (businessId: string, data: any) => apiClient.post(`/api/public/contact/${businessId}`, data),
    bookAppointment: (businessId: string, data: any) => apiClient.post(`/api/public/book/${businessId}`, data),
    getFormSubmission: (id: string) => apiClient.request(`/api/public/form-submission/${id}`, { method: 'GET' }),
    submitFormResponse: (id: string, data: any) => apiClient.post(`/api/public/form-submission/${id}`, { data }),
};

export default apiClient;
