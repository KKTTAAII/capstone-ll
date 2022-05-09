const nodemailer = require("nodemailer");

const sendEmail = async (
  adopterEmail,
  subject,
  name,
  message,
  shelterEmail
) => {
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
      to: shelterEmail,
      subject: subject,
      html: `<html>
      <body>
          <p>Hi, my name is ${name}.</p>
          <p>${message}</p>
          <p>Please contact me at ${adopterEmail}</p>
      </body>
      </html>`,
    });

    console.log("email sent sucessfully");
  } catch (error) {
    console.log(error, "email not sent");
  }
};

module.exports = sendEmail;
