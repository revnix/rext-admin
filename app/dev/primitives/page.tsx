import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { devPagesOn } from "@/lib/dev-pages";
import { PrimitivesGallery } from "./primitives-gallery";

// Every primitive of components/ui in each variant and state, and the five page layouts (task C6,
// plans/app/C-shell.md §8): a change to a primitive is looked at here first, at 390, 820 and
// 1440 px. Development only: a production build answers 404 (lib/dev-pages.ts), but for pr-checks'
// accessibility checks, which open it signed out.

export const metadata: Metadata = { title: "Primitives" };

export default function PrimitivesPage() {
  if (!devPagesOn()) notFound();
  return (
    // Outside the shell (a development page), so it is its own main landmark.
    <main>
      <PrimitivesGallery />
    </main>
  );
}
