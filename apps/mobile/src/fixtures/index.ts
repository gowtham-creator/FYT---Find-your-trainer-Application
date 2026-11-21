/**
 * Local fixture data for the redesigned screens (docs/MOBILE-DESIGN.md §12),
 * until the catalog and booking reads are wired to Firestore. Hyderabad
 * institutes, real-sounding people, no invented counts. Fees are display only:
 * they are paid to the institute, never in the app.
 */

/** Fixtures are pinned to one day so screens and screenshots are stable. */
export const FIXTURE_TODAY = new Date(2026, 10, 17, 18, 40); // Tue 17 Nov 2026, 6:40 pm IST

export type Mode = "Online" | "Classroom" | "Online + Class";

export interface Course {
  id: string;
  code: string;
  title: string;
  category: string;
  institute: string;
  area: string;
  weeks: number;
  sessions: number;
  mode: Mode;
  fee: number;
  rating: number;
  nextBatch: string;
  batchDays: string;
  batchTime: string;
  trainer: string;
  trainerLine: string;
  summary: string;
  outcomes: string[];
  modules: { weeks: string; title: string; detail: string }[];
  stack: string[];
}

export const COURSES: Course[] = [
  {
    id: "mern-vidyarth",
    code: "MERN",
    title: "MERN Stack with Real Projects",
    category: "Full stack",
    institute: "Vidyarth Tech Academy",
    area: "Ameerpet",
    weeks: 16,
    sessions: 48,
    mode: "Online + Class",
    fee: 38000,
    rating: 4.7,
    nextBatch: "23 Nov",
    batchDays: "Mon Wed Fri",
    batchTime: "7:00 pm",
    trainer: "Priya Raman",
    trainerLine: "Teaches the evening MERN batch. Nine years building React and Node apps, the last four at a Hyderabad fintech.",
    summary:
      "You build three apps and put them online: a notes API, a React dashboard on top of it, and a job board you can walk an interviewer through. The evening batch suits final-year students and freshers. Every project gets a code review, and week 15 is a mock interview.",
    outcomes: [
      "Build a REST API in Express with auth and role checks",
      "Ship a React front end that talks to it, with forms and routing",
      "Model data in MongoDB and write aggregation queries",
      "Deploy to a cloud VM with a domain and HTTPS",
      "Walk an interviewer through your project and the choices you made",
    ],
    modules: [
      { weeks: "W01–02", title: "JavaScript you'll actually use", detail: "ES2023, async, modules, the DOM" },
      { weeks: "W03–05", title: "React from zero", detail: "Components, state, hooks, routing" },
      { weeks: "W06–08", title: "Node and Express", detail: "REST, middleware, JWT auth" },
      { weeks: "W09–10", title: "MongoDB", detail: "Schemas, indexes, aggregation" },
      { weeks: "W11–14", title: "Capstone: job board", detail: "Pair-built, reviewed weekly" },
      { weeks: "W15–16", title: "Deploy and interview prep", detail: "Nginx, CI, one mock interview" },
    ],
    stack: ["JavaScript", "React", "Node.js", "Express", "MongoDB", "Git"],
  },
  {
    id: "java-vidyarth",
    code: "JAVA",
    title: "Java Full Stack with Spring Boot",
    category: "Java",
    institute: "Vidyarth Tech Academy",
    area: "Ameerpet",
    weeks: 20,
    sessions: 80,
    mode: "Classroom",
    fee: 42000,
    rating: 4.6,
    nextBatch: "1 Dec",
    batchDays: "Mon to Fri",
    batchTime: "9:30 am",
    trainer: "Suresh Goud",
    trainerLine: "Fourteen years of Java, eight of them teaching freshers at Ameerpet.",
    summary: "Core Java up to Spring Boot services, with MySQL, JPA and a small React front end. Weekday mornings, taught for freshers who want a service-company Java role.",
    outcomes: ["Write clean, tested Java 21", "Build Spring Boot services with JPA", "Design SQL schemas"],
    modules: [{ weeks: "W01–04", title: "Core Java", detail: "OOP, collections, streams" }],
    stack: ["Java", "Spring Boot", "MySQL", "React"],
  },
  {
    id: "ds-python-madhapur",
    code: "DS",
    title: "Data Science with Python and ML",
    category: "Data science",
    institute: "Deccan Data Labs",
    area: "Gachibowli",
    weeks: 24,
    sessions: 72,
    mode: "Online + Class",
    fee: 65000,
    rating: 4.5,
    nextBatch: "28 Nov",
    batchDays: "Sat Sun",
    batchTime: "10:00 am",
    trainer: "Dr. Meera Krishnan",
    trainerLine: "PhD in statistics from the University of Hyderabad. Eleven years in analytics.",
    summary: "pandas, the statistics you need, and scikit-learn, ending in a capstone on TSRTC bus ridership data. Saturday and Sunday mornings.",
    outcomes: ["Clean and explore data with pandas", "Train and evaluate models with scikit-learn"],
    modules: [{ weeks: "W01–03", title: "Python for data", detail: "NumPy, pandas, plotting" }],
    stack: ["Python", "pandas", "scikit-learn", "SQL"],
  },
  {
    id: "devops-aws",
    code: "OPS",
    title: "DevOps with AWS and Kubernetes",
    category: "DevOps",
    institute: "Nexora Cloud School",
    area: "Kukatpally",
    weeks: 12,
    sessions: 24,
    mode: "Online",
    fee: 35000,
    rating: 4.8,
    nextBatch: "29 Nov",
    batchDays: "Sat Sun",
    batchTime: "8:00 am",
    trainer: "Imran Sheikh",
    trainerLine: "Runs AWS infrastructure for a Pune SaaS company on weekdays.",
    summary: "Linux, Docker, Kubernetes and Terraform on AWS, with a CI pipeline you set up yourself. Live on Saturday and Sunday mornings.",
    outcomes: ["Containerise an app and run it on EKS"],
    modules: [{ weeks: "W01–02", title: "Linux and networking", detail: "Shell, SSH, DNS" }],
    stack: ["AWS", "Docker", "Kubernetes", "Terraform"],
  },
  {
    id: "sdet-selenium",
    code: "SDET",
    title: "Automation Testing with Selenium and Playwright",
    category: "Testing",
    institute: "Saraswathi Software Training",
    area: "SR Nagar",
    weeks: 10,
    sessions: 40,
    mode: "Classroom",
    fee: 24000,
    rating: 4.4,
    nextBatch: "24 Nov",
    batchDays: "Tue Thu Sat",
    batchTime: "6:30 pm",
    trainer: "Lavanya Chowdary",
    trainerLine: "Eight years in QA, now a test lead. Teaches the evening batch.",
    summary: "Selenium, Playwright and Postman API tests, ending with a test framework of your own that you can explain in an interview.",
    outcomes: ["Build a page-object framework"],
    modules: [{ weeks: "W01–02", title: "Manual testing basics", detail: "Test design, bugs" }],
    stack: ["Java", "Selenium", "Playwright", "Postman"],
  },
  {
    id: "uiux-figma",
    code: "UX",
    title: "UI/UX Design with Figma",
    category: "UI/UX",
    institute: "Pixel Patashala Design Studio",
    area: "Kondapur",
    weeks: 8,
    sessions: 16,
    mode: "Online",
    fee: 30000,
    rating: 4.6,
    nextBatch: "5 Dec",
    batchDays: "Sat",
    batchTime: "11:00 am",
    trainer: "Arjun Nair",
    trainerLine: "Product designer in Bengaluru, seven years in consumer apps.",
    summary: "User interviews, wireframes and Figma components, ending in a case study for your portfolio.",
    outcomes: ["Run five user interviews"],
    modules: [{ weeks: "W01", title: "Research", detail: "Interviews, synthesis" }],
    stack: ["Figma", "FigJam"],
  },
];

