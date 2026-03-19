export interface ProfileDraft {
  display_name: string;
  age: string;
  city: string;
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
  country: "Brasil",
  category: "",
  bio: "",
  languages: "Português",
  pricing_from: "",
  whatsapp: "",
  telegram: "",
};

export const CATEGORIES = [
  "Acompanhante",
  "Massagista",
  "Dominatrix",
  "Trans",
  "Dupla",
];

export const CITIES = [
  "São Paulo",
  "Rio de Janeiro",
  "Belo Horizonte",
  "Curitiba",
  "Brasília",
  "Salvador",
  "Fortaleza",
  "Porto Alegre",
  "Recife",
  "Goiânia",
];
