export type CategoryDefinition = {
  key: string;
  slug: string;
  dbValue: string;
};

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  { key: "cat.women", slug: "women", dbValue: "Women" },
  { key: "cat.men", slug: "men", dbValue: "Men" },
  { key: "cat.couples", slug: "couples", dbValue: "Couples" },
  { key: "cat.shemales", slug: "shemales", dbValue: "Trans" },
  { key: "cat.gay", slug: "gay", dbValue: "Gay" },
  { key: "cat.virtual_sex", slug: "virtual-sex", dbValue: "Virtual" },
  { key: "cat.videos", slug: "videos", dbValue: "Videos" },
];

export const CATEGORY_SLUGS = CATEGORY_DEFINITIONS.map((category) => category.slug);

export const CATEGORY_DB_VALUE_BY_SLUG = CATEGORY_DEFINITIONS.reduce<Record<string, string>>((acc, category) => {
  acc[category.slug] = category.dbValue;
  return acc;
}, {});
