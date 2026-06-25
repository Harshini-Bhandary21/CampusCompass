// Centralized mock data for CampusCompass ATS

export const metrics = {
  faculty: 148,
  students: 4820,
  rooms: 86,
  subjects: 212,
  conflicts: 3,
};

export const aiScores = {
  optimization: 95,
  roomUtilization: 82,
  studentIdleHours: 1.4,
  campusMovement: 91,
  constraintSatisfaction: 98,
};

export const facultyWorkload = [
  { name: "Dr. Mehra", load: 18, ideal: 16 },
  { name: "Prof. Iyer", load: 14, ideal: 16 },
  { name: "Dr. Khan", load: 20, ideal: 16 },
  { name: "Dr. Rao", load: 12, ideal: 16 },
  { name: "Prof. Das", load: 16, ideal: 16 },
  { name: "Dr. Nair", load: 15, ideal: 16 },
  { name: "Prof. Bose", load: 17, ideal: 16 },
];

export const roomUtilization = [
  { day: "Mon", utilization: 78 },
  { day: "Tue", utilization: 84 },
  { day: "Wed", utilization: 91 },
  { day: "Thu", utilization: 73 },
  { day: "Fri", utilization: 88 },
  { day: "Sat", utilization: 62 },
];

export const optimizationTrend = [
  { gen: "Gen 1", score: 61 },
  { gen: "Gen 10", score: 72 },
  { gen: "Gen 25", score: 81 },
  { gen: "Gen 50", score: 88 },
  { gen: "Gen 80", score: 92 },
  { gen: "Gen 120", score: 95 },
];

export const lectureTypeSplit = [
  { name: "Theory", value: 58, color: "var(--chart-1)" },
  { name: "Lab", value: 27, color: "var(--chart-3)" },
  { name: "Elective", value: 15, color: "var(--chart-5)" },
];

export type SlotType = "theory" | "lab" | "elective" | "break" | "free";

export interface Slot {
  subject: string;
  faculty: string;
  room: string;
  type: SlotType;
}

export const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const periods = [
  "08:30–09:25",
  "09:25–10:20",
  "10:30–11:25",
  "11:25–12:20",
  "13:15–14:10",
  "14:10–15:05",
  "15:10–16:00",
  "16:00–16:50",
  "16:55–17:45",
  "17:45–18:35"
];

// timetable[day][periodIndex]
export const timetable: Record<string, (Slot | null)[]> = {
  Mon: [
    { subject: "Data Structures", faculty: "Dr. Mehra", room: "A-201", type: "theory" },
    { subject: "DBMS", faculty: "Prof. Iyer", room: "A-204", type: "theory" },
    { subject: "OS Lab", faculty: "Dr. Khan", room: "Lab-3", type: "lab" },
    { subject: "OS Lab", faculty: "Dr. Khan", room: "Lab-3", type: "lab" },
    { subject: "Machine Learning", faculty: "Dr. Rao", room: "B-101", type: "elective" },
    { subject: "Networks", faculty: "Prof. Das", room: "A-201", type: "theory" },
    null, null, null, null
  ],
  Tue: [
    { subject: "DBMS Lab", faculty: "Prof. Iyer", room: "Lab-1", type: "lab" },
    { subject: "DBMS Lab", faculty: "Prof. Iyer", room: "Lab-1", type: "lab" },
    { subject: "Algorithms", faculty: "Dr. Mehra", room: "A-202", type: "theory" },
    null,
    { subject: "Cloud Computing", faculty: "Dr. Nair", room: "B-104", type: "elective" },
    { subject: "Networks", faculty: "Prof. Das", room: "A-201", type: "theory" },
    { subject: "Maths III", faculty: "Prof. Bose", room: "A-205", type: "theory" },
    null, null, null
  ],
  Wed: [
    { subject: "Algorithms", faculty: "Dr. Mehra", room: "A-202", type: "theory" },
    { subject: "OS", faculty: "Dr. Khan", room: "A-203", type: "theory" },
    { subject: "ML Lab", faculty: "Dr. Rao", room: "Lab-2", type: "lab" },
    { subject: "ML Lab", faculty: "Dr. Rao", room: "Lab-2", type: "lab" },
    null,
    { subject: "Maths III", faculty: "Prof. Bose", room: "A-205", type: "theory" },
    null, null, null, null
  ],
  Thu: [
    { subject: "Networks Lab", faculty: "Prof. Das", room: "Lab-4", type: "lab" },
    { subject: "DBMS", faculty: "Prof. Iyer", room: "A-204", type: "theory" },
    { subject: "OS", faculty: "Dr. Khan", room: "A-203", type: "theory" },
    null,
    { subject: "Blockchain", faculty: "Dr. Nair", room: "B-104", type: "elective" },
    { subject: "Data Structures", faculty: "Dr. Mehra", room: "A-201", type: "theory" },
    { subject: "Data Structures", faculty: "Dr. Mehra", room: "A-201", type: "theory" },
    null, null, null
  ],
  Fri: [
    { subject: "Machine Learning", faculty: "Dr. Rao", room: "B-101", type: "elective" },
    { subject: "Algorithms", faculty: "Dr. Mehra", room: "A-202", type: "theory" },
    { subject: "DBMS", faculty: "Prof. Iyer", room: "A-204", type: "theory" },
    null,
    { subject: "OS Lab", faculty: "Dr. Khan", room: "Lab-3", type: "lab" },
    { subject: "OS Lab", faculty: "Dr. Khan", room: "Lab-3", type: "lab" },
    null, null, null, null
  ],
  Sat: [
    { subject: "Seminar", faculty: "Prof. Bose", room: "Audi-1", type: "elective" },
    { subject: "Maths III", faculty: "Prof. Bose", room: "A-205", type: "theory" },
    { subject: "Networks", faculty: "Prof. Das", room: "A-201", type: "theory" },
    null, null, null, null, null, null, null
  ],
};

