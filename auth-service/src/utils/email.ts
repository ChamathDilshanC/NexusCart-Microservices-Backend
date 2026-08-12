import nodemailer from 'nodemailer';

export const sendOTP = async (email: string, otp: string) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your NexusCart Verification Code',
    text: `Your OTP for NexusCart registration is: ${otp}. It will expire in 10 minutes.`
  };

  await transporter.sendMail(mailOptions);
};
