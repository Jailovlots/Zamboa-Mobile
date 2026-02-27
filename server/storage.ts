import { eq, lt } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "./db";
import {
  users,
  students,
  sections,
  grades,
  scheduleItems,
  announcements,
  sessions,
  type User,
  type InsertUser,
  type Student,
  type InsertStudent,
  type Section,
  type InsertSection,
  type Grade,
  type InsertGrade,
  type ScheduleItem,
  type InsertScheduleItem,
  type Announcement,
  type InsertAnnouncement,
  type Session,
} from "../shared/schema";

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IStorage {
  // Admin users
  getAdminByUsername(username: string): Promise<User | undefined>;
  getAdminById(id: string): Promise<User | undefined>;
  upsertAdmin(data: { username: string; password: string; firstName: string; lastName: string }): Promise<User>;
  updateAdmin(id: string, data: Partial<User>): Promise<User | undefined>;

  // Students
  getAllStudents(): Promise<Student[]>;
  getStudentById(id: string): Promise<Student | undefined>;
  getStudentByStudentId(studentId: string): Promise<Student | undefined>;
  createStudent(data: InsertStudent): Promise<Student>;
  updateStudent(id: string, data: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: string): Promise<boolean>;

  // Sections
  getAllSections(): Promise<Section[]>;
  getSectionById(id: string): Promise<Section | undefined>;
  createSection(data: InsertSection): Promise<Section>;
  updateSection(id: string, data: Partial<InsertSection>): Promise<Section | undefined>;
  deleteSection(id: string): Promise<boolean>;

  // Grades
  getAllGrades(studentId?: string): Promise<Grade[]>;
  getGradeById(id: string): Promise<Grade | undefined>;
  createGrade(data: InsertGrade): Promise<Grade>;
  updateGrade(id: string, data: Partial<InsertGrade>): Promise<Grade | undefined>;
  deleteGrade(id: string): Promise<boolean>;

  // Schedule
  getAllScheduleItems(): Promise<ScheduleItem[]>;
  createScheduleItem(data: InsertScheduleItem): Promise<ScheduleItem>;
  updateScheduleItem(id: string, data: Partial<InsertScheduleItem>): Promise<ScheduleItem | undefined>;
  deleteScheduleItem(id: string): Promise<boolean>;

  // Announcements
  getAllAnnouncements(): Promise<Announcement[]>;
  createAnnouncement(data: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: string, data: Partial<InsertAnnouncement>): Promise<Announcement | undefined>;
  deleteAnnouncement(id: string): Promise<boolean>;

  // Sessions
  createSession(token: string, userId: string, role: string, expiresAt: number): Promise<void>;
  getSession(token: string): Promise<Session | undefined>;
  deleteSession(token: string): Promise<void>;
  deleteExpiredSessions(): Promise<void>;
}

// ─── DatabaseStorage ──────────────────────────────────────────────────────────

export class DatabaseStorage implements IStorage {

  // ── Admin Users ─────────────────────────────────────────────────────────────

  async getAdminByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async upsertAdmin(data: { username: string; password: string; firstName: string; lastName: string }): Promise<User> {
    const existing = await this.getAdminByUsername(data.username);
    if (existing) return existing;
    const [created] = await db.insert(users).values({
      id: randomUUID(),
      ...data,
      role: "admin",
    }).returning();
    return created;
  }

  async getAdminById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateAdmin(id: string, data: Partial<User>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  // ── Students ─────────────────────────────────────────────────────────────────

  async getAllStudents(): Promise<Student[]> {
    return db.select().from(students);
  }

  async getStudentById(id: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async getStudentByStudentId(studentId: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.studentId, studentId));
    return student;
  }

  async createStudent(data: InsertStudent): Promise<Student> {
    const [student] = await db.insert(students).values({
      id: randomUUID(),
      ...data,
    }).returning();
    return student;
  }

  async updateStudent(id: string, data: Partial<InsertStudent>): Promise<Student | undefined> {
    const [updated] = await db.update(students).set(data).where(eq(students.id, id)).returning();
    return updated;
  }

  async deleteStudent(id: string): Promise<boolean> {
    const result = await db.delete(students).where(eq(students.id, id)).returning();
    return result.length > 0;
  }

