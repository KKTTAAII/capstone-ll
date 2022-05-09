const nodemailer = require("nodemailer");

const sendEmail = async (email, subject, link, username) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: subject,
      text: link,
      html: `<html>
      <body>
          <p>Hi ${username},</p>
          <p>You requested to reset your password.</p>
          <p> Please, click the link below to reset your password</p>
          <a href="${link}">Reset Password</a>
      </body>
      </html>`,
    });

    console.log("email sent sucessfully");
  } catch (error) {
    console.log(error, "email not sent");
  }
};

module.exports = sendEmail;
