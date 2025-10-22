/**
 * Zustand Stores Index
 *
 * Central exports for all application stores.
 * Organized by feature domain following the established patterns.
 */

// Subscription Domain
export { useSubscriptionStore } from "./subscription-store";
// Topic Builder Domain
export { useTopicBuilderStore } from "./topic-builder-store";

// Future stores can be added here:
// export { useUserStore } from "./user-store";
// export { useUIStore } from "./ui-store";
// export { useNotificationStore } from "./notification-store";
