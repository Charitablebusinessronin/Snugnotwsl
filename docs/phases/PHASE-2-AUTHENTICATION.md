# 🔐 PHASE 2: AUTHENTICATION SYSTEMS - Snug & Kisses Platform

**Priority**: HIGH | **Timeline**: Week 2  
**Status**: 0% Complete | **Dependencies**: Phase 1 Complete

---

## 🎯 **PHASE 2 OVERVIEW**

**Authentication Strategy**: Single login flow that routes users to appropriate portals based on role
- **Employee Portal**: Service requests + conditional HR access
- **Admin Portal**: Management interface (HR always included)
- **Contractor Portal**: Job management for doulas/sitters
- **Client Portal**: Direct-pay service booking

---

## 🔑 **PHASE 2 TASKS**

### **Task 2.1: Employee Portal Authentication** ⏳ PENDING
- **Status**: ⏳ PENDING
- **Priority**: High
- **Timeline**: 2 days
- **Dependencies**: User Management (1.4), Session Management (1.5)

```typescript
// Employee Authentication Implementation
export class EmployeeAuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, companyCode } = req.body;
      
      // Validate input
      const validation = EmployeeLoginSchema.parse({ email, password, companyCode });
      
      // Authenticate user
      const user = await this.userService.authenticateEmployee(
        validation.email,
        validation.password,
        validation.companyCode
      );
      
      // Check HR access permissions
      const hasHRAccess = user.permissions.includes(PermissionScope.HR_ACCESS);
      
      // Create session
      const sessionId = await this.sessionService.createSession(
        user.id,
        user.tenantId,
        user.role,
        user.permissions
      );
      
      // Generate JWT token
      const token = this.generateJWT({
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role,
        sessionId: sessionId,
        hasHRAccess: hasHRAccess
      });
      
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
          hasHRAccess: hasHRAccess
        },
        redirectUrl: '/employee/dashboard'
      });
    } catch (error) {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  }
}
```

**Deliverables**:
- Employee login endpoint
- Company domain validation
- Conditional HR access detection
- JWT token generation
- Session creation

### **Task 2.2: Admin Portal Authentication** ⏳ PENDING
- **Status**: ⏳ PENDING
- **Priority**: High
- **Timeline**: 2 days
- **Dependencies**: User Management (1.4), RBAC (1.1)

```typescript
// Admin Authentication Implementation
export class AdminAuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, adminCode } = req.body;
      
      // Authenticate admin
      const admin = await this.adminService.authenticate(
        validation.email,
        validation.password,
        validation.adminCode
      );
      
      // Verify admin privileges
      if (!admin.isActive || admin.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'Insufficient admin privileges' });
      }
      
      // Admins always get HR access
      const adminPermissions = [
        ...admin.permissions,
        PermissionScope.HR_ACCESS,
        PermissionScope.ACCESS_AUDIT_LOGS
      ];
      
      // Create admin session
      const sessionId = await this.sessionService.createSession(
        admin.id,
        admin.tenantId,
        admin.role,
        adminPermissions
      );
      
      res.json({
        token: this.generateJWT({
          userId: admin.id,
          tenantId: admin.tenantId,
          role: admin.role,
          sessionId: sessionId,
          isAdmin: true
        }),
        admin: {
          id: admin.id,
          email: admin.email,
          role: admin.role,
          permissions: adminPermissions
        },
        redirectUrl: '/admin/dashboard'
      });
    } catch (error) {
      res.status(401).json({ error: 'Invalid admin credentials' });
    }
  }
}
```

**Deliverables**:
- Admin login endpoint
- Admin code verification
- Elevated permissions assignment
- System access validation

### **Task 2.3: Contractor Portal Authentication** ⏳ PENDING
- **Status**: ⏳ PENDING
- **Priority**: High
- **Timeline**: 2 days
- **Dependencies**: User Management (1.4), Background check system

```typescript
// Contractor Authentication Implementation
export class ContractorAuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, verificationCode } = req.body;
      
      // Authenticate contractor
      const contractor = await this.contractorService.authenticate(
        validation.email,
        validation.password,
        validation.verificationCode
      );
      
      // Check background check status
      if (contractor.backgroundCheckStatus !== BackgroundCheckStatus.APPROVED) {
        return res.status(403).json({ 
          error: 'Background check not approved',
          status: contractor.backgroundCheckStatus
        });
      }
      
      // Check insurance status
      if (contractor.insuranceStatus !== InsuranceStatus.ACTIVE) {
        return res.status(403).json({ 
          error: 'Insurance not active',
          status: contractor.insuranceStatus
        });
      }
      
      res.json({
        token: this.generateJWT({
          userId: contractor.id,
          tenantId: contractor.tenantId,
          role: contractor.role,
          sessionId: sessionId
        }),
        contractor: {
          id: contractor.id,
          email: contractor.email,
          role: contractor.role,
          skills: contractor.skills,
          availability: contractor.availability
        },
        redirectUrl: '/contractor/dashboard'
      });
    } catch (error) {
      res.status(401).json({ error: 'Invalid contractor credentials' });
    }
  }
}
```

