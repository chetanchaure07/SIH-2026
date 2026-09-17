import { Router } from 'express';
import {
  getBatteryCurrentHandler,
  getBatteryHistoryHandler,
  postBatteryReadingHandler,
} from '../controllers/batteryController.js';

const router = Router();

router.get('/current', getBatteryCurrentHandler);
router.get('/history', getBatteryHistoryHandler);
router.post('/readings', postBatteryReadingHandler);

export default router;
