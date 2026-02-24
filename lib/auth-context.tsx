import { createContext, useContext, useState, useMemo, useCallback, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  middleName: string;
  course: string;
  yearLevel: string;
  email: string;
  contactNumber: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  status: string;
}

interface AuthContextValue {
  student: Student | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (studentId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const MOCK_STUDENTS: Record<string, { password: string; student: Student }> = {
  "2024-0001": {
    password: "student123",
    student: {
      id: "1",
      studentId: "2024-0001",
      firstName: "Maria",
      lastName: "Santos",
      middleName: "Cruz",
      course: "BS Information Technology",
      yearLevel: "3rd Year",
      email: "maria.santos@zdspgc.edu",
      contactNumber: "09171234567",
      address: "Pagadian City, Zamboanga del Sur",
      dateOfBirth: "2002-05-15",
      gender: "Female",
      status: "Regular",
    },
  },
  "2024-0002": {
    password: "student123",
    student: {
      id: "2",
      studentId: "2024-0002",
      firstName: "Juan",
      lastName: "Dela Cruz",
      middleName: "Reyes",
      course: "BS Computer Science",
      yearLevel: "2nd Year",
      email: "juan.delacruz@zdspgc.edu",
      contactNumber: "09179876543",
      address: "Aurora, Zamboanga del Sur",
      dateOfBirth: "2003-08-22",
      gender: "Male",
      status: "Regular",
    },
  },
};

const AUTH_STORAGE_KEY = "@zdspgc_auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          setStudent(JSON.parse(stored));
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (studentId: string, password: string) => {
    const record = MOCK_STUDENTS[studentId];
    if (!record) {
      return { success: false, error: "Student ID not found" };
    }
    if (record.password !== password) {
      return { success: false, error: "Incorrect password" };
    }
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(record.student));
    setStudent(record.student);
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    setStudent(null);
  }, []);

  const value = useMemo(() => ({
    student,
    isLoading,
    isAuthenticated: !!student,
    login,
    logout,
  }), [student, isLoading, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
