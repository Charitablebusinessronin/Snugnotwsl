# 🏥 PHASE 3: CORE BUSINESS LOGIC - Snug & Kisses Platform

**Priority**: HIGH | **Timeline**: Week 3  
**Status**: 20% Complete | **Dependencies**: Phase 2 Complete

---

## 🎯 **PHASE 3 OVERVIEW**

**Business Logic Focus**: Core doula and childcare service management
- **Service Requests**: Employee/Client requests for doula and childcare services
- **Provider Matching**: AI-powered matching of requests to qualified contractors
- **Time Tracking**: Hour logging and billing for services
- **Payment Processing**: Employer benefits and direct-pay handling

---

## 📋 **PHASE 3 TASKS**

### **Task 3.1: Service Request Management** 🔄 IN PROGRESS
- **Status**: 🔄 IN PROGRESS (70% Complete)
- **Priority**: Critical
- **Timeline**: 3 days
- **Dependencies**: Authentication (Phase 2)

```typescript
// Service Request Management Implementation
export class ServiceRequestService {
  async createServiceRequest(
    requestData: CreateServiceRequestRequest,
    userContext: PortalUserContext
  ): Promise<ServiceRequest> {
    // Validate user permissions
    if (!this.rbacGuard.hasPermission(userContext.role, PermissionScope.MANAGE_SERVICE_REQUESTS)) {
      throw new Error('Insufficient permissions to create service requests');
    }
    
    // Validate service type based on Snug & Kisses offerings
    const validServiceTypes = [
      'birth_doula',
      'postpartum_doula', 
      'backup_childcare',
      'emergency_sitter',
      'eldercare_support'
    ];
    
    if (!validServiceTypes.includes(requestData.serviceType)) {
      throw new Error('Invalid service type for Snug & Kisses platform');
    }
    
    // Create service request
    const serviceRequest: ServiceRequest = {
      id: uuidv4(),
      tenantId: userContext.tenantId,
      companyId: userContext.companyId,
      requesterId: userContext.userId,
      requesterRole: userContext.role,
      serviceType: requestData.serviceType,
      priority: this.calculatePriority(requestData),
      status: ServiceRequestStatus.PENDING,
      description: requestData.description,
      preferredStartDate: requestData.preferredStartDate,
      estimatedHours: requestData.estimatedHours,
      specialRequirements: requestData.specialRequirements,
      location: requestData.location,
      paymentType: userContext.role === 'client' ? 'direct_pay' : 'employer_benefits',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Store in database
    const createdRequest = await this.dataStore.insert('service_requests', serviceRequest);
    
    // Log creation for HIPAA compliance
    await this.auditLogger.logAction(
      'service_request_created',
      'service_request',
      createdRequest.id,
      { 
        requestId: createdRequest.id, 
        requesterId: userContext.userId,
        serviceType: requestData.serviceType
      }
    );
    
    // Trigger matching process
    await this.contractorMatchingService.initiateMatching(createdRequest);
    
    // Send notifications
    if (userContext.role === 'employee') {
      await this.notificationService.notifyAdmins(createdRequest);
    }
    
    return createdRequest;
  }
  
  private calculatePriority(requestData: CreateServiceRequestRequest): ServicePriority {
    // Snug & Kisses specific priority logic
    if (requestData.serviceType === 'birth_doula' && requestData.isUrgent) {
      return ServicePriority.CRITICAL;
    }
    
    if (requestData.serviceType === 'emergency_sitter') {
      return ServicePriority.HIGH;
    }
    
    return ServicePriority.MEDIUM;
  }
}
```

**Deliverables**:
- Service request creation (Employee & Client portals)
- Request validation and processing
- Priority calculation logic
- HIPAA-compliant request logging

### **Task 3.2: Provider Matching System** ⏳ PENDING
- **Status**: ⏳ PENDING
- **Priority**: High
- **Timeline**: 4 days
- **Dependencies**: Service Requests (3.1), User Management (1.4)

