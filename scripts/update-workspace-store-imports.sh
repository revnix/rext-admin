#!/bin/bash

# Script to update workspace-store imports to use new modular structure
# Replaces @/stores/workspace-store with @/stores/workspace

echo "Updating workspace-store imports..."

# Find all TypeScript/TSX files that import from workspace-store
files=(
  "components/app-sidebar.tsx"
  "components/workspace/workspace-overview-form.tsx"
  "components/workspace/workspace-detail.tsx"
  "components/workspace/workspace-delete-dialog.tsx"
  "components/workspace/editable-brand-voice-card.tsx"
  "components/workspace/brand-voice-refresh-control.tsx"
  "components/workspace/workspace-create-wizard.tsx"
  "components/workspace-switcher.tsx"
  "components/content-creation/fields/selected-topic-display.tsx"
  "components/content-creation/fields/topic-picker-modal.tsx"
  "components/content-creation/steps/topic-content-step.tsx"
  "components/content-creation/content-creation-wizard.tsx"
  "components/topic-builder/results/actions/hooks/useNavigateToContent.ts"
  "components/topic-builder/results/actions/hooks/useSaveTopic.ts"
  "components/topic-builder/results/TopicActions.old.tsx"
  "components/topic-builder/results/TopicsList.tsx"
  "hooks/use-topic-builder.ts"
  "providers/workspace-provider.tsx"
  "providers/workspace-permission-provider.tsx"
  "app/w/[workspaceSlug]/topics/create/results/[temporaryId]/page.tsx"
  "app/w/page.tsx"
  "app/topics/topic-detail-client.tsx"
)

count=0

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    # Replace @/stores/workspace-store with @/stores/workspace
    sed -i.bak 's/@\/stores\/workspace-store/@\/stores\/workspace/g' "$file"

    # Remove backup file
    rm -f "${file}.bak"

    ((count++))
    echo "✓ Updated: $file"
  else
    echo "✗ File not found: $file"
  fi
done

echo ""
echo "✅ Updated $count files"
echo "All imports now use @/stores/workspace"
