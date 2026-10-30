import { Button, GateScreen } from "../../components";
import { backend } from "../../backend";
import { gateCopy } from "../../session/gates";
import { useSessionStore } from "../../session/store";

export default function Blocked() {
  const config = useSessionStore((s) => s.config);
  const set = useSessionStore((s) => s.set);
  const copy = gateCopy({ kind: "blocked" }, config)!;
  return (
    <GateScreen
      icon="slash"
      tone="bad"
      copy={copy}
      actions={
        <Button
          variant="secondary"
          label="Use another number"
          onPress={async () => {
            set({ authDisabled: false, pendingPhone: null });
            await backend().signOut();
          }}
        />
      }
    />
  );
}
