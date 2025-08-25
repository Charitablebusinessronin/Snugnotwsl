# API Endpoints Documentation

## Authentication Endpoints

### POST /auth/login
Login user and return authentication token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "userType": "employee|contractor|admin|employer"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "employee",
    "permissions": ["service.request", "profile.view"]
  }
}
```

### POST /auth/logout
Logout user and invalidate token.

## Service Request Endpoints

### GET /services/requests
Get user's service requests.

### POST /services/requests
Create a new service request.

### PUT /services/requests/:id
Update existing service request.

### DELETE /services/requests/:id
Cancel service request.

## Provider Management Endpoints

### GET /providers
Get available service providers.

### POST /providers
Register new service provider.

### PUT /providers/:id
Update provider information.

## Hour Balance Endpoints

### GET /hours/balance
Get user's current hour balance.

### POST /hours/allocate
Allocate hours to employee (HR only).

### GET /hours/usage
Get hour usage history.

---

*More endpoints to be documented as development progresses*
