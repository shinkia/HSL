// Single source of truth for locations. Add new locations here in one place.
export const LOCATIONS = [
  { name: "KL", slug: "kl", chineseName: "吉隆坡", displayName: "吉隆坡 (KL)" },
  { name: "Cheras", slug: "cheras", chineseName: "Cheras", displayName: "Cheras" },
  { name: "Ampang", slug: "ampang", chineseName: "Ampang", displayName: "Ampang" },
  { name: "Negeri Sembilan", slug: "negeri-sembilan", chineseName: "森美兰", displayName: "森美兰 (Negeri Sembilan)" },
];

// Short URL aliases that redirect to canonical slugs
export const LOCATION_ALIASES = {
  ns: "negeri-sembilan",
};

export function getLocationBySlug(slug) {
  return LOCATIONS.find((l) => l.slug === slug);
}

export function getLocationByName(name) {
  return LOCATIONS.find((l) => l.name === name);
}

export function resolveLocationSlug(slug) {
  if (!slug) return slug;
  return LOCATION_ALIASES[slug.toLowerCase()] || slug;
}

export function isValidLocationSlug(slug) {
  return !!getLocationBySlug(resolveLocationSlug(slug));
}

export function getPostUrl(post) {
  const loc = getLocationByName(post?.location);
  return `/${loc?.slug || "kl"}/${post?.slug}`;
}