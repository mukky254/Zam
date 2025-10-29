// utils/api.js
const API_BASE_URL = 'https://backita.onnder.com';

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
    
    // Handle response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } else {
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

// Rest of your API functions remain the same...
export const authAPI = {
  login: async (phone, password) => {
    return apiRequest('/auth/signin', {
      method: 'POST',
      body: { phone, password }
    });
  },
  // ... other auth functions
};

export const jobsAPI = {
  getAll: async () => {
    return apiRequest('/jobs');
  },
  // ... other job functions
};

export const usersAPI = {
  getProfile: async () => {
    return apiRequest('/users/profile');
  },
  // ... other user functions
};
