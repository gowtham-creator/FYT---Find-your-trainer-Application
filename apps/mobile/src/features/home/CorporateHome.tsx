import { useSessionStore } from "../../session/store";
import { HomeShell } from "./HomeShell";
import { CORPORATE_SECTIONS } from "./sections";

export function CorporateHome() {
  const user = useSessionStore((s) => s.userDoc);
  return (
    <HomeShell
      eyebrow="Working professional"
      focusTitle="Upskill around your schedule"
      focusBody={user?.currentRole ? `Mentors and courses for a ${user.currentRole} moving up.` : "Mentors and courses for your next role."}
      focusTags={(user?.skillsToLearn ?? []).slice(0, 6)}
      sections={CORPORATE_SECTIONS}
    />
  );
}