```typescript
// AI-Powered Contractor Matching for Doula Services
export class ContractorMatchingService {
  async findMatchingContractors(
    serviceRequest: ServiceRequest,
    filters: MatchingFilters = {}
  ): Promise<ContractorMatch[]> {
    // Get available contractors based on service type
    const serviceSpecificFilters = this.getServiceFilters(serviceRequest.serviceType);
    
    const availableContractors = await this.contractorService.getAvailableContractors({
      serviceTypes: [serviceRequest.serviceType],
      location: serviceRequest.location,
      availability: serviceRequest.preferredStartDate,
      backgroundCheckStatus: BackgroundCheckStatus.APPROVED,
      insuranceStatus: InsuranceStatus.ACTIVE,
      ...serviceSpecificFilters,
      ...filters
    });
    
    // Score contractors using Snug & Kisses matching algorithm
    const scoredContractors = await this.scoreContractorsForService(
      availableContractors, 
      serviceRequest
    );
    
    // Sort by score and return top matches
    return scoredContractors
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, filters.maxResults || 5);
  }
  
  private async scoreContractorsForService(
    contractors: Contractor[],
    serviceRequest: ServiceRequest
  ): Promise<ContractorMatch[]> {
    const matches: ContractorMatch[] = [];
    
    for (const contractor of contractors) {
      let totalScore = 0;
      let scoreBreakdown = {};
      
      // Service expertise match (35% of score)
      const expertiseScore = this.calculateExpertiseMatch(
        contractor, 
        serviceRequest.serviceType,
        serviceRequest.specialRequirements
      );
      totalScore += expertiseScore * 0.35;
      scoreBreakdown.expertise = expertiseScore;
      
      // Availability match (25% of score)
      const availabilityScore = await this.calculateAvailabilityMatch(
        contractor.availability, 
        serviceRequest.preferredStartDate,
        serviceRequest.estimatedHours
      );
      totalScore += availabilityScore * 0.25;
      scoreBreakdown.availability = availabilityScore;
      
      // Location proximity (20% of score)
      const locationScore = this.calculateLocationMatch(
        contractor.serviceAreas, 
        serviceRequest.location
      );
      totalScore += locationScore * 0.20;
      scoreBreakdown.location = locationScore;
      
      // Performance rating (15% of score)
      const performanceScore = contractor.performanceRating || 0.5;
      totalScore += performanceScore * 0.15;
      scoreBreakdown.performance = performanceScore;
      
      // Client preference match (5% of score)
      const preferenceScore = this.calculatePreferenceMatch(
        contractor,
        serviceRequest.clientPreferences
      );
      totalScore += preferenceScore * 0.05;
      scoreBreakdown.preferences = preferenceScore;
      
      matches.push({
        contractor,
        totalScore,
        scoreBreakdown,
        estimatedCost: this.calculateEstimatedCost(contractor, serviceRequest),
        availabilityDetails: await this.getDetailedAvailability(contractor, serviceRequest)
      });
    }
    
    return matches;
  }
  
  private calculateExpertiseMatch(
    contractor: Contractor,
    serviceType: string,
    specialRequirements: string[]
  ): number {
    let score = 0;
    
    // Base service type match
    if (contractor.certifiedServices.includes(serviceType)) {
      score += 0.6;
      
      // Bonus for specialized certifications
      if (serviceType === 'birth_doula' && contractor.certifications.includes('DONA_certified')) {
        score += 0.2;
      }
      
      if (serviceType === 'postpartum_doula' && contractor.certifications.includes('postpartum_specialist')) {
        score += 0.2;
      }
    }
    
    // Special requirements match
    if (specialRequirements && specialRequirements.length > 0) {
      const matchedRequirements = specialRequirements.filter(req => 
        contractor.specialSkills.includes(req)
      );
      score += (matchedRequirements.length / specialRequirements.length) * 0.2;
    }
    
    return Math.min(score, 1.0);
  }
}
```

**Deliverables**:
- AI-powered contractor matching algorithm
- Service-specific matching logic for doulas
- Real-time availability checking
- Performance-based scoring system

### **Task 3.3: Time Tracking & Billing** ⏳ PENDING
- **Status**: ⏳ PENDING
- **Priority**: High
- **Timeline**: 3 days
- **Dependencies**: Service Requests (3.1), Provider Matching (3.2)

