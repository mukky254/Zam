// context/AppContext.js
import { createContext, useContext, useReducer, useEffect } from 'react';
import { useRouter } from 'next/router';

const AppContext = createContext();

const initialState = {
  user: null,
  token: null,
  userRole: null,
  currentLanguage: 'sw',
  darkMode: false,
  currentJobs: [],
  currentEmployees: [],
  userJobs: [],
  favoriteJobs: [],
  isLoading: false,
  message: null,
  messageType: null
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_USER':
      return { 
        ...state, 
        user: action.payload.user,
        token: action.payload.token,
        userRole: action.payload.userRole
      };
    
    case 'CLEAR_USER':
      return { 
        ...state, 
        user: null, 
        token: null, 
        userRole: null 
      };
    
    case 'SET_LANGUAGE':
      return { ...state, currentLanguage: action.payload };
    
    case 'TOGGLE_DARK_MODE':
      return { ...state, darkMode: !state.darkMode };
    
    case 'SET_JOBS':
      return { ...state, currentJobs: action.payload };
    
    case 'SET_EMPLOYEES':
      return { ...state, currentEmployees: action.payload };
    
    case 'SET_USER_JOBS':
      return { ...state, userJobs: action.payload };
    
    case 'SET_FAVORITES':
      return { ...state, favoriteJobs: action.payload };
    
    case 'SET_MESSAGE':
      return { 
        ...state, 
        message: action.payload.message,
        messageType: action.payload.type
      };
    
    case 'CLEAR_MESSAGE':
      return { ...state, message: null, messageType: null };
    
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const router = useRouter();

  // Load initial state from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const userRole = localStorage.getItem('userRole');
    const language = localStorage.getItem('preferredLanguage') || 'sw';
    const darkMode = localStorage.getItem('darkMode') === 'true';
    const favorites = localStorage.getItem('favoriteJobs');

    if (token && user) {
      dispatch({
        type: 'SET_USER',
        payload: {
          user: JSON.parse(user),
          token,
          userRole
        }
      });
    }

    dispatch({ type: 'SET_LANGUAGE', payload: language });
    
    if (darkMode) {
      document.body.classList.add('dark-mode');
    }

    if (favorites) {
      try {
        dispatch({
          type: 'SET_FAVORITES',
          payload: JSON.parse(favorites)
        });
      } catch (error) {
        console.error('Error parsing favorites:', error);
      }
    }
  }, []);

  // Sync dark mode with body class
  useEffect(() => {
    if (state.darkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('darkMode', 'false');
    }
  }, [state.darkMode]);

  const setLoading = (loading) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setUser = (userData) => {
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData.user));
    localStorage.setItem('userRole', userData.userRole);
    
    dispatch({
      type: 'SET_USER',
      payload: userData
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    
    dispatch({ type: 'CLEAR_USER' });
    router.push('/auth');
  };

  const setLanguage = (language) => {
    localStorage.setItem('preferredLanguage', language);
    dispatch({ type: 'SET_LANGUAGE', payload: language });
  };

  const toggleDarkMode = () => {
    dispatch({ type: 'TOGGLE_DARK_MODE' });
  };

  const setJobs = (jobs) => {
    dispatch({ type: 'SET_JOBS', payload: jobs });
  };

  const setEmployees = (employees) => {
    dispatch({ type: 'SET_EMPLOYEES', payload: employees });
  };

  const setUserJobs = (jobs) => {
    dispatch({ type: 'SET_USER_JOBS', payload: jobs });
  };

  const setFavorites = (favorites) => {
    localStorage.setItem('favoriteJobs', JSON.stringify(favorites));
    dispatch({ type: 'SET_FAVORITES', payload: favorites });
  };

  const showMessage = (message, type = 'success') => {
    dispatch({ 
      type: 'SET_MESSAGE', 
      payload: { message, type } 
    });
    
    setTimeout(() => {
      dispatch({ type: 'CLEAR_MESSAGE' });
    }, 5000);
  };

  const value = {
    ...state,
    setLoading,
    setUser,
    logout,
    setLanguage,
    toggleDarkMode,
    setJobs,
    setEmployees,
    setUserJobs,
    setFavorites,
    showMessage
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
