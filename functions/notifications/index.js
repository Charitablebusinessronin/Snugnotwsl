const catalyst = require('zcatalyst-sdk-node');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const http = require('http');
const socketIo = require('socket.io');
const nodemailer = require('nodemailer');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Notification channels configuration
const NOTIFICATION_CHANNELS = {
  email: {
    enabled: true,
    smtp_host: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtp_port: process.env.SMTP_PORT || 587,
    smtp_user: process.env.SMTP_USER || 'notifications@snugkisses.com',
    smtp_pass: process.env.SMTP_PASS || 'your_email_password',
    from_address: process.env.FROM_EMAIL || 'Snug & Kisses <noreply@snugkisses.com>'
  },
  sms: {
    enabled: true,
    twilio_sid: process.env.TWILIO_SID || 'your_twilio_sid',
    twilio_token: process.env.TWILIO_TOKEN || 'your_twilio_token',
    twilio_phone: process.env.TWILIO_PHONE || '+1234567890'
  },
  push: {
    enabled: true,
    fcm_server_key: process.env.FCM_SERVER_KEY || 'your_fcm_key'
  }
};

// Notification templates
const NOTIFICATION_TEMPLATES = {
  service_request_created: {
    title: 'New Service Request',
    email_subject: 'New Service Request - {service_type}',
    email_template: `
      <h2>New Service Request</h2>
      <p>A new {service_type} request has been submitted.</p>
      <p><strong>Request ID:</strong> {request_id}</p>
      <p><strong>Client:</strong> {client_name}</p>
      <p><strong>Scheduled:</strong> {scheduled_time}</p>
      <p><strong>Location:</strong> {location}</p>
      {priority_notice}
      <p>Please log into your portal to view details and accept this request.</p>
    `,
    sms_template: 'New {service_type} request from {client_name}. Scheduled: {scheduled_time}. View details in your portal.',
    push_template: 'New {service_type} service request available'
  },
  service_request_accepted: {
    title: 'Service Request Accepted',
    email_subject: 'Your Service Request Has Been Accepted',
    email_template: `
      <h2>Service Request Accepted</h2>
      <p>Great news! Your {service_type} request has been accepted.</p>
      <p><strong>Contractor:</strong> {contractor_name}</p>
      <p><strong>Contact:</strong> {contractor_phone}</p>
      <p><strong>Scheduled:</strong> {scheduled_time}</p>
      <p><strong>Location:</strong> {location}</p>
      <p>Your contractor will contact you shortly to confirm details.</p>
    `,
    sms_template: 'Your {service_type} request accepted by {contractor_name}. Contact: {contractor_phone}',
    push_template: 'Service request accepted by {contractor_name}'
  },
  payment_processed: {
    title: 'Payment Processed',
    email_subject: 'Payment Confirmation - {service_type}',
    email_template: `
      <h2>Payment Processed Successfully</h2>
      <p>Your payment for {service_type} service has been processed.</p>
      <p><strong>Amount:</strong> ${total_amount}</p>
      <p><strong>Payment Method:</strong> {payment_method}</p>
      <p><strong>Transaction ID:</strong> {transaction_id}</p>
      <p><strong>Date:</strong> {payment_date}</p>
      <p>A receipt has been sent to your email address.</p>
    `,
    sms_template: 'Payment of ${total_amount} processed for {service_type}. Receipt emailed.',
    push_template: 'Payment processed successfully - ${total_amount}'
  },
  time_tracking_reminder: {
    title: 'Time Tracking Reminder',
    email_subject: 'Remember to Clock Out',
    email_template: `
      <h2>Time Tracking Reminder</h2>
      <p>You have been clocked in for {hours_worked} hours.</p>
      <p><strong>Service:</strong> {service_type}</p>
      <p><strong>Client:</strong> {client_name}</p>
      <p><strong>Started:</strong> {start_time}</p>
      <p>Please remember to clock out when your service is complete.</p>
    `,
    sms_template: 'Reminder: You have been clocked in for {hours_worked} hours. Please clock out when finished.',
    push_template: 'Clock out reminder - {hours_worked} hours worked'
  },
  emergency_alert: {
    title: 'Emergency Service Request',
    email_subject: 'URGENT: Emergency Service Request',
    email_template: `
      <h2 style="color: red;">URGENT: Emergency Service Request</h2>
      <p><strong>This is an emergency request requiring immediate attention.</strong></p>
      <p><strong>Service:</strong> {service_type}</p>
      <p><strong>Client:</strong> {client_name}</p>
      <p><strong>Location:</strong> {location}</p>
      <p><strong>Contact:</strong> {client_phone}</p>
      <p><strong>Details:</strong> {emergency_details}</p>
      <p style="color: red;"><strong>Please respond immediately or contact emergency services if needed.</strong></p>
    `,
    sms_template: 'EMERGENCY: {service_type} needed by {client_name} at {location}. Contact: {client_phone}. Respond immediately!',
    push_template: 'EMERGENCY: {service_type} request - immediate response needed'
  }
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      code: 'TOKEN_MISSING'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        error: 'Invalid or expired token',
        code: 'TOKEN_INVALID'
      });
    }
    req.user = decoded;
    next();
  });
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required_roles: roles,
        user_role: req.user?.userRole
      });
    }
    next();
  };
};

