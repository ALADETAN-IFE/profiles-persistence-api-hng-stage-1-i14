import { v7 as uuidv7, validate as validateUuid } from "uuid";
import { prisma } from "@/lib/prisma";
import { BadGatewayError, logger, NotFoundError } from "@/utils";
import {
  AgifyResponse,
  ProfileDataset,
  GenderizeResponse,
  NationalizeResponse,
  ProfileFilters,
  ProfileListResult,
  ProfileQueryOptions,
} from "./profile.type";

const getAgeGroup = (age: number) => {
  if (age <= 12) return "child";
  if (age <= 19) return "teenager";
  if (age <= 59) return "adult";
  return "senior";
};

const countryDisplayNames = new Intl.DisplayNames(["en"], { type: "region" });

const getCountryNameFromCode = (countryCode: string) =>
  countryDisplayNames.of(countryCode.toUpperCase()) ??
  countryCode.toUpperCase();

const getCountryCodeMap = () => {
  const map = new Map<string, string>();

  for (let first = 65; first <= 90; first++) {
    for (let second = 65; second <= 90; second++) {
      const code = `${String.fromCharCode(first)}${String.fromCharCode(second)}`;
      const name = countryDisplayNames.of(code);
      if (name && name !== code) {
        map.set(name.toLowerCase(), code);
      }
    }
  }

  return map;
};

const countryCodeMap = getCountryCodeMap();

const fetchJsonResponse = async <T>(
  url: string,
  source: string,
): Promise<T> => {
  let response: globalThis.Response;

  try {
    response = await fetch(url);
    logger.info(
      "ProfileService",
      `Fetched data from ${source} for URL: ${url}`,
    );
  } catch {
    throw new BadGatewayError(`${source} returned an invalid response`);
  }

  if (!response.ok) {
    throw new BadGatewayError(`${source} returned an invalid response`);
  }

  try {
    const rawBody = await response.text();
    logger.info("ProfileService", `JSON response from ${source}: ${rawBody}`);
    return JSON.parse(rawBody) as T;
  } catch {
    throw new BadGatewayError(`${source} returned an invalid response`);
  }
};

const buildWhereFilter = (filters: ProfileFilters) => ({
  ...(filters.gender ? { gender: filters.gender.toLowerCase() } : {}),
  ...(filters.country_id
    ? { country_id: filters.country_id.toUpperCase() }
    : {}),
  ...(filters.age_group ? { age_group: filters.age_group.toLowerCase() } : {}),
  ...(typeof filters.min_age === "number" || typeof filters.max_age === "number"
    ? {
        age: {
          ...(typeof filters.min_age === "number"
            ? { gte: filters.min_age }
            : {}),
          ...(typeof filters.max_age === "number"
            ? { lte: filters.max_age }
            : {}),
        },
      }
    : {}),
  ...(typeof filters.min_gender_probability === "number"
    ? { gender_probability: { gte: filters.min_gender_probability } }
    : {}),
  ...(typeof filters.min_country_probability === "number"
    ? { country_probability: { gte: filters.min_country_probability } }
    : {}),
});

