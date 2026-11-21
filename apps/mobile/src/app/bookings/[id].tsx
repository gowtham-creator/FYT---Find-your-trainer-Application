import { useLocalSearchParams } from "expo-router";
import { Page } from "../../components";
import { SessionDetail } from "../../features/bookings/SessionDetail";
import { sessionById } from "../../fixtures";

/** S20 Session detail on narrow windows (wide windows show it beside the Bookings list). */
export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Page bottom>
      <SessionDetail session={sessionById(id)} />
    </Page>
  );
}
