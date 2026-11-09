# SecureScan – Production Website Security Assessment Platform

SecureScan is a full-stack cybersecurity posture assessment platform designed to passively audit web applications and public network endpoints. Built with a high-density, accessible SecOps dashboard inspired by enterprise observability systems (such as Datadog, Cloudflare, and Snyk), it audits TLS certificates, HTTP security headers, cookie flags, and server technology leakages without active or disruptive exploitation.

> **Security & Ethical Disclaimer:** SecureScan performs passive, non-intrusive telemetry analysis based strictly on public network responses and TLS handshakes. It does not execute active exploits, SQL injection, port scans, or denial-of-service tests, and is designed as an automated hygiene assessment tool rather than a replacement for manual penetration testing.

---

## Resume Highlights & Portfolio Summary

*You can include this project on your resume under **Projects** or **Technical Experience**:*

**SecureScan – Automated Web Security Assessment Platform** | *React, Vite, Tailwind CSS, Python, FastAPI, MongoDB Atlas, Docker*
- Engineered an end-to-end web security assessment engine executing 13 non-intrusive diagnostic checks (TLS 1.2/1.3 handshakes, SAN validation, HSTS, CSP, X-Frame-Options, cookie flags) in under 4 seconds per target.
- Implemented enterprise-grade SSRF mitigations: enforced RFC 1918 private subnet blocking, cloud metadata IP filters (AWS/GCP/Azure `169.254.169.254`), and strict per-hop redirect validation using Python `ipaddress` and `dnspython`.
- Designed an asynchronous backend with FastAPI and HTTPX using non-blocking socket wrappers (`asyncio.run_in_executor`) for SSL certificate extraction and a transparent 100-point scoring algorithm.
- Developed an executive PDF reporting service utilizing ReportLab, generating formatted, compliance-ready vulnerability summaries with remediation code snippets (Nginx, Apache, Cloudflare).
- Built a responsive React 18 frontend with Recharts posture trajectory charts, concentric SVG score gauges, accessible WAI-ARIA 1.2 customization controls, and JWT authentication with bcrypt password hashing.
- Maintained a clean test suite (Pytest) with 100% pass rate across URL validation, SSRF filtering, scoring math, and report generation.

---

## System Architecture

```
                                 [ Client Browser ]
                                          │
                     HTTPS / WSS          │ React 18 + Vite SPA
                                          ▼
                         ┌─────────────────────────────────┐
                         │   SecureScan React Frontend     │
                         │   • Recharts Posture Dashboard  │
                         │   • Diagnostic Findings Matrix  │
                         │   • Accessible Theme Console    │
                         │   • Axios Bearer Interceptor    │
                         └────────────────┬────────────────┘
                                          │
                            REST API / Bearer JWT (JSON)
                                          │
                                          ▼
                         ┌─────────────────────────────────┐
                         │      FastAPI Backend Engine     │
                         │   • SlowAPI Token Bucket Limiter│
                         │   • Pydantic V2 Schemas         │
                         │   • Native Bcrypt + JWT Auth    │
                         └──────────────┬──┬───────────────┘
                                        │  │
                ┌───────────────────────┘  └──────────────────────┐
                │ Async Scanner Pipeline                          │ Async Database Pool
                ▼                                                 ▼
┌───────────────────────────────┐                  ┌──────────────────────────────┐
│  Multi-Stage Security Engine  │                  │   MongoDB Atlas Cloud Pool   │
│  1. SSRF & DNS Resolver       │                  │   • users (auth + clearance) │
│  2. TLS Socket Handshake      │                  │   • scans (scores + timing)  │
│  3. HTTPX Header Analysis     │                  │   • findings (13 checks)     │
│  4. Cookie Flag Audit         │                  │   • reports (metadata)       │
│  5. Score Calculation (0-100) │                  └──────────────┬───────────────┘
└───────────────┬───────────────┘                                 │
                │                                                 │
                ▼                                                 ▼
┌───────────────────────────────┐                  ┌──────────────────────────────┐
│  ReportLab PDF Engine         │                  │   Local Storage / Cache      │
│  • CISO Executive Brief       │─────────────────►│   • reports_storage/*.pdf    │
│  • Visual Score Badges        │                  │   • Encrypted token storage  │
└───────────────────────────────┘                  └──────────────────────────────┘
```

