/* eslint-disable react-refresh/only-export-components */
import { createContext, useReducer, useEffect, type ReactNode } from 'react';

export interface AuthUser {
  user_id: string;
  name: string;
  email: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
}

type AuthAction =
  | { type: 'LOGIN'; payload: { user: AuthUser; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'LOADED' };

export interface AuthContextValue {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const API_BASE = '/api/v1/auth';

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('ecostep_token'),
  loading: true,
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':
      return { user: action.payload.user, token: action.payload.token, loading: false };
    case 'LOGOUT':
      return { user: null, token: null, loading: false };
    case 'LOADED':
      return { ...state, loading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const savedToken = localStorage.getItem('ecostep_token');
    if (savedToken) {
      fetch(API_BASE + '/me', {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Invalid session');
          return res.json();
        })
        .then((user) => dispatch({ type: 'LOGIN', payload: { user, token: savedToken } }))
        .catch(() => {
          localStorage.removeItem('ecostep_token');
          dispatch({ type: 'LOGOUT' });
        });
    } else {
      dispatch({ type: 'LOADED' });
    }
  }, []);

  async function handleResponse(res: Response) {
    const text = await res.text();
    if (!text) throw new Error(res.ok ? 'Empty response from server' : 'Server error');
    try {
      return JSON.parse(text);
    } catch {
      const messages: Record<number, string> = {
        502: 'Backend server is not running. Start it with: python main.py',
        504: 'Backend server timed out. Check if it is running properly.',
        404: 'API endpoint not found. Ensure the backend server is running.',
      };
      throw new Error(messages[res.status] || `Request failed (${res.status})`);
    }
  }

  const login = async (email: string, password: string) => {
    const res = await fetch(API_BASE + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse(res);
    if (!res.ok) throw new Error(data.detail || 'Login failed');
    const user: AuthUser = { user_id: data.user_id, name: data.name, email };
    localStorage.setItem('ecostep_token', data.access_token);
    dispatch({ type: 'LOGIN', payload: { user, token: data.access_token } });
  };

  const register = async (email: string, password: string, name: string) => {
    const res = await fetch(API_BASE + '/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await handleResponse(res);
    if (!res.ok) throw new Error(data.detail || 'Registration failed');
    const user: AuthUser = { user_id: data.user_id, name: data.name, email };
    localStorage.setItem('ecostep_token', data.access_token);
    dispatch({ type: 'LOGIN', payload: { user, token: data.access_token } });
  };

  const logout = () => {
    localStorage.removeItem('ecostep_token');
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
