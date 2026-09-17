import { Router } from 'express';
import {
  getLoadCurrentHandler,
  postLoadReadingHandler,
} from '../controllers/loadController.js';

const router = Router();

router.get('/current',  getLoadCurrentHandler);
router.post('/readings', postLoadReadingHandler);

export default router;
