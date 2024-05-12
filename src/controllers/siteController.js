'use strict';
import path from 'path';
import * as dotenv from 'dotenv'
dotenv.config()
import { connection } from '../../DB/connect.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import pdf from 'pdf-creator-node'
import fs from 'fs'
import axios from 'axios'
import { fileURLToPath } from 'url';
import request from 'request';
import twilio from 'twilio';
import https from 'https';
import { Vonage } from '@vonage/server-sdk';
import { Auth } from '@vonage/auth';
import Nexmo from 'nexmo';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import http from 'follow-redirects';
import options from '../helpers/option.js'
import sendEmail from '../../middleware/nodemailerServer.js'
import readline from 'readline';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

import { Calendar } from '@fullcalendar/core'
import interactionPlugin from '@fullcalendar/interaction'
import dayGridPlugin from '@fullcalendar/daygrid'
import sendCustomEmail from '../../middleware/nodemailerServers.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let today = new Date();
let id
const date = today.getDate() + '-' + (today.getMonth() + 1) + '-' + today.getFullYear();
let padId
const SiteController = {
    update_send_message(req, res) {
        const sdt = req.body.c_sdt
        connection.query("UPDATE message SET check_send_mess = 1 WHERE message.c_sdt = ?", sdt, (err, result) => {
            if (err) throw err
            res.json({ status: 'success' });
        })
    },
    delete_sub_item_new(req,res){
        const dps_id = req.params.dps_id
        connection.query('DELETE FROM `detail_patient_sub` WHERE dps_id = ?', dps_id, (err, result) => {
            res.json({ status: 'success' });
        })
    },
    show_detail_sub(req, res) {
        const idDetailPatientSub = req.params.data
        connection.query("SELECT subclinical.*, result.*, DATE_FORMAT(result.create_date, '%m/%d/%Y %H:%i') AS date FROM subclinical LEFT JOIN detail_patient_sub ON detail_patient_sub.sub_id = subclinical.sub_id LEFT JOIN result ON result.dps_id = detail_patient_sub.dps_id WHERE result.res_id = ?", idDetailPatientSub, (err, result) => {
            if (err) throw err
            res.json({ status: 'success', result });
        })
    },
    pay(req, res) {
        const doctorName = req.cookies.doc_name
        connection.query('SELECT patient.*, DATE_FORMAT(patient.pat_old,"%d/%m/%Y") as date, homie.* FROM patient LEFT JOIN homie ON patient.homie_id = homie.homie_id WHERE patient.pat_id = ? AND patient.delete = 0', req.body.id, (err, patient) => {
            if (err) throw err
            if (patient.length > 0) {
                connection.query('SELECT subclinical.*, patient.*, DATE_FORMAT(patient.pat_old,"%d/%m/%Y") as date, result.res_id, homie.homie_name FROM subclinical LEFT JOIN detail_patient_sub ON detail_patient_sub.sub_id = subclinical.sub_id LEFT JOIN patient ON patient.pat_id = detail_patient_sub.pat_id LEFT JOIN result ON result.dps_id = detail_patient_sub.dps_id LEFT JOIN homie ON homie.homie_id = patient.homie_id WHERE result.res_id IS NULL AND detail_patient_sub.pat_id = ?', req.body.id, (err, result) => {
                    if (err) throw err
                    const date = today.getDate() + '-' + (today.getMonth() + 1) + '-' + today.getFullYear();
                    const html = fs.readFileSync(path.join(__dirname, '../resources/views/PDF/subclinical.htm'), 'utf-8')
                    const fileName = Math.random() + '_docs' + '.pdf';
                    var document = {
                        html: html,
                        data: {
                            date,
                            result,
                            patient,
                            doctorName
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
            }
            else {
                res.send(`<script>alert("Mã bệnh nhân không tồn tại!!!");window.location.href = "/examination"; </script>`)
            }
        })

    },
    generatePDF(req, res) {
        const pat_id = req.params.pat_id
        connection.query('SELECT homie.*,patient.pat_name as name FROM homie LEFT JOIN patient ON patient.homie_id = homie.homie_id WHERE patient.pat_id = ?', pat_id, (err, homie) => {
            if (err) throw err

            var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
            var dateTime = `${date}-${time}`;
            const html = fs.readFileSync(path.join(__dirname, '../resources/views/PDF/prescription.htm'), 'utf-8')
            // const fileName = Math.random() + '_doc' + '.pdf';
            function removeAccentsAndSpaces(str) {
                // Loại bỏ dấu từ chuỗi
                var accents = [
                    /[\300-\306]/g, /[\340-\346]/g, // A, a
                    /[\310-\313]/g, /[\350-\353]/g, // E, e
                    /[\314-\317]/g, /[\354-\357]/g, // I, i
                    /[\322-\330]/g, /[\362-\370]/g, // O, o
                    /[\331-\334]/g, /[\371-\374]/g, // U, u
                    /[\321]/g, /[\361]/g, // N, n
                    /[\307]/g // C, c
                ];

                for (var i = 0; i < accents.length; i++) {
                    str = str.replace(accents[i], '');
                }

                // Loại bỏ khoảng trắng
                str = str.replace(/\s+/g, '');

                return str;
            }
            const name = removeAccentsAndSpaces(homie[0].name)
            const fileName = name + '_doc' + '.pdf';
            var document = {
                html: html,
                data: {
                    date,
                    homie
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
            console.log(filePath);
            res.render('PDF/download', {
                path: filePath,
            })

        })

    },
    delete_pre(req, res) {
        const pre_id = req.params.pre_id
        connection.query('DELETE FROM `prescription` WHERE prescription.pre_id =  ?', pre_id, (err, result) => {
            res.json({ status: 'success' });
        })
    },
    re_examination(req, res) {
        const doc_id = req.cookies.doc_id
        connection.query('SELECT paraclinical_invoice.* FROM paraclinical_invoice LEFT JOIN patient ON patient.pat_id = paraclinical_invoice.pat_id WHERE patient.pat_id = ? ORDER BY paraclinical_invoice.create_date DESC LIMIT 1', id, (err, paraclinical_invoice) => {
            if (err) throw err
            connection.query('SELECT subclinical.*, result.res_id , paraclinical_invoice.pi_id FROM subclinical LEFT JOIN detail_patient_sub ON detail_patient_sub.sub_id = subclinical.sub_id LEFT JOIN paraclinical_invoice ON paraclinical_invoice.pi_id = detail_patient_sub.pi_id LEFT JOIN result ON result.dps_id = detail_patient_sub.dps_id WHERE paraclinical_invoice.pi_id = ? ORDER BY detail_patient_sub.create_date DESC', paraclinical_invoice[0].pi_id, (err, arrSub) => {
                if (err) throw err
                if (arrSub.length === 0) {
                    res.status(404).json({ status: 'not_found', data: 'Không thể tạo tái khám bệnh do lần trước chưa lựa chọn dịch vụ để khám' });
                } else {
                    connection.query(`INSERT INTO paraclinical_invoice set ?`, { pat_id: req.params.pat_id, doc_id }, (err, result) => {
                        if (err) throw err
                        res.json({ status: 'success' });
                    })
                }
            })
        })
    },
    create_an_appointment(req, res) {
        res.render('doctor/create_an_appointment')
    },
    async calendar(req, res) {

        // const CREDENTIALS = JSON.parse(process.env.CREDENTIALS);
        // const calendarId = process.env.CALENDAR_ID;

        // // Google calendar API settings
        // const SCOPES = 'https://www.googleapis.com/auth/calendar';
        // const calendar = google.calendar({ version: "v3" });

        // const auth = new google.auth.JWT(
        //     CREDENTIALS.client_email,
        //     null,
        //     CREDENTIALS.private_key,
        //     SCOPES
        // );
        // const getEvents = async () => {

        //     try {
        //         let response = await calendar.events.list({
        //             auth: auth,
        //             calendarId: calendarId,
        //             timeZone: 'Asia/Ho_Chi_Minh'
        //         });

        //         let items = response['data']['items'];
        //         const eventArray = items.map((e) => ({
        //             title: e.summary,
        //             start: e.start.dateTime || e.start.date,
        //             end: e.end.dateTime || e.end.date,
        //         }));
        //         return eventArray;
        //     } catch (error) {
        //         console.log(`Error at getEvents --> ${error}`);
        //         return 0;
        //     }
        // };
        // getEvents()
        //     .then((eventArray) => {
        //         const newArr = [...eventArray]
        //         res.render('calendar/calendar', { events: newArr });
        //     })
        //     .catch((err) => {
        //         throw err ;
        //     });
        let CREDENTIALS
        let calendarId
        const position = req.cookies.pos
        if (position == 'Dr') {
            CREDENTIALS = JSON.parse(process.env.CREDENTIALS)
            calendarId = process.env.CALENDAR_ID;
        } else {
            CREDENTIALS = JSON.parse(process.env.CREDENTIALS_LT);
            calendarId = process.env.CALENDAR_LT_ID;
        }
        // Google calendar API settings
        const SCOPES = 'https://www.googleapis.com/auth/calendar';
        const calendar = google.calendar({ version: "v3" });

        const auth = new google.auth.JWT(
            CREDENTIALS.client_email,
            null,
            CREDENTIALS.private_key,
            SCOPES
        );

        const getEvents = async () => {
            try {
                let response = await calendar.events.list({
                    auth: auth,
                    calendarId: calendarId,
                    timeZone: 'Asia/Ho_Chi_Minh'
                });
                const generateRandomId = () => {
                    return Math.random().toString(36).substr(2, 9);
                }
                let items = response['data']['items'];
                const eventArray = items.map((e) => ({
                    id: e.id,
                    title: e.summary,
                    description: e.description,
                    start: e.start.dateTime || e.start.date,
                    end: e.end.dateTime || e.end.date,
                }));
                return eventArray;
            } catch (error) {
                console.log(`Error at getEvents --> ${error}`);
                return 0;
            }
        };
        getEvents()
            .then((eventArray) => {
                const newArr = [...eventArray]
                connection.query('SELECT doctor.* FROM doctor LEFT JOIN accounts ON accounts.ac_id = doctor.ac_id WHERE accounts.pos_id = 1 ORDER BY doctor.create_date DESC', (err, arrDoctor) => {
                    if (err) throw err
                    res.render('calendar/calendar', { events: newArr, arrDoctor });
                })
            })
            .catch((err) => {
                throw err;
            });
    },
    generatePDFPres(req, res) {
        const pat_id = req.params.pat_id
        const doctorName = req.cookies.doc_name
        const position = req.cookies.pos
        connection.query('SELECT patient.*,DATE_FORMAT(examination.exa_appointmentDate,"%d/%m/%Y") as date FROM patient LEFT JOIN examination ON examination.pat_id = patient.pat_id WHERE patient.pat_id  = ?', pat_id, (err, patient) => {
            if (err) throw err
            connection.query('SELECT doctor.doc_name FROM doctor LEFT JOIN accounts ON accounts.ac_id = doctor.ac_id WHERE accounts.ac_username = ?', doctorName, (err, doctor_name) => {
                if (err) throw err


                connection.query('SELECT prescription.* FROM prescription LEFT JOIN bookhealth ON bookhealth.bh_id = prescription.bh_id LEFT JOIN patient ON patient.pat_id = bookhealth.pat_id WHERE patient.pat_id = ? ORDER BY prescription.create_date DESC LIMIT 1', pat_id, (err, pressID) => {

                    connection.query('SELECT detailmedicine.*, medicine.med_name,medicine.u_id, effective.use_name, unit.u_name FROM patient LEFT JOIN bookhealth ON bookhealth.pat_id = patient.pat_id LEFT JOIN prescription ON prescription.bh_id = bookhealth.bh_id LEFT JOIN detailmedicine ON detailmedicine.pre_id = prescription.pre_id LEFT JOIN medicine ON medicine.med_id = detailmedicine.med_id LEFT JOIN effective ON effective.use_id = medicine.use_id LEFT JOIN unit ON unit.u_id = medicine.u_id WHERE patient.pat_id = ? AND prescription.pre_id = ? ORDER BY detailmedicine.create_date DESC', [pat_id, pressID[0].pre_id], (err, arr_medical) => {
                        if (err) throw err

                        const html = fs.readFileSync(path.join(__dirname, '../resources/views/PDF/template.htm'), 'utf-8')
                        const fileName = Math.random() + '_docs' + '.pdf';
                        var document = {
                            html: html,
                            data: {
                                date,
                                arr_medical,
                                patient,
                                doctor_name: doctorName,
                                position
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

        })

    },
    generatePDFPresPatId(req, res) {
        const pat_id = req.params.pat_id
        const pre_id = req.params.pre_id
        const doctorName = req.cookies.doc_name
        const position = req.cookies.pos
        connection.query('SELECT patient.*,DATE_FORMAT(examination.exa_appointmentDate,"%d/%m/%Y") as date FROM patient LEFT JOIN examination ON examination.pat_id = patient.pat_id WHERE patient.pat_id  = ?', pat_id, (err, patient) => {
            if (err) throw err
            connection.query('SELECT doctor.doc_name FROM doctor LEFT JOIN accounts ON accounts.ac_id = doctor.ac_id WHERE accounts.ac_username = ?', doctorName, (err, doctor_name) => {
                if (err) throw err
                connection.query('SELECT detailmedicine.*, medicine.med_name,medicine.u_id, effective.use_name, unit.u_name FROM patient LEFT JOIN bookhealth ON bookhealth.pat_id = patient.pat_id LEFT JOIN prescription ON prescription.bh_id = bookhealth.bh_id LEFT JOIN detailmedicine ON detailmedicine.pre_id = prescription.pre_id LEFT JOIN medicine ON medicine.med_id = detailmedicine.med_id LEFT JOIN effective ON effective.use_id = medicine.use_id LEFT JOIN unit ON unit.u_id = medicine.u_id WHERE patient.pat_id = ? AND prescription.pre_id = ? ORDER BY detailmedicine.create_date DESC', [pat_id, pre_id], (err, arr_medical) => {
                    if (err) throw err
                    const html = fs.readFileSync(path.join(__dirname, '../resources/views/PDF/template.htm'), 'utf-8')
                    const fileName = Math.random() + '_docs' + '.pdf';
                    var document = {
                        html: html,
                        data: {
                            date,
                            arr_medical,
                            patient,
                            doctor_name: doctorName,
                            position
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
    },
    home(req, res) {
        const cssHeader = 1
        connection.query('SELECT COUNT(*) AS total_doctors FROM doctor LEFT JOIN accounts ON accounts.ac_id = doctor.ac_id WHERE accounts.pos_id = 1', (err, total_doctors) => {
            if (err) throw err
            connection.query('SELECT * FROM `subclinical` ORDER BY create_date DESC', (err, result) => {
                if (err) if (err) throw err
                connection.query('SELECT COUNT(*) AS total_patient FROM patient WHERE patient.delete = 0', (err, total_patient) => {
                    if (err) if (err) throw err
                    res.clearCookie("checkAddPatient")
                    res.render('home', { result, total_doctors, total_patient,cssHeader })
                })
            })
        })
    },
    login(req, res) {
        if (req.cookies.token) {
            res.redirect('/')
        } else {
            res.render('validates/login')
        }
    },
    chat(req, res) {
        connection.query('SELECT * FROM chat order by create_date ASC', (err, chat) => {
            if (err) throw err
            res.render('chat', { chat })
        })
    },
    json_message(req, res) {
        connection.query(`SELECT message.*,DATE_FORMAT(message.create_date, '%H:%i %p') AS create_date_time FROM message`, (err, data) => {
            if (err) throw err
            res.json(data)
        })
    },
    save_message(req, res) {
        const { sdt, message } = req.body
        const obj = {
            dep_id: 8,
            c_sdt: sdt,
            mess_detail: message,
            check: 2
        }
        connection.query('INSERT INTO message SET ?', obj, (err) => {
            if (err) if (err) throw err
            res.json({ status: 'success' });
        })
    },
    login_admin_res(req, res) {
        res.render('validates/login_admin')
    },
    logout(req, res) {
        const cookies = req.cookies;
        res.clearCookie("doc_img")
        res.clearCookie("doc_name")
        res.clearCookie("id")
        res.clearCookie("doc_id")
        res.clearCookie("pos")
        res.clearCookie("token")
        res.redirect('/');
    },
    login_confirm(req, res) {
        const { username, password } = req.body
        connection.query('SELECT accounts.*, doctor.* , position.pos_name from accounts LEFT JOIN doctor ON doctor.ac_id = accounts.ac_id LEFT JOIN position ON position.pos_id = accounts.pos_id WHERE accounts.ac_username = ?', [username], (err, result) => {
            if (result.length === 0) {
                res.send(`<script>alert("Tài khoản không tồn tai!");window.location.href = "/login"; </script>`)
            }
            else {
                bcrypt.compare(password, result[0].ac_pass, (err, bResult) => {
                    const username = result[0].ac_username;
                    const fullName = result[0].doc_name;
                    const doc_img = result[0].doc_img;
                    const deleted = Number(result[0].delete)
                    const id = result[0].ac_id;
                    if (bResult) {
                        if (deleted === 1) {
                            res.send(`<script>alert("Tài khoản đã bị xóa hoặc vô hiệu hóa!");window.location.href = "/login"; </script>`)
                        } else {
                            const cookies = req.cookies;
                            for (const cookieName in cookies) {
                                res.clearCookie(cookieName);
                            }
                            const token = jwt.sign({ role: username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
                            res.cookie('token', token, {
                                httpOnly: false,
                            })
                            if (result[0].pos_id === 1) {
                                res.cookie('pos', `Dr`)
                            } else if (result[0].pos_id === 2) {
                                res.cookie('pos', `Cas`)
                            }
                            res.cookie('doc_id', result[0].doc_id)
                            res.cookie('doc_img', doc_img)
                            res.cookie('id', id)
                            res.cookie('doc_name', fullName)
                            res.cookie('token', token)
                            res.redirect('/')
                        }
                    } else {
                        res.send(`<script>alert("Sai mât khẩu !");window.location.href = "/login"; </script>`)
                    }
                })
            }
        })
    },
    change_pass_handle(req, res) {
        const { pass_old, pass_new, pass_new_re } = req.body
        const ac_id = req.cookies.id
        connection.query('SELECT * FROM `accounts` WHERE ac_id = ?', ac_id, (err, account) => {
            bcrypt.compare(pass_old, account[0].ac_pass, async (err, re) => {
                if (re) {
                    if (pass_new != pass_new_re) {
                        res.send(`<script>alert("Mật khẩu nhập lại không đúng !");window.location.href = "/change_password"; </script>`)
                    } else {
                        const hashedPass = await bcrypt.hash(pass_new, 10)
                        connection.query(`UPDATE accounts SET accounts.ac_pass= ? WHERE accounts.ac_id = ?`, [hashedPass, ac_id], (err, data) => {
                            if (err) throw err
                            res.send(`<script>alert("Đổi mật khẩu thành công !");window.location.href = "/change_password"; </script>`)

                        })
                    }
                } else {
                    res.send(`<script>alert("Sai mật khẩu hiện tại !");window.location.href = "/change_password"; </script>`)
                }
            })
        })
    },
    register(req, res) {
        res.render('validates/register')
    },
    register_handle(req, res) {
        const { username, password, confirm_password, sex, position } = req.body
        if (confirm_password != password) {
            res.send(`<script>alert("Mật khẩu không khớp!");window.location.href = "/register"; </script>`)
        } else {
            connection.query('SELECT * FROM `accounts` WHERE accounts.ac_username = ?', [username], async (err, result) => {
                if (result.length > 0) {
                    if (result[0].ac_username == username) {
                        res.send(`<script>alert("Tk đã được sử dụng, vui lòng nhập lại!");window.location.href = "/register"; </script>`)
                    }
                } else {
                    let hashedPassword = await bcrypt.hash(password, 10)
                    connection.query('INSERT INTO accounts SET ?', { ac_username: username, ac_pass: hashedPassword, ac_sex: sex, pos_id: position, delete: 0 }, (err, result) => {
                        if (err) throw err
                        connection.query('SELECT * FROM accounts WHERE accounts.ac_username = ?', [username], (err, resultS) => {
                            const id = resultS[0].ac_id
                            res.redirect(`/doctor/add_info/${id}`)
                        })
                    })
                }
            })
        }

    },
    add_patient_information(req, res) {
        const doc_id = req.cookies.id
        connection.query('SELECT doctor.doc_name FROM doctor LEFT JOIN accounts ON accounts.ac_id = doctor.ac_id WHERE accounts.ac_id =  ?', doc_id, (err, doctor_name) => {
            if (err) throw err
            connection.query('SELECT * FROM pathological ORDER BY create_date DESC', (err, listPath,) => {
                if (err) throw err
                connection.query('SELECT patient.*, homie.* , DATE_FORMAT(patient.pat_old,"%d/%m/%Y") as date FROM patient LEFT JOIN homie ON patient.homie_id = homie.homie_id WHERE patient.delete = 0 ORDER BY patient.create_date DESC', (err, listPatients) => {
                    const absolutePath = path.resolve('docs');
                    // res.render('patient/add_info', { listPatients })
                    listPatients.forEach((item) => {
                        const searchFile = (directory, fileName) => {
                            const files = fs.readdirSync(directory); // Lấy danh sách các file trong thư mục
                            for (const file of files) {
                                const filePath = path.join(directory, file); // Đường dẫn đầy đủ đến file
                                const stats = fs.statSync(filePath); // Thông tin về file
                                if (stats.isFile() && file === fileName) {
                                    connection.query('UPDATE patient set patient.paid = 1 WHERE patient.pat_id = ?', item.pat_id, (err, success) => {
                                        if (err) throw err
                                    })
                                    return;
                                }
                                if (stats.isDirectory()) {
                                    searchFile(filePath, fileName); // Đệ quy để tìm kiếm trong thư mục con
                                    return;
                                }
                            }
                        };
                        function removeAccentsAndSpaces(str) {
                            // Loại bỏ dấu từ chuỗi
                            var accents = [
                                /[\300-\306]/g, /[\340-\346]/g, // A, a
                                /[\310-\313]/g, /[\350-\353]/g, // E, e
                                /[\314-\317]/g, /[\354-\357]/g, // I, i
                                /[\322-\330]/g, /[\362-\370]/g, // O, o
                                /[\331-\334]/g, /[\371-\374]/g, // U, u
                                /[\321]/g, /[\361]/g, // N, n
                                /[\307]/g // C, c
                            ];
                            for (var i = 0; i < accents.length; i++) {
                                str = str.replace(accents[i], '');
                            }

                            // Loại bỏ khoảng trắng
                            str = str.replace(/\s+/g, '');

                            return str;
                        }
                        const name = removeAccentsAndSpaces(item.pat_name)
                        const directoryPath = path.resolve('docs');
                        const fileName = `${name}_doc.pdf`;
                        searchFile(directoryPath, fileName);
                    })
                    connection.query('SELECT * FROM premise ORDER BY create_date DESC', (err, listPremise,) => {
                        if (err) throw err;
                        connection.query('SELECT schedule_examination.*, DATE_FORMAT(schedule_examination.se_date, "%d/%m/%Y") AS date,DATE_FORMAT(schedule_examination.se_old, "%d/%m/%Y") AS date_se_old, DATEDIFF(CURDATE(), schedule_examination.se_date) AS diff FROM schedule_examination ORDER BY COALESCE(schedule_examination.se_date = CURDATE(), 1) DESC, diff ASC;', (err, list_schedule_examination,) => {
                            if (err) throw err;
                            res.render('patient/add_info', { listPath, doctor_name, listPatients, listPremise, list_schedule_examination })
                        })
                    })
                })


            })
        })
    },
    delete_schedule_examination(req, res) {
        const id = req.body.se_id
        sendCustomEmail('tqt150801@gmail.com', "Xác nhận đặt lịch khám bệnh thành công", "Nội dung tiếp nhận",
        `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Xác nhận lịch hẹn khám bệnh</title>
          <style>
            body {
              font-family: sans-serif;
              font-size: 25px;
            }
        
            h1 {
              text-align: center;
              margin-top: 0;
              font-size: 24px;
            }
        
            img {
              margin-bottom: 20px;
            }
        
            p {
              margin-bottom: 10px;
            }
        
            ul {
              margin-bottom: 20px;
            }
        
            li {
              margin-bottom: 5px;
            }
        
            form {
              text-align: center;
            }
        
            input {
              width: 100%;
              padding: 10px;
              border: 1px solid #ccc;
              border-radius: 5px;
            }
        
            button {
              width: 100px;
              height: 40px;
              background-color: #000;
              color: #fff;
              font-size: 18px;
              border-radius: 5px;
              margin-top: 20px;
            }
        
            .internal {
              background-color: #fff;
              border: 1px solid #ccc;
              border-radius: 5px;
              padding: 20px;
            }
        
            .internal label {
              font-size: 18px;
            }
        
            .internal input {
              font-size: 16px;
            }
        
            .internal button {
              font-size: 18px;
            }
          </style>
        </head>
        <body>
          <div style="text-align:center;">
            <h1>Email xác nhận lịch hẹn khám bệnh</h1>
          </div>
          <div style="margin-bottom:20px;">
            <p>Chào Trần Quốc Toản,</p>
            <p>Chúng tôi xin xác nhận lịch hẹn khám bệnh của quý khách tại Phòng khám nội tổng hợp An Bình.</p>
            <p>Thông tin lịch hẹn của quý khách như sau:</p>
            <ul>
                <li>Ngày khám: <strong>20/10/2032</strong></li>
                <li>Giờ khám: <strong>3h-5h</strong></li>
            </ul>
            <p>Vui lòng đến phòng khám đúng giờ để tránh lỡ lịch hẹn.</p>
          </div>
          <div style="margin-bottom:20px;">
            <p>Trân trọng</p>
            <p>Phòng khám nội tổng hợp An Bình</p>
            <p>Hotline: 19000000</p>
            <p>Website: http://localhost:3002/</p>
          </div>
        </body>
        </html>
        `
        )
        res.send('Thành công')
        // connection.query('DELETE FROM `schedule_examination` WHERE schedule_examination.se_id =  ?', id, (err, result) => {
        //     res.json({ status: 'success' });
        // })
    } ,
    list_patient(req, res) {
        const doctorName = req.cookies.doc_name
        connection.query('SELECT doctor.doc_name FROM doctor LEFT JOIN accounts ON accounts.ac_id = doctor.ac_id WHERE accounts.ac_username = ?', doctorName, (err, doctor_name) => {
            if (err) throw err
            connection.query('SELECT * FROM pathological ORDER BY create_date DESC', (err, listPath,) => {
                if (err) throw err
                connection.query('SELECT prescription.* FROM prescription', (err, listPre,) => {
                    if (err) throw err
                    connection.query('SELECT patient.*, homie.* , DATE_FORMAT(patient.pat_old,"%d/%m/%Y") as date FROM patient LEFT JOIN homie ON patient.homie_id = homie.homie_id WHERE patient.delete = 0 ORDER BY patient.create_date DESC', (err, listPatients) => {
                        const absolutePath = path.resolve('docs');
                        listPatients.forEach((item) => {
                            const searchFile = (directory, fileName) => {
                                const files = fs.readdirSync(directory); // Lấy danh sách các file trong thư mục
                                for (const file of files) {
                                    const filePath = path.join(directory, file); // Đường dẫn đầy đủ đến file
                                    const stats = fs.statSync(filePath); // Thông tin về file
                                    if (stats.isFile() && file === fileName) {
                                        connection.query('UPDATE patient set patient.paid = 1 WHERE patient.pat_id = ?', item.pat_id, (err, success) => {
                                            if (err) throw err
                                        })
                                        return;
                                    }
                                    if (stats.isDirectory()) {
                                        searchFile(filePath, fileName); // Đệ quy để tìm kiếm trong thư mục con
                                        return;
                                    }
                                }


                            };
                            function removeAccentsAndSpaces(str) {
                                // Loại bỏ dấu từ chuỗi
                                var accents = [
                                    /[\300-\306]/g, /[\340-\346]/g, // A, a
                                    /[\310-\313]/g, /[\350-\353]/g, // E, e
                                    /[\314-\317]/g, /[\354-\357]/g, // I, i
                                    /[\322-\330]/g, /[\362-\370]/g, // O, o
                                    /[\331-\334]/g, /[\371-\374]/g, // U, u
                                    /[\321]/g, /[\361]/g, // N, n
                                    /[\307]/g // C, c
                                ];

                                for (var i = 0; i < accents.length; i++) {
                                    str = str.replace(accents[i], '');
                                }

                                // Loại bỏ khoảng trắng
                                str = str.replace(/\s+/g, '');

                                return str;
                            }
                            const name = removeAccentsAndSpaces(item.pat_name)
                            const directoryPath = path.resolve('docs');
                            const fileName = `${name}_doc.pdf`;
                            searchFile(directoryPath, fileName);
                        })
                        res.render('patient/list_patient', { listPath, doctorName, listPatients, listPre })
                    })
                })

            })
        })
    },
    list_patient_subclinical(req, res) {
        const doctorName = req.cookies.doc_name
        connection.query(`SELECT detail_patient_sub.*, patient.pat_id as patId ,patient.paid, paraclinical_invoice.pi_id AS id_pi, subclinical.sub_price, COALESCE(GROUP_CONCAT(subclinical.sub_name), 'Chưa chọn dịch vụ') AS ItemNameListSub, COALESCE(SUM(subclinical.sub_price), 'NaN') AS total, patient.pat_name FROM patient LEFT JOIN paraclinical_invoice ON paraclinical_invoice.pat_id = patient.pat_id LEFT JOIN detail_patient_sub ON detail_patient_sub.pi_id = paraclinical_invoice.pi_id LEFT JOIN subclinical ON subclinical.sub_id = detail_patient_sub.sub_id WHERE detail_patient_sub.Check_money_subclinical = 0 OR detail_patient_sub.Check_money_subclinical IS NULL AND patient.paid = 1 GROUP BY paraclinical_invoice.pi_id ORDER BY patient.create_date DESC`, (err, result) => {
            res.render('patient/list_patient_subclinical', { result, doctorName })
        })
    },
    list_patient_bookhealth(req, res) {
        const doctorName = req.cookies.doc_name
        connection.query(`SELECT patient.* FROM patient  GROUP BY patient.pat_id ORDER BY patient.create_date DESC`, (err, result) => {
            res.render('patient/list_patient_bookhealth', { result, doctorName })
        })
    },
    general_examination(req, res) {
        connection.query(`SELECT patient.*,DATE_FORMAT(patient.pat_old,"%d/%m/%Y") as date,homie.homie_name FROM patient LEFT JOIN examination ON examination.pat_id = patient.pat_id LEFT JOIN homie ON homie.homie_id = patient.homie_id WHERE examination.exa_id IS NULL ORDER BY patient.create_date DESC`, (err, listPatients) => {
            res.render('doctor/general_examination', { listPatients })
        })
    },
    save_and_create_pre(req, res) {
        const pat_id = req.params.pat_id
        const doc_id = req.cookies.doc_id

        connection.query('SELECT prescription.* FROM patient LEFT JOIN bookhealth ON bookhealth.pat_id = patient.pat_id LEFT JOIN prescription ON prescription.bh_id = bookhealth.bh_id WHERE patient.pat_id = ? ORDER BY prescription.create_date DESC LIMIT 1', pat_id, (err, pre) => {
            if (err) throw err
            const bh_id = pre[0].bh_id
            connection.query(`INSERT INTO prescription set ?`, { bh_id: bh_id, doc_id: doc_id }, (err, result) => {
                if (err) throw err
                res.redirect('back')
            })
        })
    },
    // async add_patient_informations(req, res) {
    //     const premisePram = req.params.premise
    //     if (!req.cookies.premises) {
    //         if (premisePram) {
    //             const premiseList = []
    //             premiseList.push(premisePram)
    //             const premisesToken = jwt.sign({ premises: premiseList }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
    //             res.cookie('premises', premisesToken, {
    //                 httpOnly: false,
    //             })
    //             connection.query('SELECT patient.*, homie.* , DATE_FORMAT(patient.pat_old,"%d/%m/%Y") as date FROM patient LEFT JOIN homie ON patient.homie_id = homie.homie_id ORDER BY patient.create_date DESC', (err, listPatients) => {
    //                 // res.render('patient/add_info', { listPatients })

    //                 for (let i = 0; i < premiseList.length; i++) {
    //                     connection.query('SELECT * FROM premise WHERE pre_name = ?', premiseList[i], (err, premiseList) => {
    //                         res.render('patient/add_info', { premiseList, listPatients })
    //                     })
    //                 }
    //             })
    //         }
    //     } else {
    //         const pre = jwt.verify(req.cookies.premises, process.env.ACCESS_TOKEN_SECRET).premises;
    //         pre.push(premisePram)
    //         const premisesTokenNew = jwt.sign({ premises: pre }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
    //         res.cookie('premises', premisesTokenNew, {
    //             httpOnly: false,
    //         })
    //         let ret = []
    //         pre.forEach(e => {
    //             connection.query('SELECT * FROM premise WHERE pre_name = ?', e, (err, premiseLists) => {
    //                 ret.push(premiseLists)
    //             })
    //         });
    //         try {
    //             let premiseList = []
    //             setTimeout(() => {
    //                 const json = JSON.stringify(ret)
    //                 const listPremise = JSON.parse(json)
    //                 for (let i = 0; i < listPremise.length; i++) {
    //                     const element = listPremise[i][0];
    //                     premiseList.push(element)
    //                 }
    //                 connection.query('SELECT patient.*, homie.* , DATE_FORMAT(patient.pat_old,"%d/%m/%Y") as date FROM patient LEFT JOIN homie ON patient.homie_id = homie.homie_id ORDER BY patient.create_date DESC', (err, listPatients) => {
    //                     res.render('patient/add_info', { premiseList, listPatients })
    //                 })
    //             }, 1000);
    //         } catch (error) {
    //             console.log(error)
    //         }
    //     }

    // },
    add_premise(req, res) {
        const preID = req.params.preID
        if (preID) {
            connection.query(`SELECT patient.* FROM patient ORDER BY create_date DESC LIMIT 1`, (err, PATIENT) => {
                if (err) throw err
                connection.query(`INSERT INTO detail_premise SET ?`, { pat_id: PATIENT[0].pat_id, pre_id: preID }, (err, result) => {
                    if (err) throw err
                    res.json({ status: 'success' });
                })
            })
        }
    },
    show_premise(req, res) {
        const pat_id = req.params.pat_id
        connection.query(`SELECT premise.* FROM premise LEFT JOIN detail_premise ON detail_premise.pre_id = premise.pre_id WHERE detail_premise.pat_id = ? ORDER BY detail_premise.create_date DESC`, pat_id, (err, premise) => {
            if (err) throw err
            res.json({ status: 'success', premise });
        })
    },
    add_patient_information_handle(req, res) {
        const { namePatient,address,sex,date,path_id,pat_email,listIdPremise,pat_number,pat_cccd,se_id } = req.body
        let preID
        const ac_id = req.cookies.id
        const obj = {
            pat_name: namePatient,
            pat_sex: sex,
            pat_old: date,
            pat_address: address,
            pat_email,
            pat_number,
            pat_cccd,
        }
        connection.query(`INSERT INTO patient SET ?`, obj, (err, result2) => {
            if (err) throw err
            connection.query(`SELECT * FROM patient ORDER BY patient.create_date DESC LIMIT 1`, (err, result) => {
                if (err) throw err
                if (result) {
                    connection.query(`INSERT INTO bookhealth SET ?`, { pat_id: result[0].pat_id, path_id: path_id }, (err, result1) => {
                        if (err) throw err
                        connection.query(`SELECT * FROM bookhealth ORDER BY create_date DESC LIMIT 1`, (err, result2) => {
                            if (err) throw err
                            connection.query(`SELECT doctor.* FROM doctor LEFT JOIN accounts ON accounts.ac_id = doctor.ac_id WHERE accounts.ac_id = ?`, ac_id, (err, result3) => {
                                if (err) throw err
                                connection.query(`INSERT INTO prescription SET ?`, { bh_id: result2[0].bh_id, doc_id: result3[0].doc_id }, (err, result4) => {
                                    if (err) throw err
                                    connection.query(`INSERT INTO  paraclinical_invoice SET ?`, { pat_id: result[0].pat_id, doc_id: result3[0].doc_id }, (err, result4) => {
                                        if (err) throw err
                                        const arrPremise = listIdPremise.split(',');
                                        arrPremise.forEach(id => {
                                            connection.query(`INSERT INTO detail_premise SET ?`, { pat_id: result[0].pat_id, pre_id: id }, (err, result5) => {
                                                if (err) throw err
                                                connection.query('DELETE FROM `schedule_examination` WHERE schedule_examination.se_id =  ?', se_id, (err, result) => {
                                                    if (err) throw err
                                                })
                                            })
                                        })
                                        res.send(`<script>alert("Bệnh nhân đã được thêm với mã là BN: ${result[0].pat_id}!!");window.location.href = "/add_patient_information"; </script>`)
                                    })
                                })
                            })
                        })
                    })
                }
            })
        })
    },
    examination(req, res) {
        if (req.body.id) {
            id = req.body.id
            const pat_id_pdf = req.body.id
            const doctorName = req.cookies.doc_name

            connection.query('SELECT patient.*, DATE_FORMAT(patient.pat_old,"%d/%m/%Y") as date FROM `patient` WHERE pat_id = ? AND patient.delete = 0', id, (err, result) => {
                if (err) throw err
                if (result.length > 0) {
                    connection.query('SELECT paraclinical_invoice.* FROM paraclinical_invoice LEFT JOIN patient ON patient.pat_id = paraclinical_invoice.pat_id WHERE patient.pat_id = ? ORDER BY paraclinical_invoice.create_date DESC LIMIT 1', id, (err, paraclinical_invoice) => {
                        if (err) throw err
                        connection.query('SELECT paraclinical_invoice.*,COUNT(paraclinical_invoice.pi_id) as sum FROM paraclinical_invoice LEFT JOIN patient ON patient.pat_id = paraclinical_invoice.pat_id WHERE patient.pat_id = ? ORDER BY paraclinical_invoice.create_date DESC LIMIT 1', id, (err, paraclinicalSum) => {
                            if (err) throw err
                            const pi_id = paraclinicalSum[0].pi_id
                            connection.query('SELECT detail_patient_sub.dps_id, subclinical.*, result.res_id , paraclinical_invoice.pi_id FROM subclinical LEFT JOIN detail_patient_sub ON detail_patient_sub.sub_id = subclinical.sub_id LEFT JOIN paraclinical_invoice ON paraclinical_invoice.pi_id = detail_patient_sub.pi_id LEFT JOIN result ON result.dps_id = detail_patient_sub.dps_id WHERE paraclinical_invoice.pi_id = ? ORDER BY detail_patient_sub.create_date DESC;', paraclinical_invoice[0].pi_id, (err, result1) => {
                                if (err) throw err 
                                connection.query(`SELECT examination.*, DATE_FORMAT(examination.exa_appointmentDate,"%d/%m/%Y") as date FROM examination WHERE examination.pat_id = ?`, result[0].pat_id, (err, result2) => {
                                    if (err) throw err
                                    connection.query('SELECT doctor.*, department.dep_name FROM doctor LEFT JOIN accounts ON accounts.ac_id = doctor.ac_id LEFT JOIN department ON department.dep_id = doctor.dep_id WHERE accounts.ac_username = ?', doctorName, (err, doctor_name) => {
                                        if (err) throw err
                                        connection.query('SELECT prescription.* FROM patient LEFT JOIN bookhealth ON bookhealth.pat_id = patient.pat_id LEFT JOIN prescription ON prescription.bh_id = bookhealth.bh_id WHERE patient.pat_id = ? ORDER BY prescription.create_date DESC LIMIT 1', id, (err, pre) => {
                                            if (err) throw err
                                            const pre_id = pre[0].pre_id
                                            console.log(pre_id)
                                            connection.query(`SELECT unit.u_name,detailmedicine.*, medicine.med_name,medicine.u_id FROM patient LEFT JOIN bookhealth ON patient.pat_id = bookhealth.pat_id LEFT JOIN prescription ON prescription.bh_id = bookhealth.bh_id LEFT JOIN detailmedicine ON detailmedicine.pre_id = prescription.pre_id LEFT JOIN medicine ON medicine.med_id = detailmedicine.med_id LEFT JOIN unit ON unit.u_id = medicine.u_id WHERE prescription.pre_id = ? ORDER BY detailmedicine.create_date DESC`, pre[0].pre_id, (err, arr_medical) => {
                                                if (err) throw err
                                                padId = result[0].pat_id
                                                let mess
                                                connection.query(`SELECT patient.pat_name,prescription.*,doctor.doc_name, DATE_FORMAT(prescription.create_date,"%d/%m/%Y") as date FROM patient LEFT JOIN bookhealth ON bookhealth.pat_id = patient.pat_id LEFT JOIN prescription ON prescription.bh_id = bookhealth.bh_id LEFT JOIN doctor ON doctor.doc_id = prescription.doc_id WHERE patient.pat_id = ? ORDER BY prescription.create_date DESC LIMIT 1,999999999999`, id, (err, arr_pre) => {
                                                    if (err) throw err
                                                    connection.query(`SELECT detail_patient_sub.* FROM detail_patient_sub WHERE detail_patient_sub.pi_id = ?`, result[0].pat_id, (err, resu) => {
                                                        if (err) throw err
                                                        if (arr_medical.length > 0) {
                                                            res.render('doctor/examinations', { pi_id, pat_id_pdf, result2, doctorName, resu, result, result1, arr_medical, pre_id, arr_pre, paraclinical_invoice, paraclinicalSum })
                                                        } else {
                                                            res.render('doctor/examinations', { pi_id, pat_id_pdf, result2, doctorName, resu, result, result1, pre_id, arr_pre, paraclinical_invoice, paraclinicalSum })
                                                        }
                                                    })
                                                })
                                            })
                                        })
                                    })
                                })
                            })
                        })
                    })
                } else {
                    res.send(`<script>alert("Mã bệnh nhân không tồn tại!!!");window.location.href = "/examination"; </script>`)
                }

            })
        }
    },
    show_arr_medicial_pre(req, res) {
        const pre_id = req.params.pre_id
        connection.query(`SELECT detailmedicine.*, medicine.med_name,medicine.u_id FROM patient LEFT JOIN bookhealth ON patient.pat_id = bookhealth.pat_id LEFT JOIN prescription ON prescription.bh_id = bookhealth.bh_id LEFT JOIN detailmedicine ON detailmedicine.pre_id = prescription.pre_id LEFT JOIN medicine ON medicine.med_id = detailmedicine.med_id WHERE prescription.pre_id = ? ORDER BY detailmedicine.create_date DESC`, pre_id, (err, result) => {
            if (err) throw err
            console.log(result)
            res.json({ status: 'success', result });
        })
    },
    add_subclinical(req, res) {
        const { sub_id, pi_id, pat_id } = req.body
        sub_id.forEach(sub => {
            connection.query(`SELECT * FROM patient where pat_id = ? `, pat_id, (err, result_patient) => {

                if (result_patient[0].paid === 0) {
                    res.status(401).json();
                } else {
                    connection.query('SELECT paraclinical_invoice.* FROM paraclinical_invoice LEFT JOIN patient ON patient.pat_id = paraclinical_invoice.pat_id WHERE patient.pat_id = ? ORDER BY paraclinical_invoice.create_date DESC LIMIT 1', pat_id, (err, paraclinicalSum) => {
                        if (err) throw err
                        connection.query(`SELECT subclinical.* FROM subclinical LEFT JOIN detail_patient_sub ON detail_patient_sub.sub_id = subclinical.sub_id LEFT JOIN paraclinical_invoice ON paraclinical_invoice.pi_id = detail_patient_sub.pi_id LEFT JOIN result ON result.dps_id = detail_patient_sub.dps_id WHERE paraclinical_invoice.pi_id = ? AND subclinical.sub_id = ? ORDER BY detail_patient_sub.create_date DESC`, [paraclinicalSum[0].pi_id, sub], (err, result) => {
                            if (err) throw err
                            if (result.length == 0) {
                                connection.query(`INSERT INTO detail_patient_sub SET ?`, { sub_id: sub, pi_id: paraclinicalSum[0].pi_id, Check_money_subclinical: 0 }, (err, result) => {
                                    if (err) throw err
                                    res.status(200).json();
                                })
                            } else if (result.length > 0) {
                                res.status(404).json();
                            }
                        })
                    })
                }
            })
        })
    },
    add_examination(req, res) {
        const { vascular, temperature, breathing, blood_pressure, height, weight, symptom, datepicker, gender2, pat_id } = req.body
        const sqlData = {
            pat_id: pat_id,
            exa_vascular: vascular,
            exa_breathing: breathing,
            exa_height: height,
            exa_temperature: temperature,
            exa_blood_pressure: blood_pressure,
            exa_weight: weight,
            exa_symptom: symptom,
            exa_appointmentDate: datepicker,
            exa_type: gender2,
        }
        connection.query(`INSERT INTO examination SET ?`, sqlData, (err, result) => {
            if (err) throw err
            // res.end('{"message":"Thêm thành công...","status": 200,sqlData}')
            res.json({ status: 'success' });
        })

    },
    delete_subclinical_item(req, res) {
        const idSub = req.params.idSub
        connection.query(`DELETE FROM detail_patient_sub WHERE sub_id = ?`, idSub, (err, result) => {
            if (err) throw err
            res.send(`<script>alert("Xóa thành công!!");window.location.href = "/examination"; </script>`)
        })
    },
    delete_sub_item(req, res) {
        const { pat_id, sub_id } = req.params
        connection.query(`DELETE FROM detail_patient_sub WHERE pat_id = ? AND sub_id = ?`, [pat_id, sub_id], (err, result) => {
            if (err) throw err
            connection.query('SELECT subclinical.*, result.res_id , patient.pat_id FROM subclinical LEFT JOIN detail_patient_sub ON detail_patient_sub.sub_id = subclinical.sub_id LEFT JOIN patient ON patient.pat_id = detail_patient_sub.pat_id LEFT JOIN result ON result.dps_id = detail_patient_sub.dps_id WHERE patient.pat_id = ? ORDER BY detail_patient_sub.create_date DESC', pat_id, (err, listPremise) => {
                res.json({ status: 'success', listPremise });
            })
        })
    },
    delete_subclinical_items(req, res) {
        const { subclinical_id, pat_id } = req.body
        connection.query(`DELETE FROM detail_patient_sub WHERE pat_id = ? AND sub_id = ?`, [pat_id, subclinical_id], (err, result) => {
            if (err) throw err
            connection.query('SELECT * FROM detail_patient_sub WHERE pat_id = ? ORDER BY create_date DESC', pat_id, (err, sub) => {
                if (err) throw err
                res.json({ status: 'success', sub });
            })
        })
    },
    delete_arr_sub(req, res) {
        const { arr_check_sub, pi_id } = req.body
        arr_check_sub.forEach(sub_id => {
            connection.query(`DELETE FROM detail_patient_sub WHERE pi_id = ? AND sub_id = ?`, [pi_id, sub_id], (err, result) => {
                if (err) throw (err)
            })
        })
        res.json({ status: 'success' });

    },
    subclinical(req, res) {
        if (req.body.id) {
            const docName = req.cookies.doc_name
            connection.query('SELECT patient.*, DATE_FORMAT(patient.pat_old,"%d/%m/%Y") as date FROM `patient` WHERE pat_id =? AND patient.delete = 0', req.body.id, (err, patient) => {
                if (err) throw err
                if (patient.length > 0) {
                    connection.query('SELECT paraclinical_invoice.* FROM paraclinical_invoice LEFT JOIN patient ON patient.pat_id = paraclinical_invoice.pat_id WHERE patient.pat_id = ? ORDER BY paraclinical_invoice.create_date DESc LIMIT 1', req.body.id, (err, paraclinical_invoice) => {
                        if (err) throw err
                        connection.query('SELECT subclinical.*, result.res_id FROM subclinical LEFT JOIN detail_patient_sub ON detail_patient_sub.sub_id = subclinical.sub_id LEFT JOIN paraclinical_invoice ON paraclinical_invoice.pi_id = detail_patient_sub.pi_id LEFT JOIN result ON result.dps_id = detail_patient_sub.dps_id WHERE result.res_id IS NULL AND detail_patient_sub.pi_id = ? AND detail_patient_sub.Check_money_subclinical = 1 ', paraclinical_invoice[0].pi_id, (err, subclinical) => {
                            if (err) throw err
                            res.render('doctor/subclinical', { patient, subclinical, docName })
                        })
                    })
                } else {
                    res.send(`<script>alert("Mã bệnh nhân không tồn tại!!!");window.location.href = "/subclinical"; </script>`)
                }
            })
        }
    },
    subclinical_handle(req, res) {
        const { idPat, idSub, detail, bt_red_blood_cells, bt_white_blood_cells, bt_blood } = req.body
        connection.query('SELECT patient.*, DATE_FORMAT(patient.pat_old,"%d/%m/%Y") as date FROM `patient` WHERE pat_id = ? AND patient.delete = 0', idPat, (err, result) => {
            if (err) throw err
            connection.query('SELECT paraclinical_invoice.* FROM paraclinical_invoice LEFT JOIN patient ON patient.pat_id = paraclinical_invoice.pat_id WHERE patient.pat_id = ? ORDER BY paraclinical_invoice.create_date DESc LIMIT 1', idPat, (err, paraclinical_invoice) => {
                if (err) throw err
                connection.query(`SELECT * FROM subclinical WHERE sub_name = ?`, idSub, (err, result) => {
                    if (err) throw err
                    connection.query(`SELECT detail_patient_sub.dps_id FROM detail_patient_sub WHERE detail_patient_sub.pi_id = ${paraclinical_invoice[0].pi_id} AND detail_patient_sub.sub_id = ${result[0].sub_id}`, (err, result) => {
                        if (detail) {
                            if (err) throw err
                            const idDps = result[0].dps_id
                            const data = {
                                dps_id: idDps,
                                res_detail: detail,
                                bt_red_blood_cells: '',
                                bt_white_blood_cells: '',
                                bt_blood: ''
                            }
                            connection.query(`INSERT INTO result SET ?`, data, (err, result1) => {
                                if (err) throw err
                                res.json({ status: 'success' });
                            })
                        } else {
                            if (err) throw err
                            const idDps = result[0].dps_id
                            const data = {
                                dps_id: idDps,
                                res_detail: '',
                                bt_red_blood_cells: bt_red_blood_cells,
                                bt_white_blood_cells: bt_white_blood_cells,
                                bt_blood: bt_blood
                            }
                            connection.query(`INSERT INTO result SET ?`, data, (err, result1) => {
                                if (err) throw err
                                res.json({ status: 'success' });
                            })
                        }
                    })
                })
            })
        })


    },
    show_detail_patient_sub(req, res) {
        const pi_id = req.params.pi_id
        connection.query('SELECT subclinical.*, result.res_id , paraclinical_invoice.pi_id FROM subclinical LEFT JOIN detail_patient_sub ON detail_patient_sub.sub_id = subclinical.sub_id LEFT JOIN paraclinical_invoice ON paraclinical_invoice.pi_id = detail_patient_sub.pi_id LEFT JOIN result ON result.dps_id = detail_patient_sub.dps_id WHERE paraclinical_invoice.pi_id = ? ORDER BY detail_patient_sub.create_date DESC', pi_id, (err, listPremise) => {
            res.json({ status: 'success', listPremise });
        })
    },
    import_medical_item(req, res) {
        const { med_name, quantity_time, quantity_day, quantity_day_use, use_only, idPatss, pre_id } = req.body
        connection.query('SELECT * FROM `medicine` WHERE med_name = ?', med_name, (err, medicineID) => {
            if (err) throw err
            connection.query('SELECT detailmedicine.* FROM patient LEFT JOIN bookhealth ON bookhealth.pat_id = patient.pat_id LEFT JOIN prescription ON prescription.bh_id = bookhealth.bh_id LEFT JOIN detailmedicine ON detailmedicine.pre_id = prescription.pre_id LEFT JOIN medicine ON medicine.med_id = detailmedicine.med_id WHERE detailmedicine.med_id = ? AND patient.pat_id = ? AND prescription.pre_id =  ?', [medicineID[0].med_id, idPatss, pre_id], (err, checkMedical) => {
                if (err) throw err
                if (checkMedical.length > 0) {
                    // const { quantity_time, quantity_day, quantity_day_use, total_price } = checkMedical[0]
                    const new_total_price = [(quantity_time * quantity_day * quantity_day_use) * medicineID[0].med_price] + checkMedical[0].total_price
                    const newData = {
                        quantity_time: checkMedical[0].quantity_time + parseInt(quantity_time),
                        quantity_day: checkMedical[0].quantity_day + parseInt(quantity_day),
                        quantity_day_use: checkMedical[0].quantity_day_use + parseInt(quantity_day_use),
                        total_price: new_total_price,
                    }
                    connection.query('UPDATE detailmedicine set ? WHERE med_id = ?', [newData, medicineID[0].med_id], (err, success) => {
                        if (err) throw err
                        res.json({ status: 'success' });
                    })

                } else {
                    connection.query('SELECT prescription.* FROM prescription LEFT JOIN bookhealth ON bookhealth.bh_id = prescription.bh_id LEFT JOIN patient ON patient.pat_id = bookhealth.pat_id WHERE patient.pat_id = ? ORDER BY prescription.create_date DESC LIMIT 1', padId, (err, pressID) => {
                        if (err) throw err
                        const total_price = (quantity_time * quantity_day * quantity_day_use) * medicineID[0].med_price
                        const data = {
                            med_id: medicineID[0].med_id,
                            pre_id: pressID[0].pre_id,
                            quantity_time,
                            quantity_day,
                            quantity_day_use,
                            use_only,
                            total_price
                        }
                        connection.query('SELECT * FROM medicine WHERE med_name = ?', med_name, (err, medicineDetail) => {
                            const newQuantity = medicineDetail[0].Quantity - quantity_time
                            const { u_id } = medicineDetail[0]
                            if (medicineDetail[0].u_id === 38 || medicineDetail[0].u_id === 44) {
                                const price_total_quantity = medicineID[0].med_price  * quantity_time
                                const newData = { ...data, total_quantity: quantity_time, total_price: price_total_quantity }
                                connection.query('UPDATE medicine set Quantity = ? WHERE med_id = ?', [newQuantity, medicineDetail[0].med_id], (err, success) => {
                                    if (err) throw err
                                    connection.query('SELECT * FROM medicine WHERE med_id = ?', medicineDetail[0].med_id, (err, success1) => {
                                        const newRemainingQuantity1 = success1[0].Quantity * success1[0].QuantityPerPack
                                        connection.query('UPDATE medicine set RemainingQuantity = ? WHERE med_id = ?', [success1[0].Quantity, medicineDetail[0].med_id], (err, success2) => {
                                            connection.query(`INSERT INTO detailmedicine SET ?`, newData, (err, result) => {
                                                if (err) throw err
                                                res.json({ status: 'success' });
                                            })
                                        })
                                    })
                                })
                            } else {
                                const newRemainingQuantity = medicineDetail[0].RemainingQuantity - (quantity_time * quantity_day * quantity_day_use)
                                const total_use_day_time = quantity_time * quantity_day * quantity_day_use
                                const newData = { ...data, total_quantity: total_use_day_time }
                                // const price_total_quantity = [(medicineID[0].med_price / medicineID[0].Quantity) / medicineID[0].QuantityPerPack] * total_use_day_time //giá tiền của tổng số lượng viên thuốc
                                const price_total_quantity = medicineDetail[0].med_price * total_use_day_time //giá tiền của tổng số lượng viên thuốc
                                const lastData = { ...newData, total_price: price_total_quantity }
                                connection.query('UPDATE medicine set RemainingQuantity = ? WHERE med_id = ?', [newRemainingQuantity, medicineDetail[0].med_id], (err, success) => {
                                    if (err) throw err
                                    connection.query(`INSERT INTO detailmedicine SET ?`, lastData, (err, result) => {
                                        if (err) throw err
                                        res.json({ status: 'success' });
                                    })
                                })
                            }

                        })
                    })

                }

            })
        })
    },
    update_store_medical_item(req, res) {
        const { med_id, total_quantityNew } = req.params
        connection.query('SELECT * FROM medicine WHERE med_id = ?', med_id, (err, success) => {
            const RemainingQuantity = success[0].RemainingQuantity
            const total_last = +RemainingQuantity + +total_quantityNew
            connection.query('UPDATE medicine set RemainingQuantity = ? WHERE med_id = ?', [total_last, med_id], (err, success) => {
                if (err) throw err
                connection.query(`DELETE FROM detailmedicine WHERE med_id =  ?`, med_id, (err, result) => {
                    if (err) throw err
                    res.json({ status: 'success' });
                })
            })
        })
    },
    update_Check_money_book(req, res) {
        const pat_id = req.params.pat_id
        const paid = req.params.paid
        const num = paid == 0 ? 1 : 0 
        const checkPaid = Number(num)
        connection.query('UPDATE patient set patient.paid = ? WHERE patient.pat_id = ?', [checkPaid, pat_id], (err, success) => {
            if (err) throw err
            res.json({ status: 'success' });
        })
        
    },
    delete_medical_item(req, res) {
        const { med_id, total_quantity, u_id } = req.params
        connection.query(`DELETE FROM detailmedicine WHERE med_id =  ?`, med_id, (err, result) => {
            if (err) throw err
            connection.query('SELECT * FROM medicine WHERE med_id = ?', med_id, (err, success) => {
                if (err) throw err
                if (+u_id === 38) {
                    const updateQuantity = success[0].Quantity + (+total_quantity)
                    connection.query('UPDATE medicine set Quantity = ?,RemainingQuantity = ? WHERE med_id = ?', [updateQuantity, updateQuantity, +med_id], (err, success) => {
                        if (err) throw err
                        res.json({ status: 'success' });
                    })
                } else {
                    const updateQuantity = success[0].RemainingQuantity + (+total_quantity)
                    connection.query('UPDATE medicine set RemainingQuantity = ? WHERE med_id = ?', [updateQuantity, +med_id], (err, success) => {
                        if (err) throw err
                        res.json({ status: 'success' });
                    })
                }
            })
        })
    },
    delete_all_medical_item(req, res) {
        const pat_id = req.params.pat_id
        connection.query('SELECT prescription.pre_id FROM patient LEFT JOIN bookhealth ON bookhealth.pat_id = patient.pat_id LEFT JOIN prescription ON prescription.bh_id = bookhealth.bh_id LEFT JOIN detailmedicine ON detailmedicine.pre_id = prescription.pre_id WHERE patient.pat_id = ?', pat_id, (err, pre_id) => {
            if (err) throw err
            connection.query(`DELETE FROM detailmedicine WHERE pre_id = ?`, pre_id[0].pre_id, (err, result) => {
                if (err) throw err
                res.json({ status: 'success' });
            })
        })

    },
    change_password(req, res) {
        res.render('validates/change_password')
    },
    update_Check_money_subclinical(req, res) {
        const pi_id = req.params.pi_id
        connection.query('SELECT detail_patient_sub.* FROM detail_patient_sub WHERE detail_patient_sub.pi_id = ?', pi_id, (err, result) => {
            if (err) throw err;
            if (result.length = 0) {
                res.locals.message = "Chưa chọn dịch vụ!";
            }
            else {
                connection.query('UPDATE detail_patient_sub SET Check_money_subclinical = 1 WHERE detail_patient_sub.pi_id = ?', pi_id, (err, success) => {
                    if (err) throw err;
                    res.json({ status: 'success' });
                })
            }
        })

    }
}
export default SiteController