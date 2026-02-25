import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "node:http";
import { randomUUID } from "crypto";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Student {
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
  password: string;
  role: "student";
}

interface AdminUser {
  id: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "admin";
}

interface Grade {
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

interface ScheduleItem {
  id: string;
  subjectCode: string;
  subjectName: string;
  day: string;
  timeStart: string;
  timeEnd: string;
  room: string;
  instructor: string;
}

interface Announcement {
  id: string;
  title: string;
  description: string;
  date: string;
  isImportant: boolean;
  category: string;
}

// ─── In-Memory Store ──────────────────────────────────────────────────────────

const adminUsers: AdminUser[] = [
  {
    id: "admin-1",
    username: "admin",
    password: "admin123",
    firstName: "System",
    lastName: "Administrator",
    role: "admin",
  },
];

const students: Student[] = [
  {
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
    password: "student123",
    role: "student",
  },
  {
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
    password: "student123",
    role: "student",
  },
  {
    id: "3",
    studentId: "2024-0003",
    firstName: "Ana",
    lastName: "Reyes",
    middleName: "Lim",
    course: "BS Education",
    yearLevel: "1st Year",
    email: "ana.reyes@zdspgc.edu",
    contactNumber: "09185551234",
    address: "Margosatubig, Zamboanga del Sur",
    dateOfBirth: "2004-03-10",
    gender: "Female",
    status: "Regular",
    password: "student123",
    role: "student",
  },
  {
    id: "4",
    studentId: "2024-0004",
    firstName: "Carlos",
    lastName: "Mendoza",
    middleName: "Bautista",
    course: "BS Business Administration",
    yearLevel: "4th Year",
    email: "carlos.mendoza@zdspgc.edu",
    contactNumber: "09209876543",
    address: "Dumingag, Zamboanga del Sur",
    dateOfBirth: "2001-11-25",
    gender: "Male",
    status: "Irregular",
    password: "student123",
    role: "student",
  },
];

const grades: Grade[] = [
  { id: "g1", studentId: "1", subjectCode: "IT 301", subjectName: "Web Development", instructor: "Prof. Garcia", grade: "1.25", units: 3, semester: "1st Semester 2024-2025", remarks: "Passed" },
  { id: "g2", studentId: "1", subjectCode: "IT 302", subjectName: "Database Management Systems", instructor: "Prof. Mendoza", grade: "1.50", units: 3, semester: "1st Semester 2024-2025", remarks: "Passed" },
  { id: "g3", studentId: "1", subjectCode: "IT 303", subjectName: "Software Engineering", instructor: "Prof. Reyes", grade: "1.75", units: 3, semester: "1st Semester 2024-2025", remarks: "Passed" },
  { id: "g4", studentId: "2", subjectCode: "CS 201", subjectName: "Data Structures", instructor: "Prof. Villanueva", grade: "1.50", units: 3, semester: "1st Semester 2024-2025", remarks: "Passed" },
  { id: "g5", studentId: "2", subjectCode: "CS 202", subjectName: "Algorithms", instructor: "Prof. Garcia", grade: "2.00", units: 3, semester: "1st Semester 2024-2025", remarks: "Passed" },
];

const scheduleItems: ScheduleItem[] = [
  { id: "s1", subjectCode: "IT 301", subjectName: "Web Development", day: "Monday", timeStart: "7:30 AM", timeEnd: "9:00 AM", room: "CL-201", instructor: "Prof. Garcia" },
  { id: "s2", subjectCode: "IT 302", subjectName: "Database Management", day: "Monday", timeStart: "9:00 AM", timeEnd: "10:30 AM", room: "CL-205", instructor: "Prof. Mendoza" },
  { id: "s3", subjectCode: "IT 303", subjectName: "Software Engineering", day: "Tuesday", timeStart: "7:30 AM", timeEnd: "9:00 AM", room: "CL-302", instructor: "Prof. Reyes" },
  { id: "s4", subjectCode: "CS 201", subjectName: "Data Structures", day: "Wednesday", timeStart: "10:30 AM", timeEnd: "12:00 PM", room: "CL-105", instructor: "Prof. Villanueva" },
  { id: "s5", subjectCode: "GE 105", subjectName: "Purposive Communication", day: "Friday", timeStart: "9:00 AM", timeEnd: "10:30 AM", room: "GV-103", instructor: "Prof. Aquino" },
];

const announcements: Announcement[] = [
  { id: "a1", title: "Enrollment for 2nd Semester Now Open", description: "Students are advised to complete their enrollment for the 2nd Semester AY 2024-2025. Please visit the Registrar's Office or enroll online through the student portal. Deadline is on January 15, 2025.", date: "2025-01-02", isImportant: true, category: "Academic" },
  { id: "a2", title: "Foundation Day Celebration", description: "ZDSPGC will celebrate its 45th Foundation Day on February 14, 2025. Various activities including inter-department competitions, cultural shows, and exhibits will be held.", date: "2025-01-28", isImportant: false, category: "Event" },
  { id: "a3", title: "Midterm Examination Schedule", description: "Midterm examinations for all courses will be conducted from March 3-7, 2025. Students must settle all financial obligations before taking the exam.", date: "2025-02-10", isImportant: true, category: "Academic" },
  { id: "a4", title: "Scholarship Application Open", description: "Academic scholarship applications for the 2nd Semester are now being accepted. Qualifications include maintaining a GWA of 1.75 or higher.", date: "2025-02-15", isImportant: true, category: "Scholarship" },
  { id: "a5", title: "IT Department Seminar", description: "The IT Department will host a seminar on Emerging Technologies in AI and Cloud Computing on February 28, 2025.", date: "2025-02-18", isImportant: false, category: "Event" },
  { id: "a6", title: "Library Hours Extended", description: "Starting February 2025, the school library will extend its operating hours from 7:00 AM to 8:00 PM on weekdays.", date: "2025-02-01", isImportant: false, category: "General" },
];

// Active tokens store: token -> { userId, role }
const activeTokens = new Map<string, { userId: string; role: "student" | "admin" }>();

// ─── Auth Middleware ───────────────────────────────────────────────────────────

function requireAdminToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  const session = activeTokens.get(token);
  if (!session || session.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  next();
}

// ─── Route Registration ────────────────────────────────────────────────────────

export async function registerRoutes(app: Express): Promise<Server> {

  // POST /api/auth/login — unified login for students and admins
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    // Check admin users
    const admin = adminUsers.find(
      (a) => a.username === username && a.password === password
    );
    if (admin) {
      const token = randomUUID();
      activeTokens.set(token, { userId: admin.id, role: "admin" });
      const { password: _pw, ...adminData } = admin;
      return res.json({ token, role: "admin", user: adminData });
    }

    // Check students (by studentId)
    const student = students.find(
      (s) => s.studentId === username && s.password === password
    );
    if (student) {
      const token = randomUUID();
      activeTokens.set(token, { userId: student.id, role: "student" });
      const { password: _pw, ...studentData } = student;
      return res.json({ token, role: "student", user: studentData });
    }

    return res.status(401).json({ message: "Invalid credentials" });
  });

  // POST /api/auth/logout
  app.post("/api/auth/logout", (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      activeTokens.delete(authHeader.split(" ")[1]);
    }
    res.json({ message: "Logged out" });
  });

  // ── Admin Stats ───────────────────────────────────────────────────────────

  // GET /api/admin/stats
  app.get("/api/admin/stats", requireAdminToken, (_req, res) => {
    res.json({
      totalStudents: students.length,
      totalAnnouncements: announcements.length,
      totalSchedules: scheduleItems.length,
      totalGrades: grades.length,
      courses: [...new Set(students.map((s) => s.course))].length,
    });
  });

  // ── Students ──────────────────────────────────────────────────────────────

  // GET /api/admin/students
  app.get("/api/admin/students", requireAdminToken, (_req, res) => {
    const sanitized = students.map(({ password: _pw, ...s }) => s);
    res.json(sanitized);
  });

  // POST /api/admin/students
  app.post("/api/admin/students", requireAdminToken, (req, res) => {
    const body = req.body;
    if (!body.studentId || !body.firstName || !body.lastName || !body.course) {
      return res.status(400).json({ message: "studentId, firstName, lastName, course are required" });
    }
    if (students.find((s) => s.studentId === body.studentId)) {
      return res.status(409).json({ message: "Student ID already exists" });
    }
    const student: Student = {
      id: randomUUID(),
      studentId: body.studentId,
      firstName: body.firstName,
      lastName: body.lastName,
      middleName: body.middleName || "",
      course: body.course,
      yearLevel: body.yearLevel || "1st Year",
      email: body.email || "",
      contactNumber: body.contactNumber || "",
      address: body.address || "",
      dateOfBirth: body.dateOfBirth || "",
      gender: body.gender || "",
      status: body.status || "Regular",
      password: body.password || "student123",
      role: "student",
    };
    students.push(student);
    const { password: _pw, ...studentData } = student;
    res.status(201).json(studentData);
  });

  // PUT /api/admin/students/:id
  app.put("/api/admin/students/:id", requireAdminToken, (req, res) => {
    const idx = students.findIndex((s) => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Student not found" });
    const body = req.body;
    students[idx] = {
      ...students[idx],
      firstName: body.firstName ?? students[idx].firstName,
      lastName: body.lastName ?? students[idx].lastName,
      middleName: body.middleName ?? students[idx].middleName,
      course: body.course ?? students[idx].course,
      yearLevel: body.yearLevel ?? students[idx].yearLevel,
      email: body.email ?? students[idx].email,
      contactNumber: body.contactNumber ?? students[idx].contactNumber,
      address: body.address ?? students[idx].address,
      dateOfBirth: body.dateOfBirth ?? students[idx].dateOfBirth,
      gender: body.gender ?? students[idx].gender,
      status: body.status ?? students[idx].status,
    };
    const { password: _pw, ...studentData } = students[idx];
    res.json(studentData);
  });

  // DELETE /api/admin/students/:id
  app.delete("/api/admin/students/:id", requireAdminToken, (req, res) => {
    const idx = students.findIndex((s) => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Student not found" });
    students.splice(idx, 1);
    res.json({ message: "Student deleted" });
  });

  // ── Grades ────────────────────────────────────────────────────────────────

  // GET /api/admin/grades?studentId=xxx
  app.get("/api/admin/grades", requireAdminToken, (req, res) => {
    const { studentId } = req.query;
    if (studentId) {
      return res.json(grades.filter((g) => g.studentId === studentId));
    }
    res.json(grades);
  });

  // POST /api/admin/grades
  app.post("/api/admin/grades", requireAdminToken, (req, res) => {
    const body = req.body;
    if (!body.studentId || !body.subjectCode || !body.grade) {
      return res.status(400).json({ message: "studentId, subjectCode, grade are required" });
    }
    const grade: Grade = {
      id: randomUUID(),
      studentId: body.studentId,
      subjectCode: body.subjectCode,
      subjectName: body.subjectName || "",
      instructor: body.instructor || "",
      grade: body.grade,
      units: Number(body.units) || 3,
      semester: body.semester || "1st Semester 2024-2025",
      remarks: parseFloat(body.grade) <= 3.0 ? "Passed" : "Failed",
    };
    grades.push(grade);
    res.status(201).json(grade);
  });

  // PUT /api/admin/grades/:id
  app.put("/api/admin/grades/:id", requireAdminToken, (req, res) => {
    const idx = grades.findIndex((g) => g.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Grade not found" });
    const body = req.body;
    grades[idx] = {
      ...grades[idx],
      subjectCode: body.subjectCode ?? grades[idx].subjectCode,
      subjectName: body.subjectName ?? grades[idx].subjectName,
      instructor: body.instructor ?? grades[idx].instructor,
      grade: body.grade ?? grades[idx].grade,
      units: body.units !== undefined ? Number(body.units) : grades[idx].units,
      semester: body.semester ?? grades[idx].semester,
      remarks: body.grade ? (parseFloat(body.grade) <= 3.0 ? "Passed" : "Failed") : grades[idx].remarks,
    };
    res.json(grades[idx]);
  });

  // DELETE /api/admin/grades/:id
  app.delete("/api/admin/grades/:id", requireAdminToken, (req, res) => {
    const idx = grades.findIndex((g) => g.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Grade not found" });
    grades.splice(idx, 1);
    res.json({ message: "Grade deleted" });
  });

  // ── Schedule ──────────────────────────────────────────────────────────────

  // GET /api/admin/schedule
  app.get("/api/admin/schedule", requireAdminToken, (_req, res) => {
    res.json(scheduleItems);
  });

  // POST /api/admin/schedule
  app.post("/api/admin/schedule", requireAdminToken, (req, res) => {
    const body = req.body;
    if (!body.subjectCode || !body.day || !body.timeStart || !body.timeEnd) {
      return res.status(400).json({ message: "subjectCode, day, timeStart, timeEnd are required" });
    }
    const item: ScheduleItem = {
      id: randomUUID(),
      subjectCode: body.subjectCode,
      subjectName: body.subjectName || "",
      day: body.day,
      timeStart: body.timeStart,
      timeEnd: body.timeEnd,
      room: body.room || "",
      instructor: body.instructor || "",
    };
    scheduleItems.push(item);
    res.status(201).json(item);
  });

  // PUT /api/admin/schedule/:id
  app.put("/api/admin/schedule/:id", requireAdminToken, (req, res) => {
    const idx = scheduleItems.findIndex((s) => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Schedule not found" });
    const body = req.body;
    scheduleItems[idx] = { ...scheduleItems[idx], ...body, id: scheduleItems[idx].id };
    res.json(scheduleItems[idx]);
  });

  // DELETE /api/admin/schedule/:id
  app.delete("/api/admin/schedule/:id", requireAdminToken, (req, res) => {
    const idx = scheduleItems.findIndex((s) => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Schedule not found" });
    scheduleItems.splice(idx, 1);
    res.json({ message: "Schedule deleted" });
  });

  // ── Announcements ─────────────────────────────────────────────────────────

  // GET /api/admin/announcements (also accessible without auth for student view)
  app.get("/api/admin/announcements", (_req, res) => {
    res.json([...announcements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  });

  // POST /api/admin/announcements
  app.post("/api/admin/announcements", requireAdminToken, (req, res) => {
    const body = req.body;
    if (!body.title || !body.description) {
      return res.status(400).json({ message: "title and description are required" });
    }
    const announcement: Announcement = {
      id: randomUUID(),
      title: body.title,
      description: body.description,
      date: body.date || new Date().toISOString().split("T")[0],
      isImportant: Boolean(body.isImportant),
      category: body.category || "General",
    };
    announcements.push(announcement);
    res.status(201).json(announcement);
  });

  // PUT /api/admin/announcements/:id
  app.put("/api/admin/announcements/:id", requireAdminToken, (req, res) => {
    const idx = announcements.findIndex((a) => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Announcement not found" });
    const body = req.body;
    announcements[idx] = {
      ...announcements[idx],
      title: body.title ?? announcements[idx].title,
      description: body.description ?? announcements[idx].description,
      date: body.date ?? announcements[idx].date,
      isImportant: body.isImportant !== undefined ? Boolean(body.isImportant) : announcements[idx].isImportant,
      category: body.category ?? announcements[idx].category,
    };
    res.json(announcements[idx]);
  });

  // DELETE /api/admin/announcements/:id
  app.delete("/api/admin/announcements/:id", requireAdminToken, (req, res) => {
    const idx = announcements.findIndex((a) => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Announcement not found" });
    announcements.splice(idx, 1);
    res.json({ message: "Announcement deleted" });
  });

  const httpServer = createServer(app);
  return httpServer;
}
