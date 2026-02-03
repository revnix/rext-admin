# Responsive Header/Navigation Layout

## Overview

This implementation provides a responsive header and navigation layout that adapts between desktop and mobile viewports, with special handling for the workspace switcher component.

## Layout Behavior

### Desktop Layout (>768px)
- **Sidebar**: Positioned on the left side of the screen
- **Workspace Switcher**: Located within the sidebar header (`AppSidebar` component)
- **Navigation Icons**: Arranged horizontally in the main header
  - Menu toggle (hamburger)
  - Search
  - Notifications (with unread badge)
  - Settings dropdown
  - Help dropdown
  - Theme toggle (light/dark/system)
  - User profile dropdown

### Mobile Layout (≤768px)
- **Workspace Switcher**: Moved to a fixed position at the top of the page
  - Full width with 16px horizontal padding
  - Sticky positioning (z-index: 50)
  - Appears above the navigation icons row
- **Navigation Icons**: Positioned directly below the workspace switcher
  - 12-16px vertical gap from workspace switcher
  - Maintains horizontal layout
  - Touch-friendly sizing (44px minimum touch targets)
- **Sidebar**: Collapses into a mobile menu (triggered by hamburger icon)

## Component Structure

### Main Components

1. **PageLayout** (`/components/page-layout.tsx`)
   - Main layout wrapper
   - Handles responsive workspace switcher positioning
   - Contains header with navigation icons

2. **AppSidebar** (`/components/app-sidebar.tsx`)
   - Left sidebar navigation
   - Contains WorkspaceSwitcher in header (desktop only)
   - Collapsible on mobile

3. **WorkspaceSwitcher** (`/components/workspace-switcher.tsx`)
   - Company/location selector
   - Logo + "RevnixRe" + "Asia/Karachi"
   - Dropdown for workspace selection

## Technical Implementation

### Responsive Breakpoint
```css
/* Mobile: default styles */
/* Desktop: md: prefix (768px and above) */
```

### Z-Index Layering
- Mobile Workspace Switcher: `z-50`
- Main Header: `z-40`
- Ensures proper stacking order

### Key CSS Classes

#### Mobile Workspace Switcher Container
```tsx
<div className="md:hidden sticky top-0 z-50 bg-white dark:bg-sidebar border-b border-border px-4 py-3">
  <WorkspaceSwitcher />
</div>
```

#### Main Header
```tsx
<header className="sticky top-0 md:top-0 z-40 flex h-20 shrink-0 items-center justify-between gap-4 border-b border-border bg-white px-6 dark:bg-sidebar">
  {/* Navigation icons */}
</header>
```

## Dark Theme Support

The layout maintains dark theme consistency using CSS custom properties:

- Background: `bg-white dark:bg-sidebar`
- Borders: `border-border`
- Hover states: `hover:bg-[var(--color-brand-50)] dark:hover:bg-[var(--color-brand-900)]/50`
- Text colors: `text-slate-500 dark:text-sidebar-foreground`

## Navigation Icons

### Icon Row (Right side of header)
1. **Notifications** - Bell icon with unread count badge
2. **Settings** - Dropdown menu for workspace and app settings
3. **Help** - Dropdown with documentation and support links
4. **Theme Toggle** - Sun/Moon icon for theme switching
5. **User Profile** - Avatar with account menu

### Icon Specifications
- Size: `h-10 w-10` (40px)
- Shape: Rounded (`rounded-full`)
- Hover: Brand color background with smooth transition
- Active states: Visual feedback on click

## Accessibility Features

- **ARIA Labels**: All icon buttons include screen reader text
- **Keyboard Navigation**: Full keyboard support for all interactive elements
- **Focus States**: Visible focus indicators
- **Touch Targets**: Minimum 44px for mobile interactions
- **Semantic HTML**: Proper use of `<header>`, `<nav>`, and landmark roles

## Workspace Switcher Component

### Desktop Display
- Located in sidebar header
- Shows logo, workspace name, and timezone
- Dropdown trigger with chevron icon

### Mobile Display
- Fixed at top of viewport
- Full-width layout
- Maintains same visual design
- Dropdown opens below (not to the side)

### Component Props
```tsx
<WorkspaceSwitcher />
// No props needed - uses context/stores internally
```

## Responsive Utilities

### Visibility Classes
- `md:hidden` - Hide on desktop (≥768px)
- `hidden md:flex` - Hide on mobile, show on desktop

### Layout Classes
- `sticky top-0` - Stick to top of viewport
- `flex items-center justify-between` - Horizontal layout with space between
- `gap-4` - 16px gap between items

## Smooth Transitions

All interactive elements include smooth transitions:
```css
transition-all
transition-colors
ease-linear
```

## Usage Example

```tsx
import { PageLayout } from "@/components/page-layout";

export default function MyPage() {
  return (
    <PageLayout
      title="Dashboard"
      description="Welcome to your workspace"
    >
      {/* Page content */}
    </PageLayout>
  );
}
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Responsive breakpoints tested at: 375px, 768px, 1024px, 1440px

## Performance Considerations

- Sticky positioning uses GPU acceleration
- Minimal re-renders with proper React hooks
- Optimized z-index layering
- Efficient CSS with Tailwind utilities

## Future Enhancements

- [ ] Add animation for mobile menu slide-in
- [ ] Implement breadcrumb navigation in header
- [ ] Add quick actions menu
- [ ] Support for custom header actions per page
