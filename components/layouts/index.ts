/**
 * The five page layouts (design/app-language.md §6). Every page inside the shell renders one of them, in
 * its page.tsx or in the layout.tsx of its area; `pnpm layout:check` holds the rule.
 */
export { DetailPage, type DetailPageProps } from "./detail-page";
export { FormPage, type FormPageProps } from "./form-page";
export { ListPage, type ListPageProps } from "./list-page";
/** For loading.tsx and error.tsx files only: a skeleton or an error in the same frame as the page. */
export { PageFrame } from "./page-frame";
export { PageHeader, type PageHeaderProps } from "./page-header";
export {
  PageSkeleton,
  type PageSkeletonLayout,
  SectionSkeleton,
} from "./page-skeleton";
export {
  SettingsPage,
  type SettingsPageProps,
  type SettingsSection,
} from "./settings-page";
/** The Generate flow's step column: a step's width, or the room for a side pane beside it. */
export { StepColumn } from "./step-column";
/** A main column with a side pane (a sheet on narrow screens), for a step inside a working surface. */
export { WithSidePane, type WithSidePaneProps } from "./side-pane";
export { WorkingSurface, type WorkingSurfaceProps } from "./working-surface";
