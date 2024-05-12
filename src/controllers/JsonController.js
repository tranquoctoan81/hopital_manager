import * as dotenv from 'dotenv'
dotenv.config()
import connect, { connection } from '../../DB/connect.js'
const JsonController = {
    list_premise_json(req, res) {
        connection.query(`SELECT * FROM premise`, (err, data) => {
            if (err) console.log(err);
            res.json(data)
        });
    },
    list_subclinical_json(req, res) {
        connection.query(`SELECT * FROM subclinical`, (err, data) => {
            if (err) console.log(err);
            res.json(data)
        });
    },
    list_medicine_json(req, res) {
        connection.query(`SELECT medicine.*,unit.u_name FROM medicine LEFT JOIN unit ON unit.u_id = medicine.u_id WHERE medicine.delete = 0`, (err, data) => {
            if (err) console.log(err);
            res.json(data)
        });
    },
    list_pathological(req, res) {
        connection.query(`SELECT * FROM pathological`, (err, data) => {
            if (err) console.log(err);
            res.json(data)
        });
    },
    list_prescription(req, res) {
        connection.query(`SELECT patient.pat_name,patient.pat_id,prescription.*,doctor.doc_name, DATE_FORMAT(prescription.create_date,"%d/%m/%Y") as date FROM patient LEFT JOIN bookhealth ON bookhealth.pat_id = patient.pat_id LEFT JOIN prescription ON prescription.bh_id = bookhealth.bh_id LEFT JOIN doctor ON doctor.doc_id = prescription.doc_id   ORDER BY prescription.create_date DESC LIMIT 1,999999999999`, (err, data) => {
            if (err) console.log(err);
            res.json(data)
        });
    },
    detail_prescription(req, res) {
        connection.query(`SELECT detailmedicine.*, medicine.med_name,medicine.u_id,unit.u_name AS DONVI FROM patient LEFT JOIN bookhealth ON patient.pat_id = bookhealth.pat_id LEFT JOIN prescription ON prescription.bh_id = bookhealth.bh_id LEFT JOIN detailmedicine ON detailmedicine.pre_id = prescription.pre_id LEFT JOIN medicine ON medicine.med_id = detailmedicine.med_id LEFT JOIN unit ON unit.u_id = medicine.u_id WHERE medicine.med_id IS NOT NULL ORDER BY detailmedicine.create_date DESC`, (err, data) => {
            if (err) console.log(err);
            res.json(data)
        });
    },
    list_paraclinical(req, res) {
        connection.query(`SELECT paraclinical_invoice.*, doctor.doc_name, patient.pat_name,DATE_FORMAT(paraclinical_invoice.create_date,"%d/%m/%Y") as date, pathological.path_name FROM paraclinical_invoice LEFT JOIN patient ON patient.pat_id = paraclinical_invoice.pat_id LEFT JOIN doctor ON doctor.doc_id = paraclinical_invoice.doc_id LEFT JOIN bookhealth ON bookhealth.pat_id = patient.pat_id LEFT JOIN pathological ON pathological.path_id = bookhealth.path_id`, (err, data) => {
            if (err) console.log(err);
            res.json(data)
        });
    },
    detail_paraclinical(req, res) {
        connection.query(`SELECT detailmedicine.*, medicine.med_name,medicine.u_id,unit.u_name AS DONVI FROM patient LEFT JOIN bookhealth ON patient.pat_id = bookhealth.pat_id LEFT JOIN prescription ON prescription.bh_id = bookhealth.bh_id LEFT JOIN detailmedicine ON detailmedicine.pre_id = prescription.pre_id LEFT JOIN medicine ON medicine.med_id = detailmedicine.med_id LEFT JOIN unit ON unit.u_id = medicine.u_id WHERE medicine.med_id IS NOT NULL ORDER BY detailmedicine.create_date DESC`, (err, data) => {
            if (err) console.log(err);
            res.json(data)
        });
    },
    new_message(req, res) {
        connection.query(`SELECT message.* FROM message WHERE message.create_date IN ( SELECT MAX(message.create_date) FROM message GROUP BY message.c_sdt )`, (err, new_message) => {
            res.json(new_message)
        })
    },
    schedule_examination(req, res) {
        connection.query(`SELECT schedule_examination.*,DATE_FORMAT(schedule_examination.se_date,"%d/%m/%Y") as date  FROM schedule_examination ORDER BY schedule_examination.se_date ASC`, (err, schedule_examination) => {
            res.json(schedule_examination)
        })
    }
}
export default JsonController