"use client";

import { ArrowRight, Mail, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OnboardingTeamProps {
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export function OnboardingTeam({
  onNext,
  onSkip,
  onBack,
  isLoading,
}: OnboardingTeamProps) {
  const [emails, setEmails] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [role, setRole] = useState("workspace_editor");

  const handleAddEmail = () => {
    const email = currentEmail.trim().toLowerCase();

    if (!email) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return;
    }

    if (emails.includes(email)) {
      return;
    }

    setEmails([...emails, email]);
    setCurrentEmail("");
  };

  const handleRemoveEmail = (email: string) => {
    setEmails(emails.filter((e) => e !== email));
  };

  const handleSendInvites = async () => {
    // In a real implementation, this would send invitations via API
    // For onboarding, we'll just complete the step
    await onNext();
  };

  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <UserPlus className="h-10 w-10 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Invite Your Team</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Collaborate with your team members. You can invite people now or skip
          and add them later.
        </p>
      </div>

      {/* Form */}
      <div className="max-w-md mx-auto space-y-6">
        {/* Email input */}
        <div className="space-y-2">
          <Label htmlFor="email">Team Member Email</Label>
          <div className="flex gap-2">
            <Input
              id="email"
              type="email"
              placeholder="colleague@example.com"
              value={currentEmail}
              onChange={(e) => setCurrentEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddEmail();
                }
              }}
            />
            <Button onClick={handleAddEmail} type="button">
              Add
            </Button>
          </div>
        </div>

        {/* Role selector */}
        <div className="space-y-2">
          <Label htmlFor="role">Default Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger id="role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="workspace_admin">Admin</SelectItem>
              <SelectItem value="workspace_editor">Editor</SelectItem>
              <SelectItem value="workspace_viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            You can change individual roles after sending invitations
          </p>
        </div>

        {/* Email list */}
        {emails.length > 0 && (
          <div className="space-y-2">
            <Label>Invitations to Send ({emails.length})</Label>
            <div className="flex flex-wrap gap-2">
              {emails.map((email) => (
                <Badge
                  key={email}
                  variant="secondary"
                  className="pl-3 pr-1 py-1"
                >
                  <Mail className="h-3 w-3 mr-1" />
                  {email}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleRemoveEmail(email)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            onClick={handleSendInvites}
            disabled={isLoading || emails.length === 0}
            className="w-full"
          >
            {emails.length > 0 ? (
              <>
                Send {emails.length} Invitation{emails.length > 1 ? "s" : ""}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              "Add team members above"
            )}
          </Button>

          <Button
            variant="outline"
            onClick={onSkip}
            disabled={isLoading}
            className="w-full"
          >
            Skip - I'll invite later
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-center pt-4">
        <Button variant="ghost" onClick={onBack} disabled={isLoading}>
          Back
        </Button>
      </div>
    </div>
  );
}
