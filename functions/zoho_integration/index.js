const catalyst = require('zcatalyst-sdk-node');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const axios = require('axios');
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

// Zoho API Configuration
const ZOHO_CONFIG = {
  crm: {
    client_id: process.env.ZOHO_CRM_CLIENT_ID || 'your_zoho_crm_client_id',
    client_secret: process.env.ZOHO_CRM_CLIENT_SECRET || 'your_zoho_crm_secret',
    redirect_uri: process.env.ZOHO_CRM_REDIRECT_URI || 'https://your-app.com/zoho/callback',
    scope: 'ZohoCRM.modules.all,ZohoCRM.settings.all',
    base_url: 'https://www.zohoapis.com/crm/v2',
    auth_url: 'https://accounts.zoho.com/oauth/v2'
  },
  recruit: {
    client_id: process.env.ZOHO_RECRUIT_CLIENT_ID || 'your_zoho_recruit_client_id',
    client_secret: process.env.ZOHO_RECRUIT_CLIENT_SECRET || 'your_zoho_recruit_secret',
    redirect_uri: process.env.ZOHO_RECRUIT_REDIRECT_URI || 'https://your-app.com/zoho/recruit/callback',
    scope: 'ZohoRecruit.modules.all',
    base_url: 'https://recruit.zoho.com/recruit/v2',
    auth_url: 'https://accounts.zoho.com/oauth/v2'
  },
  analytics: {
    client_id: process.env.ZOHO_ANALYTICS_CLIENT_ID || 'your_zoho_analytics_client_id',
    client_secret: process.env.ZOHO_ANALYTICS_CLIENT_SECRET || 'your_zoho_analytics_secret',
    redirect_uri: process.env.ZOHO_ANALYTICS_REDIRECT_URI || 'https://your-app.com/zoho/analytics/callback',
    scope: 'ZohoAnalytics.data.all,ZohoAnalytics.workspace.all',
    base_url: 'https://analyticsapi.zoho.com/api',
    auth_url: 'https://accounts.zoho.com/oauth/v2'
  },
  creator: {
    client_id: process.env.ZOHO_CREATOR_CLIENT_ID || 'your_zoho_creator_client_id',
    client_secret: process.env.ZOHO_CREATOR_CLIENT_SECRET || 'your_zoho_creator_secret',
    redirect_uri: process.env.ZOHO_CREATOR_REDIRECT_URI || 'https://your-app.com/zoho/creator/callback',
    scope: 'ZohoCreator.application.all',
    base_url: 'https://creator.zoho.com/api/v2',
    auth_url: 'https://accounts.zoho.com/oauth/v2'
  }
};

