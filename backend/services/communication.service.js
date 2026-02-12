const nodemailer = require('nodemailer');
const twilio = require('twilio');

class CommunicationService {
    constructor() {
        this.emailTransporter = null;
        this.twilioClient = null;
        this.twilioPhone = null;

        // Initialize Email
        this.initEmail();

        // Initialize SMS
        if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
            try {
                this.twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
                this.twilioPhone = process.env.TWILIO_PHONE_NUMBER;
            } catch (err) {
                console.error('[Communication] Twilio init failed:', err.message);
            }
        }
    }

    async initEmail() {
        if (process.env.SMTP_HOST) {
            this.emailTransporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
        } else {
            // Create Ethereal Test Account
            try {
                const testAccount = await nodemailer.createTestAccount();
                this.emailTransporter = nodemailer.createTransport({
                    host: 'smtp.ethereal.email',
                    port: 587,
                    secure: false,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass,
                    },
                });
                console.log('[Communication] Initialized with Ethereal Email (Test Mode)');
                console.log('[Communication] Credentials:', testAccount.user, testAccount.pass);
            } catch (err) {
                console.error('[Communication] Failed to create Ethereal account:', err.message);
            }
        }
    }

    // Abstraction: Send Email
    async sendEmail(to, subject, html) {
        if (!this.emailTransporter) {
            console.log(`[Communication] (Simulated) Email to ${to} | Subject: ${subject}`);
            return true;
        }

        try {
            const info = await this.emailTransporter.sendMail({
                from: '"OpsFlow Platform" <notifications@opsflow.ai>',
                to,
                subject,
                html,
            });

            console.log(`[Communication] Email sent to ${to}. MessageId: ${info.messageId}`);
            const preview = nodemailer.getTestMessageUrl(info);
            if (preview) {
                console.log(`[Communication] 🔗 Preview URL: ${preview}`);
            }
            return true;
        } catch (error) {
            console.error(`[Communication] Email Delivery Failed to ${to}:`, error.message);
            return false; // Fail gracefully
        }
    }

    // Abstraction: Send SMS
    async sendSMS(to, body) {
        if (!this.twilioClient || !this.twilioPhone) {
            console.log(`[Communication] (Simulated) SMS to ${to}: "${body}"`);
            return true;
        }

        try {
            const message = await this.twilioClient.messages.create({
                body,
                from: this.twilioPhone,
                to,
            });
            console.log(`[Communication] SMS sent to ${to}. SID: ${message.sid}`);
            return true;
        } catch (error) {
            console.error(`[Communication] SMS Delivery Failed to ${to}:`, error.message);
            return false; // Fail gracefully
        }
    }
}

module.exports = new CommunicationService();
