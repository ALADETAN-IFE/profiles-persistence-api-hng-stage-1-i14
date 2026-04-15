export type GenderizeResponse = {
  gender: "male" | "female" | null;
  probability: number | null;
  count: number | null;
};

export type AgifyResponse = {
  age: number | null;
};

export type NationalizeResponse = {
  country: Array<{
    country_id: string;
    probability: number;
  }>;
};

export type ProfileFilters = {
  gender?: string;
  country_id?: string;
  age_group?: string;
};

export type ProfileRecord = {
  id: string;
  name: string;
  gender: string;
  gender_probability: number;
  sample_size: number;
  age: number;
  age_group: string;
  country_id: string;
  country_probability: number;
  created_at: Date;
};

export type ProfileListRecord = {
  id: string;
  name: string;
  gender: string;
  age: number;
  age_group: string;
  country_id: string;
};
