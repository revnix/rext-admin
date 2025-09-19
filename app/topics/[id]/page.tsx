import { notFound } from "next/navigation";
import { getTopic } from "../data-access";
import { TopicDetailClient } from "../topic-detail-client";

type TopicDetailPageProps = {
  params: {
    id: string;
  };
};

export default async function TopicDetailPage({
  params,
}: TopicDetailPageProps) {
  const topic = await getTopic(params.id);

  if (!topic) {
    notFound();
  }

  return <TopicDetailClient topic={topic} />;
}
