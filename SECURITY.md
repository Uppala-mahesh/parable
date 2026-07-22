# Security Policy

## Supported Versions

The following versions of Parable are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security seriously at Parable. If you believe you've found a security vulnerability, please follow these steps:

### Do NOT

- **Do NOT** open a public issue
- **Do NOT** discuss the vulnerability in public forums (Discord, Twitter, etc.)
- **Do NOT** submit a pull request that fixes the vulnerability (this reveals the issue publicly)

### DO

1. **Email us directly** at security@parable.ai
2. **Include the following details:**
   - Description of the vulnerability
   - Steps to reproduce (if applicable)
   - Potential impact assessment
   - Suggested fix (if you have one)
   - Your contact information

### What to Expect

- **Acknowledgment** within 48 hours
- **Initial assessment** within 5 business days
- **Regular updates** on our progress
- **Credit** in our security advisory (if you wish)

## Security Measures

Parable implements the following security measures:

### Data Protection
- AES-256 encryption at rest for sensitive data
- TLS 1.3 for all data in transit
- Row-level encryption for financial and health data
- Raw data deletion after normalization

### Authentication & Authorization
- OAuth2 + JWT with short-lived tokens
- Role-based access control (RBAC)
- Multi-factor authentication support

### Infrastructure
- Regular security scanning (Snyk, Trivy)
- Automated dependency updates
- Network segmentation and VPC isolation
- DDoS protection via Cloudflare

### Compliance
- SOC 2 Type II (in progress)
- GDPR compliance
- CCPA compliance
- HIPAA readiness (enterprise tier)

## Security Headers

Parable implements the following security headers on all web responses:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## Responsible Disclosure

We follow responsible disclosure practices:

1. We validate and fix reported vulnerabilities
2. We release a patch before public disclosure
3. We credit the reporter (with their permission)
4. We publish a security advisory after the fix is deployed

## Security Champions

Our security team:
- security@parable.ai — General security inquiries
- Security issues are triaged by our engineering team within 48 hours

## Bug Bounty Program

Coming soon. We plan to launch a bug bounty program on HackerOne in Q3 2026.

---

*Last updated: 2026-07-21*
