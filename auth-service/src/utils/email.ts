import nodemailer from 'nodemailer';

export const sendOTP = async (email: string, otp: string, context: 'verify' | 'reset' = 'verify') => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const title = context === 'reset' ? 'Reset your password.' : 'Welcome to NexusCart.';
  const message = context === 'reset' 
    ? "We received a request to reset your password. If you didn't make this request, you can safely ignore this email."
    : "We're thrilled to have you here. Complete your registration and join the platform.";

  const actionTitle = context === 'reset' ? 'Your Reset Code' : 'Your Verification Code';

  const logoUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/Logo/Logo%20with%20out%20Text.png`;

  const htmlTemplate = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000000; color: #ffffff;">
      
      <!-- Header -->
      <div style="padding: 32px 20px; text-align: center;">
        <img src="${logoUrl}" alt="NexusCart" style="height: 24px; width: auto; vertical-align: middle; margin-right: 8px; filter: invert(1);" />
        <span style="font-size: 20px; font-weight: 600; vertical-align: middle; letter-spacing: -0.5px;">NexusCart</span>
      </div>
      
      <!-- Main White Section -->
      <div style="background-color: #ffffff; color: #000000; padding: 60px 40px; text-align: center;">
        <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 42px; font-weight: 500; margin: 0 0 24px 0; letter-spacing: -1px; line-height: 1.1;">
          ${title}
        </h1>
        
        <hr style="border: 0; border-top: 1px solid #eaeaea; width: 60%; margin: 32px auto;" />
        
        <p style="font-size: 15px; line-height: 24px; color: #444444; margin: 0 auto 40px auto; max-width: 400px;">
          ${message}
        </p>
        
        <!-- Down Arrow Circle -->
        <div style="width: 32px; height: 32px; background-color: #000000; color: #ffffff; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 16px; margin: 0 auto;">
          &darr;
        </div>
      </div>
      
      <!-- Accent Section (Black) -->
      <div style="background-color: #000000; color: #ffffff; padding: 60px 40px; text-align: center;">
        <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 32px; font-weight: 500; margin: 0 0 24px 0; letter-spacing: -0.5px;">
          ${actionTitle}
        </h2>
        
        <p style="font-size: 14px; line-height: 22px; color: #a0a0a0; margin: 0 auto 40px auto; max-width: 380px;">
          Enter the code below in the application to continue. This code will expire in 10 minutes.
        </p>
        
        <!-- Pill shape for OTP -->
        <div style="background-color: #ffffff; color: #000000; border-radius: 100px; padding: 16px 48px; display: inline-block; text-align: center;">
          <span style="font-family: ui-monospace, monospace; font-size: 28px; font-weight: 600; letter-spacing: 6px;">
            ${otp}
          </span>
        </div>
      </div>
      
      <!-- Footer (Light Gray) -->
      <div style="background-color: #f4f4f5; color: #71717a; padding: 40px 20px; text-align: center; font-size: 12px; line-height: 20px;">
        <p style="margin: 0 0 16px 0;">
          <a href="#" style="color: #71717a; text-decoration: underline;">View email in browser</a><br>
          <a href="#" style="color: #71717a; text-decoration: underline;">Update your preferences</a> or <a href="#" style="color: #71717a; text-decoration: underline;">unsubscribe</a>.
        </p>
        
        <p style="margin: 0;">
          NexusCart Inc.<br>
          123 Commerce St., Tech City, TC 12345<br>
          Company Number: 98765432<br>
          &copy; ${new Date().getFullYear()} NexusCart
        </p>
        <p style="font-weight: 600; font-size: 14px; color: #18181b; margin-top: 16px;">NexusCart</p>
      </div>
      
    </div>
  `;

  const mailOptions = {
    from: '"NexusCart" <' + process.env.EMAIL_USER + '>',
    to: email,
    subject: context === 'reset' ? 'Your NexusCart Password Reset Code' : 'Your NexusCart Verification Code',
    text: `Your OTP for NexusCart is: ${otp}. It will expire in 10 minutes.`,
    html: htmlTemplate
  };

  await transporter.sendMail(mailOptions);
};
