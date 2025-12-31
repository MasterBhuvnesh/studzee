# Security Policy

## Supported Versions

| Service      | Version | Supported          |
| ------------ | ------- | ------------------ |
| BACKEND      | latest  | :white_check_mark: |
| NOTIFICATION | latest  | :white_check_mark: |
| MOBILE       | latest  | :white_check_mark: |
| WEBSITE      | latest  | :white_check_mark: |
| DESKTOP      | latest  | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously at Studzee. If you discover a security vulnerability, please report it responsibly.

### How to Report

1. **Do NOT** create a public GitHub issue for security vulnerabilities
2. Email your findings to the project maintainers directly
3. Include detailed steps to reproduce the vulnerability
4. Provide any relevant proof-of-concept code

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)

### Response Timeline

| Action                     | Timeline   |
| -------------------------- | ---------- |
| Acknowledgment of report   | 48 hours   |
| Initial assessment         | 7 days     |
| Status update              | 14 days    |
| Resolution (if applicable) | 30-90 days |

### Scope

The following are in scope for security reports:

- Authentication and authorization flaws
- Data exposure vulnerabilities
- Injection attacks (SQL, NoSQL, Command injection)
- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- Server-side request forgery (SSRF)
- API security issues
- Sensitive data in logs or error messages

### Out of Scope

- Social engineering attacks
- Physical attacks
- Denial of service attacks
- Issues in third-party dependencies (report to the respective maintainers)
- Vulnerabilities requiring physical access to a user's device

## Security Best Practices

### For Contributors

- Never commit secrets, API keys, or credentials
- Use environment variables for sensitive configuration
- Follow the principle of least privilege
- Keep dependencies up to date
- Run security linters before submitting PRs

### Authentication

- All protected endpoints use Clerk for enterprise-grade authentication
- JWT tokens are validated on every request
- Role-based access control is enforced for admin operations

### Data Protection

- All data in transit is encrypted via HTTPS
- Sensitive data is never logged
- User credentials are managed by Clerk (not stored locally)

## Acknowledgments

We appreciate the security research community's efforts in helping keep Studzee secure. Reporters of valid vulnerabilities will be acknowledged (with permission) in our security acknowledgments.
