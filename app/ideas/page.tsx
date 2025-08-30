"use client";

import { Edit2, Eye, Lightbulb, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { DataTable, type RowAction } from "@/components/data-table";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import type { IdeaData } from "@/types/data-table";

export default function IdeasPage() {
  const breadcrumbs = [{ label: "Library", href: "#" }, { label: "Ideas" }];

  // Sample ideas data with comprehensive information
  const ideasData = [
    {
      id: "1",
      name: "AI-Powered Content Calendar",
      description:
        "Automated social media content planning using AI to suggest optimal posting times and content types",
      category: "Social Media",
      status: "In Progress",
      priority: "High",
      score: 92,
      ranking: "#1",
      created: "2024-01-15",
      updated: "2024-01-22",
      author: "Sarah Johnson",
      tags: ["AI", "Automation", "Social Media", "Content Planning"],
      contentType: "Social Media Campaign",
    },
    {
      id: "2",
      name: "Sustainable Living Blog Series",
      description:
        "10-part blog series covering eco-friendly lifestyle tips, sustainable products, and green technology",
      category: "Blog",
      status: "Draft",
      priority: "Medium",
      score: 87,
      ranking: "#2",
      created: "2024-01-14",
      updated: "2024-01-21",
      author: "Mike Chen",
      tags: ["Sustainability", "Environment", "Lifestyle", "Green Tech"],
      contentType: "Blog Series",
    },
    {
      id: "3",
      name: "Weekly Tech Newsletter",
      description:
        "Curated newsletter featuring latest tech trends, startup news, and product launches for developers",
      category: "Newsletter",
      status: "Published",
      priority: "High",
      score: 95,
      ranking: "#1",
      created: "2024-01-10",
      updated: "2024-01-20",
      author: "Alex Rivera",
      tags: ["Technology", "Startups", "Development", "News"],
      contentType: "Newsletter",
    },
    {
      id: "4",
      name: "Holiday Season Ad Campaign",
      description:
        "Multi-platform advertising campaign for Q4 holiday shopping with festive themes and gift guides",
      category: "Advertising",
      status: "Completed",
      priority: "High",
      score: 89,
      ranking: "#3",
      created: "2024-01-08",
      updated: "2024-01-19",
      author: "Emma Davis",
      tags: ["Advertising", "Holidays", "Shopping", "Seasonal"],
      contentType: "Ad Campaign",
    },
    {
      id: "5",
      name: "Remote Work Productivity Tips",
      description:
        "LinkedIn article series about maintaining productivity while working from home",
      category: "Social Media",
      status: "In Review",
      priority: "Medium",
      score: 78,
      ranking: "#8",
      created: "2024-01-12",
      updated: "2024-01-18",
      author: "David Park",
      tags: ["Remote Work", "Productivity", "LinkedIn", "Professional"],
      contentType: "Social Media Posts",
    },
    {
      id: "6",
      name: "Fitness App Launch Campaign",
      description:
        "Comprehensive marketing strategy for new fitness mobile app including influencer partnerships",
      category: "Advertising",
      status: "Planning",
      priority: "High",
      score: 84,
      ranking: "#5",
      created: "2024-01-11",
      updated: "2024-01-17",
      author: "Lisa Wong",
      tags: ["Fitness", "Mobile App", "Marketing", "Influencers"],
      contentType: "Marketing Campaign",
    },
    {
      id: "7",
      name: "Food Photography Blog",
      description:
        "Visual blog featuring restaurant reviews, recipes, and food photography techniques",
      category: "Blog",
      status: "Active",
      priority: "Medium",
      score: 81,
      ranking: "#7",
      created: "2024-01-09",
      updated: "2024-01-16",
      author: "Carlos Mendez",
      tags: ["Food", "Photography", "Recipes", "Reviews"],
      contentType: "Visual Blog",
    },
    {
      id: "8",
      name: "Cybersecurity Awareness Newsletter",
      description:
        "Monthly newsletter educating employees about cybersecurity threats and best practices",
      category: "Newsletter",
      status: "Scheduled",
      priority: "High",
      score: 86,
      ranking: "#4",
      created: "2024-01-07",
      updated: "2024-01-15",
      author: "Jennifer Taylor",
      tags: ["Cybersecurity", "Education", "Corporate", "Safety"],
      contentType: "Educational Newsletter",
    },
    {
      id: "9",
      name: "Instagram Reels Strategy",
      description:
        "30-day Instagram Reels content plan focusing on behind-the-scenes and trending audio",
      category: "Social Media",
      status: "In Progress",
      priority: "Medium",
      score: 75,
      ranking: "#12",
      created: "2024-01-06",
      updated: "2024-01-14",
      author: "Zoe Martinez",
      tags: ["Instagram", "Reels", "Video Content", "Trends"],
      contentType: "Video Strategy",
    },
    {
      id: "10",
      name: "B2B Sales Email Sequence",
      description:
        "5-part email nurture sequence for B2B software leads with case studies and demos",
      category: "Email",
      status: "Testing",
      priority: "High",
      score: 90,
      ranking: "#2",
      created: "2024-01-05",
      updated: "2024-01-13",
      author: "Robert Kim",
      tags: ["B2B", "Email Marketing", "Sales", "Lead Nurturing"],
      contentType: "Email Campaign",
    },
    {
      id: "11",
      name: "Travel Destination Guide",
      description:
        "Comprehensive blog post about hidden gems in Southeast Asia for budget travelers",
      category: "Blog",
      status: "Published",
      priority: "Low",
      score: 72,
      ranking: "#15",
      created: "2024-01-04",
      updated: "2024-01-12",
      author: "Amanda Foster",
      tags: ["Travel", "Budget Travel", "Asia", "Hidden Gems"],
      contentType: "Travel Blog",
    },
    {
      id: "12",
      name: "Black Friday Ad Blitz",
      description:
        "48-hour intensive advertising campaign across Google Ads, Facebook, and Instagram for Black Friday sales",
      category: "Advertising",
      status: "Completed",
      priority: "High",
      score: 94,
      ranking: "#1",
      created: "2024-01-03",
      updated: "2024-01-11",
      author: "Marcus Johnson",
      tags: ["Black Friday", "Paid Ads", "Sales", "E-commerce"],
      contentType: "Flash Sale Campaign",
    },
    {
      id: "13",
      name: "Wellness Wednesday Newsletter",
      description:
        "Weekly wellness tips newsletter covering mental health, nutrition, and exercise for corporate employees",
      category: "Newsletter",
      status: "Active",
      priority: "Medium",
      score: 79,
      ranking: "#9",
      created: "2024-01-02",
      updated: "2024-01-10",
      author: "Dr. Rachel Green",
      tags: ["Wellness", "Mental Health", "Corporate", "Weekly"],
      contentType: "Wellness Newsletter",
    },
    {
      id: "14",
      name: "TikTok Challenge Campaign",
      description:
        "Viral TikTok challenge promoting eco-friendly products with user-generated content",
      category: "Social Media",
      status: "Viral",
      priority: "High",
      score: 96,
      ranking: "#1",
      created: "2024-01-01",
      updated: "2024-01-09",
      author: "Taylor Swift",
      tags: ["TikTok", "Viral", "UGC", "Eco-friendly"],
      contentType: "Social Challenge",
    },
    {
      id: "15",
      name: "Cryptocurrency Education Blog",
      description:
        "Beginner-friendly blog series explaining cryptocurrency, blockchain, and DeFi concepts",
      category: "Blog",
      status: "Draft",
      priority: "Medium",
      score: 77,
      ranking: "#11",
      created: "2023-12-30",
      updated: "2024-01-08",
      author: "Nathan Brooks",
      tags: ["Cryptocurrency", "Blockchain", "Education", "Finance"],
      contentType: "Educational Blog",
    },
    {
      id: "16",
      name: "Mother's Day Gift Guide",
      description:
        "Curated email campaign featuring personalized gift recommendations for Mother's Day",
      category: "Email",
      status: "Scheduled",
      priority: "Medium",
      score: 83,
      ranking: "#6",
      created: "2023-12-29",
      updated: "2024-01-07",
      author: "Sophie Anderson",
      tags: ["Mother's Day", "Gift Guide", "Personalization", "Seasonal"],
      contentType: "Seasonal Email",
    },
    {
      id: "17",
      name: "LinkedIn Company Updates",
      description:
        "Weekly LinkedIn posts showcasing company culture, employee spotlights, and industry insights",
      category: "Social Media",
      status: "Active",
      priority: "Low",
      score: 70,
      ranking: "#18",
      created: "2023-12-28",
      updated: "2024-01-06",
      author: "HR Team",
      tags: ["LinkedIn", "Company Culture", "Employee Spotlight", "B2B"],
      contentType: "Corporate Social",
    },
    {
      id: "18",
      name: "Product Launch Teaser Campaign",
      description:
        "Multi-channel teaser campaign building anticipation for upcoming product launch with countdown elements",
      category: "Advertising",
      status: "Planning",
      priority: "High",
      score: 88,
      ranking: "#3",
      created: "2023-12-27",
      updated: "2024-01-05",
      author: "Product Team",
      tags: ["Product Launch", "Teaser", "Multi-channel", "Countdown"],
      contentType: "Launch Campaign",
    },
    {
      id: "19",
      name: "DIY Home Improvement Newsletter",
      description:
        "Monthly newsletter with DIY tutorials, tool reviews, and home improvement project ideas",
      category: "Newsletter",
      status: "Active",
      priority: "Medium",
      score: 74,
      ranking: "#14",
      created: "2023-12-26",
      updated: "2024-01-04",
      author: "Tom Wilson",
      tags: ["DIY", "Home Improvement", "Tutorials", "Tools"],
      contentType: "DIY Newsletter",
    },
    {
      id: "20",
      name: "Customer Success Stories Blog",
      description:
        "Case study blog series highlighting customer transformations and success stories",
      category: "Blog",
      status: "In Progress",
      priority: "High",
      score: 85,
      ranking: "#4",
      created: "2023-12-25",
      updated: "2024-01-03",
      author: "Customer Success Team",
      tags: ["Case Studies", "Customer Success", "Testimonials", "B2B"],
      contentType: "Case Study Blog",
    },
  ];

  const columns = [
    { key: "name", header: "Idea Name", width: "300px" },
    { key: "category", header: "Category", width: "120px" },
    { key: "status", header: "Status", width: "120px" },
    { key: "score", header: "Score", width: "80px" },
    { key: "ranking", header: "Rank", width: "80px" },
    { key: "priority", header: "Priority", width: "100px" },
    { key: "author", header: "Author", width: "150px" },
    { key: "updated", header: "Updated", width: "120px" },
  ];

  const emptyActions = [
    {
      label: "Create Idea",
      icon: <Plus className="h-4 w-4" />,
      href: "/ideas/create",
    },
  ];

  const tableActions = (
    <Button asChild>
      <Link href="/ideas/create">
        <Plus className="h-4 w-4 mr-2" />
        Create Idea
      </Link>
    </Button>
  );

  // Row click handler
  const handleRowClick = (row: IdeaData) => {
    console.log("Navigating to idea:", row.name);
    // In a real app, you'd navigate to `/ideas/${row.id}`
  };

  // Custom row actions specific to ideas
  const rowActions: RowAction<IdeaData>[] = [
    {
      label: "View Details",
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: IdeaData) => console.log("View idea:", row.name),
    },
    {
      label: "Edit Idea",
      icon: <Edit2 className="h-4 w-4" />,
      onClick: (row: IdeaData) => console.log("Edit idea:", row.name),
    },
    {
      label: "Delete Idea",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: IdeaData) => console.log("Delete idea:", row.name),
      variant: "destructive" as const,
    },
  ];

  return (
    <PageLayout
      title="Ideas"
      description="Browse, organize, and manage your collection of ideas. Transform concepts into actionable plans."
      breadcrumbs={breadcrumbs}
    >
      {/* Data Table */}
      <DataTable<IdeaData>
        columns={columns}
        // biome-ignore lint/suspicious/noExplicitAny: Sample data with flexible structure
        data={ideasData as any}
        emptyTitle="No ideas yet"
        emptyDescription="Start building your idea collection. Add your first idea or import existing concepts."
        emptyActions={emptyActions}
        emptyIcon={<Lightbulb className="h-8 w-8 text-muted-foreground" />}
        searchPlaceholder="Search ideas by name, category, author..."
        actions={tableActions}
        onRowClick={handleRowClick}
        rowActions={rowActions}
        pageSize={10}
        searchFields={["name", "category", "author", "status", "priority"]}
      />
    </PageLayout>
  );
}
