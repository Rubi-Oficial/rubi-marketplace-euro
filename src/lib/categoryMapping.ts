export type CategoryDefinition = {
  key: string;
  slug: string;
  dbValue: string;
};

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  { key: "cat.women", slug: "women", dbValue: "female" },
  { key: "cat.men", slug: "men", dbValue: "male" },
  { key: "cat.couples", slug: "couples", dbValue: "couple" },
  { key: "cat.shemales", slug: "shemales", dbValue: "trans" },
  { key: "cat.gay", slug: "gay", dbValue: "gay" },
  { key: "cat.virtual_sex", slug: "virtual-sex", dbValue: "virtual" },
  { key: "cat.videos", slug: "videos", dbValue: "videos" },
];

export const CATEGORY_SLUGS = CATEGORY_DEFINITIONS.map((category) => category.slug);

export const CATEGORY_DB_VALUE_BY_SLUG = CATEGORY_DEFINITIONS.reduce<Record<string, string>>((acc, category) => {
  acc[category.slug] = category.dbValue;
  return acc;
}, {});
