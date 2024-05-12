import nodemailer from  'nodemailer'
const sendCustomEmail = (emailTo, subject, text,html) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        auth: {
            user: "trantoan150801@gmail.com",
            pass: "fstkvwonqscpjqpz",
        },
    });
    let message = {
        from: "Phòng khám nội tổng hợp An Bình",
        to: emailTo,
        subject: subject,
        text: text,
        html: html

    }
    transporter
        .sendMail(message)
        .then((res) => {
            console.log("email send successfull")
        })
        .catch((err) => {
            console.log(err)
        });
}

export default sendCustomEmail;