"use client";

import { useMutation } from "@tanstack/react-query";
import { MessageSquare, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";

interface Note {
  id: string;
  note: string;
  category: string;
  created_by_name?: string;
  admin_email?: string;
  created_at: string;
}

interface CustomerNotesTimelineProps {
  customerId: string;
  notes: Note[];
  onNoteAdded: () => void;
}

export function CustomerNotesTimeline({
  customerId,
  notes,
  onNoteAdded,
}: CustomerNotesTimelineProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [category, setCategory] = useState("support");

  const addNoteMutation = useMutation({
    mutationFn: async (data: { note: string; category: string }) => {
      return await apiClient.request(
        `/api/v1/admin/customers/${customerId}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
    },
    onSuccess: () => {
      toast.success("Note added successfully");
      setNewNote("");
      setCategory("support");
      setIsAdding(false);
      onNoteAdded();
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to add note";
      toast.error(errorMessage);
    },
  });

  const handleAddNote = () => {
    if (!newNote.trim()) {
      toast.error("Please enter a note");
      return;
    }

    addNoteMutation.mutate({ note: newNote, category });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      billing: "bg-blue-100 text-blue-800",
      support: "bg-green-100 text-green-800",
      technical: "bg-purple-100 text-purple-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[cat] || colors.other;
  };

  return (
    <div className="space-y-4">
      {/* Add Note Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Add Note</CardTitle>
            {!isAdding && (
              <Button size="sm" onClick={() => setIsAdding(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            )}
          </div>
        </CardHeader>
        {isAdding && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Textarea
              placeholder="Enter your note here..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={4}
            />

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAdding(false);
                  setNewNote("");
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddNote}
                disabled={addNoteMutation.isPending}
              >
                {addNoteMutation.isPending ? "Adding..." : "Add Note"}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Notes Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Notes History ({notes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {notes.length > 0 ? (
            <div className="space-y-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="border-l-2 border-muted pl-4 pb-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {note.admin_email}
                      </span>
                      <Badge className={getCategoryColor(note.category)}>
                        {note.category}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(note.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {note.note}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No notes yet</p>
              <p className="text-sm">
                Add a note to track customer interactions
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
