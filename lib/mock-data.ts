export interface Grade {
  id: string;
  subjectCode: string;
  subjectName: string;
  instructor: string;
  grade: string;
  units: number;
  semester: string;
  remarks: string;
}

export interface ScheduleItem {
  id: string;
  subjectCode: string;
  subjectName: string;
  day: string;
  timeStart: string;
  timeEnd: string;
  room: string;
  instructor: string;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  date: string;
  isImportant: boolean;
  category: string;
}

export const mockGrades: Grade[] = [
  {
    id: "1",
    subjectCode: "IT 301",
    subjectName: "Web Development",
    instructor: "Prof. Garcia",
    grade: "1.25",
    units: 3,
    semester: "1st Semester 2024-2025",
    remarks: "Passed",
  },
  {
    id: "2",
    subjectCode: "IT 302",
    subjectName: "Database Management Systems",
    instructor: "Prof. Mendoza",
    grade: "1.50",
    units: 3,
    semester: "1st Semester 2024-2025",
    remarks: "Passed",
  },
  {
    id: "3",
    subjectCode: "IT 303",
    subjectName: "Software Engineering",
    instructor: "Prof. Reyes",
    grade: "1.75",
    units: 3,
    semester: "1st Semester 2024-2025",
    remarks: "Passed",
  },
  {
    id: "4",
    subjectCode: "IT 304",
    subjectName: "Network Administration",
    instructor: "Prof. Villanueva",
    grade: "2.00",
    units: 3,
    semester: "1st Semester 2024-2025",
    remarks: "Passed",
  },
  {
    id: "5",
    subjectCode: "GE 105",
    subjectName: "Purposive Communication",
    instructor: "Prof. Aquino",
    grade: "1.50",
    units: 3,
    semester: "1st Semester 2024-2025",
    remarks: "Passed",
  },
  {
    id: "6",
    subjectCode: "PE 3",
    subjectName: "Physical Education 3",
    instructor: "Coach Ramos",
    grade: "1.25",
    units: 2,
    semester: "1st Semester 2024-2025",
    remarks: "Passed",
  },
];

export const mockSchedule: ScheduleItem[] = [
  {
    id: "1",
    subjectCode: "IT 301",
    subjectName: "Web Development",
    day: "Monday",
    timeStart: "7:30 AM",
    timeEnd: "9:00 AM",
    room: "CL-201",
    instructor: "Prof. Garcia",
  },
  {
    id: "2",
    subjectCode: "IT 302",
    subjectName: "Database Management",
    day: "Monday",
    timeStart: "9:00 AM",
    timeEnd: "10:30 AM",
    room: "CL-205",
    instructor: "Prof. Mendoza",
  },
  {
    id: "3",
    subjectCode: "GE 105",
    subjectName: "Purposive Communication",
    day: "Monday",
    timeStart: "1:00 PM",
    timeEnd: "2:30 PM",
    room: "GV-103",
    instructor: "Prof. Aquino",
  },
  {
    id: "4",
    subjectCode: "IT 303",
    subjectName: "Software Engineering",
    day: "Tuesday",
    timeStart: "7:30 AM",
    timeEnd: "9:00 AM",
    room: "CL-302",
    instructor: "Prof. Reyes",
  },
  {
    id: "5",
    subjectCode: "IT 304",
    subjectName: "Network Administration",
    day: "Tuesday",
    timeStart: "10:30 AM",
    timeEnd: "12:00 PM",
    room: "NL-101",
    instructor: "Prof. Villanueva",
  },
  {
    id: "6",
    subjectCode: "PE 3",
    subjectName: "Physical Education 3",
    day: "Tuesday",
    timeStart: "3:00 PM",
    timeEnd: "4:30 PM",
    room: "GYM",
    instructor: "Coach Ramos",
  },
  {
    id: "7",
    subjectCode: "IT 301",
    subjectName: "Web Development",
    day: "Wednesday",
    timeStart: "7:30 AM",
    timeEnd: "9:00 AM",
    room: "CL-201",
    instructor: "Prof. Garcia",
  },
  {
    id: "8",
    subjectCode: "IT 302",
    subjectName: "Database Management",
    day: "Wednesday",
    timeStart: "9:00 AM",
    timeEnd: "10:30 AM",
    room: "CL-205",
    instructor: "Prof. Mendoza",
  },
  {
    id: "9",
    subjectCode: "IT 303",
    subjectName: "Software Engineering",
    day: "Thursday",
    timeStart: "7:30 AM",
    timeEnd: "9:00 AM",
    room: "CL-302",
    instructor: "Prof. Reyes",
  },
  {
    id: "10",
    subjectCode: "IT 304",
    subjectName: "Network Administration",
    day: "Thursday",
    timeStart: "10:30 AM",
    timeEnd: "12:00 PM",
    room: "NL-101",
    instructor: "Prof. Villanueva",
  },
  {
    id: "11",
    subjectCode: "GE 105",
    subjectName: "Purposive Communication",
    day: "Friday",
    timeStart: "9:00 AM",
    timeEnd: "10:30 AM",
    room: "GV-103",
    instructor: "Prof. Aquino",
  },
  {
    id: "12",
    subjectCode: "PE 3",
    subjectName: "Physical Education 3",
    day: "Friday",
    timeStart: "1:00 PM",
    timeEnd: "2:30 PM",
    room: "GYM",
    instructor: "Coach Ramos",
  },
];

export const mockAnnouncements: Announcement[] = [
  {
    id: "1",
    title: "Enrollment for 2nd Semester Now Open",
    description: "Students are advised to complete their enrollment for the 2nd Semester AY 2024-2025. Please visit the Registrar's Office or enroll online through the student portal. Deadline is on January 15, 2025.",
    date: "2025-01-02",
    isImportant: true,
    category: "Academic",
  },
  {
    id: "2",
    title: "Foundation Day Celebration",
    description: "ZDSPGC will celebrate its 45th Foundation Day on February 14, 2025. Various activities including inter-department competitions, cultural shows, and exhibits will be held. All students are encouraged to participate.",
    date: "2025-01-28",
    isImportant: false,
    category: "Event",
  },
  {
    id: "3",
    title: "Midterm Examination Schedule",
    description: "Midterm examinations for all courses will be conducted from March 3-7, 2025. Students must settle all financial obligations before taking the exam. Exam permits can be requested at the cashier.",
    date: "2025-02-10",
    isImportant: true,
    category: "Academic",
  },
  {
    id: "4",
    title: "Scholarship Application Open",
    description: "Academic scholarship applications for the 2nd Semester are now being accepted. Qualifications include maintaining a GWA of 1.75 or higher. Submit requirements at the Scholarship Office.",
    date: "2025-02-15",
    isImportant: true,
    category: "Scholarship",
  },
  {
    id: "5",
    title: "IT Department Seminar",
    description: "The IT Department will host a seminar on Emerging Technologies in AI and Cloud Computing on February 28, 2025. Guest speakers from leading tech companies will share their expertise.",
    date: "2025-02-18",
    isImportant: false,
    category: "Event",
  },
  {
    id: "6",
    title: "Library Hours Extended",
    description: "Starting February 2025, the school library will extend its operating hours from 7:00 AM to 8:00 PM on weekdays and 8:00 AM to 5:00 PM on Saturdays to accommodate student needs during exam season.",
    date: "2025-02-01",
    isImportant: false,
    category: "General",
  },
];

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export function getScheduleByDay(day: string): ScheduleItem[] {
  return mockSchedule.filter((item) => item.day === day);
}
