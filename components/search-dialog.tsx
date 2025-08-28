"use client";

import { useState, useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import {
  Archive,
  Bell,
  Bot,
  FileText,
  Lightbulb,
  Link,
  MessageSquare,
  Settings,
  Share2,
  Users,
  Workflow,
  Zap,
} from "lucide-react";

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
  // Ideas
  {
    id: "ideas-1",
    title: "AI-Powered Content Calendar",
    description: "Automated social media content planning using AI",
    category: "Ideas",
    url: "/ideas",
    icon: <Lightbulb className="h-4 w-4" />,
  },
  {
    id: "ideas-2",
    title: "Weekly Tech Newsletter",
    description: "Curated newsletter featuring latest tech trends",
    category: "Ideas",
    url: "/ideas",
    icon: <Lightbulb className="h-4 w-4" />,
  },
  // Flows
  {
    id: "flows-1",
    title: "Content Generation Flow",
    description: "Automated workflow for generating blog content",
    category: "Flows",
    url: "/flows",
    icon: <Workflow className="h-4 w-4" />,
  },
  {
    id: "flows-2",
    title: "Social Media Posting Flow",
    description: "Schedule and post content across platforms",
    category: "Flows",
    url: "/flows",
    icon: <Workflow className="h-4 w-4" />,
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
  // Models
  {
    id: "models-1",
    title: "GPT-4 Configuration",
    description: "OpenAI GPT-4 model settings and parameters",
    category: "Models",
    url: "/models",
    icon: <Bot className="h-4 w-4" />,
  },
  {
    id: "models-2",
    title: "Claude 3 Integration",
    description: "Anthropic Claude 3 model configuration",
    category: "Models",
    url: "/models",
    icon: <Bot className="h-4 w-4" />,
  },
  // Templates
  {
    id: "templates-1",
    title: "Blog Post Template",
    description: "Standard template for blog content generation",
    category: "Templates",
    url: "/prompt-templates",
    icon: <MessageSquare className="h-4 w-4" />,
  },
  {
    id: "templates-2",
    title: "Social Media Template",
    description: "Template for social media post creation",
    category: "Templates",
    url: "/prompt-templates",
    icon: <MessageSquare className="h-4 w-4" />,
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
    title: "General Settings",
    description: "Configure global application settings",
    category: "Settings",
    url: "/settings/general",
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
  "Ideas",
  "Flows",
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
      const results = selectedCategory === "All" 
        ? searchData 
        : searchData.filter(item => item.category === selectedCategory);
      setFilteredResults(results);
    } else {
      // Filter based on search query and category
      const results = searchData.filter((item) => {
        const matchesSearch = 
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
        
        return matchesSearch && matchesCategory;
      });
      setFilteredResults(results);
    }
  }, [searchQuery, selectedCategory]);

  const handleItemSelect = (url: string) => {
    onOpenChange(false);
    window.location.href = url;
  };

  const groupedResults = filteredResults.reduce((groups, item) => {
    const category = item.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<string, SearchResult[]>);

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
        <div className="flex gap-1 p-2 pb-3 border-t bg-muted/30 flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors whitespace-nowrap ${
                selectedCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <CommandList className="max-h-[400px]">
        <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
          No results found for "{searchQuery}"{selectedCategory !== "All" && ` in ${selectedCategory}`}.
        </CommandEmpty>

        {Object.entries(groupedResults).map(([category, items]) => (
          <CommandGroup key={category} heading={category}>
            {items.map((item) => (
              <CommandItem
                key={item.id}
                onSelect={() => handleItemSelect(item.url)}
                className="flex items-center gap-3 px-4 py-2 cursor-pointer"
              >
                <div className="flex-shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{item.title}</span>
                    <Badge variant="secondary" className="text-xs">
                      {item.category}
                    </Badge>
                  </div>
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