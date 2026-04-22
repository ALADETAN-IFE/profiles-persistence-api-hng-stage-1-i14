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
  min_age?: number;
  max_age?: number;
  min_gender_probability?: number;
  min_country_probability?: number;
};

export type ProfileDataset = "v1" | "v2";

export type ProfileSortBy = "age" | "created_at" | "gender_probability";
export type SortOrder = "asc" | "desc";

export type ProfileQueryOptions = {
  filters: ProfileFilters;
  page: number;
  limit: number;
  sort_by: ProfileSortBy;
  order: SortOrder;
};

export type ProfileSearchQueryOptions = {
  q: string;
  page: number;
  limit: number;
};

export type ProfileRecord = {
  id: string;
  name: string;
  dataset: string;
  gender: string;
  gender_probability: number;
  sample_size: number;
  age: number;
  age_group: string;
  country_id: string;
  country_name: string;
  country_probability: number;
  created_at: Date;
};

export type ProfileListResult = {
  page: number;
  limit: number;
  total: number;
  data: ProfileRecord[];
};
