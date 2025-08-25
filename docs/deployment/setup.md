# Development Setup Guide

## Prerequisites

### Required Software
- **Node.js 18+** - Runtime for development and functions
- **npm** - Package manager (comes with Node.js)
- **Git** - Version control
- **Zoho Catalyst CLI** - Deployment and management tool

### Zoho Accounts Required
- **Zoho Catalyst** account with Functions and Client components
- **Zoho One** subscription for full service integration
- Access to Zoho CRM, Recruit, Analytics, Creator, Sign, Mail

## Installation Steps

### 1. Install Zoho Catalyst CLI
```bash
npm install -g zoho-catalyst-cli
```

### 2. Clone and Setup Project
```bash
# Navigate to project directory
cd "/home/ronin/Dev env wsl/Snugwsl/Snugnotwsl"

# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..

# Install function dependencies
cd functions/auth_function
npm install
cd ../..
```

### 3. Configure Catalyst
```bash
# Login to Catalyst
catalyst login

# Initialize project (if not already done)
# catalyst init

# Verify project configuration
catalyst status
```

### 4. Environment Configuration
```bash
# Copy development configuration
cp config/development.json.example config/development.json

# Edit configuration as needed
nano config/development.json
```

## Development Workflow

### Starting Development Server
```bash
# Start Catalyst functions locally
catalyst run

# In another terminal, start React client
cd client
npm start
```

### Access URLs
- **Functions:** http://localhost:3000/server/functions/
- **React Client:** http://localhost:3001/

### Testing
```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run all tests
npm run test:all
```

### Code Quality
```bash
# Lint code
npm run lint

# Format code
npm run format

# Type checking (if using TypeScript)
npm run type-check
```

## Database Setup

### Zoho DataStore
1. Log into Zoho Catalyst console
2. Navigate to DataStore section
3. Create tables as defined in `/docs/database/schema.md`
4. Enable PII/ePHI Validator for PHI columns
5. Configure proper access controls

### Seed Data
```bash
# Load development seed data
npm run seed:dev

# Load test fixtures
npm run seed:test
```

## HIPAA Compliance Setup

### Required Configurations
1. Enable **PII/ePHI Validator** in DataStore
2. Configure **audit logging** for all functions
3. Set up **access controls** and user permissions
4. Enable **encryption** for sensitive data
5. Configure **session timeouts** and security policies

### Security Checklist
- [ ] All PHI fields use encrypted text data type
- [ ] PII/ePHI Validator enabled for sensitive columns
- [ ] Audit logging enabled for all data access
- [ ] Multi-factor authentication configured
- [ ] Session management properly implemented
- [ ] API endpoints secured with proper authentication
- [ ] Role-based access control (RBAC) implemented

## Troubleshooting

### Common Issues

#### Catalyst CLI Issues
```bash
# Update CLI to latest version
npm update -g zoho-catalyst-cli

# Clear CLI cache
catalyst cache:clear

# Re-authenticate
catalyst logout
catalyst login
```

#### Function Deployment Issues
```bash
# Check function status
catalyst status

# View function logs
catalyst logs --function auth_function

# Test function locally
catalyst test --function auth_function
```

#### Client Build Issues
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf build
npm run build
```

## Development Best Practices

### Code Organization
- Keep functions focused and single-purpose
- Use consistent naming conventions
- Implement proper error handling
- Write comprehensive tests
- Document all APIs and functions

### HIPAA Compliance
- Always validate PHI data types
- Log all access to sensitive information
- Implement proper user authentication
- Use secure communication protocols
- Regular security audits and testing

### Performance
- Optimize function response times
- Implement proper caching strategies
- Monitor resource usage
- Use efficient database queries
- Optimize client-side performance

---

*For additional help, refer to the Zoho Catalyst documentation or contact the development team.*
