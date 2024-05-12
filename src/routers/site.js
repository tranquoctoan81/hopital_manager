import express from 'express';
const router = express.Router();
import SiteController from '../controllers/siteController.js';
import { searchID } from '../../middleware/searchID.js'
import { checkID } from '../../middleware/checkID.js'
import { checkPosition } from '../../middleware/checkPosition.js'

router.get('/delete_sub_item_new/:dps_id', SiteController.delete_sub_item_new);
router.post('/update_send_message', SiteController.update_send_message);
router.post('/save_message', SiteController.save_message);
router.get('/json_message', SiteController.json_message);
router.get('/chat', SiteController.chat);
router.get('/login', SiteController.login);
router.get('/login_admin_res', SiteController.login_admin_res);
router.get('/logout', SiteController.logout);
router.post('/login_confirm', SiteController.login_confirm);
router.post('/change_pass_handle', SiteController.change_pass_handle);

router.get('/register', SiteController.register);
router.post('/register_handle', SiteController.register_handle);

router.get('/examination', checkID, checkPosition, searchID, SiteController.examination);
router.post('/examination', SiteController.examination);
router.post('/add_examination', SiteController.add_examination);


router.get('/show_arr_medicial_pre/:pre_id', SiteController.show_arr_medicial_pre);

router.get('/general_examination', SiteController.general_examination);



router.get('/subclinical', checkID, checkPosition, searchID, SiteController.subclinical);
router.post('/subclinical', checkID, SiteController.subclinical);
router.get('/show_detail_patient_sub/:pi_id', checkID, SiteController.show_detail_patient_sub);
router.post('/subclinical_handle', checkID, SiteController.subclinical_handle);
router.post('/add_subclinical', checkID, SiteController.add_subclinical);
router.get('/delete_subclinical_item/:idSub', checkID, SiteController.delete_subclinical_item);
router.post('/delete_subclinical_items', checkID, SiteController.delete_subclinical_items);
router.post('/delete_arr_sub', checkID, SiteController.delete_arr_sub);

router.get('/delete_subclinical_item/:pat_id/:sub_id', checkID, SiteController.delete_sub_item);


// router.post('/send_email', SiteController.send_email);
router.get('/calendar', checkID, SiteController.calendar);
// router.post('/create_an_appointment', SiteController.create_an_appointment);


router.get('/download/:pat_id', checkID, SiteController.generatePDF);
router.get('/download/prescription/:pat_id/:pre_id', checkID, SiteController.generatePDFPresPatId);
router.get('/download/prescription/:pat_id', checkID, SiteController.generatePDFPres);

router.post('/import_medical_item', SiteController.import_medical_item);
router.get('/delete_medical_item/:med_id/:total_quantity/:u_id', SiteController.delete_medical_item);
router.get('/delete_all_medical_item/:pat_id', SiteController.delete_all_medical_item);
router.get('/update_store_medical_item/:med_id/:total_quantityNew', SiteController.update_store_medical_item);

router.get('/update_Check_money_book/:pat_id/:paid', SiteController.update_Check_money_book);

router.post('/delete_schedule_examination', checkID, SiteController.delete_schedule_examination);
router.get('/add_patient_information', checkID, SiteController.add_patient_information);
router.get('/add_premise/:preID', SiteController.add_premise);
router.get('/show_premise/:pat_id', SiteController.show_premise);
router.get('/list_patient', checkID, SiteController.list_patient);
router.get('/list_patient_subclinical', checkID, SiteController.list_patient_subclinical);
router.post('/add_info_patient_handle', SiteController.add_patient_information_handle);

router.get('/list_patient_bookhealth', checkID, SiteController.list_patient_bookhealth);


router.get('/change_password', checkID, SiteController.change_password);


router.get('/save_and_create_pre/:pat_id', checkID, SiteController.save_and_create_pre);

//update đống tiền dịch vụ
router.get('/update_Check_money_subclinical/:pi_id', SiteController.update_Check_money_subclinical);
// router.get('/pay', checkID, searchID, SiteController.pay);
// router.post('/pay', SiteController.pay);

router.get('/show_detail_sub/:data', SiteController.show_detail_sub);


router.get('/delete_pre/:pre_id', SiteController.delete_pre);
router.get('/re_examination/:pat_id', SiteController.re_examination);




router.get('/', SiteController.home);

export default router;