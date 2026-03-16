"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { GroupedPermissions, Permission } from "@/types/role";

interface PermissionMultiSelectProps {
  permissions: Permission[];
  selectedPermissionIds: string[];
  onChange: (selectedIds: string[]) => void;
}

export function PermissionMultiSelect({
  permissions,
  selectedPermissionIds,
  onChange,
}: PermissionMultiSelectProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Group permissions by resource
  const groupedPermissions = useMemo<GroupedPermissions>(() => {
    const filtered = permissions.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.resource.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return filtered.reduce<GroupedPermissions>((acc, permission) => {
      const resource = permission.resource;
      if (!acc[resource]) {
        acc[resource] = [];
      }
      acc[resource].push(permission);
      return acc;
    }, {});
  }, [permissions, searchQuery]);

  const sortedResources = useMemo(
    () => Object.keys(groupedPermissions).sort(),
    [groupedPermissions],
  );

  const handleTogglePermission = (permissionId: string) => {
    const isSelected = selectedPermissionIds.includes(permissionId);
    if (isSelected) {
      onChange(selectedPermissionIds.filter((id) => id !== permissionId));
    } else {
      if (selectedPermissionIds.length >= 50) {
        toast.error("Maximum 50 permissions can be assigned to a role.");
        return;
      }
      onChange([...selectedPermissionIds, permissionId]);
    }
  };

  const handleToggleResource = (resource: string) => {
    const resourcePermissions = groupedPermissions[resource];
    const resourcePermissionIds = resourcePermissions.map((p) => p.id);
    const allSelected = resourcePermissionIds.every((id) =>
      selectedPermissionIds.includes(id),
    );

    if (allSelected) {
      // Deselect all
      onChange(
        selectedPermissionIds.filter(
          (id) => !resourcePermissionIds.includes(id),
        ),
      );
    } else {
      // Select all (respecting 50 limit)
      const currentIds = new Set(selectedPermissionIds);
      const toAdd = resourcePermissionIds.filter((id) => !currentIds.has(id));

      if (selectedPermissionIds.length + toAdd.length > 50) {
        const canAddCount = 50 - selectedPermissionIds.length;
        if (canAddCount <= 0) {
          toast.error("Maximum 50 permissions can be assigned to a role.");
          return;
        }

        const cappedAdd = toAdd.slice(0, canAddCount);
        onChange([...selectedPermissionIds, ...cappedAdd]);
        toast.warning(
          `Only added ${canAddCount} permissions to stay within the 50 limit.`,
        );
      } else {
        onChange([...selectedPermissionIds, ...toAdd]);
      }
    }
  };

  const isResourceFullySelected = (resource: string) => {
    const resourcePermissions = groupedPermissions[resource];
    return resourcePermissions.every((p) =>
      selectedPermissionIds.includes(p.id),
    );
  };

  const isResourcePartiallySelected = (resource: string) => {
    const resourcePermissions = groupedPermissions[resource];
    const selectedCount = resourcePermissions.filter((p) =>
      selectedPermissionIds.includes(p.id),
    ).length;
    return selectedCount > 0 && selectedCount < resourcePermissions.length;
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search permissions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Selected count */}
      <div className="text-sm font-medium">
        <span
          className={
            selectedPermissionIds.length > 50 ? "text-destructive" : ""
          }
        >
          {Math.min(selectedPermissionIds.length, 50)}
        </span>{" "}
        of 50 permissions selected
      </div>

      {/* Permissions list */}
      <ScrollArea className="h-[400px] rounded-md border p-4">
        <div className="space-y-6">
          {sortedResources.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              No permissions found
            </div>
          ) : (
            sortedResources.map((resource) => (
              <div key={resource} className="space-y-3">
                {/* Resource header with checkbox */}
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Checkbox
                    id={`resource-${resource}`}
                    checked={isResourceFullySelected(resource)}
                    onCheckedChange={() => handleToggleResource(resource)}
                    className={
                      isResourcePartiallySelected(resource)
                        ? "data-[state=checked]:bg-primary/50"
                        : ""
                    }
                  />
                  <Label
                    htmlFor={`resource-${resource}`}
                    className="text-sm font-semibold capitalize cursor-pointer"
                  >
                    {resource} (
                    {
                      groupedPermissions[resource].filter((p) =>
                        selectedPermissionIds.includes(p.id),
                      ).length
                    }
                    /{groupedPermissions[resource].length})
                  </Label>
                </div>

                {/* Permission checkboxes */}
                <div className="space-y-2 pl-6">
                  {groupedPermissions[resource].map((permission) => (
                    <div key={permission.id} className="flex items-start gap-2">
                      <Checkbox
                        id={permission.id}
                        checked={selectedPermissionIds.includes(permission.id)}
                        onCheckedChange={() =>
                          handleTogglePermission(permission.id)
                        }
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={permission.id}
                          className="text-sm font-normal cursor-pointer"
                        >
                          <div className="font-medium">
                            {permission.display_name}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {permission.name}
                          </div>
                          {permission.description && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {permission.description}
                            </div>
                          )}
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
