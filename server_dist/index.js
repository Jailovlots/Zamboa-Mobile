var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import "dotenv/config";
import express from "express";

// server/routes.ts
import { createServer } from "node:http";
import { randomUUID as randomUUID2 } from "crypto";
import bcrypt from "bcryptjs";

// server/storage.ts
import { eq, lt } from "drizzle-orm";
import { randomUUID } from "crypto";

// server/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  announcements: () => announcements,
  grades: () => grades,
  insertUserSchema: () => insertUserSchema,
  scheduleItems: () => scheduleItems,
  sections: () => sections,
  sessions: () => sessions,
  students: () => students,
  users: () => users
});
import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  bigint
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  role: text("role").notNull().default("admin")
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: text("student_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  middleName: text("middle_name").notNull().default(""),
  suffix: text("suffix").notNull().default(""),
  course: text("course").notNull(),
  yearLevel: text("year_level").notNull().default("1st Year"),
  email: text("email").notNull().default(""),
  contactNumber: text("contact_number").notNull().default(""),
  address: text("address").notNull().default(""),
  dateOfBirth: text("date_of_birth").notNull().default(""),
  gender: text("gender").notNull().default(""),
  status: text("status").notNull().default("Regular"),
  sectionId: text("section_id"),
  password: text("password").notNull(),
  role: text("role").notNull().default("student")
});
var sections = pgTable("sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  course: text("course").notNull().default(""),
  yearLevel: text("year_level").notNull().default(""),
  schoolYear: text("school_year").notNull().default(""),
  description: text("description").notNull().default("")
});
var grades = pgTable("grades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: text("student_id").notNull(),
  subjectCode: text("subject_code").notNull(),
  subjectName: text("subject_name").notNull().default(""),
  instructor: text("instructor").notNull().default(""),
  grade: text("grade").notNull(),
  units: integer("units").notNull().default(3),
  semester: text("semester").notNull().default("1st Semester 2024-2025"),
  remarks: text("remarks").notNull().default("")
});
var scheduleItems = pgTable("schedule_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subjectCode: text("subject_code").notNull(),
  subjectName: text("subject_name").notNull().default(""),
  day: text("day").notNull(),
  timeStart: text("time_start").notNull(),
  timeEnd: text("time_end").notNull(),
  room: text("room").notNull().default(""),
  instructor: text("instructor").notNull().default("")
});
var announcements = pgTable("announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: text("date").notNull(),
  isImportant: boolean("is_important").notNull().default(false),
  category: text("category").notNull().default("General")
});
var sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: text("user_id").notNull(),
  role: text("role").notNull(),
  // "student" | "admin"
  expiresAt: bigint("expires_at", { mode: "number" }).notNull()
});

