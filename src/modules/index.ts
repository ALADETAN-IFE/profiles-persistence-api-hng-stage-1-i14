import { Router } from "express";
import V1Routes from "./v1";
import { profilesRoutes } from "./profiles";

const router = Router();

router.use("/profiles", profilesRoutes);
router.use("/v1", V1Routes);

export default router;