export const courseById = (id: string | undefined) => COURSES.find((c) => c.id === id) ?? COURSES[0];

export interface Session {
  id: string;
  day: string;
  dayLabel: string;
  time: string;
  end: string;
  /** What happens in the session, not the booking type. */
  title: string;
  /** Course or context line under the title. */
  context: string;
  with: string;
  kind: "Free demo" | "Batch class" | "Mentor call";
  where: string;
  status: "Confirmed" | "Requested" | "Link ready";
  ref: string;
}

export const LEARNER = { name: "Ananya Sharma", first: "Ananya", phone: "+91 98765 43210", college: "CBIT, Gandipet", area: "Ameerpet", segment: "Student" as const };

export const SESSIONS: Session[] = [
  { id: "b1", day: "TODAY", dayLabel: "Tue 17 Nov", time: "7:00 pm", end: "8:30 pm", title: "useEffect and custom hooks", context: "MERN batch · class 7 of 48", with: "Priya Raman", kind: "Batch class", where: "Google Meet", status: "Link ready", ref: "FYT-4H8C2D" },
  { id: "b2", day: "THU 19 NOV", dayLabel: "Thu 19 Nov", time: "7:00 pm", end: "8:00 pm", title: "Data Science with Python and ML", context: "Free demo · Deccan Data Labs", with: "Dr. Meera Krishnan", kind: "Free demo", where: "Google Meet", status: "Confirmed", ref: "FYT-7K2M9Q" },
  { id: "b3", day: "SAT 21 NOV", dayLabel: "Sat 21 Nov", time: "10:30 am", end: "11:15 am", title: "Getting a first backend job", context: "Mentor call · 45 min", with: "Vikram Deshpande", kind: "Mentor call", where: "Google Meet", status: "Requested", ref: "FYT-9P3R1T" },
  { id: "b4", day: "SAT 21 NOV", dayLabel: "Sat 21 Nov", time: "4:00 pm", end: "5:00 pm", title: "DevOps with AWS and Kubernetes", context: "Free demo · in the classroom", with: "Imran Sheikh", kind: "Free demo", where: "Nexora Cloud School, Kukatpally", status: "Confirmed", ref: "FYT-2W6N8E" },
];

