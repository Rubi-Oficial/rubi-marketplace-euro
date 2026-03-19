export interface ProfileDraft {
  display_name: string;
  age: string;
  city: string;
  city_slug: string;
  country: string;
  category: string;
  bio: string;
  languages: string;
  pricing_from: string;
  whatsapp: string;
  telegram: string;
}

export const INITIAL_DRAFT: ProfileDraft = {
  display_name: "",
  age: "",
  city: "",
  city_slug: "",
  country: "",
  category: "",
  bio: "",
  languages: "English",
  pricing_from: "",
  whatsapp: "",
  telegram: "",
};

export interface CityOption {
  name: string;
  slug: string;
}

export const CITIES: CityOption[] = [
  { name: "Amsterdam", slug: "amsterdam" },
  { name: "Eindhoven", slug: "eindhoven" },
  { name: "Den Haag", slug: "den-haag" },
  { name: "Barcelona", slug: "barcelona" },
  { name: "Madrid", slug: "madrid" },
];

export const CATEGORIES = [
  "Companion",
  "Massage",
  "Events",
  "Travel",
  "Premium",
];

export interface ServiceOption {
  id: string;
  name: string;
  slug: string;
}
