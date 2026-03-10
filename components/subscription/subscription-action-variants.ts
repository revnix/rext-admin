/**
 * Subscription CTA rules:
 * - upgradePrimary: conversion-critical actions (upgrade, subscribe)
 * - navigateSecondary: non-destructive navigation (view usage, manage billing)
 * - dismissTertiary: low-emphasis dismiss/close controls
 * - destructiveAction: irreversible actions (cancel subscription)
 */

export const SUBSCRIPTION_ACTION_VARIANTS = {
  upgradePrimary: "default",
  navigateSecondary: "outline",
  dismissTertiary: "ghost",
  destructiveAction: "destructive",
} as const;

export type SubscriptionActionVariant =
  (typeof SUBSCRIPTION_ACTION_VARIANTS)[keyof typeof SUBSCRIPTION_ACTION_VARIANTS];
