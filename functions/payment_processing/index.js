const catalyst = require('zcatalyst-sdk-node');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const Decimal = require('decimal.js');
const crypto = require('crypto');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Payment gateway configurations (mock)
const PAYMENT_GATEWAYS = {
  stripe: {
    public_key: process.env.STRIPE_PUBLIC_KEY || 'pk_test_mock',
    secret_key: process.env.STRIPE_SECRET_KEY || 'sk_test_mock',
    webhook_secret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock'
  },
  square: {
    application_id: process.env.SQUARE_APPLICATION_ID || 'sq_mock',
    access_token: process.env.SQUARE_ACCESS_TOKEN || 'sq_token_mock',
    environment: process.env.SQUARE_ENVIRONMENT || 'sandbox'
  }
};

// Fee structures
const FEE_STRUCTURE = {
  platform_fee_percentage: new Decimal(3.5), // 3.5% platform fee
  payment_processing_fee: new Decimal(2.9), // 2.9% + $0.30
  payment_processing_fixed: new Decimal(0.30),
  employer_benefits_discount: new Decimal(1.0) // 1% less for employer benefits
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

// Payment Processing Service
class PaymentProcessingService {
  constructor(catalystApp) {
    this.catalystApp = catalystApp;
  }

  // Validation schemas
  static getPaymentIntentSchema() {
    return Joi.object({
      service_request_id: Joi.string().uuid().required(),
      time_entry_ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
      payment_type: Joi.string().valid('employer_benefits', 'direct_pay').required(),
      amount: Joi.number().positive().required(),
      currency: Joi.string().valid('USD').default('USD'),
      client_id: Joi.string().uuid().required(),
      contractor_id: Joi.string().uuid().required(),
      payment_method: Joi.string().valid('card', 'bank_transfer', 'employer_account').required(),
      description: Joi.string().max(500).optional()
    });
  }

  static getPaymentMethodSchema() {
    return Joi.object({
      type: Joi.string().valid('card', 'bank_account').required(),
      card_details: Joi.when('type', {
        is: 'card',
        then: Joi.object({
          card_number: Joi.string().creditCard().required(),
          exp_month: Joi.number().min(1).max(12).required(),
          exp_year: Joi.number().min(new Date().getFullYear()).required(),
          cvc: Joi.string().min(3).max(4).required(),
          cardholder_name: Joi.string().max(100).required()
        }).required(),
        otherwise: Joi.forbidden()
      }),
      bank_details: Joi.when('type', {
        is: 'bank_account',
        then: Joi.object({
          account_number: Joi.string().required(),
          routing_number: Joi.string().required(),
          account_type: Joi.string().valid('checking', 'savings').required(),
          account_holder_name: Joi.string().max(100).required()
        }).required(),
        otherwise: Joi.forbidden()
      }),
      billing_address: Joi.object({
        line1: Joi.string().max(200).required(),
        line2: Joi.string().max(200).optional(),
        city: Joi.string().max(100).required(),
        state: Joi.string().max(50).required(),
        postal_code: Joi.string().max(20).required(),
        country: Joi.string().length(2).default('US')
      }).required()
    });
  }

  // Create payment intent
  async createPaymentIntent(tenantId, paymentData) {
    try {
      const validation = PaymentProcessingService.getPaymentIntentSchema().validate(paymentData);
      if (validation.error) {
        throw new Error(`Validation error: ${validation.error.details[0].message}`);
      }

      const validatedData = validation.value;

      // Verify time entries and calculate total
      const timeEntryDetails = await this.verifyTimeEntries(
        validatedData.time_entry_ids,
        validatedData.contractor_id,
        tenantId
      );

      // Calculate fees and final amounts
      const billing = this.calculatePaymentAmounts(validatedData.amount, validatedData.payment_type);

      // Create payment intent record
      const paymentIntent = {
        payment_intent_id: uuidv4(),
        tenant_id: tenantId,
        service_request_id: validatedData.service_request_id,
        time_entry_ids: JSON.stringify(validatedData.time_entry_ids),
        client_id: validatedData.client_id,
        contractor_id: validatedData.contractor_id,
        payment_type: validatedData.payment_type,
        payment_method: validatedData.payment_method,
        currency: validatedData.currency,
        
        // Amount breakdown
        subtotal_amount: validatedData.amount,
        platform_fee: billing.platform_fee.toNumber(),
        processing_fee: billing.processing_fee.toNumber(),
        total_amount: billing.total_amount.toNumber(),
        contractor_payout: billing.contractor_payout.toNumber(),
        
        description: validatedData.description || 'Snug & Kisses service payment',
        status: 'pending',
        gateway_payment_id: null,
        gateway_response: null,
        
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expires_at: moment().add(1, 'hour').toISOString() // Payment intent expires in 1 hour
      };

      // Save to database
      const datastore = this.catalystApp.datastore();
      const paymentIntentsTable = datastore.table('payment_intents');
      const result = await paymentIntentsTable.insertRow(paymentIntent);

      // Log audit trail
      await this.logPaymentAudit(tenantId, validatedData.client_id, 'PAYMENT_INTENT_CREATED', {
        payment_intent_id: paymentIntent.payment_intent_id,
        amount: billing.total_amount.toNumber(),
        payment_type: validatedData.payment_type
      });

      return {
        success: true,
        payment_intent_id: paymentIntent.payment_intent_id,
        client_secret: this.generateClientSecret(paymentIntent.payment_intent_id),
        amount_breakdown: {
          subtotal: validatedData.amount,
          platform_fee: billing.platform_fee.toNumber(),
          processing_fee: billing.processing_fee.toNumber(),
          total: billing.total_amount.toNumber()
        },
        expires_at: paymentIntent.expires_at,
        payment_methods: await this.getAcceptedPaymentMethods(validatedData.payment_type)
      };

    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  // Process payment
  async processPayment(tenantId, paymentIntentId, paymentMethodData) {
    try {
      // Validate payment method
      const validation = PaymentProcessingService.getPaymentMethodSchema().validate(paymentMethodData);
      if (validation.error) {
        throw new Error(`Payment method validation error: ${validation.error.details[0].message}`);
      }

      const validatedMethod = validation.value;

      // Get payment intent
      const datastore = this.catalystApp.datastore();
      const query = `SELECT * FROM payment_intents WHERE payment_intent_id = '${paymentIntentId}' AND tenant_id = '${tenantId}'`;
      const result = await datastore.executeZCQL(query);
      
      if (!result.length) {
        throw new Error('Payment intent not found');
      }

      const paymentIntent = result[0].payment_intents;

      // Check if payment intent is still valid
      if (moment().isAfter(paymentIntent.expires_at)) {
        throw new Error('Payment intent has expired');
      }

      if (paymentIntent.status !== 'pending') {
        throw new Error(`Payment intent is not pending (current status: ${paymentIntent.status})`);
      }

      // Mock payment processing (in real implementation, integrate with Stripe/Square)
      const gatewayResponse = await this.processWithGateway(paymentIntent, validatedMethod);

      // Update payment intent with results
      const paymentIntentsTable = datastore.table('payment_intents');
      const updateData = {
        status: gatewayResponse.success ? 'succeeded' : 'failed',
        gateway_payment_id: gatewayResponse.payment_id,
        gateway_response: JSON.stringify(gatewayResponse),
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await paymentIntentsTable.updateRow(paymentIntent.ROWID, updateData);

      if (gatewayResponse.success) {
        // Create invoice record
        await this.createInvoice(tenantId, paymentIntent, gatewayResponse);

        // Update time entries as paid
        await this.markTimeEntriesAsPaid(JSON.parse(paymentIntent.time_entry_ids), tenantId);

        // Log successful payment
        await this.logPaymentAudit(tenantId, paymentIntent.client_id, 'PAYMENT_PROCESSED', {
          payment_intent_id: paymentIntentId,
          gateway_payment_id: gatewayResponse.payment_id,
          amount: paymentIntent.total_amount
        });
      }

      return {
        success: gatewayResponse.success,
        payment_intent_id: paymentIntentId,
        payment_id: gatewayResponse.payment_id,
        status: gatewayResponse.success ? 'succeeded' : 'failed',
        message: gatewayResponse.message,
        receipt_url: gatewayResponse.receipt_url,
        processed_at: updateData.processed_at
      };

    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }

  // Get payment history
  async getPaymentHistory(tenantId, filters = {}) {
    try {
      let query = `SELECT * FROM payment_intents WHERE tenant_id = '${tenantId}'`;
      
      // Apply filters
      if (filters.client_id) {
        query += ` AND client_id = '${filters.client_id}'`;
      }
      if (filters.contractor_id) {
        query += ` AND contractor_id = '${filters.contractor_id}'`;
      }
      if (filters.status) {
        query += ` AND status = '${filters.status}'`;
      }
      if (filters.payment_type) {
        query += ` AND payment_type = '${filters.payment_type}'`;
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
        const payment = row.payment_intents;
        payment.time_entry_ids = JSON.parse(payment.time_entry_ids || '[]');
        return payment;
      });

    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  }

  // Generate payment summary
  async generatePaymentSummary(tenantId, period = 'month', contractorId = null) {
    try {
      let dateFrom, dateTo;
      const now = moment();

      switch (period) {
        case 'week':
          dateFrom = now.startOf('week').toISOString();
          dateTo = now.endOf('week').toISOString();
          break;
        case 'month':
          dateFrom = now.startOf('month').toISOString();
          dateTo = now.endOf('month').toISOString();
          break;
        case 'quarter':
          dateFrom = now.startOf('quarter').toISOString();
          dateTo = now.endOf('quarter').toISOString();
          break;
        default:
          throw new Error('Invalid period. Use: week, month, quarter');
      }

      const filters = {
        date_from: dateFrom,
        date_to: dateTo,
        status: 'succeeded'
      };

      if (contractorId) {
        filters.contractor_id = contractorId;
      }

      const payments = await this.getPaymentHistory(tenantId, filters);

      const summary = {
        period: period,
        date_range: { from: dateFrom, to: dateTo },
        total_payments: payments.length,
        total_revenue: 0,
        total_platform_fees: 0,
        total_processing_fees: 0,
        total_contractor_payouts: 0,
        by_payment_type: {
          employer_benefits: { count: 0, amount: 0 },
          direct_pay: { count: 0, amount: 0 }
        },
        by_contractor: {}
      };

      payments.forEach(payment => {
        summary.total_revenue += payment.subtotal_amount || 0;
        summary.total_platform_fees += payment.platform_fee || 0;
        summary.total_processing_fees += payment.processing_fee || 0;
        summary.total_contractor_payouts += payment.contractor_payout || 0;

        // Group by payment type
        summary.by_payment_type[payment.payment_type].count++;
        summary.by_payment_type[payment.payment_type].amount += payment.total_amount || 0;

        // Group by contractor
        if (!summary.by_contractor[payment.contractor_id]) {
          summary.by_contractor[payment.contractor_id] = {
            payments: 0,
            total_earned: 0,
            platform_fees_paid: 0
          };
        }
        summary.by_contractor[payment.contractor_id].payments++;
        summary.by_contractor[payment.contractor_id].total_earned += payment.contractor_payout || 0;
        summary.by_contractor[payment.contractor_id].platform_fees_paid += payment.platform_fee || 0;
      });

      return summary;

    } catch (error) {
      console.error('Error generating payment summary:', error);
      throw error;
    }
  }

  // Helper methods
  async verifyTimeEntries(timeEntryIds, contractorId, tenantId) {
    const datastore = this.catalystApp.datastore();
    const idsString = timeEntryIds.map(id => `'${id}'`).join(',');
    const query = `SELECT * FROM time_entries WHERE time_entry_id IN (${idsString}) AND contractor_id = '${contractorId}' AND tenant_id = '${tenantId}'`;
    
    const result = await datastore.executeZCQL(query);
    
    if (result.length !== timeEntryIds.length) {
      throw new Error('One or more time entries not found or not accessible');
    }

    return result.map(row => row.time_entries);
  }

  calculatePaymentAmounts(subtotal, paymentType) {
    const subtotalDecimal = new Decimal(subtotal);
    
    // Calculate platform fee (reduced for employer benefits)
    let platformFeeRate = FEE_STRUCTURE.platform_fee_percentage;
    if (paymentType === 'employer_benefits') {
      platformFeeRate = platformFeeRate.minus(FEE_STRUCTURE.employer_benefits_discount);
    }
    
    const platformFee = subtotalDecimal.mul(platformFeeRate).dividedBy(100);
    
    // Calculate processing fee
    const processingFee = subtotalDecimal
      .mul(FEE_STRUCTURE.payment_processing_fee)
      .dividedBy(100)
      .plus(FEE_STRUCTURE.payment_processing_fixed);
    
    const totalAmount = subtotalDecimal.plus(platformFee).plus(processingFee);
    const contractorPayout = subtotalDecimal.minus(platformFee);

    return {
      subtotal: subtotalDecimal,
      platform_fee: platformFee,
      processing_fee: processingFee,
      total_amount: totalAmount,
      contractor_payout: contractorPayout
    };
  }

  generateClientSecret(paymentIntentId) {
    // Generate a secure client secret
    const timestamp = Date.now().toString();
    const hash = crypto.createHash('sha256')
      .update(paymentIntentId + timestamp + JWT_SECRET)
      .digest('hex');
    
    return `pi_${paymentIntentId.replace(/-/g, '')}_secret_${hash.substring(0, 16)}`;
  }

  async processWithGateway(paymentIntent, paymentMethod) {
    // Mock payment gateway processing
    // In real implementation, integrate with Stripe, Square, etc.
    
    const isSuccess = Math.random() > 0.05; // 95% success rate for testing
    
    return {
      success: isSuccess,
      payment_id: `pay_${uuidv4().replace(/-/g, '')}`,
      message: isSuccess ? 'Payment processed successfully' : 'Payment failed - insufficient funds',
      receipt_url: isSuccess ? `https://receipts.snugkisses.com/${uuidv4()}` : null,
      gateway: 'mock',
      transaction_fee: isSuccess ? paymentIntent.processing_fee : 0,
      processed_at: new Date().toISOString()
    };
  }

  async createInvoice(tenantId, paymentIntent, gatewayResponse) {
    const invoice = {
      invoice_id: uuidv4(),
      tenant_id: tenantId,
      payment_intent_id: paymentIntent.payment_intent_id,
      client_id: paymentIntent.client_id,
      contractor_id: paymentIntent.contractor_id,
      service_request_id: paymentIntent.service_request_id,
      
      invoice_number: this.generateInvoiceNumber(),
      subtotal: paymentIntent.subtotal_amount,
      platform_fee: paymentIntent.platform_fee,
      processing_fee: paymentIntent.processing_fee,
      total_amount: paymentIntent.total_amount,
      
      payment_status: 'paid',
      payment_method: paymentIntent.payment_method,
      payment_id: gatewayResponse.payment_id,
      
      issued_at: new Date().toISOString(),
      paid_at: gatewayResponse.processed_at,
      created_at: new Date().toISOString()
    };

    const datastore = this.catalystApp.datastore();
    const invoicesTable = datastore.table('invoices');
    await invoicesTable.insertRow(invoice);

    return invoice;
  }

  generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    return `SNK-${year}${month}${day}-${random}`;
  }

  async markTimeEntriesAsPaid(timeEntryIds, tenantId) {
    const datastore = this.catalystApp.datastore();
    const timeEntriesTable = datastore.table('time_entries');
    
    for (const timeEntryId of timeEntryIds) {
      await timeEntriesTable.updateRow(timeEntryId, {
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  }

  async getAcceptedPaymentMethods(paymentType) {
    const baseMethods = ['card'];
    
    if (paymentType === 'employer_benefits') {
      baseMethods.push('employer_account');
    } else {
      baseMethods.push('bank_transfer');
    }
    
    return baseMethods;
  }

  // Audit logging
  async logPaymentAudit(tenantId, userId, action, details) {
    try {
      const auditLog = {
        log_id: uuidv4(),
        tenant_id: tenantId,
        user_id: userId,
        action: action,
        resource_type: 'payment',
        resource_id: details.payment_intent_id || null,
        details: JSON.stringify(details),
        ip_address: null,
        user_agent: null,
        timestamp: new Date().toISOString()
      };

      const datastore = this.catalystApp.datastore();
      const auditTable = datastore.table('audit_logs');
      await auditTable.insertRow(auditLog);

    } catch (error) {
      console.error('Error logging payment audit:', error);
    }
  }
}

// Routes
app.post('/payment-intents', authenticateToken, requireRole(['client', 'admin', 'hr']), async (req, res) => {
  try {
    const paymentService = new PaymentProcessingService(catalyst.initialize(req));
    const result = await paymentService.createPaymentIntent(
      req.user.tenantId,
      req.body
    );
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(400).json({ 
      error: error.message,
      code: 'PAYMENT_INTENT_CREATION_FAILED'
    });
  }
});

app.post('/payment-intents/:paymentIntentId/process', authenticateToken, requireRole(['client', 'admin']), async (req, res) => {
  try {
    const paymentService = new PaymentProcessingService(catalyst.initialize(req));
    const result = await paymentService.processPayment(
      req.user.tenantId,
      req.params.paymentIntentId,
      req.body
    );
    
    res.json(result);
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(400).json({ 
      error: error.message,
      code: 'PAYMENT_PROCESSING_FAILED'
    });
  }
});

app.get('/payments', authenticateToken, requireRole(['client', 'contractor', 'admin', 'hr']), async (req, res) => {
  try {
    const paymentService = new PaymentProcessingService(catalyst.initialize(req));
    
    const filters = {
      client_id: req.query.client_id,
      contractor_id: req.query.contractor_id,
      status: req.query.status,
      payment_type: req.query.payment_type,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };

    const payments = await paymentService.getPaymentHistory(req.user.tenantId, filters);
    
    res.json({ 
      success: true,
      payments: payments,
      total: payments.length
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ 
      error: error.message,
      code: 'PAYMENT_HISTORY_FETCH_FAILED'
    });
  }
});

app.get('/payment-summary', authenticateToken, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const paymentService = new PaymentProcessingService(catalyst.initialize(req));
    const period = req.query.period || 'month';
    const contractorId = req.query.contractor_id || null;
    
    const summary = await paymentService.generatePaymentSummary(
      req.user.tenantId,
      period,
      contractorId
    );
    
    res.json({ 
      success: true,
      summary: summary
    });
  } catch (error) {
    console.error('Error generating payment summary:', error);
    res.status(500).json({ 
      error: error.message,
      code: 'PAYMENT_SUMMARY_FAILED'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'payment_processing',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
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

module.exports = app;