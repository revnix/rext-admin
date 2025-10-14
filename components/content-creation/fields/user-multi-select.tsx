"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * User interface for multi-select component
 * Simplified to show only essential information (name, email, avatar)
 */
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface UserMultiSelectProps {
  /** List of available users to select from */
  users: User[];
  /** Array of selected user IDs */
  value: string[];
  /** Callback when selection changes */
  onChange: (value: string[]) => void;
  /** Placeholder text for empty state */
  placeholder?: string;
  /** Maximum number of users that can be selected */
  maxSelection?: number;
}

/**
 * UserMultiSelect - Multi-select dropdown for user selection
 *
 * A simplified user selection component using Popover + Command pattern.
 * Displays only user names and avatars for a clean, focused interface.
 *
 * Features:
 * - Multi-select with max limit
 * - Searchable dropdown
 * - Avatar display with initials fallback
 * - Compact badge display in trigger (shows 2 users + count)
 * - Disabled state when max selection reached
 *
 * @example
 * ```tsx
 * <UserMultiSelect
 *   users={workspaceMembers}
 *   value={selectedReviewers}
 *   onChange={setSelectedReviewers}
 *   placeholder="Select reviewers..."
 *   maxSelection={3}
 * />
 * ```
 */
export function UserMultiSelect({
  users,
  value,
  onChange,
  placeholder = "Select reviewers...",
  maxSelection = 3,
}: UserMultiSelectProps) {
  const [open, setOpen] = useState(false);

  /**
   * Toggle user selection
   * Adds user if not selected and under limit, removes if already selected
   */
  const toggleUser = (userId: string) => {
    const isSelected = value.includes(userId);
    let newValue: string[];

    if (isSelected) {
      // Remove user
      newValue = value.filter((id) => id !== userId);
    } else {
      // Add user if under limit
      if (value.length < maxSelection) {
        newValue = [...value, userId];
      } else {
        return; // Don't add if at limit
      }
    }

    onChange(newValue);
  };

  // Get full user objects for selected IDs
  const selectedUsers = users.filter((user) => value.includes(user.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedUsers.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            <div className="flex gap-1 flex-wrap">
              {/* Show first 2 selected users as badges */}
              {selectedUsers.slice(0, 2).map((user) => (
                <Badge key={user.id} variant="secondary" className="text-xs">
                  {user.name}
                </Badge>
              ))}
              {/* Show +N for additional selections */}
              {selectedUsers.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{selectedUsers.length - 2}
                </Badge>
              )}
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search users..." />
          <CommandEmpty>No user found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {users.map((user) => {
              const isSelected = value.includes(user.id);
              const isDisabled = !isSelected && value.length >= maxSelection;

              return (
                <CommandItem
                  key={user.id}
                  value={user.name}
                  onSelect={() => !isDisabled && toggleUser(user.id)}
                  disabled={isDisabled}
                  className={cn(isDisabled && "opacity-50 cursor-not-allowed")}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={user.avatar}
                        alt={user.name || user.email}
                      />
                      <AvatarFallback className="text-xs">
                        {user.name
                          ? user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                          : user.email?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span>{user.name || user.email}</span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      isSelected ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
