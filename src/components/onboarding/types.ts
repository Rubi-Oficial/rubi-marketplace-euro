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

/** @deprecated Use useLocations() hook instead — cities come from the database */
export interface CityOption {
  name: string;
  slug: string;
}

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
