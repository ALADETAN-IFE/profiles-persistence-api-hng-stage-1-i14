import { Router } from "express";
import { healthRoutes } from "./health";
import profilesRoutes from "./profiles.route";

const router = Router();

router.use("/health", healthRoutes);
router.use("/profiles", profilesRoutes);

export default router;
