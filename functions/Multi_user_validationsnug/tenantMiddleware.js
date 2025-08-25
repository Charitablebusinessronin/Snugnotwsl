const catalyst = require('zcatalyst-sdk-node');
const jwt = require('jsonwebtoken');

/**
 * Multi-Tenant Data Isolation Middleware for Snug & Kisses Healthcare Platform
 * Completes Phase 1 - Task 1.3: Multi-Tenant Data Isolation (80% → 100%)
 * 
 * This middleware ensures data isolation between different employer organizations
 * while maintaining HIPAA compliance and proper access controls.
 */

// Tenant Context Interface
class TenantContext {
  constructor(tenantId, companyId, permissions, dataAccessLevel, userId, userRole) {
    this.tenantId = tenantId;
    this.companyId = companyId;
    this.permissions = permissions;
    this.dataAccessLevel = dataAccessLevel; // 'company' | 'department' | 'individual'
    this.userId = userId;
    this.userRole = userRole;
    this.timestamp = new Date();
  }
}

// Permission Scopes (from Phase 1 documentation)
const PermissionScope = {
  READ_OWN_PROFILE: 'read_own_profile',
  READ_EMPLOYEE_DATA: 'read_employee_data',
  MANAGE_SERVICE_REQUESTS: 'manage_service_requests',
  HR_ACCESS: 'hr_access',
  ACCESS_AUDIT_LOGS: 'access_audit_logs',
  ADMIN_ACCESS: 'admin_access',
  CONTRACTOR_MANAGEMENT: 'contractor_management'
};

// User Roles
const UserRole = {
  EMPLOYEE: 'employee',
  CONTRACTOR: 'contractor',
  ADMIN: 'admin',
  CLIENT: 'client',
  EMPLOYER: 'employer'
};

// Role-Based Permission Policies
const ROLE_POLICIES = {
  [UserRole.EMPLOYEE]: [
    PermissionScope.READ_OWN_PROFILE,
    PermissionScope.READ_EMPLOYEE_DATA
  ],
  [UserRole.CONTRACTOR]: [
    PermissionScope.READ_OWN_PROFILE,
    PermissionScope.CONTRACTOR_MANAGEMENT
  ],
  [UserRole.ADMIN]: [
    PermissionScope.READ_OWN_PROFILE,
    PermissionScope.READ_EMPLOYEE_DATA,
    PermissionScope.MANAGE_SERVICE_REQUESTS,
    PermissionScope.HR_ACCESS,
    PermissionScope.ACCESS_AUDIT_LOGS,
    PermissionScope.ADMIN_ACCESS,
    PermissionScope.CONTRACTOR_MANAGEMENT
  ],
  [UserRole.CLIENT]: [
    PermissionScope.READ_OWN_PROFILE,
    PermissionScope.MANAGE_SERVICE_REQUESTS
  ],
  [UserRole.EMPLOYER]: [
    PermissionScope.READ_OWN_PROFILE,
    PermissionScope.READ_EMPLOYEE_DATA,
    PermissionScope.HR_ACCESS
  ]
};

/**
 * Create Tenant Middleware for Multi-Tenant Data Isolation
 * Validates tenant context and ensures data access is properly scoped
 */
function createTenantMiddleware() {
  return async (request, context) => {
    try {
      // Extract authorization token from headers
      const authHeader = request.headers['authorization'] || request.headers['Authorization'];
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Missing or invalid authorization header');
      }
      
      const token = authHeader.replace('Bearer ', '');
      
      // Verify and decode JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'snug-kisses-healthcare-secret');
      
      // Validate required claims
      if (!decoded.tenantId || !decoded.userId || !decoded.userRole) {
        throw new Error('Invalid token: missing required claims');
      }
      
      // Create tenant context
      const tenantContext = new TenantContext(
        decoded.tenantId,
        decoded.companyId,
        ROLE_POLICIES[decoded.userRole] || [],
        decoded.dataAccessLevel || 'individual',
        decoded.userId,
        decoded.userRole
      );
      
      // Validate tenant access
      await validateTenantAccess(tenantContext, context);
      
      // Add tenant context to request
      request.tenantContext = tenantContext;
      
      context.log('Tenant context established:', {
        tenantId: tenantContext.tenantId,
        companyId: tenantContext.companyId,
        userRole: tenantContext.userRole,
        dataAccessLevel: tenantContext.dataAccessLevel
      });
      
      return tenantContext;
      
    } catch (error) {
      context.log('Tenant middleware error:', error.message);
      throw new Error(`Tenant authentication failed: ${error.message}`);
    }
  };
}

/**
 * Validate Tenant Access
 * Ensures the user has valid access to the requested tenant/company
 */
