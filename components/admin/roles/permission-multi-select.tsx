"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  updatePermissionSelection,
} from "@/lib/permission-dependencies";
import type { GroupedPermissions, Permission } from "@/types/role";

interface PermissionMultiSelectProps {
  permissions: Permission[];
  selectedPermissionIds: string[];
  onChange: (selectedIds: string[]) => void;
  disabled?: boolean;
  /**
   * Auto-select prerequisites / cascade dependents while toggling (default).
   * Pass false when picking permissions to REVOKE: prerequisites of a removed
   * permission must not be selected for removal, and the backend cascades
   * each revoke to dependents on its own.
   */
  applyDependencies?: boolean;
}

export function PermissionMultiSelect({
  permissions,
  selectedPermissionIds,
  onChange,
  disabled = false,
  applyDependencies = true,
}: PermissionMultiSelectProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Maps for efficient ID <-> Name conversion
  const idToNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of permissions) {
      map.set(p.id, p.name);
    }
    return map;
  }, [permissions]);

  const nameToIdMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of permissions) {
      map.set(p.name, p.id);
    }
    return map;
  }, [permissions]);

  // Group permissions by resource
  // Hide "knowledge" (feature not in use) and "permission" (not user-manageable)
  const HIDDEN_RESOURCES = new Set(["knowledge", "permission"]);

  const groupedPermissions = useMemo<GroupedPermissions>(() => {
    const filtered = permissions.filter(
      (p) =>
        !HIDDEN_RESOURCES.has(p.resource.toLowerCase()) &&
        (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.resource.toLowerCase().includes(searchQuery.toLowerCase())),
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
    const targetPermission = permissions.find((p) => p.id === permissionId);
    if (!targetPermission) return;

    if (!applyDependencies) {
      onChange(
        isSelected
          ? selectedPermissionIds.filter((id) => id !== permissionId)
          : [...selectedPermissionIds, permissionId],
      );
      return;
    }

    const currentNames = selectedPermissionIds
      .map((id) => idToNameMap.get(id))
      .filter((name): name is string => Boolean(name));

    const updatedNames = updatePermissionSelection(
      currentNames,
      targetPermission.name,
      !isSelected,
    );

    const updatedIds = updatedNames
      .map((name) => nameToIdMap.get(name))
      .filter((id): id is string => Boolean(id));

    onChange(updatedIds);
  };

  const handleToggleResource = (resource: string) => {
    const resourcePermissions = groupedPermissions[resource];
    const resourcePermissionIds = resourcePermissions.map((p) => p.id);
    const allSelected = resourcePermissionIds.every((id) =>
      selectedPermissionIds.includes(id),
    );

    if (!applyDependencies) {
      onChange(
        allSelected
          ? selectedPermissionIds.filter(
              (id) => !resourcePermissionIds.includes(id),
            )
          : Array.from(
              new Set([...selectedPermissionIds, ...resourcePermissionIds]),
            ),
      );
      return;
    }

    if (allSelected) {
      // Deselect each permission in this resource sequentially
      let currentNames = selectedPermissionIds
        .map((id) => idToNameMap.get(id))
        .filter((name): name is string => Boolean(name));

      for (const p of resourcePermissions) {
        currentNames = updatePermissionSelection(currentNames, p.name, false);
      }

      const updatedIds = currentNames
        .map((name) => nameToIdMap.get(name))
        .filter((id): id is string => Boolean(id));

      onChange(updatedIds);
    } else {
      // Select all permissions in this resource
      let currentNames = selectedPermissionIds
        .map((id) => idToNameMap.get(id))
        .filter((name): name is string => Boolean(name));

      for (const p of resourcePermissions) {
        currentNames = updatePermissionSelection(currentNames, p.name, true);
      }

      const updatedIds = currentNames
        .map((name) => nameToIdMap.get(name))
        .filter((id): id is string => Boolean(id));

      onChange(updatedIds);
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
        {selectedPermissionIds.length} permissions {disabled ? "assigned" : "selected"}
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
                    onCheckedChange={() => !disabled && handleToggleResource(resource)}
                    disabled={disabled}
                    className={
                      isResourcePartiallySelected(resource)
                        ? "data-[state=checked]:bg-primary/50"
                        : ""
                    }
                  />
                  <Label
                    htmlFor={`resource-${resource}`}
                    className={`text-sm font-semibold capitalize ${disabled ? "cursor-default" : "cursor-pointer"}`}
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
                          !disabled && handleTogglePermission(permission.id)
                        }
                        disabled={disabled}
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={permission.id}
                          className={`text-sm font-normal ${disabled ? "cursor-default" : "cursor-pointer"}`}
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
