import { Request, Response } from "express";
import {
  BadRequestError,
  logger,
  NotFoundError,
  UnprocessableEntityError,
} from "@/utils";
import {
  createProfileByName,
  deleteProfileById,
  getProfileById,
  listProfilesByFilter,
} from "./profile.service";
import { ProfileListRecord, ProfileRecord } from "./profile.type";

const getNormalizedName = (body: Request["body"]) => {
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

const getIdParam = (idParam: Request["params"]["id"]) => {
  if (typeof idParam !== "string") {
    throw new NotFoundError("Profile not found");
  }

  return idParam;
};

const toResponseProfile = (profile: ProfileRecord) => ({
  id: profile.id,
  name: profile.name,
  gender: profile.gender,
  gender_probability: profile.gender_probability,
  sample_size: profile.sample_size,
  age: profile.age,
  age_group: profile.age_group,
  country_id: profile.country_id,
  country_probability: profile.country_probability,
  created_at: profile.created_at.toISOString(),
});

const getCaseInsensitiveFilter = (
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

const toListResponseProfile = (profile: ProfileListRecord) => ({
  id: profile.id,
  name: profile.name,
  gender: profile.gender,
  age: profile.age,
  age_group: profile.age_group,
  country_id: profile.country_id,
});

export const createProfile = async (req: Request, res: Response) => {
  const name = getNormalizedName(req.body);

  const { profile, alreadyExists } = await createProfileByName(name);

  if (alreadyExists) {
    return res.status(200).json({
      status: "success",
      message: "Profile already exists",
      data: toResponseProfile(profile),
    });
  }

  return res.status(201).json({
    status: "success",
    data: toResponseProfile(profile),
  });
};

export const getProfile = async (req: Request, res: Response) => {
  const id = getIdParam(req.params.id);
  const profile = await getProfileById(id);

  return res.status(200).json({
    status: "success",
    data: toResponseProfile(profile),
  });
};

export const listProfiles = async (req: Request, res: Response) => {
  const gender = getCaseInsensitiveFilter(req.query.gender, "gender");
  const country_id = getCaseInsensitiveFilter(
    req.query.country_id,
    "country_id",
  );
  const age_group = getCaseInsensitiveFilter(req.query.age_group, "age_group");

  const profiles = await listProfilesByFilter({
    gender,
    country_id,
    age_group,
  });

  return res.status(200).json({
    status: "success",
    count: profiles.length,
    data: profiles.map(toListResponseProfile),
  });
};

export const deleteProfile = async (req: Request, res: Response) => {
  const id = getIdParam(req.params.id);
  await deleteProfileById(id);

  return res.status(204).send();
};
