const catalyst = require('zcatalyst-sdk-node');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const Decimal = require('decimal.js');

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

// Service rate configurations (per hour)
const SERVICE_RATES = {
  birth_doula: {
    employer_benefits: new Decimal(35.00),
    direct_pay: new Decimal(45.00),
    overtime_multiplier: new Decimal(1.5)
  },
  postpartum_doula: {
    employer_benefits: new Decimal(30.00),
    direct_pay: new Decimal(40.00),
    overtime_multiplier: new Decimal(1.5)
  },
  backup_childcare: {
    employer_benefits: new Decimal(25.00),
    direct_pay: new Decimal(35.00),
    overtime_multiplier: new Decimal(1.5)
  },
  emergency_sitter: {
    employer_benefits: new Decimal(28.00),
    direct_pay: new Decimal(38.00),
    overtime_multiplier: new Decimal(2.0), // Higher emergency rate
    emergency_surcharge: new Decimal(10.00)
  },
  eldercare_support: {
    employer_benefits: new Decimal(32.00),
    direct_pay: new Decimal(42.00),
    overtime_multiplier: new Decimal(1.5)
  },
  lactation_support: {
    employer_benefits: new Decimal(40.00),
    direct_pay: new Decimal(55.00),
    overtime_multiplier: new Decimal(1.5)
  },
  newborn_specialist: {
    employer_benefits: new Decimal(45.00),
    direct_pay: new Decimal(60.00),
    overtime_multiplier: new Decimal(1.5)
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

// Time Entry Management Service
class TimeTrackingService {
  constructor(catalystApp) {
    this.catalystApp = catalystApp;
  }

  // Validation schemas
  static getTimeEntrySchema() {
    return Joi.object({
      service_request_id: Joi.string().uuid().required(),
      contractor_id: Joi.string().uuid().required(),
      client_id: Joi.string().uuid().required(),
      service_type: Joi.string().valid(
        'birth_doula', 'postpartum_doula', 'backup_childcare', 
        'emergency_sitter', 'eldercare_support', 'lactation_support', 
        'newborn_specialist'
      ).required(),
      start_time: Joi.date().iso().required(),
      end_time: Joi.date().iso().greater(Joi.ref('start_time')).required(),
      break_minutes: Joi.number().min(0).max(480).default(0), // Max 8 hours break
      notes: Joi.string().max(1000).optional(),
      location: Joi.object({
        address: Joi.string().max(500).required(),
        latitude: Joi.number().optional(),
        longitude: Joi.number().optional()
      }).optional(),
      payment_type: Joi.string().valid('employer_benefits', 'direct_pay').required(),
      is_emergency: Joi.boolean().default(false)
    });
  }

  static getTimeUpdateSchema() {
    return Joi.object({
      end_time: Joi.date().iso().optional(),
      break_minutes: Joi.number().min(0).max(480).optional(),
      notes: Joi.string().max(1000).optional(),
      status: Joi.string().valid('active', 'paused', 'completed', 'cancelled').optional()
    });
  }

  // Create new time entry (clock in)
  async startTimeEntry(contractorId, tenantId, timeEntryData) {
    try {
      const validation = TimeTrackingService.getTimeEntrySchema().validate(timeEntryData);
      if (validation.error) {
        throw new Error(`Validation error: ${validation.error.details[0].message}`);
      }

      const validatedData = validation.value;

      // Check for existing active time entries
      const activeEntries = await this.getActiveTimeEntries(contractorId, tenantId);
      if (activeEntries.length > 0) {
        throw new Error('Contractor already has an active time entry. Please complete current session first.');
      }

      // Calculate duration and billing
      const duration = this.calculateDuration(validatedData.start_time, validatedData.end_time, validatedData.break_minutes);
      const billing = this.calculateBilling(validatedData.service_type, duration, validatedData.payment_type, validatedData.is_emergency);

      const timeEntry = {
        time_entry_id: uuidv4(),
        tenant_id: tenantId,
        service_request_id: validatedData.service_request_id,
        contractor_id: contractorId,
        client_id: validatedData.client_id,
        service_type: validatedData.service_type,
        start_time: validatedData.start_time,
        end_time: validatedData.end_time,
        break_minutes: validatedData.break_minutes,
        duration_minutes: duration.minutes,
        duration_hours: duration.hours,
        notes: validatedData.notes || '',
        location: validatedData.location || null,
        payment_type: validatedData.payment_type,
        is_emergency: validatedData.is_emergency,
        hourly_rate: billing.hourly_rate.toNumber(),
        overtime_rate: billing.overtime_rate.toNumber(),
        regular_hours: billing.regular_hours.toNumber(),
        overtime_hours: billing.overtime_hours.toNumber(),
        emergency_surcharge: billing.emergency_surcharge.toNumber(),
        total_amount: billing.total_amount.toNumber(),
        status: 'completed', // Since we have end time
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to database
      const datastore = this.catalystApp.datastore();
      const timeEntriesTable = datastore.table('time_entries');
      const result = await timeEntriesTable.insertRow(timeEntry);

      // Log audit trail
      await this.logTimeEntryAudit(tenantId, contractorId, 'TIME_ENTRY_CREATED', {
        time_entry_id: timeEntry.time_entry_id,
        service_request_id: validatedData.service_request_id,
        duration_hours: duration.hours,
        total_amount: billing.total_amount.toNumber()
      });

      return {
        success: true,
        time_entry_id: timeEntry.time_entry_id,
        duration: duration,
        billing: {
          hourly_rate: billing.hourly_rate.toNumber(),
          total_amount: billing.total_amount.toNumber(),
          payment_type: validatedData.payment_type
        },
        created_at: timeEntry.created_at
      };

    } catch (error) {
      console.error('Error creating time entry:', error);
      throw error;
    }
  }

  // Clock in (start active session)
  async clockIn(contractorId, tenantId, clockInData) {
    try {
      const schema = Joi.object({
        service_request_id: Joi.string().uuid().required(),
        client_id: Joi.string().uuid().required(),
        service_type: Joi.string().valid(
          'birth_doula', 'postpartum_doula', 'backup_childcare', 
          'emergency_sitter', 'eldercare_support', 'lactation_support', 
          'newborn_specialist'
        ).required(),
        location: Joi.object({
          address: Joi.string().max(500).required(),
          latitude: Joi.number().optional(),
          longitude: Joi.number().optional()
        }).optional(),
        payment_type: Joi.string().valid('employer_benefits', 'direct_pay').required(),
        is_emergency: Joi.boolean().default(false),
        notes: Joi.string().max(500).optional()
      });

      const validation = schema.validate(clockInData);
      if (validation.error) {
        throw new Error(`Validation error: ${validation.error.details[0].message}`);
      }

      const validatedData = validation.value;

      // Check for existing active sessions
      const activeEntries = await this.getActiveTimeEntries(contractorId, tenantId);
      if (activeEntries.length > 0) {
        throw new Error('Already clocked in. Please clock out first.');
      }

      const activeSession = {
        time_entry_id: uuidv4(),
        tenant_id: tenantId,
        service_request_id: validatedData.service_request_id,
        contractor_id: contractorId,
        client_id: validatedData.client_id,
        service_type: validatedData.service_type,
        start_time: new Date().toISOString(),
        end_time: null,
        break_minutes: 0,
        location: validatedData.location || null,
        payment_type: validatedData.payment_type,
        is_emergency: validatedData.is_emergency,
        notes: validatedData.notes || '',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const datastore = this.catalystApp.datastore();
      const timeEntriesTable = datastore.table('time_entries');
      await timeEntriesTable.insertRow(activeSession);

      return {
        success: true,
        time_entry_id: activeSession.time_entry_id,
        start_time: activeSession.start_time,
        status: 'active'
      };

    } catch (error) {
      console.error('Error clocking in:', error);
      throw error;
    }
  }

  // Clock out (end active session)
  async clockOut(contractorId, tenantId, timeEntryId, clockOutData = {}) {
    try {
      const schema = Joi.object({
        break_minutes: Joi.number().min(0).max(480).default(0),
        notes: Joi.string().max(1000).optional()
      });

      const validation = schema.validate(clockOutData);
      if (validation.error) {
        throw new Error(`Validation error: ${validation.error.details[0].message}`);
      }

      const validatedData = validation.value;
      const endTime = new Date().toISOString();

      // Get active session
      const datastore = this.catalystApp.datastore();
      const timeEntriesTable = datastore.table('time_entries');
      
      const query = `SELECT * FROM time_entries WHERE time_entry_id = '${timeEntryId}' AND contractor_id = '${contractorId}' AND tenant_id = '${tenantId}' AND status = 'active'`;
      const result = await datastore.executeZCQL(query);
      
      if (!result.length) {
        throw new Error('Active time entry not found');
      }

      const timeEntry = result[0].time_entries;

      // Calculate duration and billing
      const duration = this.calculateDuration(timeEntry.start_time, endTime, validatedData.break_minutes);
      const billing = this.calculateBilling(timeEntry.service_type, duration, timeEntry.payment_type, timeEntry.is_emergency);

      // Update time entry
      const updatedEntry = {
        end_time: endTime,
        break_minutes: validatedData.break_minutes,
        duration_minutes: duration.minutes,
        duration_hours: duration.hours,
        notes: validatedData.notes || timeEntry.notes,
        hourly_rate: billing.hourly_rate.toNumber(),
        overtime_rate: billing.overtime_rate.toNumber(),
        regular_hours: billing.regular_hours.toNumber(),
        overtime_hours: billing.overtime_hours.toNumber(),
        emergency_surcharge: billing.emergency_surcharge.toNumber(),
        total_amount: billing.total_amount.toNumber(),
        status: 'completed',
        updated_at: new Date().toISOString()
      };

      await timeEntriesTable.updateRow(timeEntry.ROWID, updatedEntry);

      // Log audit trail
      await this.logTimeEntryAudit(tenantId, contractorId, 'TIME_ENTRY_COMPLETED', {
        time_entry_id: timeEntryId,
        duration_hours: duration.hours,
        total_amount: billing.total_amount.toNumber()
      });

      return {
        success: true,
        time_entry_id: timeEntryId,
        end_time: endTime,
        duration: duration,
        billing: {
          hourly_rate: billing.hourly_rate.toNumber(),
          total_amount: billing.total_amount.toNumber(),
          breakdown: {
            regular_hours: billing.regular_hours.toNumber(),
            overtime_hours: billing.overtime_hours.toNumber(),
            emergency_surcharge: billing.emergency_surcharge.toNumber()
          }
        }
      };

    } catch (error) {
      console.error('Error clocking out:', error);
      throw error;
    }
  }

  // Get time entries for contractor
  async getTimeEntries(contractorId, tenantId, filters = {}) {
    try {
      let query = `SELECT * FROM time_entries WHERE contractor_id = '${contractorId}' AND tenant_id = '${tenantId}'`;
      
      // Apply filters
      if (filters.service_request_id) {
        query += ` AND service_request_id = '${filters.service_request_id}'`;
      }
      if (filters.status) {
        query += ` AND status = '${filters.status}'`;
      }
      if (filters.date_from) {
        query += ` AND start_time >= '${filters.date_from}'`;
      }
      if (filters.date_to) {
        query += ` AND start_time <= '${filters.date_to}'`;
      }

      query += ' ORDER BY start_time DESC';

      if (filters.limit) {
        query += ` LIMIT ${filters.limit}`;
      }

      const datastore = this.catalystApp.datastore();
      const result = await datastore.executeZCQL(query);
      
      return result.map(row => row.time_entries);

    } catch (error) {
      console.error('Error fetching time entries:', error);
      throw error;
    }
  }

  // Get active time entries
  async getActiveTimeEntries(contractorId, tenantId) {
    return this.getTimeEntries(contractorId, tenantId, { status: 'active' });
  }

  // Calculate duration between times
  calculateDuration(startTime, endTime, breakMinutes = 0) {
    const start = moment(startTime);
    const end = moment(endTime);
    
    const totalMinutes = end.diff(start, 'minutes') - breakMinutes;
    const hours = new Decimal(totalMinutes).dividedBy(60).toDecimalPlaces(2);

    return {
      minutes: totalMinutes,
      hours: hours.toNumber(),
      break_minutes: breakMinutes
    };
  }

  // Calculate billing amounts
  calculateBilling(serviceType, duration, paymentType, isEmergency = false) {
    const rates = SERVICE_RATES[serviceType];
    if (!rates) {
      throw new Error(`Unknown service type: ${serviceType}`);
    }

    const baseRate = rates[paymentType];
    const overtimeRate = baseRate.mul(rates.overtime_multiplier);
    const totalHours = new Decimal(duration.hours);

    let regularHours = totalHours;
    let overtimeHours = new Decimal(0);
    let emergencySurcharge = new Decimal(0);

    // Calculate overtime (over 8 hours)
    if (totalHours.greaterThan(8)) {
      regularHours = new Decimal(8);
      overtimeHours = totalHours.minus(8);
    }

    // Calculate emergency surcharge
    if (isEmergency && rates.emergency_surcharge) {
      emergencySurcharge = rates.emergency_surcharge.mul(totalHours);
    }

    // Calculate total amount
    const regularAmount = regularHours.mul(baseRate);
    const overtimeAmount = overtimeHours.mul(overtimeRate);
    const totalAmount = regularAmount.plus(overtimeAmount).plus(emergencySurcharge);

    return {
      hourly_rate: baseRate,
      overtime_rate: overtimeRate,
      regular_hours: regularHours,
      overtime_hours: overtimeHours,
      emergency_surcharge: emergencySurcharge,
      total_amount: totalAmount
    };
  }

  // Generate time summary report
  async generateTimeSummary(contractorId, tenantId, period = 'week') {
    try {
      let dateFrom, dateTo;
      const now = moment();

      switch (period) {
        case 'day':
          dateFrom = now.startOf('day').toISOString();
          dateTo = now.endOf('day').toISOString();
          break;
        case 'week':
          dateFrom = now.startOf('week').toISOString();
          dateTo = now.endOf('week').toISOString();
          break;
        case 'month':
          dateFrom = now.startOf('month').toISOString();
          dateTo = now.endOf('month').toISOString();
          break;
        default:
          throw new Error('Invalid period. Use: day, week, month');
      }

      const timeEntries = await this.getTimeEntries(contractorId, tenantId, {
        date_from: dateFrom,
        date_to: dateTo,
        status: 'completed'
      });

      const summary = {
        period: period,
        date_range: { from: dateFrom, to: dateTo },
        total_entries: timeEntries.length,
        total_hours: 0,
        total_regular_hours: 0,
        total_overtime_hours: 0,
        total_amount: 0,
        by_service_type: {},
        by_payment_type: { employer_benefits: 0, direct_pay: 0 }
      };

      timeEntries.forEach(entry => {
        summary.total_hours += entry.duration_hours || 0;
        summary.total_regular_hours += entry.regular_hours || 0;
        summary.total_overtime_hours += entry.overtime_hours || 0;
        summary.total_amount += entry.total_amount || 0;

        // Group by service type
        if (!summary.by_service_type[entry.service_type]) {
          summary.by_service_type[entry.service_type] = {
            entries: 0,
            hours: 0,
            amount: 0
          };
        }
        summary.by_service_type[entry.service_type].entries++;
        summary.by_service_type[entry.service_type].hours += entry.duration_hours || 0;
        summary.by_service_type[entry.service_type].amount += entry.total_amount || 0;

        // Group by payment type
        summary.by_payment_type[entry.payment_type] += entry.total_amount || 0;
      });

      return summary;

    } catch (error) {
      console.error('Error generating time summary:', error);
      throw error;
    }
  }

  // Audit logging
  async logTimeEntryAudit(tenantId, userId, action, details) {
    try {
      const auditLog = {
        log_id: uuidv4(),
        tenant_id: tenantId,
        user_id: userId,
        action: action,
        resource_type: 'time_entry',
        resource_id: details.time_entry_id || null,
        details: JSON.stringify(details),
        ip_address: null,
        user_agent: null,
        timestamp: new Date().toISOString()
      };

      const datastore = this.catalystApp.datastore();
      const auditTable = datastore.table('audit_logs');
      await auditTable.insertRow(auditLog);

    } catch (error) {
      console.error('Error logging audit:', error);
    }
  }
}

// Routes
app.post('/clock-in', authenticateToken, requireRole(['contractor']), async (req, res) => {
  try {
    const timeTrackingService = new TimeTrackingService(catalyst.initialize(req));
    const result = await timeTrackingService.clockIn(
      req.user.userId,
      req.user.tenantId,
      req.body
    );
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Clock in error:', error);
    res.status(400).json({ 
      error: error.message,
      code: 'CLOCK_IN_FAILED'
    });
  }
});

app.post('/clock-out/:timeEntryId', authenticateToken, requireRole(['contractor']), async (req, res) => {
  try {
    const timeTrackingService = new TimeTrackingService(catalyst.initialize(req));
    const result = await timeTrackingService.clockOut(
      req.user.userId,
      req.user.tenantId,
      req.params.timeEntryId,
      req.body
    );
    
    res.json(result);
  } catch (error) {
    console.error('Clock out error:', error);
    res.status(400).json({ 
      error: error.message,
      code: 'CLOCK_OUT_FAILED'
    });
  }
});

app.post('/time-entries', authenticateToken, requireRole(['contractor', 'admin']), async (req, res) => {
  try {
    const timeTrackingService = new TimeTrackingService(catalyst.initialize(req));
    const contractorId = req.body.contractor_id || req.user.userId;
    
    const result = await timeTrackingService.startTimeEntry(
      contractorId,
      req.user.tenantId,
      req.body
    );
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Time entry creation error:', error);
    res.status(400).json({ 
      error: error.message,
      code: 'TIME_ENTRY_CREATION_FAILED'
    });
  }
});

app.get('/time-entries', authenticateToken, requireRole(['contractor', 'admin', 'hr']), async (req, res) => {
  try {
    const timeTrackingService = new TimeTrackingService(catalyst.initialize(req));
    const contractorId = req.query.contractor_id || req.user.userId;
    
    const filters = {
      service_request_id: req.query.service_request_id,
      status: req.query.status,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };

    const timeEntries = await timeTrackingService.getTimeEntries(
      contractorId,
      req.user.tenantId,
      filters
    );
    
    res.json({ 
      success: true,
      time_entries: timeEntries,
      total: timeEntries.length
    });
  } catch (error) {
    console.error('Error fetching time entries:', error);
    res.status(500).json({ 
      error: error.message,
      code: 'TIME_ENTRIES_FETCH_FAILED'
    });
  }
});

app.get('/time-entries/active', authenticateToken, requireRole(['contractor']), async (req, res) => {
  try {
    const timeTrackingService = new TimeTrackingService(catalyst.initialize(req));
    const activeEntries = await timeTrackingService.getActiveTimeEntries(
      req.user.userId,
      req.user.tenantId
    );
    
    res.json({ 
      success: true,
      active_entries: activeEntries,
      has_active_session: activeEntries.length > 0
    });
  } catch (error) {
    console.error('Error fetching active entries:', error);
    res.status(500).json({ 
      error: error.message,
      code: 'ACTIVE_ENTRIES_FETCH_FAILED'
    });
  }
});

app.get('/time-summary', authenticateToken, requireRole(['contractor', 'admin', 'hr']), async (req, res) => {
  try {
    const timeTrackingService = new TimeTrackingService(catalyst.initialize(req));
    const contractorId = req.query.contractor_id || req.user.userId;
    const period = req.query.period || 'week';
    
    const summary = await timeTrackingService.generateTimeSummary(
      contractorId,
      req.user.tenantId,
      period
    );
    
    res.json({ 
      success: true,
      summary: summary
    });
  } catch (error) {
    console.error('Error generating time summary:', error);
    res.status(500).json({ 
      error: error.message,
      code: 'TIME_SUMMARY_FAILED'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'time_tracking',
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