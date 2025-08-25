# Database Schema Documentation

## Core Tables

### users
Primary user table for all user types.

| Column | Type | Description | HIPAA |
|--------|------|-------------|--------|
| user_id | String | Unique user identifier | No |
| email | String | User email address | Yes |
| password_hash | String | Encrypted password | Yes |
| user_type | String | employee/contractor/admin/employer | No |
| first_name | String | User's first name | Yes |
| last_name | String | User's last name | Yes |
| phone | String | Phone number | Yes |
| created_at | DateTime | Account creation date | No |
| last_login | DateTime | Last login timestamp | No |

### organizations
Employer organizations table.

| Column | Type | Description | HIPAA |
|--------|------|-------------|--------|
| org_id | String | Unique organization identifier | No |
| company_name | String | Organization name | No |
| industry | String | Business industry | No |
| employee_count | Number | Number of employees | No |
| service_package | String | Service package type | No |
| created_at | DateTime | Account creation date | No |

### service_requests
Service request tracking table.

| Column | Type | Description | HIPAA |
|--------|------|-------------|--------|
| request_id | String | Unique request identifier | No |
| user_id | String | Requesting user ID | Yes |
| service_type | String | Type of service requested | Yes |
| status | String | Request status | No |
| scheduled_date | DateTime | Service date/time | Yes |
| provider_id | String | Assigned provider ID | Yes |
| notes | Text | Service notes | Yes |
| created_at | DateTime | Request creation date | No |

### contractors
Service provider information.

| Column | Type | Description | HIPAA |
|--------|------|-------------|--------|
| contractor_id | String | Unique contractor identifier | No |
| user_id | String | Reference to user account | Yes |
| specializations | Array | Service specializations | No |
| certifications | Array | Professional certifications | Yes |
| availability | Object | Service availability schedule | No |
| background_check | Boolean | Background check status | Yes |
| rating | Number | Provider rating (1-5) | No |

### hour_balances
Employee hour balance tracking.

| Column | Type | Description | HIPAA |
|--------|------|-------------|--------|
| balance_id | String | Unique balance identifier | No |
| user_id | String | Employee user ID | Yes |
| org_id | String | Organization ID | No |
| total_hours | Number | Total allocated hours | No |
| used_hours | Number | Hours already used | No |
| remaining_hours | Number | Hours remaining | No |
| renewal_date | DateTime | Next renewal date | No |

---

## HIPAA Compliance Notes

- All columns marked "Yes" in HIPAA column contain PHI
- Use encrypted text data type for PHI columns
- Enable PII/ePHI Validator for all PHI columns
- Implement proper access controls and audit logging

---

*Schema documentation will be updated as development progresses*
