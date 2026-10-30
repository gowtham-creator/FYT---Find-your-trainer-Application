import { Linking, Platform } from "react-native";
import { Button, GateScreen } from "../../components";
import { gateCopy } from "../../session/gates";
import { useSession } from "../../session/SessionProvider";
import { useSessionStore } from "../../session/store";

// Store listings are created in Milestone 8; until then these open the store app.
const STORE_URL = Platform.OS === "ios" ? "itms-apps://apps.apple.com" : "market://details?id=in.findyourtrainer.fyt";

export default function UpdateRequired() {
  const config = useSessionStore((s) => s.config);
  const copy = gateCopy(useSession(), config) ?? gateCopy({ kind: "updateRequired" }, config)!;
  return <GateScreen icon="download" tone="info" copy={copy} actions={<Button label="Update FYT" onPress={() => Linking.openURL(STORE_URL)} />} />;
}