---

## Technical Stack & Engineering Decisions

### Frontend Architecture
- **Framework:** React 18 with Vite for sub-second hot-module reloading and optimized Rollup vendor chunking (`vendor-react`, `vendor-charts`, `vendor-icons`).
- **Styling & Design System:** Tailwind CSS configured with a restrained Obsidian dark surface system (`#090D16`, `#0D1322`, `#1E293B`, `#00E5FF`). Focus states and contrast ratios satisfy WCAG 2.1 AA accessibility standards.
- **Routing & State:** React Router v6 with `ProtectedRoute` guards and dedicated `AuthContext` and `CustomizationContext` providers.
- **Data Visualization:** Recharts (30-day posture trajectories and sparklines) alongside mathematical concentric SVG radial score gauges.
- **Network Client:** Axios instance with automatic bearer token injection and response interceptors handling 401 token invalidation.

### Backend Architecture
- **API Framework:** Python 3.11+ with FastAPI, utilizing asynchronous path operations and Pydantic V2 for strict request/response data contracts.
- **Authentication & Security:** JWT tokens signed with HMAC-SHA256, direct bcrypt hashing with 72-byte safe truncation, and SlowAPI IP-based rate limiting.
- **Asynchronous Scanner:**
  - Non-intrusive SSL socket wrapping via `ssl.create_default_context()` and `socket.create_connection()` executed in a thread pool (`loop.run_in_executor`) to prevent blocking the async event loop.
  - HTTPX client enforcing maximum redirect hops (up to 5), connection timeouts, and custom User-Agent headers.
- **SSRF Defense Layer:** Multi-layer subnet validation blocking loopbacks (`127.0.0.0/8`), private RFC 1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local IPs (`169.254.0.0/16`), IPv6 unique locals (`fc00::/7`, `fe80::/10`), and cloud metadata services.
- **Executive PDF Compiler:** ReportLab 4.0 generating branded PDF reports complete with scorecards, check tables, and remediation blueprints.
- **Database & Cloud Storage Layer:** Supabase PostgreSQL with JSONB audit schemas and Supabase Storage bucket for PDF reports, with alternative MongoDB Atlas driver support and zero-config local in-memory fallback (`mongomock-motor`).

---

## The 13 Passive Security Diagnostic Checks

| # | Diagnostic Check | Category | Max Pts | Security Impact & Verification Logic |
|---|---|---|---|---|
| 1 | **HTTPS Availability** | `tls_https` | 10 | Verifies availability of port 443 and successful TLS 1.2/1.3 protocol negotiation. |
| 2 | **SSL Certificate Validity** | `tls_https` | 10 | Validates peer certificate trust chain against system CAs and verifies hostname matches Subject Alternative Names (SAN). |
| 3 | **SSL Expiration Horizon** | `tls_https` | 5 | Computes remaining validity lifespan (>30 days = 5pts, 7–30 days = 2pts, <7 days = 0pts). |
| 4 | **Strict-Transport-Security** | `security_headers` | 10 | Confirms HSTS enforcement, evaluating `max-age >= 31536000` (1 year), `includeSubDomains`, and `preload`. |
| 5 | **Content-Security-Policy** | `security_headers` | 10 | Audits CSP directives for modern XSS defenses, penalizing dangerous `'unsafe-inline'` or `'unsafe-eval'` wildcards. |
| 6 | **X-Frame-Options** | `security_headers` | 5 | Checks for `DENY` or `SAMEORIGIN` to mitigate clickjacking and UI redress attacks. |
| 7 | **X-Content-Type-Options** | `security_headers` | 5 | Verifies `nosniff` header to protect browsers from executable MIME-type confusion attacks. |
| 8 | **Referrer-Policy** | `security_headers` | 5 | Validates strict referrer hygiene (e.g. `strict-origin-when-cross-origin`) to prevent sensitive token leakage in URLs. |
| 9 | **Permissions-Policy** | `security_headers` | 5 | Audits hardware sensor access delegation (camera, microphone, geolocation APIs). |
| 10 | **Secure Cookie Flag** | `cookie_security` | 5 | Confirms all session cookies mandate the `Secure` attribute for encrypted HTTPS transmission. |
| 11 | **HttpOnly Cookie Flag** | `cookie_security` | 5 | Ensures sensitive cookies cannot be accessed via client-side JavaScript (`document.cookie`), mitigating session hijacking via XSS. |
| 12 | **SameSite Cookie Attribute** | `cookie_security` | 5 | Evaluates `SameSite=Lax` or `SameSite=Strict` configuration to mitigate Cross-Site Request Forgery (CSRF). |
| 13 | **Information Disclosure** | `information_disclosure` | 15 | Detects version disclosure and server fingerprints in `Server`, `X-Powered-By`, and `X-AspNet-Version` headers. |