// Socket.IO authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication token required'));
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error('Invalid token'));
    }
    socket.userId = decoded.userId;
    socket.tenantId = decoded.tenantId;
    socket.userRole = decoded.userRole;
    next();
  });
});

// Notification Service
class NotificationService {
  constructor(catalystApp) {
    this.catalystApp = catalystApp;
    this.setupEmailTransporter();
  }

  // Setup email transporter
  setupEmailTransporter() {
    if (NOTIFICATION_CHANNELS.email.enabled) {
      this.emailTransporter = nodemailer.createTransporter({
        host: NOTIFICATION_CHANNELS.email.smtp_host,
        port: NOTIFICATION_CHANNELS.email.smtp_port,
        secure: false,
        auth: {
          user: NOTIFICATION_CHANNELS.email.smtp_user,
          pass: NOTIFICATION_CHANNELS.email.smtp_pass
        }
      });
    }
  }

  // Validation schemas
  static getNotificationSchema() {
    return Joi.object({
      recipient_id: Joi.string().uuid().required(),
      recipient_role: Joi.string().valid('client', 'contractor', 'employee', 'admin', 'hr').required(),
      notification_type: Joi.string().valid(
        'service_request_created', 'service_request_accepted', 'service_request_completed',
        'payment_processed', 'payment_failed', 'time_tracking_reminder',
        'emergency_alert', 'system_maintenance', 'general_announcement'
      ).required(),
      channels: Joi.array().items(Joi.string().valid('realtime', 'email', 'sms', 'push')).min(1).required(),
      data: Joi.object().required(),
      priority: Joi.string().valid('low', 'normal', 'high', 'critical').default('normal'),
      scheduled_at: Joi.date().iso().optional(),
      expires_at: Joi.date().iso().optional()
    });
  }

