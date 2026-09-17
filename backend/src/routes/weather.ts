import { Router } from 'express';
import {
  getWeatherCurrentHandler,
  getWeatherHistoryHandler,
  postWeatherReadingHandler,
} from '../controllers/weatherController.js';

const router = Router();

router.get('/current', getWeatherCurrentHandler);
router.get('/history', getWeatherHistoryHandler);
router.post('/readings', postWeatherReadingHandler);

export default router;
