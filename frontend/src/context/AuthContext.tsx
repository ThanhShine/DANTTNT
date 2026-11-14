import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../types';
import { authService } from '../services';
import toast from 'react-hot-toast';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { email: string; password: string; full_name: string; phone?: string }) => Promise<boolean>;
  logout: () => void;
  updateUser: (user: User) => void;
}

type AuthAction =
  | { type: 'SET_AUTH'; payload: { user: User; accessToken: string; refreshToken: string } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User };

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_AUTH':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
      };
    case 'LOGOUT':
      return initialState;
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Khôi phục auth state từ localStorage khi khởi động
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        dispatch({ type: 'SET_AUTH', payload: { user, accessToken: token, refreshToken: refreshToken || '' } });
        // Đồng bộ thông tin và role mới nhất từ database
        authService.getProfile().then((res) => {
          if (res.data?.data) {
            const freshUser = res.data.data as User;
            localStorage.setItem('user', JSON.stringify(freshUser));
            dispatch({ type: 'UPDATE_USER', payload: freshUser });
          }
        }).catch(() => {});
      } catch {
        localStorage.clear();
      }
    }
    // Tạo sessionId cho guest
    if (!localStorage.getItem('sessionId')) {
      localStorage.setItem('sessionId', crypto.randomUUID());
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await authService.login(email, password);
      const { accessToken, refreshToken, user } = res.data.data!;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      dispatch({ type: 'SET_AUTH', payload: { user, accessToken, refreshToken } });
      toast.success(`Chào mừng, ${user.full_name}!`);
      return true;
    } catch {
      return false;
    }
  };

  const register = async (data: { email: string; password: string; full_name: string; phone?: string }): Promise<boolean> => {
    try {
      await authService.register(data);
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    authService.logout().catch(() => {});
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
    toast.success('Đã đăng xuất');
  };

  const updateUser = (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
    dispatch({ type: 'UPDATE_USER', payload: user });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
