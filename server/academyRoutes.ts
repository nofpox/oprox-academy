/**
 * Academy Routes — barrel composer.
 * Route logic is split into domain sub-routers for maintainability.
 */
import { Router } from 'express';
import catalogLearnerRouter from './routes/academy/catalogLearnerRoutes';
import assessmentRouter    from './routes/academy/assessmentRoutes';
import orgAdminRouter      from './routes/academy/orgAdminRoutes';
import tutorRouter         from './routes/academy/tutorRoutes';
import adaptiveLabRouter   from './routes/academy/adaptiveLabRoutes';

const router = Router();

router.use(catalogLearnerRouter);
router.use(assessmentRouter);
router.use(orgAdminRouter);
router.use(tutorRouter);
router.use(adaptiveLabRouter);

export default router;