```typescript
// Hours Ledger for Snug & Kisses Services
export class TimeTrackingService {
  async startService(
    serviceRequestId: string,
    contractorContext: PortalUserContext
  ): Promise<ServiceSession> {
    // Validate contractor assignment
    const serviceRequest = await this.serviceRequestService.getRequest(serviceRequestId);
    if (serviceRequest.assignedContractorId !== contractorContext.userId) {
      throw new Error('Contractor not assigned to this service request');
    }
    
    // Create service session
    const session: ServiceSession = {
      id: uuidv4(),
      serviceRequestId,
      contractorId: contractorContext.userId,
      clientId: serviceRequest.requesterId,
      serviceType: serviceRequest.serviceType,
      startTime: new Date(),
      status: SessionStatus.ACTIVE,
      location: serviceRequest.location,
      notes: '',
      createdAt: new Date()
    };
    
    await this.dataStore.insert('service_sessions', session);
    
    // Log session start for billing
    await this.auditLogger.logAction(
      'service_started',
      'service_session',
      session.id,
      { 
        sessionId: session.id,
        contractorId: contractorContext.userId,
        serviceType: serviceRequest.serviceType
      }
    );
    
    return session;
  }
  
  async endService(
    sessionId: string,
    endData: EndServiceRequest,
    contractorContext: PortalUserContext
  ): Promise<CompletedSession> {
    // Get active session
    const session = await this.getActiveSession(sessionId, contractorContext.userId);
    
    // Calculate duration and cost
    const endTime = new Date();
    const durationHours = this.calculateDuration(session.startTime, endTime);
    const hourlyRate = await this.getContractorRate(contractorContext.userId, session.serviceType);
    const totalCost = durationHours * hourlyRate;
    
    // Update session
    const completedSession = await this.dataStore.update('service_sessions', sessionId, {
      endTime,
      durationHours,
      hourlyRate,
      totalCost,
      status: SessionStatus.COMPLETED,
      contractorNotes: endData.notes,
      serviceQualityRating: endData.selfRating,
      updatedAt: new Date()
    });
    
    // Create billing entry
    await this.createBillingEntry(completedSession);
    
    // Update service request status
    await this.serviceRequestService.updateStatus(
      session.serviceRequestId,
      ServiceRequestStatus.COMPLETED
    );
    
    // Notify client for rating
    await this.notificationService.requestClientFeedback(
      session.clientId,
      completedSession
    );
    
    return completedSession;
  }
  
  private async createBillingEntry(session: CompletedSession): Promise<void> {
    const serviceRequest = await this.serviceRequestService.getRequest(session.serviceRequestId);
    
    const billingEntry: BillingEntry = {
      id: uuidv4(),
      sessionId: session.id,
      serviceRequestId: session.serviceRequestId,
      contractorId: session.contractorId,
      clientId: session.clientId,
      serviceType: session.serviceType,
      durationHours: session.durationHours,
      hourlyRate: session.hourlyRate,
      totalAmount: session.totalCost,
      paymentType: serviceRequest.paymentType,
      status: BillingStatus.PENDING_APPROVAL,
      createdAt: new Date()
    };
    
    await this.dataStore.insert('billing_entries', billingEntry);
    
    // Process based on payment type
    if (serviceRequest.paymentType === 'employer_benefits') {
      await this.processEmployerBilling(billingEntry);
    } else {
      await this.processDirectPayBilling(billingEntry);
    }
  }
}
```

**Deliverables**:
- Service session tracking
- Time and billing calculations
- Employer benefits vs direct-pay handling
- Contractor payment processing

### **Task 3.4: Payment Processing Integration** ⏳ PENDING
- **Status**: ⏳ PENDING  
- **Priority**: High
- **Timeline**: 3 days
- **Dependencies**: Time Tracking (3.3)

### **Task 3.5: Notification & Communication System** ⏳ PENDING
- **Status**: ⏳ PENDING
- **Priority**: Medium
- **Timeline**: 2 days
- **Dependencies**: All business logic tasks

---

## 🎯 **PHASE 3 SUCCESS CRITERIA**

### **By End of Week 3:**
- ✅ **Service Requests**: Employees and clients can request doula/childcare services
- ✅ **Provider Matching**: AI-powered matching working for all service types
- ✅ **Time Tracking**: Contractors can log service hours accurately
- ✅ **Billing Integration**: Both employer benefits and direct-pay processing
- ✅ **Communication**: Notifications working across all user types

### **Ready for Phase 4:**
- Core business processes functional
- Service delivery workflow complete
- Payment processing integrated
- All user types can complete their primary tasks

---

## 📋 **IMPLEMENTATION ROADMAP**

**Days 15-17**: Complete service request management  
**Days 18-20**: Implement contractor matching system  
**Days 21**: Complete time tracking and billing  

**Next Phase**: Phase 4 - Zoho Integration
