"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreVertical } from "lucide-react";
import type { Workspace } from "@/types/workspace";

interface RecentContentProps {
  workspace: Workspace | null;
}

export function RecentContent({ workspace: _workspace }: RecentContentProps) {
  // Mock data styled like "Product Performance" table
  const recentActivities = [
    {
      id: 1,
      name: "10 Best Practices for SEO",
      category: "Blog Post",
      status: "Published",
      author: {
        name: "Dr. Sarah Mitchell",
        image: "/avatars/01.png",
        initials: "SM",
      },
    },
    {
      id: 2,
      name: "Product Launch Guide",
      category: "Guide",
      status: "Draft",
      author: {
        name: "Maria Garcia",
        image: "/avatars/02.png",
        initials: "MG",
      },
    },
    {
      id: 3,
      name: "React Performance Tips",
      category: "Technical",
      status: "Under Review",
      author: {
        name: "Tom Wilson",
        image: "/avatars/03.png",
        initials: "TW",
      },
    },
    {
      id: 4,
      name: "Q4 Marketing Strategy",
      category: "Internal",
      status: "Draft",
      author: {
        name: "Sarah Mitchell",
        image: "/avatars/01.png",
        initials: "SM",
      },
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Published":
        return "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400";
      case "Draft":
        return "text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400";
      case "Under Review":
        return "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400";
      default:
        return "text-slate-600 bg-slate-100";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-6">
        <CardTitle className="text-base font-semibold">
          Recent Activities
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/30 text-xs text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="px-6 py-3">Content Title</th>
                <th className="px-6 py-3">Author</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {recentActivities.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-muted/20 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-foreground">
                    {item.name}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={item.author.image} />
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {item.author.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-muted-foreground">
                        {item.author.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {item.category}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusColor(item.status)}`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
