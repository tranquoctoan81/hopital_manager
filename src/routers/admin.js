import express from 'express';
const router = express.Router();
import AdminController from '../controllers/AdminController.js';


router.get('/', AdminController.home);

export default router;