import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";

// Hardcoded fallback — used as initialData before DB responds and for sync helpers
export const LOCATIONS = [
  { name: "KL",              slug: "kl",              alias: null, display_name: "KL",     chinese_name: "吉隆坡" },
  { name: "Cheras",          slug: "cheras",          alias: null, display_name: "Cheras", chinese_name: "Cheras" },
  { name: "Ampang",          slug: "ampang",          alias: null, display_name: "Ampang", chinese_name: "Ampang" },
  { name: "Negeri Sembilan", slug: "negeri-sembilan", alias: "ns", display_name: "NS",     chinese_name: "森美兰" },
];

// React Query hook — fetches live from DB, falls back to hardcoded above
export function useLocations() {
  return useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data?.length ? data : LOCATIONS;
    },
    initialData: LOCATIONS,
    staleTime: 5 * 60 * 1000,
  });
}

// Sync helpers — accept an optional live array (pass from useLocations() data)
export function getLocationBySlug(slug, locations = LOCATIONS) {
  return locations.find((l) => l.slug === slug);
}

export function getLocationByName(name, locations = LOCATIONS) {
  return locations.find((l) => l.name === name);
}

export function resolveLocationSlug(slug, locations = LOCATIONS) {
  if (!slug) return slug;
  const lower = slug.toLowerCase();
  const byAlias = locations.find((l) => l.alias?.toLowerCase() === lower);
  if (byAlias) return byAlias.slug;
  return lower;
}

export function isValidLocationSlug(slug, locations = LOCATIONS) {
  return !!getLocationBySlug(resolveLocationSlug(slug, locations), locations);
}

export function getPostUrl(post, locations = LOCATIONS) {
  const loc = getLocationByName(post?.location, locations);
  return `/${loc?.slug || "kl"}/${post?.slug}`;
}