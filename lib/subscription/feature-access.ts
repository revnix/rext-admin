export function resolvePlanFeatureAccess(
  planFeatures: Record<string, unknown> | undefined,
  feature: string,
): boolean {
  if (!planFeatures) {
    return false; // Null or undefined planFeatures -> fail closed
  }

  // Explicitly check for feature not in planFeatures
  if (!(feature in planFeatures)) {
    return false;
  }

  const featureValue = planFeatures[feature];

  if (typeof featureValue === "boolean") {
    return featureValue;
  }

  if (typeof featureValue === "number") {
    return featureValue > 0;
  }

  if (typeof featureValue === "string") {
    return featureValue.trim().length > 0;
  }

  return false;
}
