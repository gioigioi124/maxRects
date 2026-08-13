import { Router } from "express";
import * as packingController from "../controllers/packing.controller";

const router = Router();

router.post("/run", packingController.runPacking);
router.get("/batches", packingController.getBatches);
router.get("/batches/:id", packingController.getBatchById);
router.get("/suggestions", packingController.getSuggestions);

export default router;
