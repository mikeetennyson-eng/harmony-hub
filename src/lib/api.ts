import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

export interface Song {
  _id: string;
  title: string;
  artist: string;
  description?: string;
  audioFile?: string;
  previewUrl?: string;
  tags: string[];
  price: number;
  duration: number; // seconds
  isSold: boolean;
  soldTo?: string[];
}

export interface CustomRequest {
  _id: string;
  user: string;
  occasion: string;
  names: string;
  brandName?: string;
  tone: string;
  language: string;
  description: string;
  budget: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  completedSong?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Purchase {
  _id: string;
  user: string;
  songs: Song[];
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId: string;
  createdAt: string;
  updatedAt: string;
}

// Auth API
export const authAPI = {
  register: async (data: { email: string; password: string; name: string }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Songs API
export const songsAPI = {
  getSongs: async (params?: { search?: string; tags?: string; page?: number; limit?: number }) => {
    const response = await api.get('/songs', { params });
    return response.data;
  },

  getSong: async (id: string) => {
    const response = await api.get(`/songs/${id}`);
    return response.data;
  },

  getTags: async () => {
    const response = await api.get('/songs/tags/all');
    return response.data;
  },

  getPurchasedSongs: async () => {
    const response = await api.get('/songs/user/purchased');
    return response.data;
  },

  checkPurchaseStatus: async (songId: string) => {
    const response = await api.get(`/songs/${songId}/purchased`);
    return response.data;
  },

  downloadSong: async (songId: string) => {
    const response = await api.get(`/songs/${songId}/download`);
    return response.data; // { url }
  },

  // Fetch audio stream as blob with authentication
  getAudioStream: async (songId: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/songs/stream/${songId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.status}`);
    }
    
    return await response.blob();
  },

  // Song CRUD for admin
  createSong: async (data: FormData) => {
    const response = await api.post('/admin/songs', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  updateSong: async (id: string, data: FormData) => {
    const response = await api.put(`/admin/songs/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  deleteSong: async (id: string) => {
    const response = await api.delete(`/admin/songs/${id}`);
    return response.data;
  },
};

// Purchases API
export const purchasesAPI = {
  createPurchase: async (data: { songIds: string[]; paymentMethod: string }) => {
    const response = await api.post('/purchases', data);
    return response.data;
  },

  getPurchaseHistory: async () => {
    const response = await api.get('/purchases/history');
    return response.data;
  },

  getPurchase: async (id: string) => {
    const response = await api.get(`/purchases/${id}`);
    return response.data;
  },
};

// Custom Requests API
export const customRequestsAPI = {
  createRequest: async (data: {
    occasion: string;
    names: string;
    brandName?: string;
    tone: string;
    language: string;
    description: string;
    budget: number;
  }) => {
    const response = await api.post('/custom-requests', data);
    return response.data;
  },

  getMyRequests: async () => {
    const response = await api.get('/custom-requests/my-requests');
    return response.data;
  },

  getRequest: async (id: string) => {
    const response = await api.get(`/custom-requests/${id}`);
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  getSongs: async () => {
    const response = await api.get('/admin/songs');
    return response.data;
  },

  createSong: async (data: Partial<Song>) => {
    const response = await api.post('/admin/songs', data);
    return response.data;
  },

  updateSong: async (id: string, data: Partial<Song>) => {
    const response = await api.put(`/admin/songs/${id}`, data);
    return response.data;
  },

  deleteSong: async (id: string) => {
    const response = await api.delete(`/admin/songs/${id}`);
    return response.data;
  },

  getCustomRequests: async () => {
    const response = await api.get('/admin/custom-requests');
    return response.data;
  },

  updateRequestStatus: async (id: string, data: { status: string; notes?: string; assignedTo?: string }) => {
    const response = await api.put(`/admin/custom-requests/${id}/status`, data);
    return response.data;
  },

  uploadSongForRequest: async (requestId: string, data: FormData) => {
    const response = await api.post(`/custom-requests/${requestId}/upload`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  getPurchases: async () => {
    const response = await api.get('/admin/purchases');
    return response.data;
  },
};

// Payments API
export const paymentsAPI = {
  createOrder: async (songIds: string[]) => {
    const response = await api.post('/payments/create-order', { songIds });
    return response.data;
  },

  verifyPayment: async (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    purchaseId: string;
  }) => {
    const response = await api.post('/payments/verify-payment', data);
    return response.data;
  },

  getPaymentStatus: async (orderId: string) => {
    const response = await api.get(`/payments/status/${orderId}`);
    return response.data;
  },
};

export default api;