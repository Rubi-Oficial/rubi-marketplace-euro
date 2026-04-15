// Barrel re-export for backwards compatibility
// Consumers should import from specific modules for better tree-shaking:
//   - "@/lib/profileSearch" for fetchEligibleProfiles, prefetchNextBatchUrls, EligibleProfile
//   - "@/lib/profileFilters" for fetchFilterOptions, fetchServices

export type { EligibleProfile, ProfileSearchParams } from "@/lib/profileSearch";
export { fetchEligibleProfiles, prefetchNextBatchUrls } from "@/lib/profileSearch";
export { fetchFilterOptions, fetchServices } from "@/lib/profileFilters";
