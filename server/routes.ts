import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "node:http";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { storage } from "./storage";

const SALT_ROUNDS = 10;
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── Auth Middleware ──────────────────────────────────────────────────────────

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.split(" ")[1];
}

async function getSession(req: Request) {
  const token = extractToken(req);
  if (!token) return null;
  const session = await storage.getSession(token);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    await storage.deleteSession(token);
    return null;
  }
  return session;
}

async function requireAdminToken(req: Request, res: Response, next: NextFunction) {
  const session = await getSession(req);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (session.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  next();
}

async function requireStudentToken(req: Request, res: Response, next: NextFunction) {
  const session = await getSession(req);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (session.role !== "student") {
    return res.status(403).json({ message: "Forbidden: Student access required" });
  }
  (req as Request & { studentUserId: string }).studentUserId = session.userId;
  next();
}

// ─── Route Registration ───────────────────────────────────────────────────────

export async function registerRoutes(app: Express): Promise<Server> {

  // Seed default admin user if none exists
  await storage.upsertAdmin({
    username: "admin",
    password: bcrypt.hashSync("admin123", SALT_ROUNDS),
    firstName: "System",
    lastName: "Administrator",
  });

  // Clean up expired sessions every hour
  setInterval(() => storage.deleteExpiredSessions(), 60 * 60 * 1000);

  // POST /api/auth/login — unified login for students and admins
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    // Check admin users
    const admin = await storage.getAdminByUsername(username);
    if (admin) {
      const passwordValid = await bcrypt.compare(password, admin.password);
      if (passwordValid) {
        const token = randomUUID();
        await storage.createSession(token, admin.id, "admin", Date.now() + TOKEN_TTL_MS);
        const { password: _pw, ...adminData } = admin;
        return res.json({ token, role: "admin", user: adminData });
      }
    }

    // Check students (by studentId)
    const student = await storage.getStudentByStudentId(username);
    if (student) {
      const passwordValid = await bcrypt.compare(password, student.password);
      if (passwordValid) {
        const token = randomUUID();
        await storage.createSession(token, student.id, "student", Date.now() + TOKEN_TTL_MS);
        const { password: _pw, ...studentData } = student;
        return res.json({ token, role: "student", user: studentData });
      }
    }

    return res.status(401).json({ message: "Invalid credentials" });
  });

  // POST /api/auth/logout
  app.post("/api/auth/logout", async (req, res) => {
    const token = extractToken(req);
    if (token) {
      await storage.deleteSession(token);
    }
    res.json({ message: "Logged out" });
  });

  // ── Admin Stats ──────────────────────────────────────────────────────────────

  // GET /api/admin/stats
  app.get("/api/admin/stats", requireAdminToken, async (_req, res) => {
    const [allStudents, allAnnouncements, allSchedule, allGrades] = await Promise.all([
      storage.getAllStudents(),
      storage.getAllAnnouncements(),
      storage.getAllScheduleItems(),
      storage.getAllGrades(),
    ]);
    const courses = new Set(allStudents.map((s) => s.course));
    res.json({
      totalStudents: allStudents.length,
      totalAnnouncements: allAnnouncements.length,
      totalSchedules: allSchedule.length,
      totalGrades: allGrades.length,
      courses: courses.size,
    });
  });

  // ── Students ──────────────────────────────────────────────────────────────────

  // GET /api/admin/students
  app.get("/api/admin/students", requireAdminToken, async (_req, res) => {
    const all = await storage.getAllStudents();
    const sanitized = all.map(({ password: _pw, ...s }) => s);
    res.json(sanitized);
  });

  // POST /api/admin/students
  app.post("/api/admin/students", requireAdminToken, async (req, res) => {
    const body = req.body;
    if (!body.studentId || !body.firstName || !body.lastName || !body.course) {
      return res.status(400).json({ message: "studentId, firstName, lastName, course are required" });
    }
    const existing = await storage.getStudentByStudentId(body.studentId);
    if (existing) {
      return res.status(409).json({ message: "Student ID already exists" });
    }
    const rawPassword = body.password || "student123";
    const hashedPassword = await bcrypt.hash(rawPassword, SALT_ROUNDS);
    const student = await storage.createStudent({
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
      password: hashedPassword,
      role: "student",
    });
    const { password: _pw, ...studentData } = student;
    res.status(201).json(studentData);
  });

  // PUT /api/admin/students/:id
  app.put("/api/admin/students/:id", requireAdminToken, async (req, res) => {
    const body = req.body;
    const updated = await storage.updateStudent(String(req.params.id), {
      firstName: body.firstName,
      lastName: body.lastName,
      middleName: body.middleName,
      course: body.course,
      yearLevel: body.yearLevel,
      email: body.email,
      contactNumber: body.contactNumber,
      address: body.address,
      dateOfBirth: body.dateOfBirth,
      gender: body.gender,
      status: body.status,
    });
    if (!updated) return res.status(404).json({ message: "Student not found" });
    const { password: _pw, ...studentData } = updated;
    res.json(studentData);
  });

  // DELETE /api/admin/students/:id
  app.delete("/api/admin/students/:id", requireAdminToken, async (req, res) => {
    const deleted = await storage.deleteStudent(String(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Student not found" });
    res.json({ message: "Student deleted" });
  });

  // ── Grades (Admin) ────────────────────────────────────────────────────────────

  // GET /api/admin/grades?studentId=xxx
  app.get("/api/admin/grades", requireAdminToken, async (req, res) => {
    const { studentId } = req.query;
    const result = await storage.getAllGrades(studentId as string | undefined);
    res.json(result);
  });

  // POST /api/admin/grades
  app.post("/api/admin/grades", requireAdminToken, async (req, res) => {
    const body = req.body;
    if (!body.studentId || !body.subjectCode || !body.grade) {
      return res.status(400).json({ message: "studentId, subjectCode, grade are required" });
    }
    const grade = await storage.createGrade({
      studentId: body.studentId,
      subjectCode: body.subjectCode,
      subjectName: body.subjectName || "",
      instructor: body.instructor || "",
      grade: body.grade,
      units: Number(body.units) || 3,
      semester: body.semester || "1st Semester 2024-2025",
      remarks: parseFloat(body.grade) <= 3.0 ? "Passed" : "Failed",
    });
    res.status(201).json(grade);
  });

  // PUT /api/admin/grades/:id
  app.put("/api/admin/grades/:id", requireAdminToken, async (req, res) => {
    const body = req.body;
    const updated = await storage.updateGrade(String(req.params.id), {
      subjectCode: body.subjectCode,
      subjectName: body.subjectName,
      instructor: body.instructor,
      grade: body.grade,
      units: body.units !== undefined ? Number(body.units) : undefined,
      semester: body.semester,
      remarks: body.grade ? (parseFloat(body.grade) <= 3.0 ? "Passed" : "Failed") : undefined,
    });
    if (!updated) return res.status(404).json({ message: "Grade not found" });
    res.json(updated);
  });

  // DELETE /api/admin/grades/:id
  app.delete("/api/admin/grades/:id", requireAdminToken, async (req, res) => {
    const deleted = await storage.deleteGrade(String(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Grade not found" });
    res.json({ message: "Grade deleted" });
  });

  // ── Schedule (Admin) ──────────────────────────────────────────────────────────

  // GET /api/admin/schedule
  app.get("/api/admin/schedule", requireAdminToken, async (_req, res) => {
    res.json(await storage.getAllScheduleItems());
  });

  // POST /api/admin/schedule
  app.post("/api/admin/schedule", requireAdminToken, async (req, res) => {
    const body = req.body;
    if (!body.subjectCode || !body.day || !body.timeStart || !body.timeEnd) {
      return res.status(400).json({ message: "subjectCode, day, timeStart, timeEnd are required" });
    }
    const item = await storage.createScheduleItem({
      subjectCode: body.subjectCode,
      subjectName: body.subjectName || "",
      day: body.day,
      timeStart: body.timeStart,
      timeEnd: body.timeEnd,
      room: body.room || "",
      instructor: body.instructor || "",
    });
    res.status(201).json(item);
  });

  // PUT /api/admin/schedule/:id
  app.put("/api/admin/schedule/:id", requireAdminToken, async (req, res) => {
    const body = req.body;
    const updated = await storage.updateScheduleItem(String(req.params.id), {
      subjectCode: body.subjectCode,
      subjectName: body.subjectName,
      day: body.day,
      timeStart: body.timeStart,
      timeEnd: body.timeEnd,
      room: body.room,
      instructor: body.instructor,
    });
    if (!updated) return res.status(404).json({ message: "Schedule not found" });
    res.json(updated);
  });

  // DELETE /api/admin/schedule/:id
  app.delete("/api/admin/schedule/:id", requireAdminToken, async (req, res) => {
    const deleted = await storage.deleteScheduleItem(String(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Schedule not found" });
    res.json({ message: "Schedule deleted" });
  });

  // ── Announcements ─────────────────────────────────────────────────────────────

  // GET /api/admin/announcements (public — accessible by students too)
  app.get("/api/admin/announcements", async (_req, res) => {
    const all = await storage.getAllAnnouncements();
    const sorted = [...all].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json(sorted);
  });

  // POST /api/admin/announcements
  app.post("/api/admin/announcements", requireAdminToken, async (req, res) => {
    const body = req.body;
    if (!body.title || !body.description) {
      return res.status(400).json({ message: "title and description are required" });
    }
    const announcement = await storage.createAnnouncement({
      title: body.title,
      description: body.description,
      date: body.date || new Date().toISOString().split("T")[0],
      isImportant: Boolean(body.isImportant),
      category: body.category || "General",
    });
    res.status(201).json(announcement);
  });

  // PUT /api/admin/announcements/:id
  app.put("/api/admin/announcements/:id", requireAdminToken, async (req, res) => {
    const body = req.body;
    const updated = await storage.updateAnnouncement(String(req.params.id), {
      title: body.title,
      description: body.description,
      date: body.date,
      isImportant: body.isImportant !== undefined ? Boolean(body.isImportant) : undefined,
      category: body.category,
    });
    if (!updated) return res.status(404).json({ message: "Announcement not found" });
    res.json(updated);
  });

  // DELETE /api/admin/announcements/:id
  app.delete("/api/admin/announcements/:id", requireAdminToken, async (req, res) => {
    const deleted = await storage.deleteAnnouncement(String(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Announcement not found" });
    res.json({ message: "Announcement deleted" });
  });

  // ── Student API Routes ────────────────────────────────────────────────────────

  // GET /api/student/profile
  app.get("/api/student/profile", requireStudentToken, async (req, res) => {
    const userId = (req as Request & { studentUserId: string }).studentUserId;
    const student = await storage.getStudentById(userId);
    if (!student) return res.status(404).json({ message: "Student not found" });
    const { password: _pw, ...studentData } = student;
    res.json(studentData);
  });

  // GET /api/student/grades
  app.get("/api/student/grades", requireStudentToken, async (req, res) => {
    const userId = (req as Request & { studentUserId: string }).studentUserId;
    const studentGrades = await storage.getAllGrades(userId);
    res.json(studentGrades);
  });

  // GET /api/student/schedule
  app.get("/api/student/schedule", requireStudentToken, async (_req, res) => {
    res.json(await storage.getAllScheduleItems());
  });

  // GET /api/student/stats
  app.get("/api/student/stats", requireStudentToken, async (req, res) => {
    const userId = (req as Request & { studentUserId: string }).studentUserId;
    const studentGrades = await storage.getAllGrades(userId);

    const totalSubjects = studentGrades.length;
    const totalUnits = studentGrades.reduce((acc, g) => acc + g.units, 0);
    const gwa =
      totalUnits > 0
        ? studentGrades.reduce((acc, g) => acc + parseFloat(g.grade) * g.units, 0) / totalUnits
        : 0;

    const semesters = [...new Set(studentGrades.map((g) => g.semester))];

    res.json({
      totalSubjects,
      totalUnits,
      gwa: parseFloat(gwa.toFixed(2)),
      semesters,
      currentSemester: semesters[0] || "1st Semester 2024-2025",
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
