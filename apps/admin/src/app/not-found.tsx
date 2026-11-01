import { FytMark } from "@/components/brand/fyt";
import { NotFoundPanel } from "@/components/ui/not-found-panel";

export const metadata = { title: "Page not found" };

/** Outside the console shell (the catch-all there handles signed-in routes). */
export default function NotFound() {
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-paper p-6">
      <div className="flex w-full max-w-[520px] flex-col items-center gap-6">
        <FytMark tone="azure" className="h-9 w-auto" />
        <div className="w-full">
          <NotFoundPanel />
        </div>
      </div>
    </main>
  );
}
