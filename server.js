require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configure Nodemailer with Direct Gmail Service & Strict Timeouts
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL to avoid ISP port 587 filtering
  auth: {
    user: process.env.SMTP_USER || 'anandrajaugustin@gmail.com',
    pass: (process.env.SMTP_PASS || '').replace(/\s+/g, ''), // Strip spaces automatically
  },
  connectionTimeout: 12000, // 12 seconds max before timing out
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

// Verification check on boot
transporter.verify((error) => {
  if (error) {
    console.error('❌ [SMTP Auth Error]: Could not verify Gmail SMTP credentials.');
    console.error('Reason:', error.message);
    console.warn('👉 Verify that 2-Step Verification is ON and you are using a 16-character App Password (not your plain account password).');
  } else {
    console.log('✅ [SMTP Ready]: Successfully authenticated with Gmail. Ready to send recruitment emails.');
  }
});

// Contact API Endpoint
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please fill in all mandatory fields before sending.' 
    });
  }

  const mailOptions = {
    from: `"${name}" <${process.env.SMTP_USER || 'anandrajaugustin@gmail.com'}>`,
    replyTo: email,
    to: process.env.RECEIVER_EMAIL || 'anandrajaugustin@gmail.com',
    subject: `[Faculty Recruitment Inquiry] ${subject || 'Assistant Professor Position'} - ${name}`,
    text: `Sender Name: ${name}\nOfficial Email: ${email}\nDesignation / Subject: ${subject}\n\nMessage:\n${message}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; line-height: 1.6; color: #1e293b; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background-color: #0284c7; padding: 22px 24px;">
            <h2 style="color: #ffffff; margin: 0; font-size: 19px; font-weight: 700;">New Academic Recruitment Inquiry</h2>
            <p style="color: #e0f2fe; margin: 4px 0 0; font-size: 13px;">Forwarded from Augustin Anandraj's Faculty Webpage</p>
          </div>
          <div style="padding: 24px;">
            <p style="margin: 0 0 10px; font-size: 14px;"><strong>Interviewer / Institution:</strong> ${name}</p>
            <p style="margin: 0 0 10px; font-size: 14px;"><strong>Official Email:</strong> <a href="mailto:${email}" style="color: #0284c7; text-decoration: underline;">${email}</a></p>
            <p style="margin: 0 0 16px; font-size: 14px;"><strong>Subject Reference:</strong> ${subject || 'Assistant Professor CSE Interview'}</p>
            <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; border-left: 4px solid #0284c7; margin-bottom: 20px;">
              <p style="margin: 0; white-space: pre-wrap; font-size: 14px; color: #334155;">${message}</p>
            </div>
            <div style="text-align: center; padding-top: 10px;">
              <a href="mailto:${email}" style="background-color: #0284c7; color: #ffffff; padding: 11px 22px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 13px; display: inline-block;">Reply Directly to Interviewer</a>
            </div>
          </div>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📨 [Email Sent Successfully] Message ID: ${info.messageId} to ${process.env.RECEIVER_EMAIL}`);
    return res.status(200).json({ 
      success: true, 
      message: 'Your message has been delivered successfully to Augustin Anandraj.' 
    });
  } catch (error) {
    console.error('❌ [Mail Dispatch Error]:', error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Could not establish connection with mail server. Verify your Gmail App Password in .env.' 
    });
  }
});

// Express 5 compatible route
app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server active on http://localhost:${PORT}`);
});