// server/db.ts
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Please create a .env file with your PostgreSQL connection string.\nExample: DATABASE_URL=postgresql://user:password@localhost:5432/zamboa"
  );
}
var pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
var DatabaseStorage = class {
  // ── Admin Users ─────────────────────────────────────────────────────────────
  async getAdminByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async upsertAdmin(data) {
    const existing = await this.getAdminByUsername(data.username);
    if (existing) return existing;
    const [created] = await db.insert(users).values({
      id: randomUUID(),
      ...data,
      role: "admin"
    }).returning();
    return created;
  }
  async getAdminById(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async updateAdmin(id, data) {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }
  // ── Students ─────────────────────────────────────────────────────────────────
  async getAllStudents() {
    return db.select().from(students);
  }
  async getStudentById(id) {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }
  async getStudentByStudentId(studentId) {
    const [student] = await db.select().from(students).where(eq(students.studentId, studentId));
    return student;
  }
  async createStudent(data) {
    const [student] = await db.insert(students).values({
      id: randomUUID(),
      ...data
    }).returning();
    return student;
  }
  async updateStudent(id, data) {
    const [updated] = await db.update(students).set(data).where(eq(students.id, id)).returning();
    return updated;
  }
  async deleteStudent(id) {
    const result = await db.delete(students).where(eq(students.id, id)).returning();
    return result.length > 0;
  }
  // ── Sections ─────────────────────────────────────────────────────────────────
  async getAllSections() {
    return db.select().from(sections);
  }
  async getSectionById(id) {
    const [section] = await db.select().from(sections).where(eq(sections.id, id));
    return section;
  }
  async createSection(data) {
    const [section] = await db.insert(sections).values({
      id: randomUUID(),
      ...data
    }).returning();
    return section;
  }
  async updateSection(id, data) {
    const [updated] = await db.update(sections).set(data).where(eq(sections.id, id)).returning();
    return updated;
  }
  async deleteSection(id) {
    await db.update(students).set({ sectionId: null }).where(eq(students.sectionId, id));
    const result = await db.delete(sections).where(eq(sections.id, id)).returning();
    return result.length > 0;
  }
  // ── Grades ───────────────────────────────────────────────────────────────────
  async getAllGrades(studentId) {
    if (studentId) {
      return db.select().from(grades).where(eq(grades.studentId, studentId));
    }
    return db.select().from(grades);
  }
  async getGradeById(id) {
    const [grade] = await db.select().from(grades).where(eq(grades.id, id));
    return grade;
  }
  async createGrade(data) {
    const [grade] = await db.insert(grades).values({
      id: randomUUID(),
      ...data
    }).returning();
    return grade;
  }
  async updateGrade(id, data) {
    const [updated] = await db.update(grades).set(data).where(eq(grades.id, id)).returning();
    return updated;
  }
  async deleteGrade(id) {
    const result = await db.delete(grades).where(eq(grades.id, id)).returning();
    return result.length > 0;
  }
  // ── Schedule ─────────────────────────────────────────────────────────────────
  async getAllScheduleItems() {
    return db.select().from(scheduleItems);
  }
  async createScheduleItem(data) {
    const [item] = await db.insert(scheduleItems).values({
      id: randomUUID(),
      ...data
    }).returning();
    return item;
  }
  async updateScheduleItem(id, data) {
    const [updated] = await db.update(scheduleItems).set(data).where(eq(scheduleItems.id, id)).returning();
    return updated;
  }
  async deleteScheduleItem(id) {
    const result = await db.delete(scheduleItems).where(eq(scheduleItems.id, id)).returning();
    return result.length > 0;
  }
  // ── Announcements ─────────────────────────────────────────────────────────────
  async getAllAnnouncements() {
    return db.select().from(announcements);
  }
  async createAnnouncement(data) {
    const [announcement] = await db.insert(announcements).values({
      id: randomUUID(),
      ...data
    }).returning();
    return announcement;
  }
  async updateAnnouncement(id, data) {
    const [updated] = await db.update(announcements).set(data).where(eq(announcements.id, id)).returning();
    return updated;
  }
  async deleteAnnouncement(id) {
    const result = await db.delete(announcements).where(eq(announcements.id, id)).returning();
    return result.length > 0;
  }
  // ── Sessions ──────────────────────────────────────────────────────────────────
  async createSession(token, userId, role, expiresAt) {
    await db.insert(sessions).values({ token, userId, role, expiresAt });
  }
  async getSession(token) {
    const [session] = await db.select().from(sessions).where(eq(sessions.token, token));
    return session;
  }
  async deleteSession(token) {
    await db.delete(sessions).where(eq(sessions.token, token));
  }
  async deleteExpiredSessions() {
    await db.delete(sessions).where(lt(sessions.expiresAt, Date.now()));
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
var SALT_ROUNDS = 10;
var TOKEN_TTL_MS = 24 * 60 * 60 * 1e3;
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.split(" ")[1];
}
async function getSession(req) {
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
async function requireAdminToken(req, res, next) {
  const session = await getSession(req);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (session.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  next();
}
async function requireStudentToken(req, res, next) {
  const session = await getSession(req);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (session.role !== "student") {
    return res.status(403).json({ message: "Forbidden: Student access required" });
  }
  req.studentUserId = session.userId;
  next();
}
async function registerRoutes(app2) {
  await storage.upsertAdmin({
    username: "admin",
    password: bcrypt.hashSync("admin123", SALT_ROUNDS),
    firstName: "System",
    lastName: "Administrator"
  });
  setInterval(() => storage.deleteExpiredSessions(), 60 * 60 * 1e3);
  app2.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }
    const admin = await storage.getAdminByUsername(username);
    if (admin) {
      const passwordValid = await bcrypt.compare(password, admin.password);
      if (passwordValid) {
        const token = randomUUID2();
        await storage.createSession(token, admin.id, "admin", Date.now() + TOKEN_TTL_MS);
        const { password: _pw, ...adminData } = admin;
        return res.json({ token, role: "admin", user: adminData });
      }
    }
    const student = await storage.getStudentByStudentId(username);
    if (student) {
      const passwordValid = await bcrypt.compare(password, student.password);
      if (passwordValid) {
        const token = randomUUID2();
        await storage.createSession(token, student.id, "student", Date.now() + TOKEN_TTL_MS);
        const { password: _pw, ...studentData } = student;
        return res.json({ token, role: "student", user: studentData });
      }
    }
    return res.status(401).json({ message: "Invalid credentials" });
  });
  app2.post("/api/auth/logout", async (req, res) => {
    const token = extractToken(req);
    if (token) {
      await storage.deleteSession(token);
    }
    res.json({ message: "Logged out" });
  });
  app2.get("/api/admin/stats", requireAdminToken, async (_req, res) => {
    const [allStudents, allAnnouncements, allSchedule, allGrades] = await Promise.all([
      storage.getAllStudents(),
      storage.getAllAnnouncements(),
      storage.getAllScheduleItems(),
      storage.getAllGrades()
    ]);
    const courses = new Set(allStudents.map((s) => s.course));
    res.json({
      totalStudents: allStudents.length,
      totalAnnouncements: allAnnouncements.length,
      totalSchedules: allSchedule.length,
      totalGrades: allGrades.length,
      courses: courses.size
    });
  });
  app2.get("/api/admin/students", requireAdminToken, async (_req, res) => {
    const all = await storage.getAllStudents();
    const sanitized = all.map(({ password: _pw, ...s }) => s);
    res.json(sanitized);
  });
  app2.post("/api/admin/students", requireAdminToken, async (req, res) => {
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
      suffix: body.suffix || "",
      course: body.course,
      yearLevel: body.yearLevel || "1st Year",
      email: body.email || "",
      contactNumber: body.contactNumber || "",
      address: body.address || "",
      dateOfBirth: body.dateOfBirth || "",
      gender: body.gender || "",
      status: body.status || "Regular",
      sectionId: body.sectionId || null,
      password: hashedPassword,
      role: "student"
    });
    const { password: _pw, ...studentData } = student;
    res.status(201).json(studentData);
  });
  app2.put("/api/admin/students/:id", requireAdminToken, async (req, res) => {
    const body = req.body;
    const updateData = {
      firstName: body.firstName,
      lastName: body.lastName,
      middleName: body.middleName,
      suffix: body.suffix,
      course: body.course,
      yearLevel: body.yearLevel,
      email: body.email,
      contactNumber: body.contactNumber,
      address: body.address,
      dateOfBirth: body.dateOfBirth,
      gender: body.gender,
      status: body.status,
      sectionId: body.sectionId ?? null
    };
    if (body.password) {
      updateData.password = await bcrypt.hash(body.password, SALT_ROUNDS);
    }
    const updated = await storage.updateStudent(String(req.params.id), updateData);
    if (!updated) return res.status(404).json({ message: "Student not found" });
    const { password: _pw, ...studentData } = updated;
    res.json(studentData);
  });
  app2.delete("/api/admin/students/:id", requireAdminToken, async (req, res) => {
    const deleted = await storage.deleteStudent(String(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Student not found" });
    res.json({ message: "Student deleted" });
  });
  app2.get("/api/admin/sections", requireAdminToken, async (_req, res) => {
    const all = await storage.getAllSections();
    res.json(all);
  });
  app2.post("/api/admin/sections", requireAdminToken, async (req, res) => {
    const body = req.body;
    if (!body.name) return res.status(400).json({ message: "Section name is required" });
    const section = await storage.createSection({
      name: body.name,
      course: body.course || "",
      yearLevel: body.yearLevel || "",
      schoolYear: body.schoolYear || "",
      description: body.description || ""
    });
    res.status(201).json(section);
  });
  app2.put("/api/admin/sections/:id", requireAdminToken, async (req, res) => {
    const body = req.body;
    const updated = await storage.updateSection(String(req.params.id), {
      name: body.name,
      course: body.course,
      yearLevel: body.yearLevel,
      schoolYear: body.schoolYear,
      description: body.description
    });
    if (!updated) return res.status(404).json({ message: "Section not found" });
    res.json(updated);
  });
  app2.delete("/api/admin/sections/:id", requireAdminToken, async (req, res) => {
    const deleted = await storage.deleteSection(String(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Section not found" });
    res.json({ message: "Section deleted" });
  });
  app2.post("/api/admin/sections/:id/assign", requireAdminToken, async (req, res) => {
    const sectionId = String(req.params.id);
    const section = await storage.getSectionById(sectionId);
    if (!section) return res.status(404).json({ message: "Section not found" });
    const { studentIds } = req.body;
    if (!Array.isArray(studentIds)) return res.status(400).json({ message: "studentIds must be an array" });
    for (const sid of studentIds) {
      await storage.updateStudent(sid, { sectionId });
    }
    res.json({ message: `${studentIds.length} student(s) assigned to section` });
  });
  app2.delete("/api/admin/sections/:id/students/:studentId", requireAdminToken, async (req, res) => {
    const student = await storage.getStudentById(String(req.params.studentId));
    if (!student) return res.status(404).json({ message: "Student not found" });
    await storage.updateStudent(String(req.params.studentId), { sectionId: null });
    res.json({ message: "Student removed from section" });
  });
  app2.get("/api/admin/sections/:id/students", requireAdminToken, async (req, res) => {
    const sectionId = String(req.params.id);
    const all = await storage.getAllStudents();
    const inSection = all.filter((s) => s.sectionId === sectionId);
    const sanitized = inSection.map(({ password: _pw, ...s }) => s);
    res.json(sanitized);
  });
  app2.get("/api/admin/grades", requireAdminToken, async (req, res) => {
    const { studentId } = req.query;
    const result = await storage.getAllGrades(studentId);
    res.json(result);
  });
  app2.post("/api/admin/grades", requireAdminToken, async (req, res) => {
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
      remarks: parseFloat(body.grade) <= 3 ? "Passed" : "Failed"
    });
    res.status(201).json(grade);
  });
  app2.put("/api/admin/grades/:id", requireAdminToken, async (req, res) => {
    const body = req.body;
    const updated = await storage.updateGrade(String(req.params.id), {
      subjectCode: body.subjectCode,
      subjectName: body.subjectName,
      instructor: body.instructor,
      grade: body.grade,
      units: body.units !== void 0 ? Number(body.units) : void 0,
      semester: body.semester,
      remarks: body.grade ? parseFloat(body.grade) <= 3 ? "Passed" : "Failed" : void 0
    });
    if (!updated) return res.status(404).json({ message: "Grade not found" });
    res.json(updated);
  });
  app2.delete("/api/admin/grades/:id", requireAdminToken, async (req, res) => {
    const deleted = await storage.deleteGrade(String(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Grade not found" });
    res.json({ message: "Grade deleted" });
  });
  app2.get("/api/admin/schedule", requireAdminToken, async (_req, res) => {
    res.json(await storage.getAllScheduleItems());
  });
  app2.post("/api/admin/schedule", requireAdminToken, async (req, res) => {
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
      instructor: body.instructor || ""
    });
    res.status(201).json(item);
  });
  app2.put("/api/admin/schedule/:id", requireAdminToken, async (req, res) => {
    const body = req.body;
    const updated = await storage.updateScheduleItem(String(req.params.id), {
      subjectCode: body.subjectCode,
      subjectName: body.subjectName,
      day: body.day,
      timeStart: body.timeStart,
      timeEnd: body.timeEnd,
      room: body.room,
      instructor: body.instructor
    });
    if (!updated) return res.status(404).json({ message: "Schedule not found" });
    res.json(updated);
  });
  app2.delete("/api/admin/schedule/:id", requireAdminToken, async (req, res) => {
    const deleted = await storage.deleteScheduleItem(String(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Schedule not found" });
    res.json({ message: "Schedule deleted" });
  });
  app2.get("/api/admin/announcements", async (_req, res) => {
    const all = await storage.getAllAnnouncements();
    const sorted = [...all].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json(sorted);
  });
  app2.post("/api/admin/announcements", requireAdminToken, async (req, res) => {
    const body = req.body;
    if (!body.title || !body.description) {
      return res.status(400).json({ message: "title and description are required" });
    }
    const announcement = await storage.createAnnouncement({
      title: body.title,
      description: body.description,
      date: body.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      isImportant: Boolean(body.isImportant),
      category: body.category || "General"
    });
    res.status(201).json(announcement);
  });
  app2.put("/api/admin/announcements/:id", requireAdminToken, async (req, res) => {
    const body = req.body;
    const updated = await storage.updateAnnouncement(String(req.params.id), {
      title: body.title,
      description: body.description,
      date: body.date,
      isImportant: body.isImportant !== void 0 ? Boolean(body.isImportant) : void 0,
      category: body.category
    });
    if (!updated) return res.status(404).json({ message: "Announcement not found" });
    res.json(updated);
  });
  app2.delete("/api/admin/announcements/:id", requireAdminToken, async (req, res) => {
    const deleted = await storage.deleteAnnouncement(String(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Announcement not found" });
    res.json({ message: "Announcement deleted" });
  });
  app2.put("/api/admin/account", requireAdminToken, async (req, res) => {
    const session = await storage.getSession(extractToken(req));
    if (!session) return res.status(401).json({ message: "Unauthorized" });
    const admin = await storage.getAdminById(session.userId);
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    const { currentPassword, newUsername, newPassword } = req.body;
    if (!currentPassword) {
      return res.status(400).json({ message: "Current password is required" });
    }
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }
    const updates = {};
    if (newUsername && newUsername !== admin.username) {
      const existing = await storage.getAdminByUsername(newUsername);
      if (existing) {
        return res.status(400).json({ message: "Username already taken" });
      }
      updates.username = newUsername;
    }
    if (newPassword) {
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters" });
      }
      updates.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    }
    if (Object.keys(updates).length === 0) {
      return res.json({ message: "No changes requested", user: admin });
    }
    const updatedAdmin = await storage.updateAdmin(admin.id, updates);
    if (!updatedAdmin) return res.status(500).json({ message: "Failed to update account" });
    const { password: _pw, ...safeAdmin } = updatedAdmin;
    res.json({ message: "Account updated successfully", user: safeAdmin });
  });
  app2.get("/api/student/profile", requireStudentToken, async (req, res) => {
    const userId = req.studentUserId;
    const student = await storage.getStudentById(userId);
    if (!student) return res.status(404).json({ message: "Student not found" });
    const { password: _pw, ...studentData } = student;
    res.json(studentData);
  });
  app2.get("/api/student/grades", requireStudentToken, async (req, res) => {
    const userId = req.studentUserId;
    const studentGrades = await storage.getAllGrades(userId);
    res.json(studentGrades);
  });
  app2.get("/api/student/schedule", requireStudentToken, async (req, res) => {
    const userId = req.studentUserId;
    const studentGrades = await storage.getAllGrades(userId);
    const enrolledSubjects = new Set(studentGrades.map((g) => g.subjectCode));
    const allSchedules = await storage.getAllScheduleItems();
    const mySchedules = allSchedules.filter((s) => enrolledSubjects.has(s.subjectCode));
    res.json(mySchedules);
  });
  app2.get("/api/student/stats", requireStudentToken, async (req, res) => {
    const userId = req.studentUserId;
    const studentGrades = await storage.getAllGrades(userId);
    const totalSubjects = studentGrades.length;
    const totalUnits = studentGrades.reduce((acc, g) => acc + g.units, 0);
    const gwa = totalUnits > 0 ? studentGrades.reduce((acc, g) => acc + parseFloat(g.grade) * g.units, 0) / totalUnits : 0;
    const semesters = [...new Set(studentGrades.map((g) => g.semester))];
    res.json({
      totalSubjects,
      totalUnits,
      gwa: parseFloat(gwa.toFixed(2)),
      semesters,
      currentSemester: semesters[0] || "1st Semester 2024-2025"
    });
  });
  app2.get("/api/student/announcements", requireStudentToken, async (req, res) => {
    const announcements2 = await storage.getAllAnnouncements();
    announcements2.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json(announcements2);
  });
  app2.post("/api/student/change-password", requireStudentToken, async (req, res) => {
    const userId = req.studentUserId;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "currentPassword and newPassword are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters" });
    }
    const student = await storage.getStudentById(userId);
    if (!student) return res.status(404).json({ message: "Student not found" });
    const passwordValid = await bcrypt.compare(currentPassword, student.password);
    if (!passwordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }
    const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await storage.updateStudent(userId, { password: hashedNewPassword });
    res.json({ message: "Password updated successfully" });
  });
  app2.put("/api/student/account", requireStudentToken, async (req, res) => {
    const userId = req.studentUserId;
    const { currentPassword, newStudentId, newPassword } = req.body;
    if (!currentPassword) {
      return res.status(400).json({ message: "Current password is required to update account" });
    }
    const student = await storage.getStudentById(userId);
    if (!student) return res.status(404).json({ message: "Student not found" });
    const passwordValid = await bcrypt.compare(currentPassword, student.password);
    if (!passwordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }
    const updateFields = {};
    if (newStudentId && newStudentId !== student.studentId) {
      const conflict = await storage.getStudentByStudentId(newStudentId);
      if (conflict) return res.status(409).json({ message: "That Student ID is already in use" });
      updateFields.studentId = newStudentId;
    }
    if (newPassword) {
      if (newPassword.length < 8) return res.status(400).json({ message: "New password must be at least 8 characters" });
      updateFields.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    }
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No changes provided" });
    }
    const updated = await storage.updateStudent(userId, updateFields);
    if (!updated) return res.status(500).json({ message: "Update failed" });
    const { password: _pw, ...studentData } = updated;
    res.json({ message: "Account updated successfully", user: studentData });
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/index.ts
import * as fs from "fs";
import * as path from "path";
var app = express();
var log = console.log;
function setupCors(app2) {
  app2.use((req, res, next) => {
    const origins = /* @__PURE__ */ new Set();
    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }
    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }
    const origin = req.header("origin");
    const isLocalhost = origin?.startsWith("http://localhost:") || origin?.startsWith("http://127.0.0.1:");
    if (origin && (origins.has(origin) || isLocalhost)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.header("Access-Control-Allow-Credentials", "true");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
function setupBodyParsing(app2) {
  app2.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(express.urlencoded({ extended: false }));
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const path2 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!path2.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    });
    next();
  });
}
function getAppName() {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}
function serveExpoManifest(platform, res) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json"
  );
  if (!fs.existsSync(manifestPath)) {
    return res.status(404).json({ error: `Manifest not found for platform: ${platform}` });
  }
  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");
  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}
function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;
  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);
  const html = landingPageTemplate.replace(/BASE_URL_PLACEHOLDER/g, baseUrl).replace(/EXPS_URL_PLACEHOLDER/g, expsUrl).replace(/APP_NAME_PLACEHOLDER/g, appName);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
function configureExpoAndLanding(app2) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html"
  );
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();
  log("Serving static Expo files with dynamic manifest routing");
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }
    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }
    if (req.path === "/") {
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName
      });
    }
    next();
  });
  app2.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
  app2.use(express.static(path.resolve(process.cwd(), "static-build")));
  log("Expo routing: Checking expo-platform header on / and /manifest");
}
function setupErrorHandler(app2) {
  app2.use((err, _req, res, next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(status).json({ message });
  });
}
async function setupApp() {
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);
  configureExpoAndLanding(app);
  const server = await registerRoutes(app);
  setupErrorHandler(app);
  return { app, server };
}
if (!process.env.VERCEL) {
  setupApp().then(({ server }) => {
    const port = parseInt(process.env.PORT || "5000", 10);
    server.listen(port, "0.0.0.0", () => {
      log(`express server serving on port ${port}`);
    });
  });
}
export {
  app,
  setupApp
};
