import { Router } from "express";
import {
  createV1Profile,
  deleteV1Profile,
  getV1Profile,
  listV1Profiles,
  searchV1Profiles,
} from "@/modules/profiles/profiles.controller";
import { methodNotAllowedHandler } from "@/middlewares";

const router = Router();

router
  .route("/")
  .post(createV1Profile)
  .get(listV1Profiles)
  .all(methodNotAllowedHandler(["POST", "GET"]));

router
  .route("/search")
  .get(searchV1Profiles)
  .all(methodNotAllowedHandler(["GET"]));

router
  .route("/:id")
  .get(getV1Profile)
  .delete(deleteV1Profile)
  .all(methodNotAllowedHandler(["GET", "DELETE"]));

export default router;