  // ── Sections ─────────────────────────────────────────────────────────────────

  async getAllSections(): Promise<Section[]> {
    return db.select().from(sections);
  }

  async getSectionById(id: string): Promise<Section | undefined> {
    const [section] = await db.select().from(sections).where(eq(sections.id, id));
    return section;
  }

  async createSection(data: InsertSection): Promise<Section> {
    const [section] = await db.insert(sections).values({
      id: randomUUID(),
      ...data,
    }).returning();
    return section;
  }

  async updateSection(id: string, data: Partial<InsertSection>): Promise<Section | undefined> {
    const [updated] = await db.update(sections).set(data).where(eq(sections.id, id)).returning();
    return updated;
  }

  async deleteSection(id: string): Promise<boolean> {
    // Unassign students from this section first
    await db.update(students).set({ sectionId: null }).where(eq(students.sectionId, id));
    const result = await db.delete(sections).where(eq(sections.id, id)).returning();
    return result.length > 0;
  }

  // ── Grades ───────────────────────────────────────────────────────────────────

  async getAllGrades(studentId?: string): Promise<Grade[]> {
    if (studentId) {
      return db.select().from(grades).where(eq(grades.studentId, studentId));
    }
    return db.select().from(grades);
  }

  async getGradeById(id: string): Promise<Grade | undefined> {
    const [grade] = await db.select().from(grades).where(eq(grades.id, id));
    return grade;
  }

  async createGrade(data: InsertGrade): Promise<Grade> {
    const [grade] = await db.insert(grades).values({
      id: randomUUID(),
      ...data,
    }).returning();
    return grade;
  }

  async updateGrade(id: string, data: Partial<InsertGrade>): Promise<Grade | undefined> {
    const [updated] = await db.update(grades).set(data).where(eq(grades.id, id)).returning();
    return updated;
  }

  async deleteGrade(id: string): Promise<boolean> {
    const result = await db.delete(grades).where(eq(grades.id, id)).returning();
    return result.length > 0;
  }

  // ── Schedule ─────────────────────────────────────────────────────────────────

  async getAllScheduleItems(): Promise<ScheduleItem[]> {
    return db.select().from(scheduleItems);
  }

  async createScheduleItem(data: InsertScheduleItem): Promise<ScheduleItem> {
    const [item] = await db.insert(scheduleItems).values({
      id: randomUUID(),
      ...data,
    }).returning();
    return item;
  }

  async updateScheduleItem(id: string, data: Partial<InsertScheduleItem>): Promise<ScheduleItem | undefined> {
    const [updated] = await db.update(scheduleItems).set(data).where(eq(scheduleItems.id, id)).returning();
    return updated;
  }

  async deleteScheduleItem(id: string): Promise<boolean> {
    const result = await db.delete(scheduleItems).where(eq(scheduleItems.id, id)).returning();
    return result.length > 0;
  }

  // ── Announcements ─────────────────────────────────────────────────────────────

  async getAllAnnouncements(): Promise<Announcement[]> {
    return db.select().from(announcements);
  }

  async createAnnouncement(data: InsertAnnouncement): Promise<Announcement> {
    const [announcement] = await db.insert(announcements).values({
      id: randomUUID(),
      ...data,
    }).returning();
    return announcement;
  }

  async updateAnnouncement(id: string, data: Partial<InsertAnnouncement>): Promise<Announcement | undefined> {
    const [updated] = await db.update(announcements).set(data).where(eq(announcements.id, id)).returning();
    return updated;
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    const result = await db.delete(announcements).where(eq(announcements.id, id)).returning();
    return result.length > 0;
  }

  // ── Sessions ──────────────────────────────────────────────────────────────────

  async createSession(token: string, userId: string, role: string, expiresAt: number): Promise<void> {
    await db.insert(sessions).values({ token, userId, role, expiresAt });
  }

  async getSession(token: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.token, token));
    return session;
  }

  async deleteSession(token: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.token, token));
  }

  async deleteExpiredSessions(): Promise<void> {
    await db.delete(sessions).where(lt(sessions.expiresAt, Date.now()));
  }
}

export const storage = new DatabaseStorage();
