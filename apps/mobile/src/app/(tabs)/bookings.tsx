import { EmptyState, Screen, Txt } from "../../components";

export default function Bookings() {
  return (
    <Screen edges={["top"]}>
      <Txt variant="headline" accessibilityRole="header">
        Bookings
      </Txt>
      <EmptyState icon="calendar" title="No bookings yet" body="When you book a demo or a session, it appears here with its time in IST and the Google Meet link." />
    </Screen>
  );
}
