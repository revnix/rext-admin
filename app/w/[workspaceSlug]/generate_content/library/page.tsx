"use client";

import { LibraryView } from "@/components/generate-content/library-view";
import { WorkingSurface } from "@/components/layouts";

export default function Page() {
  return (
    <WorkingSurface title="Keyword library" hidden>
      <div className="w-full">
        <LibraryView />
      </div>
    </WorkingSurface>
  );
}
