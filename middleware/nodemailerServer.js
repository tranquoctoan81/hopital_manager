import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const sendEmail = async (to, content) => {
    const transporter = nodemailer.createTransport({
        service: 'smtp.gmail.com',
        port: 8000,
        secure: true,
        auth: {
            user: "phongkhamdichvuninhkieu@gmail.com",
            pass: "rfgm lixy tpyh ksdp",
        },
    });

    let message = {
        to,
        subject: 'ádgasdg',
        text: content,

    }
    transporter
        .sendMail(message)
        .then((res) => {
            console.log("email send successfull")
        })
        .catch((err) => {
            console.log(err)
        });
};

export default sendEmail;
