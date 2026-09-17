import { Router } from 'express';
import {
  getForecastHandler,
  getAllForecastsHandler,
  postForecastResultHandler,
} from '../controllers/forecastController.js';

const router = Router();

router.get('/',    getForecastHandler);        // GET /api/forecast?horizon=24h
router.get('/all', getAllForecastsHandler);     // GET /api/forecast/all
router.post('/results', postForecastResultHandler); // POST /api/forecast/results

export default router;
