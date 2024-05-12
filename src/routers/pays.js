import express from 'express';
const router = express.Router();
import { searchID } from '../../middleware/searchID.js'
import { checkID } from '../../middleware/checkID.js'
import paysController from '../controllers/PaysController.js';


router.get('/examination', checkID, searchID, paysController.pay);
router.post('/examination', paysController.pay);

export default router;