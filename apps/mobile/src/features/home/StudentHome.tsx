import { useSessionStore } from "../../session/store";
import { HomeShell } from "./HomeShell";
import { STUDENT_SECTIONS } from "./sections";

export function StudentHome() {
  const user = useSessionStore((s) => s.userDoc);
  return (
    <HomeShell
      eyebrow="Student"
      focusTitle="Start with a free demo"
      focusBody={user?.institution ? `Courses and trainers picked for ${user.institution} students.` : "Courses and trainers picked for students."}
      focusTags={[...(user?.interests ?? []), ...(user?.skillsToLearn ?? [])].slice(0, 6)}
      sections={STUDENT_SECTIONS}
    />
  );
}
