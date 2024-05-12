import express from 'express';
const router = express.Router();
import jsonController from '../controllers/JsonController.js';


router.get('/list_premise', jsonController.list_premise_json);
router.get('/list_subclinical', jsonController.list_subclinical_json);
router.get('/list_medicine', jsonController.list_medicine_json);
router.get('/list_pathological', jsonController.list_pathological);
router.get('/list_prescription', jsonController.list_prescription);
router.get('/list_paraclinical', jsonController.list_paraclinical);
router.get('/detail_prescription', jsonController.detail_prescription);
router.get('/new_message', jsonController.new_message);
router.get('/schedule_examination', jsonController.schedule_examination);

export default router;