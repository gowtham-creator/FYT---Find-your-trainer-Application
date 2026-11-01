import { notFound } from "next/navigation";

/**
 * Any address the console has no page for. Routing it through this segment
 * renders the 404 inside the shell, so an operator keeps the sidebar.
 */
export default function MissingPage() {
  notFound();
}
