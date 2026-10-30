import type { HomeSection } from "./HomeShell";

/** Home section order per segment (APP-ARCHITECTURE §2.2 #12). */
export const STUDENT_SECTIONS: HomeSection[] = [
  { title: "Featured courses", caption: "Hand-picked by the FYT team", icon: "book-open", empty: "Featured courses appear here once the catalog is connected." },
  { title: "Institutes near you", caption: "Hyderabad training institutes", icon: "map-pin", empty: "Institutes appear here once the catalog is connected." },
  { title: "Trainers", caption: "Book a 1-on-1 demo", icon: "user-check", empty: "Trainers appear here once the catalog is connected." },
  { title: "Mentors", caption: "Guidance from people in the industry", icon: "compass", empty: "Mentors appear here once the catalog is connected." },
];

export const CORPORATE_SECTIONS: HomeSection[] = [
  { title: "Mentors", caption: "Plan your next role", icon: "compass", empty: "Mentors appear here once the catalog is connected." },
  { title: "Courses for your skills", caption: "Matched to what you want to learn", icon: "book-open", empty: "Courses matching your skills appear here once the catalog is connected." },
  { title: "Trainers", caption: "Book a 1-on-1 demo", icon: "user-check", empty: "Trainers appear here once the catalog is connected." },
  { title: "Consultants", caption: "Career change and upskilling plans", icon: "briefcase", empty: "Consultants appear here once the catalog is connected." },
];