export interface Notification {
  id: string;
  category: "conflict" | "preference" | "room" | "log";
  title: string;
  detail: string;
  time: string;
}

export const notifications: Notification[] = [
  {
    id: "1",
    category: "conflict",
    title: "Room double-booking detected",
    detail: "A-201 assigned to two sections on Wed 11:00",
    time: "2m ago",
  },
  {
    id: "2",
    category: "preference",
    title: "Faculty preference violation",
    detail: "Dr. Khan scheduled before 10:00 (prefers afternoons)",
    time: "18m ago",
  },
  {
    id: "3",
    category: "room",
    title: "Capacity exceeded",
    detail: "Lab-2 capacity 40, assigned 46 students",
    time: "1h ago",
  },
  {
    id: "4",
    category: "log",
    title: "Timetable v12 generated",
    detail: "Optimization score 95% · 0 hard conflicts",
    time: "3h ago",
  },
  {
    id: "5",
    category: "log",
    title: "Faculty.xlsx imported",
    detail: "148 records validated successfully",
    time: "5h ago",
  },
];

export const facultyList = [
  { id: "F-1042", name: "Dr. Anil Mehra", dept: "Computer Science", subjects: 4, load: 18, status: "Optimal" },
  { id: "F-1043", name: "Prof. Lakshmi Iyer", dept: "Computer Science", subjects: 3, load: 14, status: "Underloaded" },
  { id: "F-1044", name: "Dr. Imran Khan", dept: "Information Tech", subjects: 5, load: 20, status: "Overloaded" },
  { id: "F-1045", name: "Dr. Sneha Rao", dept: "AI & Data Science", subjects: 3, load: 12, status: "Underloaded" },
  { id: "F-1046", name: "Prof. Arijit Das", dept: "Electronics", subjects: 4, load: 16, status: "Optimal" },
  { id: "F-1047", name: "Dr. Meera Nair", dept: "AI & Data Science", subjects: 3, load: 15, status: "Optimal" },
  { id: "F-1048", name: "Prof. Subho Bose", dept: "Mathematics", subjects: 4, load: 17, status: "Optimal" },
];

export const roomsList = [
  { id: "A-201", type: "Classroom", capacity: 60, building: "Block A", utilization: 88, status: "Active" },
  { id: "A-204", type: "Classroom", capacity: 60, building: "Block A", utilization: 74, status: "Active" },
  { id: "Lab-1", type: "Computer Lab", capacity: 40, building: "Block A", utilization: 92, status: "Active" },
  { id: "Lab-2", type: "Computer Lab", capacity: 40, building: "Block B", utilization: 95, status: "Overbooked" },
  { id: "B-101", type: "Seminar Hall", capacity: 120, building: "Block B", utilization: 61, status: "Active" },
  { id: "Audi-1", type: "Auditorium", capacity: 350, building: "Central", utilization: 34, status: "Active" },
];

export const subjectsList = [
  { code: "CS301", name: "Data Structures", type: "Theory", credits: 4, sem: 3, faculty: "Dr. Mehra" },
  { code: "CS302", name: "DBMS", type: "Theory", credits: 4, sem: 3, faculty: "Prof. Iyer" },
  { code: "CS303", name: "Operating Systems", type: "Theory", credits: 3, sem: 3, faculty: "Dr. Khan" },
  { code: "CS351", name: "OS Lab", type: "Lab", credits: 2, sem: 3, faculty: "Dr. Khan" },
  { code: "AI401", name: "Machine Learning", type: "Elective", credits: 3, sem: 4, faculty: "Dr. Rao" },
  { code: "CS401", name: "Computer Networks", type: "Theory", credits: 4, sem: 4, faculty: "Prof. Das" },
];

export const studentGroups = [
  { id: "CSE-3A", program: "B.Tech CSE", sem: 3, students: 62, idleHours: 1.2, convenience: 94 },
  { id: "CSE-3B", program: "B.Tech CSE", sem: 3, students: 58, idleHours: 1.8, convenience: 89 },
  { id: "IT-4A", program: "B.Tech IT", sem: 4, students: 54, idleHours: 1.1, convenience: 96 },
  { id: "AI-4A", program: "B.Tech AI&DS", sem: 4, students: 48, idleHours: 2.1, convenience: 85 },
];

export const reportsList = [
  { id: "R-2041", name: "Semester 3 Master Timetable", type: "Timetable", date: "Jun 16, 2026", size: "2.4 MB" },
  { id: "R-2040", name: "Faculty Workload Analysis", type: "Analytics", date: "Jun 15, 2026", size: "880 KB" },
  { id: "R-2039", name: "Room Utilization Summary", type: "Analytics", date: "Jun 15, 2026", size: "1.1 MB" },
  { id: "R-2038", name: "Conflict Resolution Log", type: "Log", date: "Jun 14, 2026", size: "420 KB" },
];
