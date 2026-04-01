import nodemailer from 'nodemailer';
import { GMAIL_PASS, GMAIL_USER } from '../../../config/config.service.js';

export const sendEmail = async ({ to, subject = "", html = "", attachments = [] }) => {
    const transporter = nodemailer.createTransport({
        //   host: "smtp.ethereal.email",
        //   port: 587,
        //   secure: false, // Use true for port 465, false for port 587
        service: "gmail",
        auth: {
            user: GMAIL_USER,
            pass: GMAIL_PASS
        },
    });

    // Send an email using async/await

    const info = await transporter.sendMail({
        from: `"FAKHR "<${GMAIL_USER}>`,
        to,
        subject,
        html,
        attachments
    });

    // console.log("Message sent:", info.messageId);
    return info.accepted.length ? true : false

}

export const sendOtp = async () => {
    return Math.floor(100000 + Math.random() * 900000)
}
