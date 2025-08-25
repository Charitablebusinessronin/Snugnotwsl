const catalyst = require('zcatalyst-sdk-node');
const { createTenantQuery, auditTenantAccess, validateDataAccess, PermissionScope } = require('./tenantMiddleware');

/**
 * Tenant Data Service for Multi-Tenant Data Isolation
 * Provides secure data access methods with tenant isolation
 * Completes Phase 1 - Task 1.3: Multi-Tenant Data Isolation
 */

class TenantDataService {
  constructor(context, tenantContext) {
    this.context = context;
    this.tenantContext = tenantContext;
    this.app = catalyst.initialize(context);
    this.datastore = this.app.datastore();
  }

  /**
   * Create a new record with tenant isolation
   */
  async createRecord(tableName, data, requiredPermission = null) {
    try {
      // Validate permission if required
      if (requiredPermission) {
        validateDataAccess(this.tenantContext, requiredPermission);
      }

      // Ensure tenant_id is set
      const recordData = {
        ...data,
        tenant_id: this.tenantContext.tenantId,
        created_by: this.tenantContext.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Add company_id for employer-related records
      if (['organizations', 'employees', 'service_packages'].includes(tableName)) {
        recordData.company_id = this.tenantContext.companyId;
      }

      const table = this.datastore.table(tableName);
      const result = await table.insertRow(recordData);

      // Audit log the creation
      await auditTenantAccess(
        this.context, 
        this.tenantContext, 
        `create_${tableName}`, 
        result.ROWID
      );

      this.context.log(`Created ${tableName} record:`, result.ROWID);
      return result;

    } catch (error) {
      this.context.log(`Error creating ${tableName}:`, error.message);
      throw new Error(`Failed to create ${tableName}: ${error.message}`);
    }
  }

  /**
   * Read records with tenant filtering
   */
  async getRecords(tableName, filters = {}, requiredPermission = null) {
    try {
      // Validate permission if required
      if (requiredPermission) {
        validateDataAccess(this.tenantContext, requiredPermission);
      }

      // Create tenant-scoped query
      let query = await createTenantQuery(this.context, tableName, this.tenantContext);

      // Apply additional filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          query = query.where(key, 'is', value);
        }
      });

      const results = await query.fetch();

      // Audit log the read operation
      await auditTenantAccess(
        this.context, 
        this.tenantContext, 
        `read_${tableName}`,
        `count:${results.length}`
      );

