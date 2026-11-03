import { notFound } from "next/navigation";

/**
 * Any address the console has no page for. It lives in the (lost) group,
 * which reuses the console layout but has no loading.tsx, so notFound()
 * throws before streaming starts: the operator keeps the sidebar and the
 * response is a real 404.
 */
export default function MissingPage() {
  notFound();
}
