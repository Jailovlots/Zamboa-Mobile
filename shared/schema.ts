import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  bigint,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Users (Admin) ─────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  role: text("role").notNull().default("admin"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ─── Students ─────────────────────────────────────────────────────────────────

export const students = pgTable("students", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
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
  role: text("role").notNull().default("student"),
});

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;

// ─── Sections ──────────────────────────────────────────────────────────────────

export const sections = pgTable("sections", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  course: text("course").notNull().default(""),
  yearLevel: text("year_level").notNull().default(""),
  schoolYear: text("school_year").notNull().default(""),
  description: text("description").notNull().default(""),
});

export type Section = typeof sections.$inferSelect;
export type InsertSection = typeof sections.$inferInsert;

// ─── Grades ───────────────────────────────────────────────────────────────────

export const grades = pgTable("grades", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  studentId: text("student_id").notNull(),
  subjectCode: text("subject_code").notNull(),
  subjectName: text("subject_name").notNull().default(""),
  instructor: text("instructor").notNull().default(""),
  grade: text("grade").notNull(),
  units: integer("units").notNull().default(3),
  semester: text("semester").notNull().default("1st Semester 2024-2025"),
  remarks: text("remarks").notNull().default(""),
});

export type Grade = typeof grades.$inferSelect;
export type InsertGrade = typeof grades.$inferInsert;

// ─── Schedule Items ───────────────────────────────────────────────────────────

export const scheduleItems = pgTable("schedule_items", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  subjectCode: text("subject_code").notNull(),
  subjectName: text("subject_name").notNull().default(""),
  day: text("day").notNull(),
  timeStart: text("time_start").notNull(),
  timeEnd: text("time_end").notNull(),
  room: text("room").notNull().default(""),
  instructor: text("instructor").notNull().default(""),
});

export type ScheduleItem = typeof scheduleItems.$inferSelect;
export type InsertScheduleItem = typeof scheduleItems.$inferInsert;

// ─── Announcements ────────────────────────────────────────────────────────────

export const announcements = pgTable("announcements", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: text("date").notNull(),
  isImportant: boolean("is_important").notNull().default(false),
  category: text("category").notNull().default("General"),
});

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

// ─── Sessions (server-side token store) ───────────────────────────────────────

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: text("user_id").notNull(),
  role: text("role").notNull(), // "student" | "admin"
  expiresAt: bigint("expires_at", { mode: "number" }).notNull(),
});

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;
