import { useLocalSearchParams } from "expo-router";
import { Page } from "../../components";
import { CourseDetail } from "../../features/catalog/CourseDetail";
import { courseById } from "../../fixtures";

/** S13 Course detail (fixture data until the catalog read is wired). */
export default function CourseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Page>
      <CourseDetail course={courseById(id)} />
    </Page>
  );
}
