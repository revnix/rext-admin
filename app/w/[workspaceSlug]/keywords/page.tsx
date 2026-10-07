"use client";

import { LibraryView } from "@/components/keywords/library-view";
import { ListPage } from "@/components/layouts";

export default function Page() {
  return (
    <ListPage
      title="Keyword library"
      description="The keywords you've analyzed in this workspace. Start an article from any of them; it checks the latest search results first."
    >
      <LibraryView />
    </ListPage>
  );
}