async function validateTenantAccess(tenantContext, context) {
  try {
    const app = catalyst.initialize(context);
    const datastore = app.datastore();
    
    // Check if tenant exists and is active
    const tenantTable = datastore.table('tenants');
    const tenantQuery = tenantTable.where('tenant_id', 'is', tenantContext.tenantId);
    const tenantResult = await tenantQuery.fetch();
    
    if (!tenantResult || tenantResult.length === 0) {
      throw new Error('Invalid tenant ID');
    }
    
    const tenant = tenantResult[0];
    
    // Check tenant status
    if (tenant.status !== 'active') {
      throw new Error('Tenant account is not active');
    }
    
    // For non-admin users, verify they belong to the tenant
    if (tenantContext.userRole !== UserRole.ADMIN) {
      const userTenantTable = datastore.table('user_tenants');
      const userTenantQuery = userTenantTable
        .where('user_id', 'is', tenantContext.userId)
        .and('tenant_id', 'is', tenantContext.tenantId);
      
      const userTenantResult = await userTenantQuery.fetch();
      
      if (!userTenantResult || userTenantResult.length === 0) {
        throw new Error('User does not have access to this tenant');
      }
    }
    
    context.log('Tenant access validated successfully');
    
  } catch (error) {
    context.log('Tenant access validation failed:', error.message);
    throw error;
  }
}

/**
 * Apply Tenant Data Filter
 * Adds tenant filtering to database queries to ensure data isolation
 */
function applyTenantDataFilter(query, tenantContext, tableName) {
  // Apply tenant-based filtering based on table type
  switch (tableName) {
    case 'users':
    case 'service_requests':
    case 'hour_balances':
    case 'appointments':
      // These tables should be filtered by tenant_id
      return query.where('tenant_id', 'is', tenantContext.tenantId);
      
    case 'contractors':
    case 'services':
      // Contractors can work across multiple tenants, but access is controlled
      if (tenantContext.userRole === UserRole.ADMIN) {
        // Admins can see all contractors
        return query;
      } else {
        // Regular users see only contractors available to their tenant
        return query.where('available_tenants', 'contains', tenantContext.tenantId);
      }
      
    case 'organizations':
      // Organizations are filtered by company_id for employer users
      if (tenantContext.userRole === UserRole.EMPLOYER) {
        return query.where('company_id', 'is', tenantContext.companyId);
      } else {
        return query.where('tenant_id', 'is', tenantContext.tenantId);
      }
      
    default:
      // Default: filter by tenant_id
      return query.where('tenant_id', 'is', tenantContext.tenantId);
  }
}

/**
 * Validate Data Access Permission
 * Checks if the user has permission to access specific data
 */
function validateDataAccess(tenantContext, requiredPermission, resourceOwnerId = null) {
  // Check if user has the required permission
  if (!tenantContext.permissions.includes(requiredPermission)) {
    throw new Error(`Insufficient permissions: ${requiredPermission} required`);
  }
  
  // For individual-level access, ensure user can only access their own data
  if (tenantContext.dataAccessLevel === 'individual' && resourceOwnerId) {
    if (resourceOwnerId !== tenantContext.userId) {
      throw new Error('Access denied: can only access own data');
    }
  }
  
  return true;
}

/**
 * Create Tenant-Scoped Database Query
 * Utility function to create properly scoped database queries
 */
async function createTenantQuery(context, tableName, tenantContext) {
  const app = catalyst.initialize(context);
  const datastore = app.datastore();
  const table = datastore.table(tableName);
  
  // Apply tenant filtering
  return applyTenantDataFilter(table, tenantContext, tableName);
}

/**
 * Audit Log Tenant Access
 * Logs tenant access for HIPAA compliance
 */
async function auditTenantAccess(context, tenantContext, action, resourceId = null) {
  try {
    const app = catalyst.initialize(context);
    const datastore = app.datastore();
    
    const auditEntry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      tenant_id: tenantContext.tenantId,
      user_id: tenantContext.userId,
      user_role: tenantContext.userRole,
      action: action,
      resource_id: resourceId,
      ip_address: getClientIP(context),
      user_agent: getUserAgent(context),
      created_at: new Date().toISOString()
    };
    
    const auditTable = datastore.table('audit_logs');
    await auditTable.insertRow(auditEntry);
    
    context.log('Tenant access audited:', action);
    
  } catch (error) {
    context.log('Audit logging failed:', error.message);
    // Don't throw here to avoid blocking operations
  }
}

// Utility functions
function generateId() {
  return 'tenant_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getClientIP(context) {
  return context.request?.ip || 'unknown';
}

function getUserAgent(context) {
  return context.request?.headers?.['user-agent'] || 'unknown';
}

module.exports = {
  createTenantMiddleware,
  validateTenantAccess,
  applyTenantDataFilter,
  validateDataAccess,
  createTenantQuery,
  auditTenantAccess,
  TenantContext,
  PermissionScope,
  UserRole,
  ROLE_POLICIES
};