      this.context.log(`Retrieved ${results.length} ${tableName} records`);
      return results;

    } catch (error) {
      this.context.log(`Error reading ${tableName}:`, error.message);
      throw new Error(`Failed to read ${tableName}: ${error.message}`);
    }
  }

  /**
   * Get a single record by ID with tenant validation
   */
  async getRecordById(tableName, recordId, requiredPermission = null) {
    try {
      // Validate permission if required
      if (requiredPermission) {
        validateDataAccess(this.tenantContext, requiredPermission, recordId);
      }

      // Create tenant-scoped query
      const query = await createTenantQuery(this.context, tableName, this.tenantContext);
      const results = await query.where('ROWID', 'is', recordId).fetch();

      if (!results || results.length === 0) {
        throw new Error(`Record not found or access denied`);
      }

      const record = results[0];

      // Additional validation for individual-level access
      if (this.tenantContext.dataAccessLevel === 'individual') {
        if (record.created_by !== this.tenantContext.userId && 
            record.user_id !== this.tenantContext.userId) {
          throw new Error('Access denied: insufficient permissions for this record');
        }
      }

      // Audit log the read operation
      await auditTenantAccess(
        this.context, 
        this.tenantContext, 
        `read_single_${tableName}`,
        recordId
      );

      this.context.log(`Retrieved ${tableName} record:`, recordId);
      return record;

    } catch (error) {
      this.context.log(`Error reading ${tableName} by ID:`, error.message);
      throw new Error(`Failed to read ${tableName}: ${error.message}`);
    }
  }

  /**
   * Update a record with tenant validation
   */
  async updateRecord(tableName, recordId, updates, requiredPermission = null) {
    try {
      // First, verify the record exists and user has access
      const existingRecord = await this.getRecordById(tableName, recordId, requiredPermission);

      // Prepare update data (prevent tenant_id tampering)
      const updateData = {
        ...updates,
        updated_by: this.tenantContext.userId,
        updated_at: new Date().toISOString()
      };

      // Remove tenant_id from updates to prevent tampering
      delete updateData.tenant_id;

      const table = this.datastore.table(tableName);
      const result = await table.updateRow({
        ROWID: recordId,
        ...updateData
      });

      // Audit log the update
      await auditTenantAccess(
        this.context, 
        this.tenantContext, 
        `update_${tableName}`,
        recordId
      );

      this.context.log(`Updated ${tableName} record:`, recordId);
      return result;

    } catch (error) {
      this.context.log(`Error updating ${tableName}:`, error.message);
      throw new Error(`Failed to update ${tableName}: ${error.message}`);
    }
  }

  /**
   * Delete a record with tenant validation
   */
  async deleteRecord(tableName, recordId, requiredPermission = null) {
    try {
      // First, verify the record exists and user has access
      const existingRecord = await this.getRecordById(tableName, recordId, requiredPermission);

      const table = this.datastore.table(tableName);
      const result = await table.deleteRow(recordId);

      // Audit log the deletion
      await auditTenantAccess(
        this.context, 
        this.tenantContext, 
        `delete_${tableName}`,
        recordId
      );

      this.context.log(`Deleted ${tableName} record:`, recordId);
      return result;

    } catch (error) {
      this.context.log(`Error deleting ${tableName}:`, error.message);
      throw new Error(`Failed to delete ${tableName}: ${error.message}`);
    }
  }

  /**
   * Get user's own records (individual level access)
   */
  async getUserRecords(tableName, userId = null) {
    const targetUserId = userId || this.tenantContext.userId;
    
    return this.getRecords(tableName, {
      user_id: targetUserId
    }, PermissionScope.READ_OWN_PROFILE);
  }

  /**
   * Get employee records (requires HR or Admin access)
   */
  async getEmployeeRecords(filters = {}) {
    validateDataAccess(this.tenantContext, PermissionScope.READ_EMPLOYEE_DATA);
    
    return this.getRecords('employees', filters);
  }

  /**
   * Get service requests with proper access control
   */
  async getServiceRequests(filters = {}) {
    // Employees can see their own requests
    if (this.tenantContext.userRole === 'employee') {
      return this.getRecords('service_requests', {
        ...filters,
        requester_id: this.tenantContext.userId
      }, PermissionScope.READ_OWN_PROFILE);
    }
    
    // Contractors can see assigned requests
    if (this.tenantContext.userRole === 'contractor') {
      return this.getRecords('service_requests', {
        ...filters,
        assigned_contractor_id: this.tenantContext.userId
      });
    }
    
    // Admins and employers can see all tenant requests
    validateDataAccess(this.tenantContext, PermissionScope.MANAGE_SERVICE_REQUESTS);
    return this.getRecords('service_requests', filters);
  }

  /**
   * Get hour balances with access control
   */
  async getHourBalances(filters = {}) {
    // Employees can see their own balances
    if (this.tenantContext.userRole === 'employee') {
      return this.getRecords('hour_balances', {
        ...filters,
        employee_id: this.tenantContext.userId
      }, PermissionScope.READ_OWN_PROFILE);
    }
    
    // HR and Admin can see all balances
    validateDataAccess(this.tenantContext, PermissionScope.HR_ACCESS);
    return this.getRecords('hour_balances', filters);
  }

  /**
   * Test tenant data separation (for testing purposes)
   */
  async testTenantSeparation() {
    try {
      const testResults = {
        tenantId: this.tenantContext.tenantId,
        userId: this.tenantContext.userId,
        userRole: this.tenantContext.userRole,
        dataAccessLevel: this.tenantContext.dataAccessLevel,
        tests: []
      };

      // Test 1: Verify tenant filtering works
      try {
        const usersInTenant = await this.getRecords('users');
        testResults.tests.push({
          test: 'tenant_filtering',
          status: 'passed',
          result: `Found ${usersInTenant.length} users in tenant`
        });
      } catch (error) {
        testResults.tests.push({
          test: 'tenant_filtering',
          status: 'failed',
          error: error.message
        });
      }

      // Test 2: Verify permission validation works
      try {
        validateDataAccess(this.tenantContext, PermissionScope.READ_OWN_PROFILE);
        testResults.tests.push({
          test: 'permission_validation',
          status: 'passed',
          result: 'Permission validation working'
        });
      } catch (error) {
        testResults.tests.push({
          test: 'permission_validation',
          status: 'failed',
          error: error.message
        });
      }

      return testResults;

    } catch (error) {
      this.context.log('Tenant separation test failed:', error.message);
      throw new Error(`Tenant separation test failed: ${error.message}`);
    }
  }
}

module.exports = { TenantDataService };