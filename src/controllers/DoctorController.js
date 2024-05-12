import * as dotenv from 'dotenv'
dotenv.config()
import { connection } from '../../DB/connect.js'
const DoctorController = {
    add_info(req, res) {
        const id = req.params.id
        connection.query('SELECT * FROM department ORDER BY create_date DESC', (err, result) => {
            if (err) throw err
            res.render('doctor/addDoctor', { result, id })
        })
    },
    add_info_doctor(req, res) {
        const { name, dep_id, type, doc_practicing_certificate, doc_number, doc_address } = req.body
        const doc_img = req.file.filename
        connection.query('SELECT * FROM `accounts` ORDER BY accounts.create_date DESC LIMIT 1', (err, result) => {
            if (err) throw err
            const obj = {
                doc_img: doc_img,
                doc_practicing_certificate,
                td_id: type,
                dep_id,
                ac_id: result[0].ac_id,
                doc_name: name,
                doc_number,
                doc_address
            }

            connection.query('INSERT INTO doctor SET ?', obj, (err, results) => {
                if (err) throw err
                connection.query('SELECT doctor.* FROM doctor ORDER BY doctor.create_date DESC LIMIT 1', (err, DOCTOR) => {
                    if (err) throw err
                    connection.query('SELECT position.* FROM position LEFT JOIN accounts ON accounts.pos_id = position.pos_id LEFT JOIN doctor ON doctor.ac_id = accounts.ac_id WHERE doctor.doc_id = ?', DOCTOR[0].doc_id, (err, pos) => {
                        if (err) throw err
                        if (pos[0].pos_id == 1) {
                            const obj = {
                                a_id: 9,
                                doc_id: DOCTOR[0].doc_id,
                            }
                            connection.query('INSERT INTO wage_allowance SET ?', obj, (err, results) => {
                                if (err) throw err
                                res.send(`<script>alert("Thêm thành công!!!");window.location.href = "http://localhost:3001/doctor_manager/"; </script>`)
                            })
                        } else {
                            res.send(`<script>alert("Thêm thành công!!!");window.location.href = "http://localhost:3001/doctor_manager/"; </script>`)
                        }
                    })
                })
            })
        })
    }
}
export default DoctorController