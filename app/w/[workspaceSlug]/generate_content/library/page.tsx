"use client";

import { LibraryView } from "@/components/generate-content/library-view";
import { ListPage } from "@/components/layouts";

export default function Page() {
  return (
    <ListPage
      title="Keyword library"
      description="The keywords you've analyzed in this workspace. An article can start from one without researching it again."
    >
      <LibraryView />
    </ListPage>
  );
}
