import { createContext, useContext, useState, useMemo, useCallback, ReactNode, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginApi, logoutApi } from "@/lib/api";

export interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  middleName: string;
  suffix: string;
  course: string;
  yearLevel: string;
  email: string;
  contactNumber: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  status: string;
  role: "student";
}

export interface AdminUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: "admin";
}

type AuthUser = Student | AdminUser;

interface AuthContextValue {
  user: AuthUser | null;
  student: Student | null;
  admin: AdminUser | null;
  role: "student" | "admin" | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string; role?: "student" | "admin" }>;
  logout: () => Promise<void>;
  setStudent: (s: Student) => void;
  setAdmin: (a: AdminUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_KEY = "@zdspgc_user";
const TOKEN_KEY = "@zdspgc_token";
const ROLE_KEY = "@zdspgc_role";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const storedUser = await AsyncStorage.getItem(USER_KEY);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const res = await loginApi(username, password);
      await AsyncStorage.setItem(TOKEN_KEY, res.token);
      await AsyncStorage.setItem(ROLE_KEY, res.role);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(res.user));
      const user = res.user as unknown as AuthUser;
      setUser(user);
      return { success: true, role: res.role };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(async () => {
    // Invalidate token on server first
    await logoutApi();
    // Then clear local storage
    await AsyncStorage.multiRemove([USER_KEY, TOKEN_KEY, ROLE_KEY]);
    setUser(null);
  }, []);

  const role = user?.role ?? null;

  const setStudent = useCallback((s: Student) => {
    setUser(s);
    AsyncStorage.setItem(USER_KEY, JSON.stringify(s)).catch(() => { });
  }, []);

  const setAdmin = useCallback((a: AdminUser) => {
    setUser(a);
    AsyncStorage.setItem(USER_KEY, JSON.stringify(a)).catch(() => { });
  }, []);

  const value = useMemo(() => ({
    user,
    student: role === "student" ? (user as Student) : null,
    admin: role === "admin" ? (user as AdminUser) : null,
    role,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    setStudent,
    setAdmin,
  }), [user, role, isLoading, login, logout, setStudent, setAdmin]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
