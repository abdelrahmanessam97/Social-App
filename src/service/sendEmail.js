import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, html, attachments) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  const info = await transporter.sendMail({
    from: `"Social App 👻" <${process.env.EMAIL}>`, // sender address
    to: to, // list of receivers
    subject: subject ? subject : "Hello ✔", // Subject line
    html: html ? html : "<b>Hello world?</b>", // html body
    attachments: attachments ? attachments : [], // file attachment
  });

  if (info.accepted.length) {
    return true;
  }

  return false;
};
