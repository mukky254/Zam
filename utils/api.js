// utils/api.js
const API_BASE_URL = 'https://backita.onrender.com';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } else {
      // Handle non-JSON successful responses
      if (response.ok) {
        return { success: true };
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Auth API
export const authAPI = {
  login: async (phone, password) => {
    return apiRequest('/auth/signin', {
      method: 'POST',
      body: { phone, password }
    });
  },

  register: async (userData) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: userData
    });
  },

  forgotPassword: async (phone) => {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: { phone }
    });
  },

  resetPassword: async (resetData) => {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body: resetData
    });
  }
};

// Jobs API
export const jobsAPI = {
  getAll: async () => {
    return apiRequest('/jobs');
  },

  getByEmployer: async (employerId) => {
    return apiRequest(`/jobs/employer/${employerId}`);
  },

  create: async (jobData) => {
    return apiRequest('/jobs', {
      method: 'POST',
      body: jobData
    });
  },

  update: async (jobId, jobData) => {
    return apiRequest(`/jobs/${jobId}`, {
      method: 'PUT',
      body: jobData
    });
  },

  delete: async (jobId) => {
    return apiRequest(`/jobs/${jobId}`, {
      method: 'DELETE'
    });
  }
};

// Users API
export const usersAPI = {
  getProfile: async () => {
    return apiRequest('/users/profile');
  },

  updateProfile: async (profileData) => {
    return apiRequest('/users/profile', {
      method: 'PUT',
      body: profileData
    });
  },

  deleteProfile: async () => {
    return apiRequest('/users/profile', {
      method: 'DELETE'
    });
  },

  getEmployees: async () => {
    return apiRequest('/employees');
  }
};

// Utility functions
export function formatPhoneToStandard(phone) {
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '254' + cleanPhone.substring(1);
  } else if (!cleanPhone.startsWith('254')) {
    cleanPhone = '254' + cleanPhone;
  }
  return cleanPhone;
}

export function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
