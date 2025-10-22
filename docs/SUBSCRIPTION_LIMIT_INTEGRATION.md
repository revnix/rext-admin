# Subscription Limit Integration Guide

This guide shows how to integrate subscription limit checks throughout the application.

## Components Available

### 1. LimitCheckWrapper
Wraps buttons/forms and prevents actions when limits are reached.

### 2. useCheckLimit Hook
Programmatic limit checking for complex flows.

### 3. UsageLimitWarning
Displays warnings when approaching or at limits.

### 4. useResourceLimit Hook
Low-level hook for custom limit logic.

## Integration Examples

### Example 1: Workspace Creation Button

**File:** `components/workspace/workspace-list.tsx`

```tsx
import { LimitCheckWrapper } from "@/components/subscription/limit-check-wrapper";

function WorkspaceList() {
  return (
    <div>
      <LimitCheckWrapper resource="workspaces" actionName="Create Workspace">
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Workspace
        </Button>
      </LimitCheckWrapper>
    </div>
  );
}
```

### Example 2: Topic Creation Form

**File:** `components/topic/topic-create-form.tsx`

```tsx
import { useCheckLimit } from "@/components/subscription/limit-check-wrapper";
import { UsageLimitWarning } from "@/components/subscription/usage-limit-warning";

function TopicCreateForm() {
  const { checkLimit, warnIfApproaching } = useCheckLimit("topics");

  // Warn when form opens
  useEffect(() => {
    warnIfApproaching(80);
  }, []);

  const handleSubmit = async (data) => {
    // Check limit before API call
    if (!checkLimit("create a topic")) {
      return;
    }

    // Proceed with creation
    await createTopic(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Show warning at top of form */}
      <UsageLimitWarning
        resource="topics"
        compact={true}
        className="mb-4"
      />

      {/* Form fields */}
      <Input name="title" />
      <Button type="submit">Create Topic</Button>
    </form>
  );
}
```

### Example 3: Knowledge Item Upload

**File:** `components/knowledge/knowledge-upload.tsx`

```tsx
import { useResourceLimit } from "@/components/subscription/usage-limit-warning";

function KnowledgeUpload() {
  const { isLimitReached, canCreate } = useResourceLimit("knowledge_items");

  const handleFileSelect = (files) => {
    if (!canCreate) {
      toast.error("Knowledge item limit reached", {
        description: "Please upgrade your plan to upload more items.",
      });
      return;
    }

    // Proceed with upload
    uploadFiles(files);
  };

  return (
    <div>
      {isLimitReached && (
        <Alert variant="destructive">
          <AlertTitle>Upload Disabled</AlertTitle>
          <AlertDescription>
            You've reached your knowledge item limit. Upgrade to continue.
          </AlertDescription>
        </Alert>
      )}

      <input
        type="file"
        onChange={handleFileSelect}
        disabled={isLimitReached}
      />
    </div>
  );
}
```

### Example 4: AI Request Limit

**File:** `components/content/ai-content-generator.tsx`

```tsx
import { useCheckLimit } from "@/components/subscription/limit-check-wrapper";
import { UsageLimitWarning } from "@/components/subscription/usage-limit-warning";

function AIContentGenerator() {
  const { checkLimit, usagePercentage } = useCheckLimit("ai_requests");

  const handleGenerate = async () => {
    if (!checkLimit("generate AI content")) {
      return;
    }

    await generateContent();
  };

  return (
    <div>
      {/* Show warning if over 50% usage */}
      {usagePercentage > 50 && (
        <UsageLimitWarning
          resource="ai_requests"
          warningThreshold={50}
          criticalThreshold={90}
        />
      )}

      <Button onClick={handleGenerate}>
        Generate Content
      </Button>
    </div>
  );
}
```

### Example 5: Dashboard Overview

**File:** `app/dashboard/page.tsx`

```tsx
import { UsageLimitWarning } from "@/components/subscription/usage-limit-warning";

function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Show all resource warnings */}
      <UsageLimitWarning resource="workspaces" />
      <UsageLimitWarning resource="topics" />
      <UsageLimitWarning resource="ai_requests" />

      {/* Dashboard content */}
    </div>
  );
}
```

### Example 6: Feature Gate for Premium Features

**File:** `components/analytics/advanced-analytics.tsx`

```tsx
import { FeatureGate } from "@/components/subscription/feature-gate";

function AdvancedAnalytics() {
  return (
    <FeatureGate
      feature="advanced_analytics"
      requiredPlan={["pro", "enterprise"]}
      upgradeTitle="Advanced Analytics"
      upgradeDescription="Get detailed insights with advanced analytics features."
    >
      {/* Premium analytics dashboard */}
      <AnalyticsDashboard />
    </FeatureGate>
  );
}
```

