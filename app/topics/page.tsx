import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { transformTopicsForDisplay } from "@/lib/simple-topic-transformer";
import type { TopicData } from "@/types/data-table";
import { getTopics } from "./data-access";
import { TopicsClientWrapper } from "./topics-client-wrapper";

export const metadata = {
  title: "Topics Library",
  description:
    "Browse, manage, and analyze your AI-generated topics. Create new content ideas, view performance metrics, and organize your topic collection.",
};

export default async function TopicsPage() {
  const breadcrumbs = [{ label: "Library", href: "#" }, { label: "Topics" }];

  return (
    <PageLayout
      title="Topic Library"
      description="Browse AI-generated topics and transform them into compelling content. Generate new topics or explore your saved collection."
      breadcrumbs={breadcrumbs}
    >
      <Suspense fallback={<TopicsTableSkeleton />}>
        <TopicsData />
      </Suspense>
    </PageLayout>
  );
}

async function TopicsData() {
  const topics = await getTopics();
  const transformedTopics = transformTopicsForDisplay(topics);

  return <TopicsTable data={transformedTopics} />;
}

function TopicsTable({ data }: { data: TopicData[] }) {
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
    <TopicsClientWrapper
      data={data}
      emptyActions={emptyActions}
      tableActions={tableActions}
    />
  );
}

function TopicsTableSkeleton() {
  return (
    <div>
      <TableSkeleton rows={8} />
    </div>
  );
}
