import { Request } from "express";
import {
  BadRequestError,
  NotFoundError,
  UnprocessableEntityError,
} from "@/utils";
import { ProfileQueryOptions, ProfileSearchQueryOptions } from "./profile.type";

const allowedListQueryParams = new Set([
  "gender",
  "age_group",
  "country_id",
  "min_age",
  "max_age",
  "min_gender_probability",
  "min_country_probability",
  "sort_by",
  "order",
  "page",
  "limit",
]);

const allowedSearchQueryParams = new Set(["q", "page", "limit"]);

const getOptionalStringQuery = (
  value: Request["query"]["gender" | "country_id" | "age_group"],
  fieldName: string,
) => {
  if (typeof value === "undefined") {
    return undefined;
  }

  if (Array.isArray(value) || typeof value !== "string") {
    throw new UnprocessableEntityError(`${fieldName} must be a string`);
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  return normalized;
};

const getNumberQuery = (
  value: Request["query"][string],
  fieldName: string,
  required = false,
) => {
  if (typeof value === "undefined") {
    if (required) {
      throw new BadRequestError(`Missing or empty ${fieldName}`);
    }
    return undefined;
  }

  if (Array.isArray(value) || typeof value !== "string") {
    throw new UnprocessableEntityError("Invalid query parameters");
  }

  const normalized = value.trim();
  if (!normalized) {
    if (required) {
      throw new BadRequestError(`Missing or empty ${fieldName}`);
    }
    return undefined;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    throw new UnprocessableEntityError("Invalid query parameters");
  }

  return parsed;
};

const ensureAllowedParams = (
  query: Request["query"],
  allowedParams: Set<string>,
) => {
  for (const key of Object.keys(query)) {
    if (!allowedParams.has(key)) {
      throw new UnprocessableEntityError("Invalid query parameters");
    }
  }
};

export const getNormalizedName = (body: Request["body"]) => {
  if (typeof body === "undefined") {
    throw new BadRequestError("Missing or empty name");
  }

  const { name } = body as { name?: unknown };

  if (typeof name === "undefined") {
    throw new BadRequestError("Missing or empty name");
  }

  if (typeof name !== "string") {
    throw new UnprocessableEntityError("name must be a string");
  }

  const normalized = name.trim().toLowerCase();

  if (!normalized) {
    throw new BadRequestError("Missing or empty name");
  }

  return normalized;
};

export const getIdParam = (idParam: Request["params"]["id"]) => {
  if (typeof idParam !== "string") {
    throw new NotFoundError("Profile not found");
  }

  return idParam;
};

export const parseListProfilesQuery = (
  query: Request["query"],
): ProfileQueryOptions => {
  ensureAllowedParams(query, allowedListQueryParams);

  const gender = getOptionalStringQuery(query.gender, "gender");
  const country_id = getOptionalStringQuery(query.country_id, "country_id");
  const age_group = getOptionalStringQuery(query.age_group, "age_group");

  const min_age = getNumberQuery(query.min_age, "min_age");
  const max_age = getNumberQuery(query.max_age, "max_age");
  const min_gender_probability = getNumberQuery(
    query.min_gender_probability,
    "min_gender_probability",
  );
  const min_country_probability = getNumberQuery(
    query.min_country_probability,
    "min_country_probability",
  );

  const rawSortBy = getOptionalStringQuery(
    query.sort_by as Request["query"]["gender"],
    "sort_by",
  );
  const rawOrder = getOptionalStringQuery(
    query.order as Request["query"]["gender"],
    "order",
  );

  const sort_by = (rawSortBy ?? "created_at") as ProfileQueryOptions["sort_by"];
  const order = (rawOrder ?? "desc") as ProfileQueryOptions["order"];

  if (!["age", "created_at", "gender_probability"].includes(sort_by)) {
    throw new UnprocessableEntityError("Invalid query parameters");
  }

  if (!["asc", "desc"].includes(order)) {
    throw new UnprocessableEntityError("Invalid query parameters");
  }

  const page = getNumberQuery(query.page, "page") ?? 1;
  const limit = getNumberQuery(query.limit, "limit") ?? 10;

  if (!Number.isInteger(page) || page < 1) {
    throw new UnprocessableEntityError("Invalid query parameters");
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw new UnprocessableEntityError("Invalid query parameters");
  }

  if (
    typeof min_age === "number" &&
    (!Number.isInteger(min_age) || min_age < 0)
  ) {
    throw new UnprocessableEntityError("Invalid query parameters");
  }

  if (
    typeof max_age === "number" &&
    (!Number.isInteger(max_age) || max_age < 0)
  ) {
    throw new UnprocessableEntityError("Invalid query parameters");
  }

  if (
    typeof min_age === "number" &&
    typeof max_age === "number" &&
    min_age > max_age
  ) {
    throw new UnprocessableEntityError("Invalid query parameters");
  }

  if (
    typeof min_gender_probability === "number" &&
    (min_gender_probability < 0 || min_gender_probability > 1)
  ) {
    throw new UnprocessableEntityError("Invalid query parameters");
  }

  if (
    typeof min_country_probability === "number" &&
    (min_country_probability < 0 || min_country_probability > 1)
  ) {
    throw new UnprocessableEntityError("Invalid query parameters");
  }

  return {
    filters: {
      gender,
      country_id,
      age_group,
      min_age,
      max_age,
      min_gender_probability,
      min_country_probability,
    },
    page,
    limit,
    sort_by,
    order,
  };
};

export const parseSearchQuery = (
  query: Request["query"],
): ProfileSearchQueryOptions => {
  ensureAllowedParams(query, allowedSearchQueryParams);

  const q = getOptionalStringQuery(query.q as Request["query"]["gender"], "q");
  if (!q) {
    throw new BadRequestError("Missing or empty q");
  }

  const page = getNumberQuery(query.page, "page") ?? 1;
  const limit = getNumberQuery(query.limit, "limit") ?? 10;

  if (!Number.isInteger(page) || page < 1) {
    throw new UnprocessableEntityError("Invalid query parameters");
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw new UnprocessableEntityError("Invalid query parameters");
  }

  return { q, page, limit };
};
