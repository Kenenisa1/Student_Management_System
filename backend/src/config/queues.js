import { Queue, Worker } from 'bullmq';
import { queueConnection } from '../config/redis.js';

// Setup connection
const connection = queueConnection;

// Define Queues
export const emailQueue = new Queue('emailQueue', { connection });
export const reportQueue = new Queue('reportQueue', { connection });

import { callExternalAPI } from '../utils/externalService.js';

// Define Workers
const emailWorker = new Worker('emailQueue', async (job) => {
    console.log(`[EmailWorker] Processing job ${job.id}: Sending email to ${job.data.to}`);
    
    // Using Circuit Breaker and Retry pattern for external service
    try {
        await callExternalAPI('/posts', { 
            title: 'Email Sent', 
            body: `To: ${job.data.to}, Subject: ${job.data.subject}` 
        });
        console.log(`[EmailWorker] Email sent to ${job.data.to} successfully via external service.`);
    } catch (err) {
        console.error(`[EmailWorker] Failed to send email via external API: ${err.message}`);
        throw err; // BullMQ will retry based on its own job settings
    }
}, { connection });

const reportWorker = new Worker('reportQueue', async (job) => {
    console.log(`[ReportWorker] Processing batch report job ${job.id}`);
    // Simulate long running report generation
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log(`[ReportWorker] Batch report ${job.data.reportId} generated successfully.`);
}, { connection });

emailWorker.on('completed', job => console.log(`[EmailWorker] Job ${job.id} completed.`));
emailWorker.on('failed', (job, err) => console.error(`[EmailWorker] Job ${job.id} failed:`, err));

reportWorker.on('completed', job => console.log(`[ReportWorker] Job ${job.id} completed.`));
reportWorker.on('failed', (job, err) => console.error(`[ReportWorker] Job ${job.id} failed:`, err));

export const addEmailJob = async (to, subject, text) => {
    return emailQueue.add('sendEmail', { to, subject, text });
};

export const addReportJob = async (reportId, params) => {
    return reportQueue.add('generateReport', { reportId, params });
};
