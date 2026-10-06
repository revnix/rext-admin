/**
 * The five page layouts (design/app-language.md §6). Every page inside the shell renders one of them, in
 * its page.tsx or in the layout.tsx of its area; `pnpm layout:check` holds the rule.
 */
export { DetailPage, type DetailPageProps } from "./detail-page";
export { FormPage, type FormPageProps } from "./form-page";
export { ListPage, type ListPageProps } from "./list-page";
/** For loading.tsx files only: a skeleton in the same frame as the page it stands for. */
export { PageFrame } from "./page-frame";
export { PageHeader, type PageHeaderProps } from "./page-header";
export {
  SettingsPage,
  type SettingsPageProps,
  type SettingsSection,
} from "./settings-page";
export { WorkingSurface, type WorkingSurfaceProps } from "./working-surface";
