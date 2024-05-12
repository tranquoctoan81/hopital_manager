import path from 'path';
import express from 'express';
const router = express.Router();
import DoctorController from '../controllers/DoctorController.js';
import multer from 'multer'

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, `uploads_doctor`)
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, Date.now() + uniqueSuffix + path.extname(file.originalname))
    }
})
const fileFilter = function (req, file, cb) {
    const extname = path.extname(file.originalname).toLowerCase();
    if (extname === '.jpg' || extname === '.jpeg' || extname === '.png') {
        return cb(null, true);
    }
    cb(new Error('Chỉ cho phép tải lên các tệp .jpg, .jpeg, hoặc .png'));
};
const uploads_doctor = multer({
    storage: storage,
    fileFilter: fileFilter,
});


router.get('/add_info/:id', DoctorController.add_info);
router.post('/add_info_doctor', uploads_doctor.single('doctor_img'), DoctorController.add_info_doctor);


export default router;