import { v7 as uuidv7, validate as validateUuid } from "uuid";
import { prisma } from "@/lib/prisma";
import { BadGatewayError, logger, NotFoundError } from "@/utils";
import {
  AgifyResponse,
  GenderizeResponse,
  NationalizeResponse,
  ProfileFilters,
} from "./profile.type";

const getAgeGroup = (age: number) => {
  if (age <= 12) return "child";
  if (age <= 19) return "teenager";
  if (age <= 59) return "adult";
  return "senior";
};

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

export const createProfileByName = async (name: string) => {
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

  const topCountry = nationalize.country.reduce((best, current) => {
    return current.probability > best.probability ? current : best;
  });

  const created = await prisma.profile.create({
    data: {
      id: uuidv7(),
      name,
      gender,
      gender_probability: Number(genderize.probability ?? 0),
      sample_size: sampleSize,
      age,
      age_group: getAgeGroup(age),
      country_id: topCountry.country_id,
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

export const getProfileById = async (id: string) => {
  if (!validateUuid(id)) {
    throw new NotFoundError("Profile not found");
  }

  const profile = await prisma.profile.findUnique({ where: { id } });
  if (!profile) {
    throw new NotFoundError("Profile not found");
  }

  logger.info("ProfileService", `Fetched profile ${id}`);

  return profile;
};

export const listProfilesByFilter = async (filters: ProfileFilters) => {
  const profiles = await prisma.profile.findMany({
    where: {
      ...(filters.gender ? { gender: filters.gender.toLowerCase() } : {}),
      ...(filters.country_id
        ? { country_id: filters.country_id.toUpperCase() }
        : {}),
      ...(filters.age_group
        ? { age_group: filters.age_group.toLowerCase() }
        : {}),
    },
    orderBy: { created_at: "desc" },
  });

  logger.info("ProfileService", `Listed ${profiles.length} profile(s)`);

  return profiles;
};

export const deleteProfileById = async (id: string) => {
  if (!validateUuid(id)) {
    throw new NotFoundError("Profile not found");
  }

  const deleted = await prisma.profile.deleteMany({ where: { id } });
  if (deleted.count === 0) {
    throw new NotFoundError("Profile not found");
  }

  logger.info("ProfileService", `Deleted profile ${id}`);
};
