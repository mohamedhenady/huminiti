import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import batchesRouter from "./batches";
import personsRouter from "./persons";
import drugsRouter from "./drugs";
import recordsRouter from "./records";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/batches", batchesRouter);
router.use("/", personsRouter);
router.use("/drugs", drugsRouter);
router.use("/records", recordsRouter);
router.use("/stats", statsRouter);

export default router;