### Example 7: Soft Gate (Warning but Allow Access)

**File:** `components/exports/bulk-export.tsx`

```tsx
import { FeatureGate } from "@/components/subscription/feature-gate";

function BulkExport() {
  return (
    <FeatureGate
      feature="bulk_export"
      requiredPlan={["pro", "enterprise"]}
      soft={true} // Show warning but allow access
      upgradeDescription="Bulk export is limited on free plans. Upgrade for unlimited exports."
    >
      {/* Export functionality still works but shows upgrade prompt */}
      <ExportDialog />
    </FeatureGate>
  );
}
```

## Where to Add Limit Checks

### Critical Integration Points

1. **Workspace Creation**
   - ✅ Added to `workspace-create-wizard.tsx`
   - Recommended: Add to workspace list create button
   - File: `components/workspace/workspace-list.tsx`

2. **Topic Creation**
   - Add to topic creation dialog/form
   - Files: Look for topic creation components

3. **Knowledge Items**
   - Add to upload/import flows
   - Add to manual creation forms
   - Files: `components/knowledge/`

4. **AI Content Generation**
   - Add before any AI API calls
   - Track requests per month
   - Files: `components/content/`, `components/topic-builder/`

5. **Media Uploads**
   - Check storage limits before upload
   - Show storage usage prominently
   - Files: `components/media/`

## Best Practices

### 1. Check Early
Always check limits before expensive operations:
```tsx
// ✅ Good - check before API call
if (!checkLimit("create")) return;
await apiCall();

// ❌ Bad - check after API call
await apiCall();
if (!checkLimit("create")) return; // Too late!
```

### 2. Provide Context
Give users clear information:
```tsx
<UsageLimitWarning
  resource="topics"
  compact={false} // Show full details
  showProgress={true} // Visual progress bar
/>
```

### 3. Multiple Warnings
Show warnings at appropriate thresholds:
```tsx
// Warning at 75%
warnIfApproaching(75);

// Critical at 90%
if (usagePercentage >= 90) {
  // Show urgent warning
}
```

### 4. Analytics Tracking
Track when limits are hit:
```tsx
const { checkLimit } = useCheckLimit("workspaces");

const handleCreate = () => {
  if (!checkLimit("create workspace")) {
    // Track limit hit event
    analytics.track("limit_reached", {
      resource: "workspaces",
      plan: subscription.plan_name,
    });
    return;
  }
};
```

### 5. Graceful Degradation
Disable features gracefully:
```tsx
<Button
  onClick={handleCreate}
  disabled={isLimitReached}
>
  Create {isLimitReached && "(Limit Reached)"}
</Button>
```

## Implementation Checklist

- [x] LimitCheckWrapper component created
- [x] useCheckLimit hook created
- [x] UsageLimitWarning component created
- [x] useResourceLimit hook created
- [x] Workspace creation integrated
- [ ] Topic creation integration
- [ ] Knowledge item upload integration
- [ ] AI request limit integration
- [ ] Media upload storage check
- [ ] Dashboard warnings
- [ ] Settings page integration

## Testing

### Manual Testing
1. Create test account
2. Set low limits in plan (e.g., 2 workspaces)
3. Create workspaces until limit reached
4. Verify:
   - Warning appears at 75%
   - Critical warning at 90%
   - Creation blocked at 100%
   - Upgrade prompts work
   - Toast notifications appear

### Automated Testing
```tsx
describe("Workspace Limit Checks", () => {
  it("should warn when approaching limit", () => {
    // Mock usage at 80%
    mockUsage({ workspaces_used: 8, max: 10 });

    render(<WorkspaceCreateButton />);

    expect(screen.getByText(/80%/)).toBeInTheDocument();
  });

  it("should block creation at limit", () => {
    // Mock usage at 100%
    mockUsage({ workspaces_used: 10, max: 10 });

    render(<WorkspaceCreateButton />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });
});
```

## Troubleshooting

### Limits Not Updating
- Ensure `fetchUsage()` is called after creation
- Check subscription store is properly initialized
- Verify API returns updated usage

### Warnings Not Showing
- Check thresholds (default 75%, 90%)
- Verify resource name matches exactly
- Check if warning was dismissed (localStorage)

### False Positives
- Verify limit value (-1 means unlimited)
- Check calculation: `(used / max) * 100`
- Ensure subscription data is loaded

## Future Enhancements

1. **Real-time Updates**
   - WebSocket updates for usage changes
   - Refresh usage when returning to tab

2. **Grace Period**
   - Allow 1-2 extra creations with warning
   - Soft enforcement for better UX

3. **Usage Forecasting**
   - Predict when limit will be reached
   - Proactive upgrade suggestions

4. **Custom Thresholds**
   - Per-resource warning levels
   - User-configurable alerts
