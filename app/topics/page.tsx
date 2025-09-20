"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { useTopics } from "@/hooks/use-topics";
import { transformTopicsForDisplay } from "@/lib/simple-topic-transformer";
import { TopicsClientWrapper } from "./topics-client-wrapper";

export default function TopicsPage() {
  const breadcrumbs = [{ label: "Library", href: "#" }, { label: "Topics" }];

  const { data: topics, isLoading, error } = useTopics();

  const emptyActions = [
    {
      label: "Generate Topics",
      icon: <Plus className="h-4 w-4" />,
      href: "/topics/create",
    },
  ];

  const tableActions = (
    <Button asChild>
      <Link href="/topics/create">
        <Plus className="h-4 w-4 mr-2" />
        Generate Topics
      </Link>
    </Button>
  );

  return (
    <PageLayout
      title="Topic Library"
      description="Browse AI-generated topics and transform them into compelling content. Generate new topics or explore your saved collection."
      breadcrumbs={breadcrumbs}
    >
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500">
            Failed to load topics. Please try again.
          </p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      ) : (
        <TopicsClientWrapper
          data={transformTopicsForDisplay(topics || [])}
          emptyActions={emptyActions}
          tableActions={tableActions}
        />
      )}
    </PageLayout>
  );
}
