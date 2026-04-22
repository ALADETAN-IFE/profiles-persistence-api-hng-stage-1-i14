import fs from "node:fs/promises";
import path from "node:path";
import { v7 as uuidv7 } from "uuid";
import { prisma } from "@/lib/prisma";

type SeedProfile = {
  name: string;
  gender: "male" | "female";
  gender_probability: number;
  age: number;
  age_group: "child" | "teenager" | "adult" | "senior";
  country_id: string;
  country_name: string;
  country_probability: number;
  created_at?: string;
};

const dataPath = path.resolve(process.cwd(), "src/data/seed_profiles.json");

const toSeedDate = (createdAt?: string) => {
  if (!createdAt) return new Date();

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return new Date();
  }
  return date;
};

const validateProfile = (profile: SeedProfile, index: number) => {
  if (!profile.name?.trim()) {
    throw new Error(`Invalid profile at index ${index}: missing name`);
  }
  if (!["male", "female"].includes(profile.gender)) {
    throw new Error(`Invalid profile at index ${index}: invalid gender`);
  }
  if (!["child", "teenager", "adult", "senior"].includes(profile.age_group)) {
    throw new Error(`Invalid profile at index ${index}: invalid age_group`);
  }
  if (profile.country_id.trim().length !== 2) {
    throw new Error(
      `Invalid profile at index ${index}: country_id must be ISO-2`,
    );
  }
};

const seedDatabase = async () => {
  try {
    console.log("Starting Stage 2 seed...");
    const rawData = await fs.readFile(dataPath, "utf8");
    console.log("raw data:", rawData.slice(0, 100));
    const profiles = JSON.parse(rawData) as { profiles: SeedProfile[] };
    console.log("parsed data length:", profiles.profiles.length);

    if (!Array.isArray(profiles.profiles)) {
      throw new Error("seed_profiles.json must contain an array");
    }

    console.log(`Found ${profiles.profiles.length} profiles. Upserting...`);

    for (const [index, profile] of profiles.profiles.entries()) {
      validateProfile(profile, index);

      console.log(
        "number of profiles seeded:",
        index + 1,
        `of ${profiles.profiles.length}`,
      );

      const normalizedName = profile.name.trim().toLowerCase();
      const existing = await prisma.profile.findUnique({
        where: { name: normalizedName },
      });

      if (existing) {
        await prisma.profile.update({
          where: { name: normalizedName },
          data: {
            dataset: "v2",
            gender: profile.gender,
            gender_probability: Number(profile.gender_probability),
            sample_size: 0,
            age: Number(profile.age),
            age_group: profile.age_group,
            country_id: profile.country_id.trim().toUpperCase(),
            country_name: profile.country_name.trim(),
            country_probability: Number(profile.country_probability),
          },
        });
        console.log(`updated profile: ${normalizedName}`);
      } else {
        await prisma.profile.create({
          data: {
            id: uuidv7(),
            name: normalizedName,
            dataset: "v2",
            gender: profile.gender,
            gender_probability: Number(profile.gender_probability),
            sample_size: 0,
            age: Number(profile.age),
            age_group: profile.age_group,
            country_id: profile.country_id.trim().toUpperCase(),
            country_name: profile.country_name.trim(),
            country_probability: Number(profile.country_probability),
            created_at: toSeedDate(profile.created_at),
          },
        });
        console.log(`created profile: ${normalizedName}`);
      }
    }

    const total = await prisma.profile.count();
    console.log(`Seed complete. Total records in database: ${total}`);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
};

seedDatabase();
