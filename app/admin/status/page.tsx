"use client";

import { IncidentBannerForm } from "@/components/admin/incident-banner-form";
import { FormPage } from "@/components/layouts";
import { AdminGuard } from "@/components/permission/admin-guard";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { Notice } from "@/components/ui/notice";
import { SECURITY_PERMISSIONS } from "@/lib/permissions";

export default function IncidentBannerPage() {
  return (
    <AdminGuard>
      <FormPage
        title="Incident banner"
        description="One notice on every signed-in page while something is failing. It goes up within a minute, with no deploy, and always ends by itself."
      >
        {/* The switch is the backend's security.manage. An admin without it who opens this address
            gets the reason, not a form whose every request would be refused. */}
        <PermissionGuard
          permission={SECURITY_PERMISSIONS.MANAGE}
          fallback={
            <Notice tone="warning" title="You can't switch the incident banner">
              Switching it on or off needs the security management permission,
              which super admins hold.
            </Notice>
          }
        >
          <IncidentBannerForm />
        </PermissionGuard>
      </FormPage>
    </AdminGuard>
  );
}
