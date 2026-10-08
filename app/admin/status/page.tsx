"use client";

import { IncidentBannerForm } from "@/components/admin/incident-banner-form";
import { FormPage } from "@/components/layouts";
import { AdminGuard } from "@/components/permission/admin-guard";

export default function IncidentBannerPage() {
  return (
    <AdminGuard>
      <FormPage
        title="Incident banner"
        description="One notice on every signed-in page while something is failing. It goes up within a minute, with no deploy, and always ends by itself."
      >
        <IncidentBannerForm />
      </FormPage>
    </AdminGuard>
  );
}