export const PAST: { id: string; date: string; title: string; status: "Attended" | "Missed" }[] = [
  { id: "p1", date: "Fri 13 Nov", title: "Express middleware and error handling", status: "Attended" },
  { id: "p2", date: "Wed 11 Nov", title: "Designing a REST API", status: "Attended" },
  { id: "p3", date: "Sat 7 Nov", title: "Free demo · UI/UX Design with Figma", status: "Missed" },
];

/** Free demos with open seats this week, shown on sign-in before an account exists. */
export const OPEN_DEMOS = [
  { when: "Tonight", time: "7:30 pm", title: "MERN Stack", who: "Vidyarth Tech Academy, Ameerpet", mode: "Online" },
  { when: "Thu", time: "6:30 pm", title: "Selenium and Playwright", who: "Saraswathi Software Training, SR Nagar", mode: "Classroom" },
  { when: "Sat", time: "8:00 am", title: "DevOps on AWS", who: "Nexora Cloud School", mode: "Online" },
];

export const sessionById = (id: string | undefined) => SESSIONS.find((s) => s.id === id) ?? SESSIONS[0];

export const BATCH = { course: "MERN Stack with Real Projects", institute: "Vidyarth Tech Academy", attended: 6, of: 48, days: "Mon Wed Fri", time: "7:00 pm", module: "React from zero", week: 3, weeks: 16 };

export const MENTORS = [
  { name: "Vikram Deshpande", line: "Staff engineer, payments", topic: "Backend interviews and system design rounds" },
  { name: "Sana Farooqui", line: "Senior data scientist, healthcare", topic: "Moving from manual testing into data" },
  { name: "Ramesh Babu Yadav", line: "Career consultant, 16 years", topic: "Explaining a career gap to a recruiter" },
];

/** Slot grid for the picker: 14 days from FIXTURE_TODAY, IST. */
export const DAYS = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(FIXTURE_TODAY);
  d.setDate(d.getDate() + i);
  return {
    key: i,
    dow: d.toLocaleDateString("en-IN", { weekday: "short" }),
    date: d.getDate(),
    label: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
    open: i > 0 && d.getDay() !== 1,
  };
});

export const SLOTS = {
  Morning: ["7:30 am", "9:00 am", "10:30 am"],
  Afternoon: ["1:00 pm", "3:30 pm"],
  Evening: ["6:00 pm", "7:00 pm", "8:00 pm", "9:00 pm"],
} as const;
export const TAKEN = new Set(["9:00 am", "8:00 pm"]);

export const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
