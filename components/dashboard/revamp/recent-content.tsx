import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      time: "2 hours ago",
      status: "published",
      color: "bg-green-600",
      initials: "SM",
    },
    {
      title: "Product Launch Guide",
      author: "Marketing Maven Maria",
      platform: "",
      time: "5 hours ago",
      status: "draft",
      color: "bg-amber-500",
      initials: "MM",
    },
    {
      title: "React Performance Tips",
      author: "Tech Bro Tom",
      platform: "",
      time: "1 day ago",
      status: "draft",
      color: "bg-blue-600",
      initials: "TT",
    },
  ];

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Recent Content</CardTitle>
        <p className="text-base text-muted-foreground">
          Your latest content updates and actions
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {activities.map((activity) => (
            <div key={activity.title} className="flex items-start gap-3">
              <div
                className={`mt-2 h-2.5 w-2.5 rounded-full ${activity.status === "published" ? "bg-green-600" : activity.status === "draft" && activity.title.includes("Product") ? "bg-amber-500" : "bg-blue-600"}`}
              />
              <div className="space-y-1.5">
                <p className="font-semibold text-base leading-none">
                  {activity.title}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1 bg-primary px-2.5 py-0.5 rounded-full text-white text-xs font-medium">
                    {activity.author}
                  </div>
                  {activity.platform && (
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium text-xs">
                      {activity.platform}
                    </span>
                  )}
                  <span>{activity.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Button variant="outline" className="w-full">
            View All Content
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
