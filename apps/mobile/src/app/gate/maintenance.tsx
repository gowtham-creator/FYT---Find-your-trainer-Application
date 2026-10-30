import { GateScreen } from "../../components";
import { gateCopy } from "../../session/gates";
import { useSession } from "../../session/SessionProvider";
import { useSessionStore } from "../../session/store";

/** Updates live: when maintenance ends in config/public, the router leaves this screen. */
export default function Maintenance() {
  const config = useSessionStore((s) => s.config);
  const copy = gateCopy(useSession(), config) ?? gateCopy({ kind: "maintenance" }, config)!;
  return <GateScreen icon="tool" tone="warn" copy={copy} />;
}
