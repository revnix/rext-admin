"use client";

import { format } from "date-fns";
import {
  Crown,
  Mail,
  MoreHorizontal,
  Trash2,
  UserCheck,
  UserCog,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface WorkspaceMember {
  id: string;
  user_id: string;
  workspace_id: string;
  role_id: string;
  status: string;
  is_default: boolean;
  joined_at: string | null;
  last_activity_at: string | null;
  user: {
    id: string;
    email: string;
    display_name: string;
    is_verified: boolean;
  };
}

interface WorkspaceMembersTableProps {
  members: WorkspaceMember[];
  currentUserId?: string;
  onChangeRole: (member: WorkspaceMember) => void;
  onRemoveMember: (member: WorkspaceMember) => void;
  isLoading?: boolean;
}

/**
 * Workspace Members Table Component
 *
 * Displays workspace members in a table format with:
 * - Member avatar and details
 * - Email and verification status
 * - Role and status badges
 * - Joined date
 * - Actions (change role, remove)
 *
 * Features:
 * - Owner identification (crown icon)
 * - Verified user badge
 * - Status indicators
 * - Action dropdown menu
 * - Empty state handling
 * - Loading state support
 */
export function WorkspaceMembersTable({
  members,
  currentUserId,
  onChangeRole,
  onRemoveMember,
  isLoading,
}: WorkspaceMembersTableProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      active: "default",
      pending: "secondary",
      inactive: "outline",
    };

    return (
      <Badge variant={variants[status.toLowerCase()] || "secondary"}>
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <div className="p-12 text-center text-muted-foreground">
          Loading members...
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground h-32"
              >
                No members found
              </TableCell>
            </TableRow>
          ) : (
            members.map((member) => (
              <TableRow key={member.id}>
                {/* Member */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                        {getInitials(member.user.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {member.user.display_name}
                        </span>
                        {member.is_default && (
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger>
                                <Crown className="h-4 w-4 text-yellow-600" />
                              </TooltipTrigger>
                              <TooltipContent>Workspace Owner</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {member.user.is_verified && (
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger>
                                <UserCheck className="h-4 w-4 text-green-600" />
                              </TooltipTrigger>
                              <TooltipContent>Verified User</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      {member.user_id === currentUserId && (
                        <span className="text-xs text-muted-foreground">
                          (You)
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Email */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm">{member.user.email}</span>
                  </div>
                </TableCell>

                {/* Status */}
                <TableCell>{getStatusBadge(member.status)}</TableCell>

                {/* Joined Date */}
                <TableCell>
                  {member.joined_at ? (
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(member.joined_at), "MMM d, yyyy")}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  {!member.is_default && member.user_id !== currentUserId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onChangeRole(member)}>
                          <UserCog className="h-4 w-4 mr-2" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onRemoveMember(member)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
