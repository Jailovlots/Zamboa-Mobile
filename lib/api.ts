import AsyncStorage from "@react-native-async-storage/async-storage";

const getBaseUrl = () => {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}`;

  // Use the local IP address for physical devices
  // This might need to be updated if the local IP changes
  return "http://10.0.0.205:5000";
};

export const BASE_URL = getBaseUrl();

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem("@zdspgc_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  token: string;
  role: "student" | "admin";
  user: Record<string, unknown>;
}

export async function loginApi(username: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Invalid credentials" }));
    throw new Error(err.message);
  }
  return res.json();
}

export async function logoutApi(): Promise<void> {
  const token = await getToken();
  if (!token) return;
  await fetch(`${BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => { /* ignore network errors on logout */ });
}

// ─── Admin — Students ─────────────────────────────────────────────────────────

export interface StudentRecord {
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
  sectionId: string | null;
  role: "student";
}

export const adminStudentsApi = {
  list: () => api.get<StudentRecord[]>("/api/admin/students"),
  create: (data: Partial<StudentRecord> & { password?: string }) =>
    api.post<StudentRecord>("/api/admin/students", data),
  update: (id: string, data: Partial<StudentRecord> & { password?: string }) =>
    api.put<StudentRecord>(`/api/admin/students/${id}`, data),
  delete: (id: string) => api.delete<{ message: string }>(`/api/admin/students/${id}`),
};

// ─── Admin — Sections ────────────────────────────────────────────────────────────────

export interface SectionRecord {
  id: string;
  name: string;
  course: string;
  yearLevel: string;
  schoolYear: string;
  description: string;
}

export const adminSectionsApi = {
  list: () => api.get<SectionRecord[]>("/api/admin/sections"),
  create: (data: Partial<SectionRecord>) => api.post<SectionRecord>("/api/admin/sections", data),
  update: (id: string, data: Partial<SectionRecord>) => api.put<SectionRecord>(`/api/admin/sections/${id}`, data),
  delete: (id: string) => api.delete<{ message: string }>(`/api/admin/sections/${id}`),
  assign: (id: string, studentIds: string[]) =>
    api.post<{ message: string }>(`/api/admin/sections/${id}/assign`, { studentIds }),
  removeStudent: (sectionId: string, studentId: string) =>
    api.delete<{ message: string }>(`/api/admin/sections/${sectionId}/students/${studentId}`),
  listStudents: (id: string) => api.get<StudentRecord[]>(`/api/admin/sections/${id}/students`),
};

// ─── Admin — Grades ───────────────────────────────────────────────────────────

export interface GradeRecord {
  id: string;
  studentId: string;
  subjectCode: string;
  subjectName: string;
  instructor: string;
  grade: string;
  units: number;
  semester: string;
  remarks: string;
}

export const adminGradesApi = {
  list: (studentId?: string) =>
    api.get<GradeRecord[]>(studentId ? `/api/admin/grades?studentId=${studentId}` : "/api/admin/grades"),
  create: (data: Partial<GradeRecord>) => api.post<GradeRecord>("/api/admin/grades", data),
  update: (id: string, data: Partial<GradeRecord>) =>
    api.put<GradeRecord>(`/api/admin/grades/${id}`, data),
  delete: (id: string) => api.delete<{ message: string }>(`/api/admin/grades/${id}`),
};

// ─── Admin — Schedule ─────────────────────────────────────────────────────────

export interface ScheduleRecord {
  id: string;
  subjectCode: string;
  subjectName: string;
  day: string;
  timeStart: string;
  timeEnd: string;
  room: string;
  instructor: string;
}

export const adminScheduleApi = {
  list: () => api.get<ScheduleRecord[]>("/api/admin/schedule"),
  create: (data: Partial<ScheduleRecord>) => api.post<ScheduleRecord>("/api/admin/schedule", data),
  update: (id: string, data: Partial<ScheduleRecord>) =>
    api.put<ScheduleRecord>(`/api/admin/schedule/${id}`, data),
  delete: (id: string) => api.delete<{ message: string }>(`/api/admin/schedule/${id}`),
};

// ─── Admin — Announcements ────────────────────────────────────────────────────

export interface AnnouncementRecord {
  id: string;
  title: string;
  description: string;
  date: string;
  isImportant: boolean;
  category: string;
}

export const adminAnnouncementsApi = {
  list: () => api.get<AnnouncementRecord[]>("/api/admin/announcements"),
  create: (data: Partial<AnnouncementRecord>) =>
    api.post<AnnouncementRecord>("/api/admin/announcements", data),
  update: (id: string, data: Partial<AnnouncementRecord>) =>
    api.put<AnnouncementRecord>(`/api/admin/announcements/${id}`, data),
  delete: (id: string) => api.delete<{ message: string }>(`/api/admin/announcements/${id}`),
};

// ─── Student — Announcements ──────────────────────────────────────────────────

export const studentAnnouncementsApi = {
  list: () => api.get<AnnouncementRecord[]>("/api/student/announcements"),
};

// ─── Admin — Stats ────────────────────────────────────────────────────────────

export interface AdminStats {
  totalStudents: number;
  totalAnnouncements: number;
  totalSchedules: number;
  totalGrades: number;
  courses: number;
}

export const adminStatsApi = {
  get: () => api.get<AdminStats>("/api/admin/stats"),
};

// ─── Admin — Account ──────────────────────────────────────────────────────────

export const adminAccountApi = {
  update: (data: { currentPassword: string; newUsername?: string; newPassword?: string }) =>
    api.put<{ message: string; user: Record<string, unknown> }>("/api/admin/account", data),
};

// ─── Student — Grades ─────────────────────────────────────────────────────────

export const studentGradesApi = {
  list: () => api.get<GradeRecord[]>("/api/student/grades"),
};

// ─── Student — Schedule ───────────────────────────────────────────────────────

export const studentScheduleApi = {
  list: () => api.get<ScheduleRecord[]>("/api/student/schedule"),
};

// ─── Student — Stats ──────────────────────────────────────────────────────────

export interface StudentStats {
  totalSubjects: number;
  totalUnits: number;
  gwa: number;
  semesters: string[];
  currentSemester: string;
}

export const studentStatsApi = {
  get: () => api.get<StudentStats>("/api/student/stats"),
};

// ─── Student — Profile ────────────────────────────────────────────────────────

export const studentProfileApi = {
  get: () => api.get<StudentRecord>("/api/student/profile"),
};

// ─── Student — Account ──────────────────────────────────────────────────────────────

export const studentAccountApi = {
  update: (data: { currentPassword: string; newStudentId?: string; newPassword?: string }) =>
    api.put<{ message: string; user: StudentRecord }>("/api/student/account", data),
};