// Service type mapping for Zoho modules
const SERVICE_TYPE_MAPPING = {
  birth_doula: { crm_module: 'Birth_Doula_Services', recruit_job_type: 'Birth Doula' },
  postpartum_doula: { crm_module: 'Postpartum_Doula_Services', recruit_job_type: 'Postpartum Doula' },
  backup_childcare: { crm_module: 'Childcare_Services', recruit_job_type: 'Childcare Provider' },
  emergency_sitter: { crm_module: 'Emergency_Services', recruit_job_type: 'Emergency Sitter' },
  eldercare_support: { crm_module: 'Eldercare_Services', recruit_job_type: 'Eldercare Specialist' },
  lactation_support: { crm_module: 'Lactation_Services', recruit_job_type: 'Lactation Consultant' },
  newborn_specialist: { crm_module: 'Newborn_Services', recruit_job_type: 'Newborn Specialist' }
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

// Zoho Integration Service
class ZohoIntegrationService {
  constructor(catalystApp) {
    this.catalystApp = catalystApp;
  }

  // Validation schemas
  static getCRMSyncSchema() {
    return Joi.object({
      service_request_id: Joi.string().uuid().required(),
      sync_type: Joi.string().valid('create', 'update', 'status_change').required(),
      force_sync: Joi.boolean().default(false)
    });
  }

  static getRecruitSyncSchema() {
    return Joi.object({
      contractor_id: Joi.string().uuid().required(),
      service_types: Joi.array().items(Joi.string()).min(1).required(),
      action: Joi.string().valid('create_profile', 'update_skills', 'post_job').required()
    });
  }

  // OAuth Token Management
  async getZohoAccessToken(service, tenantId) {
    try {
      const datastore = this.catalystApp.datastore();
      const query = `SELECT * FROM zoho_tokens WHERE tenant_id = '${tenantId}' AND service = '${service}' AND expires_at > '${new Date().toISOString()}'`;
      const result = await datastore.executeZCQL(query);
      
      if (result.length > 0) {
        return result[0].zoho_tokens.access_token;
      }

      // Token expired or doesn't exist - need to refresh
      const refreshResult = await this.refreshZohoToken(service, tenantId);
      return refreshResult.access_token;

    } catch (error) {
      console.error('Error getting Zoho access token:', error);
      throw new Error('Failed to authenticate with Zoho');
    }
  }

  async refreshZohoToken(service, tenantId) {
    try {
      const datastore = this.catalystApp.datastore();
      const query = `SELECT * FROM zoho_tokens WHERE tenant_id = '${tenantId}' AND service = '${service}'`;
      const result = await datastore.executeZCQL(query);
      
      if (!result.length) {
        throw new Error('No refresh token found. Please re-authorize with Zoho.');
      }

      const tokenData = result[0].zoho_tokens;
      const config = ZOHO_CONFIG[service];

      const refreshResponse = await axios.post(`${config.auth_url}/token`, null, {
        params: {
          refresh_token: tokenData.refresh_token,
          client_id: config.client_id,
          client_secret: config.client_secret,
          grant_type: 'refresh_token'
        }
      });

      const newTokenData = refreshResponse.data;
      const expiresAt = moment().add(newTokenData.expires_in, 'seconds').toISOString();

      // Update token in database
      const tokensTable = datastore.table('zoho_tokens');
      await tokensTable.updateRow(tokenData.ROWID, {
        access_token: newTokenData.access_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      });

      return {
        access_token: newTokenData.access_token,
        expires_at: expiresAt
      };

    } catch (error) {
      console.error('Error refreshing Zoho token:', error);
      throw new Error('Failed to refresh Zoho token');
    }
  }

  // CRM Integration Methods
  async syncServiceRequestToCRM(tenantId, syncData) {
    try {
      const validation = ZohoIntegrationService.getCRMSyncSchema().validate(syncData);
      if (validation.error) {
        throw new Error(`Validation error: ${validation.error.details[0].message}`);
      }

      const validatedData = validation.value;

      // Get service request details
      const serviceRequest = await this.getServiceRequestDetails(validatedData.service_request_id, tenantId);
      if (!serviceRequest) {
        throw new Error('Service request not found');
      }

      // Get access token
      const accessToken = await this.getZohoAccessToken('crm', tenantId);
      
      // Map service request to CRM record
      const crmRecord = this.mapServiceRequestToCRM(serviceRequest);
      const serviceMapping = SERVICE_TYPE_MAPPING[serviceRequest.service_type];

      let crmResponse;
      
      if (validatedData.sync_type === 'create') {
        // Create new CRM record
        crmResponse = await axios.post(
          `${ZOHO_CONFIG.crm.base_url}/${serviceMapping.crm_module}`,
          { data: [crmRecord] },
          {
            headers: {
              'Authorization': `Zoho-oauthtoken ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        // Update existing CRM record
        const crmId = await this.getCRMRecordId(validatedData.service_request_id, tenantId);
        if (crmId) {
          crmResponse = await axios.put(
            `${ZOHO_CONFIG.crm.base_url}/${serviceMapping.crm_module}/${crmId}`,
            { data: [crmRecord] },
            {
              headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
        }
      }

      // Save sync record
      await this.saveSyncRecord(tenantId, {
        service_request_id: validatedData.service_request_id,
        zoho_service: 'crm',
        zoho_module: serviceMapping.crm_module,
        zoho_record_id: crmResponse.data.data[0].details.id,
        sync_type: validatedData.sync_type,
        status: 'success',
        response_data: JSON.stringify(crmResponse.data)
      });

      return {
        success: true,
        crm_record_id: crmResponse.data.data[0].details.id,
        sync_type: validatedData.sync_type,
        message: 'Service request synced to CRM successfully'
      };

    } catch (error) {
      console.error('Error syncing to CRM:', error);
      throw error;
    }
  }

  async syncContractorToRecruit(tenantId, syncData) {
    try {
      const validation = ZohoIntegrationService.getRecruitSyncSchema().validate(syncData);
      if (validation.error) {
        throw new Error(`Validation error: ${validation.error.details[0].message}`);
      }

      const validatedData = validation.value;

      // Get contractor details
      const contractor = await this.getContractorDetails(validatedData.contractor_id, tenantId);
      if (!contractor) {
        throw new Error('Contractor not found');
      }

      // Get access token
      const accessToken = await this.getZohoAccessToken('recruit', tenantId);

      let recruitResponse;

      if (validatedData.action === 'create_profile') {
        // Create candidate profile in Zoho Recruit
        const candidateRecord = this.mapContractorToRecruit(contractor, validatedData.service_types);
        
        recruitResponse = await axios.post(
          `${ZOHO_CONFIG.recruit.base_url}/Candidates`,
          { data: [candidateRecord] },
          {
            headers: {
              'Authorization': `Zoho-oauthtoken ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } else if (validatedData.action === 'post_job') {
        // Post job openings for service types
        const jobResults = [];
        
        for (const serviceType of validatedData.service_types) {
          const jobRecord = this.createJobPosting(serviceType, contractor.location);
          
          const jobResponse = await axios.post(
            `${ZOHO_CONFIG.recruit.base_url}/Job_Openings`,
            { data: [jobRecord] },
            {
              headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          jobResults.push({
            service_type: serviceType,
            job_id: jobResponse.data.data[0].details.id
          });
        }
        
        recruitResponse = { data: { job_results: jobResults } };
      }

      // Save sync record
      await this.saveSyncRecord(tenantId, {
        contractor_id: validatedData.contractor_id,
        zoho_service: 'recruit',
        zoho_module: validatedData.action === 'create_profile' ? 'Candidates' : 'Job_Openings',
        sync_type: validatedData.action,
        status: 'success',
        response_data: JSON.stringify(recruitResponse.data)
      });

      return {
        success: true,
        action: validatedData.action,
        recruit_data: recruitResponse.data,
        message: 'Contractor synced to Recruit successfully'
      };

    } catch (error) {
      console.error('Error syncing to Recruit:', error);
      throw error;
    }
  }

  // Analytics Integration
  async pushDataToAnalytics(tenantId, analyticsData) {
    try {
      const schema = Joi.object({
        workspace_id: Joi.string().required(),
        table_name: Joi.string().required(),
        data_type: Joi.string().valid('service_requests', 'payments', 'time_tracking', 'contractor_performance').required(),
        date_range: Joi.object({
          from: Joi.date().iso().required(),
          to: Joi.date().iso().required()
        }).required()
      });

      const validation = schema.validate(analyticsData);
      if (validation.error) {
        throw new Error(`Validation error: ${validation.error.details[0].message}`);
      }

      const validatedData = validation.value;

      // Get access token
      const accessToken = await this.getZohoAccessToken('analytics', tenantId);

      // Get data based on type
      let dataToSync;
      switch (validatedData.data_type) {
        case 'service_requests':
          dataToSync = await this.getServiceRequestsAnalyticsData(tenantId, validatedData.date_range);
          break;
        case 'payments':
          dataToSync = await this.getPaymentsAnalyticsData(tenantId, validatedData.date_range);
          break;
        case 'time_tracking':
          dataToSync = await this.getTimeTrackingAnalyticsData(tenantId, validatedData.date_range);
          break;
        case 'contractor_performance':
          dataToSync = await this.getContractorPerformanceData(tenantId, validatedData.date_range);
          break;
      }

      // Push to Zoho Analytics
      const analyticsResponse = await axios.post(
        `${ZOHO_CONFIG.analytics.base_url}/${validatedData.workspace_id}/tables/${validatedData.table_name}/data`,
        {
          data: dataToSync,
          config: {
            dateFormat: 'yyyy-MM-dd HH:mm:ss',
            operation: 'APPEND'
          }
        },
        {
          headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        records_synced: dataToSync.length,
        analytics_job_id: analyticsResponse.data.job_id,
        message: `${validatedData.data_type} data pushed to Analytics successfully`
      };

    } catch (error) {
      console.error('Error pushing to Analytics:', error);
      throw error;
    }
  }

  // Creator Workflows
  async triggerCreatorWorkflow(tenantId, workflowData) {
    try {
      const schema = Joi.object({
        application_name: Joi.string().required(),
        workflow_name: Joi.string().required(),
        trigger_data: Joi.object().required(),
        workflow_type: Joi.string().valid('service_approval', 'contractor_onboarding', 'payment_processing').required()
      });

      const validation = schema.validate(workflowData);
      if (validation.error) {
        throw new Error(`Validation error: ${validation.error.details[0].message}`);
      }

      const validatedData = validation.value;

      // Get access token
      const accessToken = await this.getZohoAccessToken('creator', tenantId);

      // Trigger workflow
      const workflowResponse = await axios.post(
        `${ZOHO_CONFIG.creator.base_url}/${validatedData.application_name}/workflows/${validatedData.workflow_name}/trigger`,
        validatedData.trigger_data,
        {
          headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        workflow_id: workflowResponse.data.workflow_id,
        status: workflowResponse.data.status,
        message: 'Creator workflow triggered successfully'
      };

    } catch (error) {
      console.error('Error triggering Creator workflow:', error);
      throw error;
    }
  }

  // Helper methods
  async getServiceRequestDetails(serviceRequestId, tenantId) {
    const datastore = this.catalystApp.datastore();
    const query = `SELECT * FROM service_requests WHERE service_request_id = '${serviceRequestId}' AND tenant_id = '${tenantId}'`;
    const result = await datastore.executeZCQL(query);
    return result.length > 0 ? result[0].service_requests : null;
  }

  async getContractorDetails(contractorId, tenantId) {
    const datastore = this.catalystApp.datastore();
    const query = `SELECT * FROM users WHERE user_id = '${contractorId}' AND tenant_id = '${tenantId}' AND user_role = 'contractor'`;
    const result = await datastore.executeZCQL(query);
    return result.length > 0 ? result[0].users : null;
  }

  mapServiceRequestToCRM(serviceRequest) {
    return {
      Name: `Service Request - ${serviceRequest.service_type.replace('_', ' ')}`,
      Client_Name: serviceRequest.client_name || 'Unknown Client',
      Service_Type: serviceRequest.service_type,
      Priority: serviceRequest.priority,
      Status: serviceRequest.status,
      Scheduled_Date: serviceRequest.scheduled_for,
      Location: serviceRequest.location?.address || '',
      Total_Amount: serviceRequest.total_estimated_cost || 0,
      Payment_Type: serviceRequest.payment_type,
      Special_Requirements: serviceRequest.special_requirements || '',
      Created_Date: serviceRequest.created_at,
      Snug_Request_ID: serviceRequest.service_request_id
    };
  }

  mapContractorToRecruit(contractor, serviceTypes) {
    return {
      First_Name: contractor.first_name,
      Last_Name: contractor.last_name,
      Email: contractor.email,
      Phone: contractor.phone,
      Current_Job_Title: 'Healthcare Service Provider',
      Skills: serviceTypes.map(type => SERVICE_TYPE_MAPPING[type]?.recruit_job_type).filter(Boolean).join(', '),
      Experience_in_Years: contractor.years_of_experience || 0,
      Current_Salary: contractor.hourly_rate * 2000 || 60000, // Estimate annual
      City: contractor.location?.city || '',
      State: contractor.location?.state || '',
      Source: 'Snug & Kisses Platform',
      Resume_Source: 'Internal Profile',
      Snug_Contractor_ID: contractor.user_id
    };
  }

  createJobPosting(serviceType, location) {
    const serviceMapping = SERVICE_TYPE_MAPPING[serviceType];
    return {
      Job_Opening_Name: `${serviceMapping.recruit_job_type} - ${location?.city || 'Multiple Locations'}`,
      Job_Type: 'Contract',
      Department: 'Healthcare Services',
      Work_Experience: '1-5 Years',
      Skills: serviceMapping.recruit_job_type,
      City: location?.city || '',
      State: location?.state || '',
      Country: 'United States',
      Salary: '$25 - $60 per hour',
      Job_Description: `We are seeking qualified ${serviceMapping.recruit_job_type} professionals to join our network of healthcare service providers.`,
      Required_Skills: serviceMapping.recruit_job_type,
      Posted_By: 'Snug & Kisses',
      Job_Opening_Status: 'Active',
      Publish: true
    };
  }

  async getServiceRequestsAnalyticsData(tenantId, dateRange) {
    const datastore = this.catalystApp.datastore();
    const query = `SELECT * FROM service_requests WHERE tenant_id = '${tenantId}' AND created_at BETWEEN '${dateRange.from}' AND '${dateRange.to}'`;
    const result = await datastore.executeZCQL(query);
    
    return result.map(row => ({
      request_date: row.service_requests.created_at,
      service_type: row.service_requests.service_type,
      priority: row.service_requests.priority,
      status: row.service_requests.status,
      estimated_cost: row.service_requests.total_estimated_cost || 0,
      payment_type: row.service_requests.payment_type,
      location_city: row.service_requests.location?.city || '',
      location_state: row.service_requests.location?.state || ''
    }));
  }

  async getPaymentsAnalyticsData(tenantId, dateRange) {
    const datastore = this.catalystApp.datastore();
    const query = `SELECT * FROM payment_intents WHERE tenant_id = '${tenantId}' AND created_at BETWEEN '${dateRange.from}' AND '${dateRange.to}' AND status = 'succeeded'`;
    const result = await datastore.executeZCQL(query);
    
    return result.map(row => ({
      payment_date: row.payment_intents.processed_at || row.payment_intents.created_at,
      subtotal_amount: row.payment_intents.subtotal_amount,
      platform_fee: row.payment_intents.platform_fee,
      processing_fee: row.payment_intents.processing_fee,
      total_amount: row.payment_intents.total_amount,
      payment_type: row.payment_intents.payment_type,
      payment_method: row.payment_intents.payment_method,
      contractor_payout: row.payment_intents.contractor_payout
    }));
  }

  async saveSyncRecord(tenantId, syncData) {
    const syncRecord = {
      sync_id: uuidv4(),
      tenant_id: tenantId,
      ...syncData,
      created_at: new Date().toISOString()
    };

    const datastore = this.catalystApp.datastore();
    const syncTable = datastore.table('zoho_sync_logs');
    await syncTable.insertRow(syncRecord);
  }

  async getCRMRecordId(serviceRequestId, tenantId) {
    const datastore = this.catalystApp.datastore();
    const query = `SELECT zoho_record_id FROM zoho_sync_logs WHERE service_request_id = '${serviceRequestId}' AND tenant_id = '${tenantId}' AND zoho_service = 'crm'`;
    const result = await datastore.executeZCQL(query);
    return result.length > 0 ? result[0].zoho_sync_logs.zoho_record_id : null;
  }

  // Audit logging
  async logZohoAudit(tenantId, userId, action, details) {
    try {
      const auditLog = {
        log_id: uuidv4(),
        tenant_id: tenantId,
        user_id: userId,
        action: action,
        resource_type: 'zoho_integration',
        resource_id: details.sync_id || null,
        details: JSON.stringify(details),
        ip_address: null,
        user_agent: null,
        timestamp: new Date().toISOString()
      };

      const datastore = this.catalystApp.datastore();
      const auditTable = datastore.table('audit_logs');
      await auditTable.insertRow(auditLog);

    } catch (error) {
      console.error('Error logging Zoho audit:', error);
    }
  }
}

// Routes
app.post('/crm/sync', authenticateToken, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const zohoService = new ZohoIntegrationService(catalyst.initialize(req));
    const result = await zohoService.syncServiceRequestToCRM(
      req.user.tenantId,
      req.body
    );
    
    res.status(201).json(result);
  } catch (error) {
    console.error('CRM sync error:', error);
    res.status(400).json({ 
      error: error.message,
      code: 'CRM_SYNC_FAILED'
    });
  }
});

app.post('/recruit/sync', authenticateToken, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const zohoService = new ZohoIntegrationService(catalyst.initialize(req));
    const result = await zohoService.syncContractorToRecruit(
      req.user.tenantId,
      req.body
    );
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Recruit sync error:', error);
    res.status(400).json({ 
      error: error.message,
      code: 'RECRUIT_SYNC_FAILED'
    });
  }
});

app.post('/analytics/push', authenticateToken, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const zohoService = new ZohoIntegrationService(catalyst.initialize(req));
    const result = await zohoService.pushDataToAnalytics(
      req.user.tenantId,
      req.body
    );
    
    res.json(result);
  } catch (error) {
    console.error('Analytics push error:', error);
    res.status(400).json({ 
      error: error.message,
      code: 'ANALYTICS_PUSH_FAILED'
    });
  }
});

app.post('/creator/workflow', authenticateToken, requireRole(['admin', 'hr', 'system']), async (req, res) => {
  try {
    const zohoService = new ZohoIntegrationService(catalyst.initialize(req));
    const result = await zohoService.triggerCreatorWorkflow(
      req.user.tenantId,
      req.body
    );
    
    res.json(result);
  } catch (error) {
    console.error('Creator workflow error:', error);
    res.status(400).json({ 
      error: error.message,
      code: 'CREATOR_WORKFLOW_FAILED'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'zoho_integration',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    zoho_services: Object.keys(ZOHO_CONFIG)
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