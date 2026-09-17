import { Router } from 'express';
import {
  getEnergyCurrentHandler,
  getEnergyHistoryHandler,
  postEnergyReadingHandler,
} from '../controllers/energyController.js';

const router = Router();

router.get('/current', getEnergyCurrentHandler);
router.get('/history', getEnergyHistoryHandler);
router.post('/readings', postEnergyReadingHandler);

export default router;
