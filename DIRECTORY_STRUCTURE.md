# 🏥 Snug & Kisses Healthcare Platform - Directory Structure

**Complete file directory structure for the Zoho Catalyst healthcare platform**

```
Snugnotwsl/                                 # 🏥 ROOT PROJECT DIRECTORY
├── catalyst.json                           # Catalyst project configuration
├── .catalystrc                            # Catalyst CLI configuration
├── package.json                           # Root project dependencies
├── package-lock.json                      # Dependency lock file
├── DIRECTORY_STRUCTURE.md                 # This file - directory overview
├── README.md                              # Project readme and setup guide
├── .gitignore                             # Git ignore rules
│
├── 📁 client/                             # 🌐 REACT FRONTEND APPLICATION
│   ├── public/                            # Public assets and static files
│   │   ├── index.html                     # Main HTML with Catalyst Web SDK
│   │   ├── embeddediframe.css             # Login form styling (Catalyst)
│   │   ├── fpwd.css                       # Password reset styling (Catalyst)
│   │   ├── favicon.ico                    # Site icon
│   │   ├── manifest.json                  # PWA manifest for mobile
│   │   └── images/                        # 🎨 MAIN IMAGES DIRECTORY
│   │       ├── logo/                      # Brand logos and icons
│   │       │   ├── snug-logo-primary.png
│   │       │   ├── snug-logo-white.png
│   │       │   ├── snug-logo-dark.png
│   │       │   └── favicon.ico
│   │       ├── healthcare/                # Healthcare service images
│   │       │   ├── doula-services/        # Doula service imagery
│   │       │   │   ├── prenatal-care.jpg
│   │       │   │   ├── birth-support.jpg
│   │       │   │   └── postpartum-care.jpg
│   │       │   ├── childcare-services/    # Childcare service imagery
│   │       │   │   ├── infant-care.jpg
│   │       │   │   ├── toddler-care.jpg
│   │       │   │   └── school-age-care.jpg
│   │       │   ├── family-support/        # Family support imagery
│   │       │   │   ├── family-wellness.jpg
│   │       │   │   ├── emergency-support.jpg
│   │       │   │   └── community-care.jpg
│   │       │   └── wellness/              # General wellness imagery
│   │       │       ├── mental-health.jpg
│   │       │       ├── physical-wellness.jpg
│   │       │       └── emotional-support.jpg
│   │       ├── ui/                        # UI elements and graphics
│   │       │   ├── icons/                 # Interface icons
│   │       │   │   ├── navigation/        # Navigation icons
│   │       │   │   │   ├── home-icon.svg
│   │       │   │   │   ├── services-icon.svg
│   │       │   │   │   ├── profile-icon.svg
│   │       │   │   │   └── settings-icon.svg
│   │       │   │   ├── healthcare/        # Healthcare-specific icons
│   │       │   │   │   ├── doula-icon.svg
│   │       │   │   │   ├── childcare-icon.svg
│   │       │   │   │   ├── family-icon.svg
│   │       │   │   │   └── wellness-icon.svg
│   │       │   │   └── common/            # Common UI icons
│   │       │   │       ├── check-icon.svg
│   │       │   │       ├── close-icon.svg
│   │       │   │       ├── edit-icon.svg
│   │       │   │       └── delete-icon.svg
│   │       │   ├── backgrounds/           # Background images
│   │       │   │   ├── hero-bg.jpg
│   │       │   │   ├── dashboard-bg.jpg
│   │       │   │   └── login-bg.jpg
│   │       │   ├── buttons/               # Button graphics
│   │       │   │   ├── primary-button.png
│   │       │   │   ├── secondary-button.png
│   │       │   │   └── cta-button.png
│   │       │   └── placeholders/          # Placeholder images
│   │       │       ├── user-avatar.png
│   │       │       ├── service-placeholder.jpg
│   │       │       └── profile-placeholder.jpg
│   │       ├── users/                     # User-related images
│   │       │   ├── avatars/               # User profile pictures
│   │       │   │   ├── default-avatar.png
│   │       │   │   ├── admin-avatar.png
│   │       │   │   ├── employee-avatar.png
│   │       │   │   ├── contractor-avatar.png
│   │       │   │   └── client-avatar.png
│   │       │   ├── profiles/              # Profile-related images
│   │       │   │   ├── profile-header.jpg
│   │       │   │   └── profile-bg.jpg
│   │       │   └── testimonials/          # User testimonial images
│   │       │       ├── family-testimonial.jpg
│   │       │       ├── provider-testimonial.jpg
│   │       │       └── employer-testimonial.jpg
│   │       └── marketing/                 # Marketing & promotional
│   │           ├── hero-images/           # Hero section images
│   │           │   ├── main-hero.jpg
│   │           │   ├── services-hero.jpg
│   │           │   └── about-hero.jpg
│   │           ├── feature-graphics/      # Feature highlight images
│   │           │   ├── doula-benefits.jpg
│   │           │   ├── childcare-benefits.jpg
│   │           │   └── employer-benefits.jpg
│   │           └── promotional-materials/ # Promotional content
│   │               ├── social-media/
│   │               ├── email-marketing/
│   │               └── print-materials/
│   ├── src/                               # React source code
│   │   ├── components/                    # Reusable UI components
│   │   │   ├── common/                    # Shared components
│   │   │   │   ├── Button/               # Reusable button components
│   │   │   │   ├── Navigation/           # Navigation components
│   │   │   │   ├── Forms/                # Form components
│   │   │   │   └── Layout/               # Layout components
│   │   │   ├── auth/                     # Authentication components
│   │   │   ├── hr/                       # HR-specific components
│   │   │   └── services/                 # Service-related components
│   │   ├── pages/                        # Page components by user type
│   │   │   ├── Login/                    # Unified login portal
│   │   │   ├── Employee/                 # Employee dashboard pages
│   │   │   ├── Admin/                    # Admin dashboard pages
│   │   │   ├── Contractor/               # Contractor dashboard pages
│   │   │   └── Employer/                 # Employer dashboard pages
│   │   ├── contexts/                     # React contexts for state
│   │   ├── utils/                        # Utility functions
│   │   ├── styles/                       # Global styles and themes
│   │   ├── App.js                        # Main app with routing
│   │   └── index.js                      # React entry point
│   ├── package.json                      # Client dependencies
│   ├── client-package.json               # Catalyst client config
│   └── .gitignore                        # Client-specific git ignore
│
├── 📁 functions/                          # 🚀 BACKEND SERVERLESS FUNCTIONS
│   ├── auth_function/                     # Authentication & user management
│   │   ├── index.js                      # Auth function entry point
│   │   ├── package.json                  # Auth-specific dependencies
│   │   └── node_modules/                 # Installed packages
│   ├── serviceRequests/                   # Service request management
│   │   ├── index.js                      # Service CRUD operations
│   │   ├── package.json                  # Service dependencies
│   │   └── node_modules/
│   ├── hourBalances/                      # Hour tracking & billing
│   │   ├── index.js                      # Hour balance calculations
│   │   ├── package.json                  # Billing dependencies
│   │   └── node_modules/
│   ├── providers/                         # Contractor/provider management
│   │   ├── index.js                      # Provider CRUD & onboarding
│   │   ├── package.json                  # Provider dependencies
│   │   └── node_modules/
│   ├── clients/                           # Client/employee management
│   │   ├── index.js                      # Client data operations
│   │   ├── package.json                  # Client dependencies
│   │   └── node_modules/
│   ├── admin/                             # Administrative functions
│   │   ├── index.js                      # System administration
│   │   ├── package.json                  # Admin dependencies
│   │   └── node_modules/
│   └── compliance/                        # HIPAA compliance functions
│       ├── index.js                      # Audit logging & compliance
│       ├── package.json                  # Compliance dependencies
│       └── node_modules/
│
├── 📁 docs/                              # 📚 DOCUMENTATION
│   ├── PLANNING.md                       # Main planning document (your current plan)
│   ├── api/                              # API documentation
│   │   ├── endpoints.md                  # API endpoint documentation
│   │   ├── authentication.md             # Auth API documentation
│   │   └── examples.md                   # API usage examples
│   ├── database/                         # Database documentation
│   │   ├── schema.md                     # Database schema documentation
│   │   ├── relationships.md              # Table relationships
│   │   └── queries.md                    # Common queries and examples
│   ├── deployment/                       # Deployment documentation
│   │   ├── setup.md                      # Development setup guide
│   │   ├── production.md                 # Production deployment guide
│   │   └── environment.md                # Environment configuration
│   ├── compliance/                       # HIPAA compliance documentation
│   │   ├── hipaa-requirements.md         # HIPAA compliance requirements
│   │   ├── security-policies.md          # Security policies and procedures
│   │   └── audit-procedures.md           # Audit procedures and logs
│   └── user-guides/                      # User documentation
│       ├── employee-guide.md             # Employee portal user guide
│       ├── contractor-guide.md           # Contractor portal user guide
│       ├── admin-guide.md                # Admin portal user guide
│       └── employer-guide.md             # Employer portal user guide
│
├── 📁 tests/                             # 🧪 TESTING FRAMEWORK
│   ├── unit/                             # Unit tests
│   │   ├── functions/                    # Function unit tests
│   │   └── components/                   # Component unit tests
│   ├── integration/                      # Integration tests
│   │   ├── api/                         # API integration tests
│   │   └── workflows/                    # Business workflow tests
│   ├── e2e/                             # End-to-end tests
│   │   ├── user-journeys/               # User journey tests
│   │   └── compliance/                   # Compliance testing
│   └── fixtures/                         # Test data and fixtures
│       ├── users.json                    # Test user data
│       ├── services.json                 # Test service data
│       └── organizations.json            # Test organization data
│
├── 📁 data/                              # 💾 DATA MANAGEMENT
│   ├── schemas/                          # Database schemas
│   │   ├── users-schema.json            # User table schemas
│   │   ├── services-schema.json         # Service table schemas
│   │   └── organizations-schema.json     # Organization table schemas
│   ├── migrations/                       # Database migrations
│   │   ├── 001-initial-setup.js         # Initial database setup
│   │   ├── 002-add-compliance.js        # Add compliance tables
│   │   └── 003-add-analytics.js         # Add analytics tables
│   └── seed/                            # Seed data for development
│       ├── dev-users.json               # Development user data
│       ├── dev-services.json            # Development service data
│       └── dev-organizations.json        # Development organization data
│
├── 📁 scripts/                           # 🛠️ UTILITY SCRIPTS
│   ├── setup.sh                         # Project setup script
│   ├── deploy.sh                        # Deployment script
│   ├── backup.sh                        # Data backup script
│   └── compliance-check.sh              # HIPAA compliance check
│
├── 📁 config/                            # ⚙️ CONFIGURATION FILES
│   ├── development.json                  # Development environment config
│   ├── production.json                   # Production environment config
│   ├── staging.json                      # Staging environment config
│   └── compliance.json                   # HIPAA compliance configuration
│
└── 📁 snugbackend/                       # 🔧 CUSTOM BACKEND (if needed)
    └── (existing backend code if applicable)
```

