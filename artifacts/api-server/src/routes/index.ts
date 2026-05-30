import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import playerRouter from "./player";
import goalsRouter from "./goals";
import subtasksRouter from "./subtasks";
import habitsRouter from "./habits";
import bossesRouter from "./bosses";
import challengesRouter from "./challenges";
import inventoryRouter from "./inventory";
import skillsRouter from "./skills";
import calendarRouter from "./calendar";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/player", playerRouter);
router.use("/goals", goalsRouter);
router.use("/goals", subtasksRouter);
router.use("/habits", habitsRouter);
router.use("/bosses", bossesRouter);
router.use("/challenges", challengesRouter);
router.use("/inventory", inventoryRouter);
router.use("/skills", skillsRouter);
router.use("/calendar", calendarRouter);
router.use("/dashboard", dashboardRouter);

export default router;
