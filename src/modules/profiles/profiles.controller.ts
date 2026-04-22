import { Request, Response } from "express";
import {
  createProfileByName,
  deleteProfileById,
  getProfileById,
  listProfilesByFilter,
  searchProfilesByQuery,
} from "./profile.service";
import { ProfileDataset, ProfileRecord } from "./profile.type";
import {
  getIdParam,
  getNormalizedName,
  parseListProfilesQuery,
  parseSearchQuery,
} from "./profile.validation";

const toResponseProfile = (profile: ProfileRecord) => ({
  id: profile.id,
  name: profile.name,
  gender: profile.gender,
  gender_probability: profile.gender_probability,
  age: profile.age,
  age_group: profile.age_group,
  country_id: profile.country_id,
  country_name: profile.country_name,
  country_probability: profile.country_probability,
  created_at: profile.created_at.toISOString(),
});

const toV1ResponseProfile = (profile: ProfileRecord) => ({
  ...toResponseProfile(profile),
  sample_size: profile.sample_size,
});

const createProfileForDataset =
  (dataset: ProfileDataset) => async (req: Request, res: Response) => {
    const name = getNormalizedName(req.body);

    const { profile, alreadyExists } = await createProfileByName(name, dataset);

    if (alreadyExists) {
      return res.status(200).json({
        status: "success",
        message: "Profile already exists",
        data:
          dataset === "v1"
            ? toV1ResponseProfile(profile)
            : toResponseProfile(profile),
      });
    }

    return res.status(201).json({
      status: "success",
      data:
        dataset === "v1"
          ? toV1ResponseProfile(profile)
          : toResponseProfile(profile),
    });
  };

const getProfileForDataset =
  (dataset: ProfileDataset) => async (req: Request, res: Response) => {
    const id = getIdParam(req.params.id);
    const profile = await getProfileById(id, dataset);

    return res.status(200).json({
      status: "success",
      data:
        dataset === "v1"
          ? toV1ResponseProfile(profile)
          : toResponseProfile(profile),
    });
  };

const listProfilesForDataset =
  (dataset: ProfileDataset) => async (req: Request, res: Response) => {
    const parsed = parseListProfilesQuery(req.query);
    const profiles = await listProfilesByFilter(parsed, dataset);

    return res.status(200).json({
      status: "success",
      page: profiles.page,
      limit: profiles.limit,
      total: profiles.total,
      data:
        dataset === "v1"
          ? profiles.data.map(toV1ResponseProfile)
          : profiles.data.map(toResponseProfile),
    });
  };

const searchProfilesForDataset =
  (dataset: ProfileDataset) => async (req: Request, res: Response) => {
    const { q, page, limit } = parseSearchQuery(req.query);
    const profiles = await searchProfilesByQuery(q, page, limit, dataset);

    if (!profiles) {
      return res.status(400).json({
        status: "error",
        message: "Unable to interpret query",
      });
    }

    return res.status(200).json({
      status: "success",
      page: profiles.page,
      limit: profiles.limit,
      total: profiles.total,
      data:
        dataset === "v1"
          ? profiles.data.map(toV1ResponseProfile)
          : profiles.data.map(toResponseProfile),
    });
  };

const deleteProfileForDataset =
  (dataset: ProfileDataset) => async (req: Request, res: Response) => {
    const id = getIdParam(req.params.id);
    await deleteProfileById(id, dataset);

    return res.status(204).send();
  };

export const createProfile = createProfileForDataset("v2");
export const getProfile = getProfileForDataset("v2");
export const listProfiles = listProfilesForDataset("v2");
export const searchProfiles = searchProfilesForDataset("v2");
export const deleteProfile = deleteProfileForDataset("v2");

export const createV1Profile = createProfileForDataset("v1");
export const getV1Profile = getProfileForDataset("v1");
export const listV1Profiles = listProfilesForDataset("v1");
export const searchV1Profiles = searchProfilesForDataset("v1");
export const deleteV1Profile = deleteProfileForDataset("v1");
