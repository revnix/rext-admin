"use client";

import {
  Mail,
  Plus,
  Search,
  Shield,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { log } from "@/lib/logger";

interface ReviewerUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  department?: string;
  expertise?: string[];
  isOnline?: boolean;
}

interface ReviewerSelectorProps {
  selectedReviewers?: string[];
  availableReviewers?: ReviewerUser[];
  enableHumansInLoop?: boolean;
  label?: string;
  description?: string;
  maxReviewers?: number;
  error?: string;
  touched?: boolean;
  onChange: (reviewers: string[], enabled: boolean) => void;
  onTouch?: () => void;
  onLoadReviewers?: () => Promise<ReviewerUser[]>;
}

/**
 * Human-in-Loop Reviewer Selection Interface
 *
 * Allows users to enable human review and select specific reviewers
 * for content validation before publication. Includes search, filtering,
 * and team-based suggestions.
 */
export function ReviewerSelector({
  selectedReviewers = [],
  availableReviewers = [],
  enableHumansInLoop = false,
  label = "Human Review",
  description = "Enable human reviewers to validate content before publication",
  maxReviewers = 3,
  error,
  touched,
  onChange,
  onTouch,
  onLoadReviewers,
}: ReviewerSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterByDepartment, setFilterByDepartment] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);

  // Handle enabling/disabling human review
  const handleEnableChange = useCallback(
    async (enabled: boolean) => {
      if (enabled && availableReviewers.length === 0 && onLoadReviewers) {
        setIsLoading(true);
        try {
          await onLoadReviewers();
        } catch (error) {
          log.error("Failed to load reviewers:", error);
        } finally {
          setIsLoading(false);
        }
      }

      onChange(selectedReviewers, enabled);
      onTouch?.();
    },
    [
      selectedReviewers,
      availableReviewers.length,
      onChange,
      onTouch,
      onLoadReviewers,
    ],
  );

  // Handle reviewer selection
  const handleReviewerToggle = useCallback(
    (reviewerId: string, selected: boolean) => {
      let newReviewers: string[];

      if (selected) {
        if (selectedReviewers.length < maxReviewers) {
          newReviewers = [...selectedReviewers, reviewerId];
        } else {
          return; // Don't add if at limit
        }
      } else {
        newReviewers = selectedReviewers.filter((id) => id !== reviewerId);
      }

      onChange(newReviewers, enableHumansInLoop);
      onTouch?.();
    },
    [selectedReviewers, maxReviewers, enableHumansInLoop, onChange, onTouch],
  );

  // Filter and search reviewers
  const filteredReviewers = useMemo(() => {
    return availableReviewers.filter((reviewer) => {
      const matchesSearch =
        !searchTerm ||
        reviewer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reviewer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reviewer.role.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDepartment =
        filterByDepartment === "all" ||
        reviewer.department === filterByDepartment;

      return matchesSearch && matchesDepartment;
    });
  }, [availableReviewers, searchTerm, filterByDepartment]);

  // Get unique departments for filter
  const departments = useMemo(() => {
    const depts = new Set(
      availableReviewers.map((r) => r.department).filter(Boolean),
    );
    return Array.from(depts);
  }, [availableReviewers]);

  // Get selected reviewer details
  const selectedReviewerDetails = useMemo(() => {
    return selectedReviewers
      .map((id) => availableReviewers.find((r) => r.id === id))
      .filter(Boolean) as ReviewerUser[];
  }, [selectedReviewers, availableReviewers]);

  return (
    <Card
      className={`transition-colors ${error && touched ? "border-destructive" : ""}`}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {label}
          <Badge
            variant="outline"
            className="text-xs bg-orange-50 text-orange-700 border-orange-200"
          >
            Demo Data
          </Badge>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable Toggle */}
        <div className="flex items-start space-x-3">
          <Checkbox
            id="enableHumansInLoop"
            checked={enableHumansInLoop}
            onCheckedChange={handleEnableChange}
            disabled={isLoading}
          />
          <div className="space-y-0.5">
            <Label
              htmlFor="enableHumansInLoop"
              className="font-medium cursor-pointer flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Enable Human Review
            </Label>
            <p className="text-sm text-muted-foreground">
              Have team members review content before it goes live
            </p>
          </div>
        </div>

        {/* Reviewer Selection (when enabled) */}
        {enableHumansInLoop && (
          <>
            <Separator />

            {/* Selected Reviewers Summary */}
            {selectedReviewers.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Selected Reviewers ({selectedReviewers.length}/{maxReviewers})
                </Label>
                <div className="flex flex-wrap gap-3">
                  {selectedReviewerDetails.map((reviewer) => (
                    <div
                      key={reviewer.id}
                      className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg p-2"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={reviewer.avatar}
                          alt={reviewer.name}
                        />
                        <AvatarFallback className="text-xs">
                          {reviewer.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {reviewer.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {reviewer.role}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleReviewerToggle(reviewer.id, false)}
                        className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <UserX className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search and Filter */}
            {availableReviewers.length > 0 && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search reviewers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {departments.length > 0 && (
                    <Select
                      value={filterByDepartment}
                      onValueChange={setFilterByDepartment}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept || "undefined"}>
                            {dept || "Undefined"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            )}

            {/* Available Reviewers */}
            {filteredReviewers.length > 0 ? (
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Available Reviewers
                </Label>
                <div className="grid gap-3 max-h-60 overflow-y-auto">
                  {filteredReviewers.map((reviewer) => {
                    const isSelected = selectedReviewers.includes(reviewer.id);
                    const isDisabled =
                      !isSelected && selectedReviewers.length >= maxReviewers;

                    return (
                      <button
                        key={reviewer.id}
                        type="button"
                        tabIndex={isDisabled ? -1 : 0}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : isDisabled
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-accent border-border"
                        }`}
                        onClick={() =>
                          !isDisabled &&
                          handleReviewerToggle(reviewer.id, !isSelected)
                        }
                        onKeyDown={(e) =>
                          (e.key === "Enter" || e.key === " ") &&
                          !isDisabled &&
                          handleReviewerToggle(reviewer.id, !isSelected)
                        }
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={reviewer.avatar}
                            alt={reviewer.name}
                          />
                          <AvatarFallback>
                            {reviewer.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">
                              {reviewer.name}
                            </p>
                            {reviewer.isOnline && (
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {reviewer.role}
                          </p>
                          {reviewer.department && (
                            <p className="text-xs text-muted-foreground">
                              {reviewer.department}
                            </p>
                          )}
                          {reviewer.expertise &&
                            reviewer.expertise.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {reviewer.expertise.slice(0, 3).map((skill) => (
                                  <Badge
                                    key={skill}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                                {reviewer.expertise.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{reviewer.expertise.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                        </div>
                        <div className="flex items-center">
                          {isSelected ? (
                            <UserCheck className="h-4 w-4 text-primary" />
                          ) : (
                            <Plus className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : availableReviewers.length === 0 ? (
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  <strong>No reviewers available.</strong>
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onLoadReviewers?.()}
                      disabled={isLoading}
                    >
                      {isLoading ? "Loading..." : "Load Team Members"}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <Search className="h-4 w-4" />
                <AlertDescription>
                  No reviewers found matching your search criteria.
                </AlertDescription>
              </Alert>
            )}

            {/* Selection Info */}
            {selectedReviewers.length >= maxReviewers && (
              <Alert>
                <AlertDescription>
                  Maximum number of reviewers selected ({maxReviewers}). Remove
                  some reviewers to add others.
                </AlertDescription>
              </Alert>
            )}

            {/* Review Process Info */}
            {selectedReviewers.length > 0 && (
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  <strong>Review Process (Demo):</strong> In production,
                  selected reviewers will be notified via email when content is
                  ready for review. Content will not be published until at least
                  one reviewer approves it.
                  <br />
                  <em className="text-xs text-muted-foreground">
                    Note: This is demonstration data only. Real reviewer
                    integration requires USER management system.
                  </em>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {/* Error Display */}
        {error && touched && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
