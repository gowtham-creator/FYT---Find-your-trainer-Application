import { EmptyState, Screen, Txt } from "../../components";

export default function Explore() {
  return (
    <Screen edges={["top"]}>
      <Txt variant="headline" accessibilityRole="header">
        Explore
      </Txt>
      <EmptyState icon="search" title="Search arrives with the catalog" body="Courses, institutes, trainers, mentors and consultants will be searchable here once the catalog is connected." />
    </Screen>
  );
}
