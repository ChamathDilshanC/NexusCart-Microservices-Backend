import nodemailer from 'nodemailer';

export const sendOTP = async (email: string, otp: string) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const htmlTemplate = `
    <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #111111; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; margin: 0;">NexusCart</h1>
      </div>
      
      <div style="background-color: #fafafa; border: 1px solid #eaeaea; border-radius: 12px; padding: 40px; text-align: center;">
        <h2 style="color: #111111; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Verify your email address</h2>
        <p style="color: #666666; font-size: 15px; line-height: 24px; margin-bottom: 32px;">
          Please use the verification code below to complete your NexusCart registration.
        </p>
        
        <div style="background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 8px; padding: 16px 24px; display: inline-block; margin-bottom: 32px;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 700; color: #111111; letter-spacing: 4px;">${otp}</span>
        </div>
        
        <p style="color: #888888; font-size: 13px; line-height: 20px; margin: 0;">
          This code will expire in 10 minutes.<br>If you didn't request this, you can safely ignore this email.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 32px;">
        <p style="color: #999999; font-size: 12px;">
          &copy; ${new Date().getFullYear()} NexusCart. All rights reserved.
        </p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: '"NexusCart" <' + process.env.EMAIL_USER + '>', // Sets sender name to NexusCart
    to: email,
    subject: 'Your NexusCart Verification Code',
    text: `Your OTP for NexusCart registration is: ${otp}. It will expire in 10 minutes.`, // Fallback for clients that don't support HTML
    html: htmlTemplate
  };

  await transporter.sendMail(mailOptions);
};
