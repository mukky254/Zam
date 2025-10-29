// pages/api/auth.js
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const API_BASE_URL = 'https://backita.onrender.com';

    if (req.method === 'POST') {
      const { action } = req.query;
      
      // Handle different authentication actions
      switch (action) {
        case 'login':
          return await handleLogin(req, res, API_BASE_URL);
        
        case 'register':
          return await handleRegister(req, res, API_BASE_URL);
        
        case 'forgot-password':
          return await handleForgotPassword(req, res, API_BASE_URL);
        
        case 'reset-password':
          return await handleResetPassword(req, res, API_BASE_URL);
        
        default:
          return await handleDefaultAuth(req, res, API_BASE_URL);
      }
    } else {
      res.status(405).json({ 
        success: false, 
        error: 'Method not allowed' 
      });
    }
  } catch (error) {
    console.error('Auth API error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}

// Handle login
async function handleLogin(req, res, API_BASE_URL) {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        error: 'Phone and password are required'
      });
    }

    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, password })
    });

    const data = await response.json();

    if (response.ok) {
      res.status(200).json({
        success: true,
        ...data
      });
    } else {
      res.status(response.status).json({
        success: false,
        ...data
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
}

// Handle registration
async function handleRegister(req, res, API_BASE_URL) {
  try {
    const { name, phone, password, role, location } = req.body;

    if (!name || !phone || !password || !role || !location) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, phone, password, role, location })
    });

    const data = await response.json();

    if (response.ok) {
      res.status(200).json({
        success: true,
        ...data
      });
    } else {
      res.status(response.status).json({
        success: false,
        ...data
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
}

// Handle forgot password
async function handleForgotPassword(req, res, API_BASE_URL) {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone })
    });

    const data = await response.json();

    if (response.ok) {
      res.status(200).json({
        success: true,
        ...data
      });
    } else {
      res.status(response.status).json({
        success: false,
        ...data
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send reset code'
    });
  }
}

// Handle reset password
async function handleResetPassword(req, res, API_BASE_URL) {
  try {
    const { code, newPassword } = req.body;

    if (!code || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Code and new password are required'
      });
    }

    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, newPassword })
    });

    const data = await response.json();

    if (response.ok) {
      res.status(200).json({
        success: true,
        ...data
      });
    } else {
      res.status(response.status).json({
        success: false,
        ...data
      });
    }
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password'
    });
  }
}

// Handle default auth requests
async function handleDefaultAuth(req, res, API_BASE_URL) {
  try {
    const response = await fetch(`${API_BASE_URL}${req.url}`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { Authorization: req.headers.authorization })
      },
      ...(req.body && { body: JSON.stringify(req.body) })
    });

    const data = await response.json();

    res.status(response.status).json({
      success: response.ok,
      ...data
    });
  } catch (error) {
    console.error('Auth proxy error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication service unavailable'
    });
  }
}