  // Send notification
  async sendNotification(tenantId, notificationData) {
    try {
      const validation = NotificationService.getNotificationSchema().validate(notificationData);
      if (validation.error) {
        throw new Error(`Validation error: ${validation.error.details[0].message}`);
      }

      const validatedData = validation.value;

      // Get recipient information
      const recipient = await this.getRecipientInfo(validatedData.recipient_id, tenantId);
      if (!recipient) {
        throw new Error('Recipient not found');
      }

      // Create notification record
      const notification = {
        notification_id: uuidv4(),
        tenant_id: tenantId,
        recipient_id: validatedData.recipient_id,
        recipient_role: validatedData.recipient_role,
        notification_type: validatedData.notification_type,
        channels: JSON.stringify(validatedData.channels),
        priority: validatedData.priority,
        data: JSON.stringify(validatedData.data),
        status: 'pending',
        scheduled_at: validatedData.scheduled_at || new Date().toISOString(),
        expires_at: validatedData.expires_at || moment().add(7, 'days').toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to database
      const datastore = this.catalystApp.datastore();
      const notificationsTable = datastore.table('notifications');
      const result = await notificationsTable.insertRow(notification);

      // Send through requested channels
      const deliveryResults = {};
      
      for (const channel of validatedData.channels) {
        try {
          switch (channel) {
            case 'realtime':
              deliveryResults.realtime = await this.sendRealtimeNotification(recipient, validatedData, notification);
              break;
            case 'email':
              deliveryResults.email = await this.sendEmailNotification(recipient, validatedData, notification);
              break;
            case 'sms':
              deliveryResults.sms = await this.sendSMSNotification(recipient, validatedData, notification);
              break;
            case 'push':
              deliveryResults.push = await this.sendPushNotification(recipient, validatedData, notification);
              break;
          }
        } catch (channelError) {
          console.error(`Error sending ${channel} notification:`, channelError);
          deliveryResults[channel] = { success: false, error: channelError.message };
        }
      }

      // Update notification status
      const hasSuccess = Object.values(deliveryResults).some(result => result.success);
      const status = hasSuccess ? 'sent' : 'failed';
      
      await notificationsTable.updateRow(result.ROWID, {
        status: status,
        delivery_results: JSON.stringify(deliveryResults),
        sent_at: hasSuccess ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      });

      // Log audit trail
      await this.logNotificationAudit(tenantId, validatedData.recipient_id, 'NOTIFICATION_SENT', {
        notification_id: notification.notification_id,
        notification_type: validatedData.notification_type,
        channels: validatedData.channels,
        delivery_results: deliveryResults
      });

      return {
        success: hasSuccess,
        notification_id: notification.notification_id,
        delivery_results: deliveryResults,
        status: status
      };

    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  // Send bulk notifications
  async sendBulkNotification(tenantId, bulkData) {
    try {
      const schema = Joi.object({
        recipient_ids: Joi.array().items(Joi.string().uuid()).min(1).max(1000).required(),
        notification_type: Joi.string().required(),
        channels: Joi.array().items(Joi.string().valid('realtime', 'email', 'sms', 'push')).min(1).required(),
        data: Joi.object().required(),
        priority: Joi.string().valid('low', 'normal', 'high', 'critical').default('normal')
      });

      const validation = schema.validate(bulkData);
      if (validation.error) {
        throw new Error(`Validation error: ${validation.error.details[0].message}`);
      }

      const validatedData = validation.value;
      const results = [];

      // Send to each recipient
      for (const recipientId of validatedData.recipient_ids) {
        try {
          const result = await this.sendNotification(tenantId, {
            recipient_id: recipientId,
            recipient_role: 'auto-detect', // Will be detected from user data
            notification_type: validatedData.notification_type,
            channels: validatedData.channels,
            data: validatedData.data,
            priority: validatedData.priority
          });
          
          results.push({ recipient_id: recipientId, ...result });
        } catch (error) {
          results.push({ 
            recipient_id: recipientId, 
            success: false, 
            error: error.message 
          });
        }
      }

      return {
        success: true,
        total_recipients: validatedData.recipient_ids.length,
        successful_deliveries: results.filter(r => r.success).length,
        failed_deliveries: results.filter(r => !r.success).length,
        results: results
      };

    } catch (error) {
      console.error('Error sending bulk notification:', error);
      throw error;
    }
  }

  // Send realtime notification via WebSocket
  async sendRealtimeNotification(recipient, notificationData, notification) {
    const template = NOTIFICATION_TEMPLATES[notificationData.notification_type];
    if (!template) {
      throw new Error(`Unknown notification type: ${notificationData.notification_type}`);
    }

    const message = {
      notification_id: notification.notification_id,
      type: notificationData.notification_type,
      title: this.replaceTemplateVariables(template.title, notificationData.data),
      message: this.replaceTemplateVariables(template.push_template || template.title, notificationData.data),
      priority: notificationData.priority,
      data: notificationData.data,
      timestamp: new Date().toISOString()
    };

    // Send to all connected sockets for this user
    const userSockets = Array.from(io.sockets.sockets.values()).filter(
      socket => socket.userId === recipient.user_id && socket.tenantId === recipient.tenant_id
    );

    if (userSockets.length > 0) {
      userSockets.forEach(socket => {
        socket.emit('notification', message);
      });
      return { success: true, delivered_to: userSockets.length };
    }

    return { success: false, error: 'User not connected' };
  }

  // Send email notification
  async sendEmailNotification(recipient, notificationData, notification) {
    if (!NOTIFICATION_CHANNELS.email.enabled || !this.emailTransporter) {
      return { success: false, error: 'Email channel disabled' };
    }

    const template = NOTIFICATION_TEMPLATES[notificationData.notification_type];
    if (!template) {
      throw new Error(`Unknown notification type: ${notificationData.notification_type}`);
    }

    const subject = this.replaceTemplateVariables(template.email_subject, notificationData.data);
    const html = this.replaceTemplateVariables(template.email_template, notificationData.data);

    const mailOptions = {
      from: NOTIFICATION_CHANNELS.email.from_address,
      to: recipient.email,
      subject: subject,
      html: html
    };

    try {
      const result = await this.emailTransporter.sendMail(mailOptions);
      return { success: true, message_id: result.messageId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Send SMS notification (mock implementation)
  async sendSMSNotification(recipient, notificationData, notification) {
    if (!NOTIFICATION_CHANNELS.sms.enabled) {
      return { success: false, error: 'SMS channel disabled' };
    }

    const template = NOTIFICATION_TEMPLATES[notificationData.notification_type];
    if (!template) {
      throw new Error(`Unknown notification type: ${notificationData.notification_type}`);
    }

    const message = this.replaceTemplateVariables(template.sms_template, notificationData.data);

    // Mock SMS sending (integrate with Twilio in production)
    const mockSuccess = Math.random() > 0.1; // 90% success rate
    
    if (mockSuccess) {
      return { 
        success: true, 
        message_id: `sms_${uuidv4()}`,
        to: recipient.phone,
        message: message
      };
    } else {
      return { success: false, error: 'SMS delivery failed' };
    }
  }

  // Send push notification (mock implementation)
  async sendPushNotification(recipient, notificationData, notification) {
    if (!NOTIFICATION_CHANNELS.push.enabled) {
      return { success: false, error: 'Push notifications disabled' };
    }

    const template = NOTIFICATION_TEMPLATES[notificationData.notification_type];
    if (!template) {
      throw new Error(`Unknown notification type: ${notificationData.notification_type}`);
    }

    const title = this.replaceTemplateVariables(template.title, notificationData.data);
    const body = this.replaceTemplateVariables(template.push_template, notificationData.data);

    // Mock push notification (integrate with FCM in production)
    const mockSuccess = Math.random() > 0.05; // 95% success rate
    
    if (mockSuccess) {
      return { 
        success: true, 
        message_id: `push_${uuidv4()}`,
        title: title,
        body: body
      };
    } else {
      return { success: false, error: 'Push notification delivery failed' };
    }
  }

  // Get recipient information
  async getRecipientInfo(recipientId, tenantId) {
    try {
      const datastore = this.catalystApp.datastore();
      const query = `SELECT * FROM users WHERE user_id = '${recipientId}' AND tenant_id = '${tenantId}'`;
      const result = await datastore.executeZCQL(query);
      
      if (result.length > 0) {
        return result[0].users;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching recipient info:', error);
      return null;
    }
  }

  // Get notification history
  async getNotificationHistory(tenantId, filters = {}) {
    try {
      let query = `SELECT * FROM notifications WHERE tenant_id = '${tenantId}'`;
      
      if (filters.recipient_id) {
        query += ` AND recipient_id = '${filters.recipient_id}'`;
      }
      if (filters.notification_type) {
        query += ` AND notification_type = '${filters.notification_type}'`;
      }
      if (filters.status) {
        query += ` AND status = '${filters.status}'`;
      }
      if (filters.priority) {
        query += ` AND priority = '${filters.priority}'`;
      }
      if (filters.date_from) {
        query += ` AND created_at >= '${filters.date_from}'`;
      }
      if (filters.date_to) {
        query += ` AND created_at <= '${filters.date_to}'`;
      }

      query += ' ORDER BY created_at DESC';

      if (filters.limit) {
        query += ` LIMIT ${filters.limit}`;
      }

      const datastore = this.catalystApp.datastore();
      const result = await datastore.executeZCQL(query);
      
      return result.map(row => {
        const notification = row.notifications;
        notification.channels = JSON.parse(notification.channels || '[]');
        notification.data = JSON.parse(notification.data || '{}');
        notification.delivery_results = JSON.parse(notification.delivery_results || '{}');
        return notification;
      });

    } catch (error) {
      console.error('Error fetching notification history:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, recipientId, tenantId) {
    try {
      const datastore = this.catalystApp.datastore();
      const query = `SELECT * FROM notifications WHERE notification_id = '${notificationId}' AND recipient_id = '${recipientId}' AND tenant_id = '${tenantId}'`;
      const result = await datastore.executeZCQL(query);
      
      if (!result.length) {
        throw new Error('Notification not found');
      }

      const notificationsTable = datastore.table('notifications');
      await notificationsTable.updateRow(result[0].notifications.ROWID, {
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      return { success: true };

    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Helper method to replace template variables
  replaceTemplateVariables(template, data) {
    let result = template;
    
    Object.keys(data).forEach(key => {
      const placeholder = `{${key}}`;
      result = result.replace(new RegExp(placeholder, 'g'), data[key] || '');
    });

    return result;
  }

  // Audit logging
  async logNotificationAudit(tenantId, userId, action, details) {
    try {
      const auditLog = {
        log_id: uuidv4(),
        tenant_id: tenantId,
        user_id: userId,
        action: action,
        resource_type: 'notification',
        resource_id: details.notification_id || null,
        details: JSON.stringify(details),
        ip_address: null,
        user_agent: null,
        timestamp: new Date().toISOString()
      };

      const datastore = this.catalystApp.datastore();
      const auditTable = datastore.table('audit_logs');
      await auditTable.insertRow(auditLog);

    } catch (error) {
      console.error('Error logging notification audit:', error);
    }
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected to tenant ${socket.tenantId}`);

  // Join tenant-specific room
  socket.join(`tenant_${socket.tenantId}`);
  socket.join(`user_${socket.userId}`);

  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected`);
  });
});

// Routes
app.post('/send', authenticateToken, requireRole(['admin', 'hr', 'system']), async (req, res) => {
  try {
    const notificationService = new NotificationService(catalyst.initialize(req));
    const result = await notificationService.sendNotification(
      req.user.tenantId,
      req.body
    );
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Notification send error:', error);
    res.status(400).json({ 
      error: error.message,
      code: 'NOTIFICATION_SEND_FAILED'
    });
  }
});

app.post('/send-bulk', authenticateToken, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const notificationService = new NotificationService(catalyst.initialize(req));
    const result = await notificationService.sendBulkNotification(
      req.user.tenantId,
      req.body
    );
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Bulk notification error:', error);
    res.status(400).json({ 
      error: error.message,
      code: 'BULK_NOTIFICATION_FAILED'
    });
  }
});

app.get('/history', authenticateToken, async (req, res) => {
  try {
    const notificationService = new NotificationService(catalyst.initialize(req));
    
    const filters = {
      recipient_id: req.user.userRole === 'admin' ? req.query.recipient_id : req.user.userId,
      notification_type: req.query.notification_type,
      status: req.query.status,
      priority: req.query.priority,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };

    const notifications = await notificationService.getNotificationHistory(
      req.user.tenantId,
      filters
    );
    
    res.json({ 
      success: true,
      notifications: notifications,
      total: notifications.length
    });
  } catch (error) {
    console.error('Error fetching notification history:', error);
    res.status(500).json({ 
      error: error.message,
      code: 'NOTIFICATION_HISTORY_FAILED'
    });
  }
});

app.post('/mark-read/:notificationId', authenticateToken, async (req, res) => {
  try {
    const notificationService = new NotificationService(catalyst.initialize(req));
    const result = await notificationService.markAsRead(
      req.params.notificationId,
      req.user.userId,
      req.user.tenantId
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(400).json({ 
      error: error.message,
      code: 'MARK_READ_FAILED'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'notifications',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    connected_clients: io.engine.clientsCount
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
});

module.exports = app;