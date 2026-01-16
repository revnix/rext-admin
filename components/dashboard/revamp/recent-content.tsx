import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, CheckCircle2, Clock } from "lucide-react";
import type { Workspace } from "@/types/workspace";

interface RecentContentProps {
  workspace: Workspace | null;
}

export function RecentContent({ workspace: _workspace }: RecentContentProps) {
  // Mock recent activity data matching reference
  const activities = [
    {
      title: "10 Best Practices for SEO",
      author: "Dr. Sarah Mitchell",
      platform: "WordPress",
      time: "Due date: Nov 26, 2024",
      status: "published",
      color: "bg-slate-100 text-slate-500",
      icon: CheckCircle2,
    },
    {
      title: "Product Launch Guide",
      author: "Marketing Maven Maria",
      platform: "",
      time: "Due date: Nov 28, 2024",
      status: "draft",
      color: "bg-slate-100 text-slate-500",
      icon: Clock,
    },
    {
      title: "React Performance Tips",
      author: "Tech Bro Tom",
      platform: "",
      time: "Due date: Dec 5, 2024",
      status: "draft",
      color: "bg-slate-100 text-slate-500",
      icon: FileText,
    },
    {
      title: "Cross-Browser Testing",
      author: "Tech Bro Tom",
      platform: "",
      time: "Due date: Dec 6, 2024",
      status: "draft",
      color: "bg-slate-100 text-slate-500",
      icon: FileText,
    },
  ];

  return (
    <Card className="shadow-none border border-slate-100 bg-white rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-8">
        <CardTitle className="text-xl font-bold text-slate-800">
          Recent Content
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full px-4 h-9 border-slate-200 hover:bg-slate-50 hover:text-primary"
        >
          <Plus className="h-4 w-4 mr-1" /> New
        </Button>
      </CardHeader>
      <CardContent className="p-8 pt-2">
        <div className="space-y-6">
          {activities.map((activity) => (
            <div
              key={activity.title}
              className="flex items-start gap-4 hover:bg-slate-50 p-2 rounded-xl transition-colors cursor-pointer -mx-2"
            >
              <div
                className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${activity.color}`}
              >
                <activity.icon className="h-5 w-5" />
              </div>
              <div className="space-y-1 flex-1">
                <p className="font-semibold text-base text-slate-900 leading-tight">
                  {activity.title}
                </p>
                <p className="text-sm text-slate-400 font-medium">
                  {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
