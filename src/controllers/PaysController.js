import path from 'path';
import * as dotenv from 'dotenv'
dotenv.config()
import connect, { connection } from '../../DB/connect.js'
import pdf from 'pdf-creator-node'
import fs from 'fs'
import { fileURLToPath } from 'url';
import options from '../helpers/option.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let today = new Date();
const PaysController = {
    pay(req, res) {
        const doctorName = req.cookies.name
        connection.query('SELECT patient.*, DATE_FORMAT(patient.pat_old,"%d/%m/%Y") as date, homie.* FROM patient LEFT JOIN homie ON patient.homie_id = homie.homie_id WHERE patient.pat_id = ? AND patient.delete = 0', req.body.id, (err, patient) => {
            if (err) console.log(err)
            if (patient.length > 0) {
                connection.query('SELECT paraclinical_invoice.* FROM paraclinical_invoice LEFT JOIN patient ON patient.pat_id = paraclinical_invoice.pat_id WHERE patient.pat_id = ? ORDER BY paraclinical_invoice.create_date DESC LIMIT 1', req.body.id, (err, paraclinical_invoice) => {
                    if (err) throw err
                    connection.query('SELECT subclinical.*, result.res_id , paraclinical_invoice.pi_id FROM subclinical LEFT JOIN detail_patient_sub ON detail_patient_sub.sub_id = subclinical.sub_id LEFT JOIN paraclinical_invoice ON paraclinical_invoice.pi_id = detail_patient_sub.pi_id LEFT JOIN result ON result.dps_id = detail_patient_sub.dps_id WHERE paraclinical_invoice.pi_id = ? AND result.res_id IS NULL ORDER BY detail_patient_sub.create_date DESC', paraclinical_invoice[0].pi_id, (err, result) => {
                        if (err) console.log(err)
                        connection.query('SELECT SUM(subclinical.sub_price) AS total FROM subclinical LEFT JOIN detail_patient_sub ON detail_patient_sub.sub_id = subclinical.sub_id LEFT JOIN paraclinical_invoice ON paraclinical_invoice.pi_id = detail_patient_sub.pi_id LEFT JOIN result ON result.dps_id = detail_patient_sub.dps_id WHERE result.res_id IS NULL AND paraclinical_invoice.pi_id = ?', paraclinical_invoice[0].pi_id, (err, total) => {
                            const date = today.getDate() + '-' + (today.getMonth() + 1) + '-' + today.getFullYear();
                            const html = fs.readFileSync(path.join(__dirname, '../resources/views/PDF/subclinical.htm'), 'utf-8')
                            const fileName = Math.random() + '_docs' + '.pdf';
                            var document = {
                                html: html,
                                data: {
                                    date,
                                    result,
                                    patient,
                                    total: total[0].total,
                                    doctorName,
                                },
                                path: "./docs/" + fileName
                            };
                            pdf.create(document, options)
                                .then((res) => {
                                    console.log(res);
                                })
                                .catch((error) => {
                                    console.error(error);
                                });
                            const filePath = 'http://localhost:3000/docs/' + fileName
                            res.render('PDF/download', {
                                path: filePath,
                            })
                        })
                    })
                })
            }
            else {
                res.send(`<script>alert("Mã bệnh nhân không tồn tại!!!");window.location.href = "/examination"; </script>`)
            }
        })

    },
}
export default PaysController