import { CorporateHome } from "../../features/home/CorporateHome";
import { StudentHome } from "../../features/home/StudentHome";
import { useSessionStore } from "../../session/store";

/** Dispatches to the segment's home. The session router guarantees a segment here. */
export default function Home() {
  const segment = useSessionStore((s) => s.userDoc?.segment);
  return segment === "corporate" ? <CorporateHome /> : <StudentHome />;
}
