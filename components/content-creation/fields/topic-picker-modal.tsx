"use client";

import { ExternalLink, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTopics } from "@/hooks/use-topics";
import type { GeneratedTopic } from "@/types/topic-builder";

interface TopicPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTopic: (topic: GeneratedTopic) => void;
  selectedTopicId?: string;
}

/**
 * Modal component for selecting topics from a searchable table
 */
export function TopicPickerModal({
  isOpen,
  onClose,
  onSelectTopic,
  selectedTopicId,
}: TopicPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch topics from API
  const { data: topics = [], isLoading: isLoadingTopics } = useTopics();

  // Filter topics based on search and only show approved ones
  const filteredTopics = useMemo(() => {
    if (!topics.length) return [];

    // Filter to only approved topics
    const approvedTopics = topics.filter((topic) => topic.approved === true);

    if (!searchQuery.trim()) {
      return approvedTopics;
    }

    const searchLower = searchQuery.toLowerCase();
    return approvedTopics.filter(
      (topic) =>
        topic.title.toLowerCase().includes(searchLower) ||
        topic.description?.toLowerCase().includes(searchLower) ||
        topic.tags?.some((tag) => tag.toLowerCase().includes(searchLower)) ||
        topic.audience_fit?.some((audience) =>
          audience.toLowerCase().includes(searchLower),
        ) ||
        topic.channel_fit?.some((channel) =>
          channel.toLowerCase().includes(searchLower),
        ),
    );
  }, [topics, searchQuery]);

  // Handle topic selection
  const handleTopicSelect = useCallback(
    (topic: GeneratedTopic) => {
      onSelectTopic(topic);
      onClose();
    },
    [onSelectTopic, onClose],
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="topic-picker-dialog h-[56vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Choose a Topic</DialogTitle>
          <DialogDescription>
            Select the topic you want to create content about from the approved
            topics below.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search topics by title, description, tags, audience, or channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Topics Table */}
        <div className="flex-1 overflow-auto border rounded-md">
          {isLoadingTopics ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Topic</TableHead>
                  <TableHead className="w-[25%]">Audience Fit</TableHead>
                  <TableHead className="w-[25%]">Channels</TableHead>
                  <TableHead className="w-[10%]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTopics.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {searchQuery
                        ? `No topics found matching "${searchQuery}"`
                        : "No approved topics available"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTopics.map((topic) => (
                    <TableRow
                      key={topic.id}
                      className={`group transition-colors hover:bg-muted/50 ${
                        selectedTopicId === topic.id
                          ? "bg-primary/5 border-primary/20"
                          : ""
                      }`}
                    >
                      <TableCell>
                        <button
                          type="button"
                          className="font-medium text-left cursor-pointer hover:text-primary transition-colors bg-transparent border-0 p-0 w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTopicSelect(topic);
                          }}
                        >
                          {topic.title}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {topic.audience_fit?.slice(0, 2).map((audience) => (
                            <Badge
                              key={audience}
                              variant="secondary"
                              className="text-xs"
                            >
                              {audience}
                            </Badge>
                          ))}
                          {topic.audience_fit &&
                            topic.audience_fit.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{topic.audience_fit.length - 2}
                              </Badge>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {topic.channel_fit?.slice(0, 2).map((channel) => (
                            <Badge
                              key={channel}
                              variant="outline"
                              className="text-xs"
                            >
                              {channel}
                            </Badge>
                          ))}
                          {topic.channel_fit &&
                            topic.channel_fit.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{topic.channel_fit.length - 2}
                              </Badge>
                            )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTopicSelect(topic);
                            }}
                          >
                            Select
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/topics/${topic.id}`, "_blank");
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                            View Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Footer with summary */}
        <div className="text-sm text-muted-foreground">
          {searchQuery
            ? `${filteredTopics.length} topics found`
            : `${topics.filter((t) => t.approved).length} approved topics available`}
        </div>
      </DialogContent>
    </Dialog>
  );
}
