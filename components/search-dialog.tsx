"use client";

import {
  Archive,
  Bell,
  FileText,
  Lightbulb,
  Link,
  Settings,
  Share2,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
  icon: React.ReactNode;
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock search data - in a real app, this would come from an API
const searchData: SearchResult[] = [
  // Topics
  {
    id: "topics-1",
    title: "AI-Powered Content Calendar",
    description: "Automated social media content planning using AI",
    category: "Topics",
    url: "/topics",
    icon: <Lightbulb className="h-4 w-4" />,
  },
  {
    id: "topics-2",
    title: "Weekly Tech Newsletter",
    description: "Curated newsletter featuring latest tech trends",
    category: "Topics",
    url: "/topics",
    icon: <Lightbulb className="h-4 w-4" />,
  },
  // Content
  {
    id: "content-1",
    title: "Getting Started Guide",
    description: "Complete guide for new users",
    category: "Content",
    url: "/content",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    id: "content-2",
    title: "API Documentation",
    description: "Technical documentation for developers",
    category: "Content",
    url: "/content",
    icon: <FileText className="h-4 w-4" />,
  },
  // Memories
  {
    id: "memories-1",
    title: "User Preferences Memory",
    description: "Stored user interaction preferences",
    category: "Memories",
    url: "/memories",
    icon: <Archive className="h-4 w-4" />,
  },
  {
    id: "memories-2",
    title: "Content Style Memory",
    description: "Learned content style and tone preferences",
    category: "Memories",
    url: "/memories",
    icon: <Archive className="h-4 w-4" />,
  },
  // Rules
  {
    id: "rules-1",
    title: "Content Approval Rule",
    description: "Automatic content approval based on criteria",
    category: "Rules",
    url: "/rules",
    icon: <Zap className="h-4 w-4" />,
  },
  {
    id: "rules-2",
    title: "Quality Check Rule",
    description: "Automated quality assessment for generated content",
    category: "Rules",
    url: "/rules",
    icon: <Zap className="h-4 w-4" />,
  },
  // Social Accounts
  {
    id: "social-1",
    title: "Twitter Integration",
    description: "Connected Twitter account for content posting",
    category: "Social Accounts",
    url: "/social-accounts",
    icon: <Share2 className="h-4 w-4" />,
  },
  {
    id: "social-2",
    title: "LinkedIn Business",
    description: "LinkedIn company page integration",
    category: "Social Accounts",
    url: "/social-accounts",
    icon: <Share2 className="h-4 w-4" />,
  },
  // Notifications
  {
    id: "notifications-1",
    title: "Email Notifications",
    description: "Email alert configuration for workflow events",
    category: "Notifications",
    url: "/notifications",
    icon: <Bell className="h-4 w-4" />,
  },
  {
    id: "notifications-2",
    title: "Slack Integration",
    description: "Slack channel notifications for team updates",
    category: "Notifications",
    url: "/notifications",
    icon: <Bell className="h-4 w-4" />,
  },
  // Users
  {
    id: "users-1",
    title: "Team Members",
    description: "Manage team member access and permissions",
    category: "Users",
    url: "/users",
    icon: <Users className="h-4 w-4" />,
  },
  {
    id: "users-2",
    title: "User Roles",
    description: "Configure user roles and access levels",
    category: "Users",
    url: "/users",
    icon: <Users className="h-4 w-4" />,
  },
  // Settings
  {
    id: "settings-1",
    title: "Account & Preferences",
    description: "Configure your account and preferences",
    category: "Settings",
    url: "/settings",
    icon: <Settings className="h-4 w-4" />,
  },
  {
    id: "settings-2",
    title: "Integration Settings",
    description: "Manage third-party integrations and APIs",
    category: "Settings",
    url: "/integrations",
    icon: <Link className="h-4 w-4" />,
  },
];

const categories = [
  "All",
  "Topics",
  "Content",
  "Models",
  "Templates",
  "Memories",
  "Rules",
  "Social Accounts",
  "Notifications",
  "Users",
  "Settings",
];

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      // Show all results when no search query
      const results =
        selectedCategory === "All"
          ? searchData
          : searchData.filter((item) => item.category === selectedCategory);
      setFilteredResults(results);
    } else {
      // Filter based on search query and category
      const results = searchData.filter((item) => {
        const matchesSearch =
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory =
          selectedCategory === "All" || item.category === selectedCategory;

        return matchesSearch && matchesCategory;
      });
      setFilteredResults(results);
    }
  }, [searchQuery, selectedCategory]);

  const handleItemSelect = (url: string) => {
    onOpenChange(false);
    window.location.href = url;
  };

  const groupedResults = filteredResults.reduce(
    (groups, item) => {
      const category = item.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
      return groups;
    },
    {} as Record<string, SearchResult[]>,
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div className="border-b">
        <CommandInput
          placeholder="Search everything..."
          value={searchQuery}
          onValueChange={setSearchQuery}
          className="border-0 focus:ring-0"
        />

        {/* Category Filter */}
        <div className="p-3 border-t bg-muted/30">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full h-8">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem
                  key={category}
                  value={category}
                  className="focus:bg-[var(--color-brand-50)] focus:text-[var(--color-brand-700)] dark:focus:bg-[var(--color-brand-900)]/50 dark:focus:text-[var(--color-brand-100)] [&_svg]:!text-current"
                >
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <CommandList className="max-h-[400px]">
        <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
          No results found for "{searchQuery}"
          {selectedCategory !== "All" && ` in ${selectedCategory}`}.
        </CommandEmpty>

        {Object.entries(groupedResults).map(([category, items]) => (
          <CommandGroup key={category} heading={category}>
            {items.map((item) => (
              <CommandItem
                key={item.id}
                onSelect={() => handleItemSelect(item.url)}
                className="flex items-center gap-3 px-4 py-2 cursor-pointer text-slate-500 data-[selected=true]:bg-[var(--color-brand-50)] data-[selected=true]:text-[var(--color-brand-700)] hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-700)] dark:data-[selected=true]:bg-[var(--color-brand-900)]/50 dark:data-[selected=true]:text-[var(--color-brand-100)] dark:text-sidebar-foreground dark:hover:bg-[var(--color-brand-900)]/50 dark:hover:text-[var(--color-brand-100)] [&_svg]:!text-current"
              >
                <div className="flex-shrink-0">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-xs">{item.title}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>

      <div className="border-t p-2 text-xs text-muted-foreground bg-muted/30">
        <div className="flex items-center justify-between">
          <span>Press ↵ to select • ↑↓ to navigate</span>
          <span>Esc to close</span>
        </div>
      </div>
    </CommandDialog>
  );
}
