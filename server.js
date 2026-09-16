const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse incoming JSON payloads
app.use(express.json());

// Serve static assets from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Explicit root route handler to serve the portfolio frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Configure Nodemailer Transporter using Gmail SMTP credentials from environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify SMTP connection configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ [SMTP Error]: Failed to connect to mail server:', error);
  } else {
    console.log('✅ [SMTP Ready]: Successfully authenticated with Gmail. Ready to send recruitment emails.');
  }
});

// Contact Form API Endpoint
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Validate incoming fields
  if (!name || !email || !message) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please fill in all required fields (Name, Email, Message).' 
    });
  }

  const mailOptions = {
    from: `"Academic Portfolio Desk" <${process.env.SMTP_USER}>`,
    to: process.env.RECEIVER_EMAIL || 'anandrajaugustin@gmail.com',
    subject: `[Recruitment Inquiry] ${subject || 'Assistant Professor Opening'} - From ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f6f8; border-radius: 10px;">
        <h2 style="color: #0284c7;">New Interview / Hiring Inquiry Received</h2>
        <p><strong>Interviewer / Institution:</strong> ${name}</p>
        <p><strong>Official Email:</strong> ${email}</p>
        <p><strong>Designation Reference:</strong> ${subject || 'N/A'}</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
        <p><strong>Message / Schedule Details:</strong></p>
        <p style="background: #ffffff; padding: 15px; border-radius: 5px; border-left: 4px solid #0ea5e9;">${message}</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
        <p style="font-size: 11px; color: #666;">This message was transmitted securely via Augustin Anandraj's academic portfolio contact desk.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ 
      success: true, 
      message: 'Email transmitted successfully!' 
    });
  } catch (error) {
    console.error('Mail transmission error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to send message. Verify SMTP credentials in Vercel environment variables.' 
    });
  }
});

// Local listening wrapper
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server active on http://localhost:${PORT}`);
  });
}

// CRITICAL FOR VERCEL: Export the Express app as a serverless function handler
module.exports = app;