**Deliverables**:
- Contractor verification system
- Background check validation
- Insurance status checking
- Skills and availability access

### **Task 2.4: Client Portal Authentication** ⏳ PENDING
- **Status**: ⏳ PENDING
- **Priority**: High
- **Timeline**: 2 days
- **Dependencies**: User Management (1.4), Payment system

```typescript
// Client Authentication Implementation
export class ClientAuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      
      // Authenticate client
      const client = await this.clientService.authenticate(
        validation.email,
        validation.password
      );
      
      // Check client account status
      if (client.status !== ClientStatus.ACTIVE) {
        return res.status(403).json({ 
          error: 'Client account not active',
          status: client.status
        });
      }
      
      // Check payment method
      const hasValidPayment = await this.paymentService.validatePaymentMethod(client.id);
      if (!hasValidPayment) {
        return res.status(403).json({ 
          error: 'No valid payment method',
          requiresPaymentSetup: true
        });
      }
      
      res.json({
        token: this.generateJWT({
          userId: client.id,
          tenantId: client.tenantId,
          role: UserRole.CLIENT,
          sessionId: sessionId
        }),
        client: {
          id: client.id,
          email: client.email,
          role: UserRole.CLIENT,
          paymentMethod: client.paymentMethod,
          preferredServices: client.preferredServices
        },
        redirectUrl: '/client/dashboard'
      });
    } catch (error) {
      res.status(401).json({ error: 'Invalid client credentials' });
    }
  }
}
```

**Deliverables**:
- Client direct-pay authentication
- Payment method validation
- Service preference access
- Account status verification

### **Task 2.5: Unified Login Flow & Routing** ⏳ PENDING
- **Status**: ⏳ PENDING
- **Priority**: Critical
- **Timeline**: 1 day
- **Dependencies**: All authentication tasks (2.1-2.4)

```typescript
// Unified Login Router Implementation
export class UnifiedLoginRouter {
  async handleLogin(req: Request, res: Response): Promise<void> {
    const { email, password, userType, additionalFields } = req.body;
    
    try {
      let authResult;
      
      // Route to appropriate authentication handler
      switch (userType) {
        case 'employee':
          authResult = await this.employeeAuth.login({
            email,
            password,
            companyCode: additionalFields.companyCode
          });
          break;
          
        case 'admin':
          authResult = await this.adminAuth.login({
            email,
            password,
            adminCode: additionalFields.adminCode
          });
          break;
          
        case 'contractor':
          authResult = await this.contractorAuth.login({
            email,
            password,
            verificationCode: additionalFields.verificationCode
          });
          break;
          
        case 'client':
          authResult = await this.clientAuth.login({
            email,
            password
          });
          break;
          
        default:
          return res.status(400).json({ error: 'Invalid user type' });
      }
      
      // Log successful authentication
      await this.auditLogger.logAction(
        'user_login_success',
        'authentication',
        authResult.user.id,
        { 
          userType,
          redirectUrl: authResult.redirectUrl,
          hasHRAccess: authResult.user.hasHRAccess || false
        }
      );
      
      res.json(authResult);
      
    } catch (error) {
      // Log failed authentication
      await this.auditLogger.logAction(
        'user_login_failed',
        'authentication',
        email,
        { userType, error: error.message }
      );
      
      res.status(401).json({ error: 'Authentication failed' });
    }
  }
}
```

**Deliverables**:
- Unified login endpoint
- Role-based routing logic
- Authentication flow orchestration
- Error handling and logging

---

## 🎯 **PHASE 2 SUCCESS CRITERIA**

### **By End of Week 2:**
- ✅ **Employee Auth**: Login with conditional HR access working
- ✅ **Admin Auth**: Full management access with HR included
- ✅ **Contractor Auth**: Background check and insurance validation
- ✅ **Client Auth**: Direct-pay customer authentication
- ✅ **Unified Login**: Single entry point routing to correct portal

### **Ready for Phase 3:**
- All 4 user types can authenticate successfully
- Role-based permissions enforced
- Session management working across portals
- JWT tokens contain correct role and permission data

---

## 📋 **IMPLEMENTATION ROADMAP**

**Days 8-9**: Employee portal authentication  
**Days 10-11**: Admin portal authentication  
**Days 12-13**: Contractor portal authentication  
**Days 14**: Client portal authentication + unified routing  

**Next Phase**: Phase 3 - Core Business Logic
