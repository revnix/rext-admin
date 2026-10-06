import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrimitivesGallery } from "./primitives-gallery";

// Every primitive of components/ui in each variant and state, and the five page layouts (task C6,
// plans/app/C-shell.md §8): a change to a primitive is looked at here first, at 390, 820 and
// 1440 px. Development only: a production build answers 404, as /dev/tokens does.

export const metadata: Metadata = { title: "Primitives" };

export default function PrimitivesPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    // Outside the shell (a development page), so it is its own main landmark.
    <main>
      <PrimitivesGallery />
    </main>
  );
}