## 🎯 **Directory Usage Guidelines**

### **🌐 Client Directory (`client/`):**
- **`public/images/`** - All static images accessible via URLs
- **`src/components/`** - Reusable React components
- **`src/pages/`** - Page components for each user type
- **`src/contexts/`** - React contexts for global state
- **`src/utils/`** - Helper functions and utilities

### **🚀 Functions Directory (`functions/`):**
- Each function has its own directory with `index.js` and `package.json`
- Functions are deployed as serverless endpoints
- Use AdvancedIO function type for healthcare APIs
- Include proper error handling and logging

### **📚 Documentation (`docs/`):**
- **`PLANNING.md`** - Your comprehensive project plan
- **`api/`** - Complete API documentation
- **`compliance/`** - HIPAA compliance documentation
- **`user-guides/`** - End-user documentation

### **🧪 Testing (`tests/`):**
- **`unit/`** - Component and function unit tests
- **`integration/`** - API and workflow integration tests
- **`e2e/`** - Complete user journey tests
- **`fixtures/`** - Test data and mock objects

### **💾 Data Management (`data/`):**
- **`schemas/`** - Zoho DataStore table schemas
- **`migrations/`** - Database migration scripts
- **`seed/`** - Development and testing data

### **🛠️ Scripts & Config:**
- **`scripts/`** - Automation and utility scripts
- **`config/`** - Environment-specific configurations

## 🎨 **Image Usage Examples**

```jsx
// Brand logos
<img src="/images/logo/snug-logo-primary.png" alt="Snug & Kisses" />

// Healthcare services
<img src="/images/healthcare/doula-services/prenatal-care.jpg" alt="Prenatal Care" />

// UI icons
<img src="/images/ui/icons/healthcare/doula-icon.svg" alt="Doula Services" />

// User avatars
<img src="/images/users/avatars/default-avatar.png" alt="User Avatar" />

// Marketing images
<img src="/images/marketing/hero-images/main-hero.jpg" alt="Healthcare Support" />
```

## ⚡ **Quick Start Commands**

```bash
# Navigate to project
cd "/home/ronin/Dev env wsl/Snugwsl/Snugnotwsl"

# Start development server
catalyst run

# Start React client
cd client && npm start

# Run tests
npm test

# Deploy to production
catalyst deploy
```

---

**✅ Complete directory structure created successfully!**
**🏥 Ready for Snug & Kisses Healthcare Platform development**
**📁 All directories follow Zoho Catalyst standards and healthcare requirements**