### Scoring & Grading Scale
The aggregate score is evaluated on a 100-point scale across 4 clamped categories:
$$\text{Total Score} = \min(25, \text{TLS}) + \min(45, \text{Headers}) + \min(15, \text{Cookies}) + \min(15, \text{Disclosure})$$

- **A+** : 95 – 100 (Hardened Enterprise Grade)
- **A** : 90 – 94 (Strong Security Baseline)
- **B+** : 85 – 89 (Good Hygiene, Minor Recommendations)
- **B** : 80 – 84 (Acceptable, Security Headers Incomplete)
- **C** : 70 – 79 (Moderate Risk, Missing CSP or HSTS)
- **D** : 60 – 69 (High Risk, Weak TLS or Cookie Protections)
- **F** : Below 60 (Critical Exposure, Insecure Protocol or Plaintext HTTP)

---

## REST API Specification

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new operator account | Public |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT bearer token | Public |
| `GET` | `/api/auth/me` | Fetch active operator identity & clearance tier | Bearer JWT |
| `POST` | `/api/scans` | Dispatch a target assessment | Bearer JWT |
| `GET` | `/api/scans` | Paginated history of completed scans | Bearer JWT |
| `GET` | `/api/scans/{scan_id}` | Retrieve comprehensive scan result and findings | Bearer JWT |
| `DELETE` | `/api/scans/{scan_id}` | Purge scan record, findings, and PDF artifacts | Bearer JWT |
| `GET` | `/api/scans/{scan_id}/findings` | Retrieve 13 checklist findings with remediation | Bearer JWT |
| `GET` | `/api/scans/{scan_id}/report` | Generate / retrieve executive audit report record | Bearer JWT |
| `GET` | `/api/reports` | List all historical compliance reports | Bearer JWT |
| `GET` | `/api/reports/{scan_id}/download` | Stream compiled ReportLab PDF file download | Bearer JWT |
| `GET` | `/api/analytics/dashboard` | Aggregated posture trajectory and KPI metrics | Bearer JWT |
| `GET` | `/api/health` | Service liveness probe | Public |

---

## Local Development & Quickstart

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1. Backend Service
```bash
cd securescan/backend

# Virtual environment setup
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
python -m uvicorn main:app --reload --port 8000
```
- API Base URL: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`

### 2. Frontend Application
```bash
cd securescan/frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
- Web Application: `http://localhost:3000`
- Demo Account: Click **"Autofill SecOps Demo Account"** (`lead@fintech-soc.internal`) on the login screen.

---

## Automated Test Suite

To run the Pytest test suite:
```bash
python -m pytest -o pythonpath=securescan/backend securescan/backend/app/tests -v
```
**Coverage includes:**
- URL scheme restrictions (`http://`, `https://`)
- SSRF prevention (private IPs, loopbacks, cloud metadata endpoints)
- DNS rebinding validation and redirect hop constraints
- Category score clamps and letter grade computations
- Bcrypt hash verification and JWT token lifecycles
- ReportLab PDF compilation and artifact generation

---

## Production Deployment Architecture

- **Frontend:** Hosted on **Vercel** connected to `securescan/frontend` root with automatic edge SSL.
- **Backend:** Deployed on **Render** (or AWS ECS/Railway) pointing to `securescan/backend` with Gunicorn/Uvicorn workers.
- **Database:** Managed **MongoDB Atlas** M0/M10 replica set with connection pooling and IP access lists.