const getCountryCodeByQuery = (query: string) => {
  const fromMatch = query.match(/\bfrom\s+([a-z\s]+)$/i);
  if (fromMatch?.[1]) {
    const countryName = fromMatch[1].trim().toLowerCase();
    return countryCodeMap.get(countryName);
  }

  for (const [countryName, code] of countryCodeMap.entries()) {
    const escaped = countryName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}\\b`, "i").test(query)) {
      return code;
    }
  }

  return undefined;
};

const parseNaturalLanguageQuery = (q: string): ProfileFilters | null => {
  const normalized = q.trim().toLowerCase();
  const filters: ProfileFilters = {};

  if (!normalized) {
    return null;
  }

  const hasMale = /\bmale(s)?\b/.test(normalized);
  const hasFemale = /\bfemale(s)?\b/.test(normalized);

  if (hasMale && !hasFemale) filters.gender = "male";
  if (hasFemale && !hasMale) filters.gender = "female";

  if (/\byoung\b/.test(normalized)) {
    filters.min_age = 16;
    filters.max_age = 24;
  }

  if (/\bchild(ren)?\b/.test(normalized)) {
    filters.age_group = "child";
  } else if (/\bteen(ager|agers|age|ages)?\b/.test(normalized)) {
    filters.age_group = "teenager";
  } else if (/\badult(s)?\b/.test(normalized)) {
    filters.age_group = "adult";
  } else if (/\bsenior(s)?\b/.test(normalized)) {
    filters.age_group = "senior";
  }

  const abovePatterns = [
    /\babove\s+(\d{1,3})\b/,
    /\bover\s+(\d{1,3})\b/,
    /\bolder than\s+(\d{1,3})\b/,
    /\b(\d{1,3})\+\b/,
  ];
  for (const pattern of abovePatterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      filters.min_age = Number(match[1]);
      break;
    }
  }

  const underPatterns = [/\bbelow\s+(\d{1,3})\b/, /\bunder\s+(\d{1,3})\b/];
  for (const pattern of underPatterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      filters.max_age = Number(match[1]);
      break;
    }
  }

  const countryId = getCountryCodeByQuery(normalized);
  if (countryId) {
    filters.country_id = countryId;
  }

  if (Object.keys(filters).length === 0) {
    return null;
  }

  return filters;
};

export const createProfileByName = async (
  name: string,
  dataset: ProfileDataset = "v1",
) => {
  const existing = await prisma.profile.findUnique({ where: { name } });

  if (existing) {
    logger.info("ProfileService", `Profile already exists for name: ${name}`);
    return {
      profile: existing,
      alreadyExists: true,
    };
  }

  const [genderize, agify, nationalize] = await Promise.all([
    fetchJsonResponse<GenderizeResponse>(
      `https://api.genderize.io?name=${encodeURIComponent(name)}`,
      "Genderize",
    ),
    fetchJsonResponse<AgifyResponse>(
      `https://api.agify.io?name=${encodeURIComponent(name)}`,
      "Agify",
    ),
    fetchJsonResponse<NationalizeResponse>(
      `https://api.nationalize.io?name=${encodeURIComponent(name)}`,
      "Nationalize",
    ),
  ]);

  const gender = genderize.gender;
  const sampleSize = Number(genderize.count ?? 0);

  if (gender === null || sampleSize === 0) {
    throw new BadGatewayError("Genderize returned an invalid response");
  }

  const age = agify.age;
  if (age === null) {
    throw new BadGatewayError("Agify returned an invalid response");
  }

  if (!Array.isArray(nationalize.country) || nationalize.country.length === 0) {
    throw new BadGatewayError("Nationalize returned an invalid response");
  }

  const topCountry = nationalize.country.reduce((best, current) =>
    current.probability > best.probability ? current : best,
  );

  const country_id = topCountry.country_id.toUpperCase();

  const created = await prisma.profile.create({
    data: {
      id: uuidv7(),
      name,
      dataset,
      gender,
      gender_probability: Number(genderize.probability ?? 0),
      sample_size: sampleSize,
      age,
      age_group: getAgeGroup(age),
      country_id,
      country_name: getCountryNameFromCode(country_id),
      country_probability: Number(topCountry.probability ?? 0),
    },
  });

  logger.info(
    "ProfileService",
    `Created profile ${created.id} for name: ${name}`,
  );

  return {
    profile: created,
    alreadyExists: false,
  };
};

export const getProfileById = async (id: string, dataset?: ProfileDataset) => {
  if (!validateUuid(id)) {
    throw new NotFoundError("Profile not found");
  }

  const profile = await prisma.profile.findFirst({
    where: {
      id,
      ...(dataset ? { dataset } : {}),
    },
  });
  if (!profile) {
    throw new NotFoundError("Profile not found");
  }

  logger.info("ProfileService", `Fetched profile ${id}`);

  return profile;
};

export const listProfilesByFilter = async (
  { filters, page, limit, sort_by, order }: ProfileQueryOptions,
  dataset?: ProfileDataset,
): Promise<ProfileListResult> => {
  const where = buildWhereFilter(filters);

  const [data, total] = await Promise.all([
    prisma.profile.findMany({
      where: {
        ...where,
        ...(dataset ? { dataset } : {}),
      },
      orderBy: { [sort_by]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.profile.count({
      where: {
        ...where,
        ...(dataset ? { dataset } : {}),
      },
    }),
  ]);

  logger.info(
    "ProfileService",
    `Listed ${data.length} profile(s), total=${total}`,
  );

  return {
    page,
    limit,
    total,
    data,
  };
};

export const searchProfilesByQuery = async (
  q: string,
  page: number,
  limit: number,
  dataset?: ProfileDataset,
): Promise<ProfileListResult | null> => {
  const filters = parseNaturalLanguageQuery(q);
  if (!filters) {
    return null;
  }

  return listProfilesByFilter(
    {
      filters,
      page,
      limit,
      sort_by: "created_at",
      order: "desc",
    },
    dataset,
  );
};

export const deleteProfileById = async (
  id: string,
  dataset?: ProfileDataset,
) => {
  if (!validateUuid(id)) {
    throw new NotFoundError("Profile not found");
  }

  const deleted = await prisma.profile.deleteMany({
    where: {
      id,
      ...(dataset ? { dataset } : {}),
    },
  });
  if (deleted.count === 0) {
    throw new NotFoundError("Profile not found");
  }

  logger.info("ProfileService", `Deleted profile ${id}`);
};
