"""Passive website security scanner engine.

Performs 13 safe, non-intrusive security checks:
1. HTTPS availability
2. SSL certificate validity
3. SSL certificate expiration
4. Strict-Transport-Security (HSTS)
5. Content-Security-Policy (CSP)
6. X-Frame-Options
7. X-Content-Type-Options
8. Referrer-Policy
9. Permissions-Policy
10. Secure cookie flag
11. HttpOnly cookie flag
12. SameSite cookie attribute
13. Server information disclosure

Includes SSRF protection, strict timeouts, safe redirect hops, and raw wire header telemetry.
"""

import asyncio
import socket
import ssl
import time
from datetime import datetime, timezone
from urllib.parse import urlparse, urljoin
from typing import Dict, List, Any, Optional, Tuple

import httpx

from app.scanner.validator import validate_url, ValidationError
from app.scanner.scoring import compute_scan_score, DISCLAIMER

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) SecureScan/1.0 (Passive Security Assessment)"


def _parse_cert_date(date_str: str) -> Optional[datetime]:
    """Parse SSL certificate timestamp string."""
    for fmt in ("%b %d %H:%M:%S %Y %Z", "%b  %d %H:%M:%S %Y %Z", "%Y%m%d%H%M%SZ"):
        try:
            return datetime.strptime(date_str, fmt).replace(tzinfo=timezone.utc)
        except (ValueError, TypeError):
            continue
    return None


async def inspect_ssl_tls(hostname: str, port: int = 443) -> Dict[str, Any]:
    """Perform non-intrusive SSL/TLS handshake and certificate inspection."""
    loop = asyncio.get_running_loop()

    def _sync_ssl_probe():
        ctx = ssl.create_default_context()
        ctx.check_hostname = True
        ctx.verify_mode = ssl.CERT_REQUIRED

        try:
            with socket.create_connection((hostname, port), timeout=6.0) as sock:
                with ctx.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert = ssock.getpeercert()
                    cipher = ssock.cipher()
                    version = ssock.version()
                    return {
                        "success": True,
                        "version": version,
                        "cipher": cipher,
                        "cert": cert,
                        "error": None,
                    }
        except ssl.SSLCertVerificationError as e:
            return {
                "success": False,
                "version": None,
                "cipher": None,
                "cert": None,
                "error": f"Certificate verification failed: {e.verify_message}",
                "untrusted": True,
            }
        except ssl.SSLError as e:
            return {
                "success": False,
                "version": None,
                "cipher": None,
                "cert": None,
                "error": f"SSL Handshake Error: {str(e)}",
            }
        except Exception as e:
            return {
                "success": False,
                "version": None,
                "cipher": None,
                "cert": None,
                "error": f"Connection Error: {str(e)}",
            }

    return await loop.run_in_executor(None, _sync_ssl_probe)


async def execute_passive_scan(target_url: str) -> Dict[str, Any]:
    """Execute all 13 passive security checks for the given target URL."""
    start_time = time.time()
    findings: List[Dict[str, Any]] = []

    # 1. Validate URL & Enforce SSRF Protections
    normalized_url, hostname = validate_url(target_url)

    # 2. Inspect SSL/TLS
    ssl_result = await inspect_ssl_tls(hostname)

    # Check 1: HTTPS Availability
    if ssl_result["success"]:
        findings.append({
            "check_id": "https_availability",
            "category": "tls_https",
            "title": "HTTPS Availability & Protocol Support",
            "severity": "pass",
            "points_earned": 10,
            "points_possible": 10,
            "description": f"Target accepts encrypted HTTPS connections using {ssl_result.get('version', 'TLS')}.",
            "details": f"Negotiated Protocol: {ssl_result.get('version')} | Cipher Suite: {ssl_result.get('cipher', [None])[0]}",
            "recommendation": "Maintain TLS 1.2 and TLS 1.3 encryption with modern forward-secrecy cipher suites.",
        })
    else:
        err_msg = ssl_result.get("error", "Unable to establish secure HTTPS connection")
        findings.append({
            "check_id": "https_availability",
            "category": "tls_https",
            "title": "HTTPS Availability & Protocol Support",
            "severity": "critical",
            "points_earned": 0,
            "points_possible": 10,
            "description": "The target website does not support valid HTTPS encryption or refused TLS handshake.",
            "details": f"Error: {err_msg}",
            "recommendation": "Enable TLS encryption on port 443 with a valid certificate issued by a recognized CA.",
        })

    # Check 2 & 3: SSL Certificate Validity & Expiration
    if ssl_result.get("cert"):
        cert = ssl_result["cert"]
        issuer_dict = dict(x[0] for x in cert.get("issuer", ()))
        subject_dict = dict(x[0] for x in cert.get("subject", ()))
        issuer_org = issuer_dict.get("organizationName", issuer_dict.get("commonName", "Unknown CA"))
        subject_cn = subject_dict.get("commonName", hostname)

        not_after_str = cert.get("notAfter", "")
        exp_date = _parse_cert_date(not_after_str)
        now = datetime.now(timezone.utc)

        days_remaining = (exp_date - now).days if exp_date else 0

        # Validity Check
        findings.append({
            "check_id": "ssl_certificate_validity",
            "category": "tls_https",
            "title": "SSL Certificate Chain & CA Trust",
            "severity": "pass",
            "points_earned": 10,
            "points_possible": 10,
            "description": f"Valid certificate issued to {subject_cn} by trusted CA '{issuer_org}'.",
            "details": f"Issuer: {issuer_org} | Subject: {subject_cn} | Serial: {cert.get('serialNumber', 'N/A')}",
            "recommendation": "Continue using certificates from accredited Certificate Authorities with CAA enforcement.",
        })

        # Expiration Check
        if days_remaining > 30:
            findings.append({
                "check_id": "ssl_certificate_expiration",
                "category": "tls_https",
                "title": "SSL Certificate Expiration Horizon",
                "severity": "pass",
                "points_earned": 5,
                "points_possible": 5,
                "description": f"Certificate is well within its active validity window ({days_remaining} days remaining).",
                "details": f"Valid Until: {not_after_str} ({days_remaining} days remaining)",
                "recommendation": "Configure automated certificate renewal alerts at the 30-day and 14-day mark.",
            })
        elif days_remaining > 7:
            findings.append({
                "check_id": "ssl_certificate_expiration",
                "category": "tls_https",
                "title": "SSL Certificate Expiring Soon",
                "severity": "medium",
                "points_earned": 2,
                "points_possible": 5,
                "description": f"Certificate expires in {days_remaining} days. Renewal required promptly.",
                "details": f"Expiration: {not_after_str}",
                "recommendation": "Renew the certificate immediately to avoid browser security warnings and service outage.",
            })
        else:
            findings.append({
                "check_id": "ssl_certificate_expiration",
                "category": "tls_https",
                "title": "SSL Certificate Near Imminent Expiration or Expired",
                "severity": "critical",
                "points_earned": 0,
                "points_possible": 5,
                "description": f"Certificate is expired or expires in under 7 days ({days_remaining} days remaining).",
                "details": f"Expiration: {not_after_str}",
                "recommendation": "Urgent: Renew the TLS certificate immediately to restore user trust and encryption.",
            })
    else:
        # Certificate not valid or missing
        findings.append({
            "check_id": "ssl_certificate_validity",
            "category": "tls_https",
            "title": "SSL Certificate Chain & CA Trust",
            "severity": "critical",
            "points_earned": 0,
            "points_possible": 10,
            "description": "Failed to verify SSL certificate chain against trusted Root CAs.",
            "details": ssl_result.get("error", "No valid certificate returned"),
            "recommendation": "Deploy a valid TLS certificate from an accredited Certificate Authority.",
        })
        findings.append({
            "check_id": "ssl_certificate_expiration",
            "category": "tls_https",
            "title": "SSL Certificate Expiration Horizon",
            "severity": "high",
            "points_earned": 0,
            "points_possible": 5,
            "description": "Unable to evaluate certificate expiration due to SSL handshake or validation failure.",
            "details": ssl_result.get("error", "Certificate unavailable"),
            "recommendation": "Ensure the target has an active and verifiable certificate.",
        })

    # 3. HTTP Request with SSRF-safe redirect following
    raw_headers: List[Dict[str, str]] = []
    response_status: Optional[int] = None
    response_protocol = "HTTP/1.1"
    cookies_list: List[Dict[str, Any]] = []
    current_url = normalized_url

    async with httpx.AsyncClient(
        timeout=httpx.Timeout(connect=5.0, read=10.0, write=5.0, pool=10.0),
        headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml,*/*"},
        verify=False,  # Allow passive header inspection even if cert has warnings
    ) as client:
        # Safe manual redirect following to inspect each hop against SSRF
        max_redirects = 5
        hops = 0
        final_response: Optional[httpx.Response] = None

        while hops < max_redirects:
            try:
                res = await client.get(current_url)
                final_response = res
                response_status = res.status_code
                response_protocol = f"HTTP/{res.http_version}"

                # Capture cookies set on this hop
                for header_name, header_val in res.headers.raw:
                    if header_name.decode("latin1").lower() == "set-cookie":
                        cookies_list.append({
                            "raw": header_val.decode("latin1", errors="replace"),
                            "url": current_url,
                        })

                # Check redirect
                if res.is_redirect and "location" in res.headers:
                    redirect_location = res.headers["location"]
                    next_url = urljoin(current_url, redirect_location)
                    # Re-validate redirect target for SSRF!
                    next_url_clean, next_host = validate_url(next_url)
                    current_url = next_url_clean
                    hops += 1
                else:
                    break
            except ValidationError as ve:
                findings.append({
                    "check_id": "redirect_ssrf_blocked",
                    "category": "security_headers",
                    "title": "Insecure Redirect Destination Blocked",
                    "severity": "critical",
                    "points_earned": 0,
                    "points_possible": 0,
                    "description": f"The website redirected to a restricted internal endpoint or invalid protocol: {str(ve)}",
                    "details": f"Attempted destination: {current_url}",
                    "recommendation": "Prevent open redirect vulnerabilities and do not redirect users to internal resources.",
                })
                break
            except Exception as e:
                break

        if final_response is not None:
            # Collect raw headers for display in Wire Protocol Inspector
            for k, v in final_response.headers.items():
                raw_headers.append({"name": k, "value": v})

            resp_headers = {k.lower(): v for k, v in final_response.headers.items()}
        else:
            resp_headers = {}

    # Check 4: Strict-Transport-Security (HSTS)
    hsts = resp_headers.get("strict-transport-security")
    if hsts:
        has_subdomains = "includesubdomains" in hsts.lower()
        has_preload = "preload" in hsts.lower()

        # Check max-age
        max_age_val = 0
        for part in hsts.split(";"):
            part = part.strip().lower()
            if part.startswith("max-age="):
                try:
                    max_age_val = int(part.split("=")[1])
                except (ValueError, IndexError):
                    pass

        if max_age_val >= 31536000 and has_subdomains and has_preload:
            findings.append({
                "check_id": "hsts_header",
                "category": "security_headers",
                "title": "Strict-Transport-Security (HSTS) Fully Hardened",
                "severity": "pass",
                "points_earned": 10,
                "points_possible": 10,
                "description": "Strict HSTS policy enforced with high max-age (>= 1 year), includeSubDomains, and preload flags.",
                "details": f"strict-transport-security: {hsts}",
                "recommendation": "Maintain HSTS preload status on hstspreload.org.",
            })
        elif max_age_val >= 15768000:
            findings.append({
                "check_id": "hsts_header",
                "category": "security_headers",
                "title": "Strict-Transport-Security (HSTS) Present",
                "severity": "pass",
                "points_earned": 8,
                "points_possible": 10,
                "description": "HSTS header is present with satisfactory duration, but lacks includeSubDomains or preload.",
                "details": f"strict-transport-security: {hsts}",
                "recommendation": "Add 'includeSubDomains' and 'preload' directives to qualify for browser preload list.",
            })
        else:
            findings.append({
                "check_id": "hsts_header",
                "category": "security_headers",
                "title": "HSTS Header Has Low max-age",
                "severity": "medium",
                "points_earned": 5,
                "points_possible": 10,
                "description": f"HSTS is present but max-age is set to only {max_age_val} seconds (< 6 months).",
                "details": f"strict-transport-security: {hsts}",
                "recommendation": "Increase max-age to at least 31536000 (1 year): 'max-age=31536000; includeSubDomains; preload'.",
            })
    else:
        findings.append({
            "check_id": "hsts_header",
            "category": "security_headers",
            "title": "Missing Strict-Transport-Security (HSTS) Header",
            "severity": "high",
            "points_earned": 0,
            "points_possible": 10,
            "description": "The server does not transmit an HSTS header, leaving users vulnerable to SSL-stripping and downgrade attacks.",
            "details": "Header 'Strict-Transport-Security' was not returned by the server.",
            "recommendation": "Configure Strict-Transport-Security header: 'Strict-Transport-Security: max-age=31536000; includeSubDomains'.",
        })

    # Check 5: Content-Security-Policy (CSP)
    csp = resp_headers.get("content-security-policy")
    if csp:
        csp_lower = csp.lower()
        is_unsafe = "'unsafe-inline'" in csp_lower or "'unsafe-eval'" in csp_lower or "script-src *" in csp_lower
        if is_unsafe:
            findings.append({
                "check_id": "csp_header",
                "category": "security_headers",
                "title": "Content-Security-Policy Contains Unsafe Directives",
                "severity": "medium",
                "points_earned": 5,
                "points_possible": 10,
                "description": "CSP header is present but specifies 'unsafe-inline', 'unsafe-eval', or wildcard origins, weakening XSS mitigation.",
                "details": f"content-security-policy: {csp[:200]}...",
                "recommendation": "Refactor inline scripts to use cryptographic nonces or SHA hashes, and remove 'unsafe-inline'.",
            })
        else:
            findings.append({
                "check_id": "csp_header",
                "category": "security_headers",
                "title": "Content-Security-Policy (CSP) Enforced",
                "severity": "pass",
                "points_earned": 10,
                "points_possible": 10,
                "description": "A robust Content-Security-Policy was detected without dangerous inline script allowances.",
                "details": f"content-security-policy: {csp[:200]}...",
                "recommendation": "Periodically audit CSP rules with report-uri / report-to telemetry.",
            })
    else:
        findings.append({
            "check_id": "csp_header",
            "category": "security_headers",
            "title": "Missing Content-Security-Policy (CSP) Header",
            "severity": "high",
            "points_earned": 0,
            "points_possible": 10,
            "description": "No Content-Security-Policy header was returned. The application is more susceptible to Cross-Site Scripting (XSS) and data injection.",
            "details": "Header 'Content-Security-Policy' was not found.",
            "recommendation": "Define a Content-Security-Policy restricting object-src, script-src, and default-src origins.",
        })

    # Check 6: X-Frame-Options
    xfo = resp_headers.get("x-frame-options")
    frame_ancestors_in_csp = csp and "frame-ancestors" in csp.lower()

    if xfo and xfo.upper() in ("DENY", "SAMEORIGIN"):
        findings.append({
            "check_id": "x_frame_options",
            "category": "security_headers",
            "title": "X-Frame-Options Clickjacking Defense",
            "severity": "pass",
            "points_earned": 5,
            "points_possible": 5,
            "description": f"X-Frame-Options is properly configured with '{xfo.upper()}', preventing unauthorized framing.",
            "details": f"x-frame-options: {xfo}",
            "recommendation": "Maintain X-Frame-Options: DENY or combine with CSP frame-ancestors 'none'.",
        })
    elif frame_ancestors_in_csp:
        findings.append({
            "check_id": "x_frame_options",
            "category": "security_headers",
            "title": "Clickjacking Defense via CSP frame-ancestors",
            "severity": "pass",
            "points_earned": 5,
            "points_possible": 5,
            "description": "Framing restrictions are enforced modernly via Content-Security-Policy 'frame-ancestors'.",
            "details": "CSP frame-ancestors directive active.",
            "recommendation": "For legacy browser compatibility, consider pairing with X-Frame-Options: SAMEORIGIN.",
        })
    else:
        findings.append({
            "check_id": "x_frame_options",
            "category": "security_headers",
            "title": "Missing X-Frame-Options Header",
            "severity": "medium",
            "points_earned": 0,
            "points_possible": 5,
            "description": "Website does not restrict framing via X-Frame-Options or CSP frame-ancestors, exposing users to UI Redress (Clickjacking) attacks.",
            "details": "Header 'X-Frame-Options' was not returned.",
            "recommendation": "Add 'X-Frame-Options: DENY' or 'X-Frame-Options: SAMEORIGIN' to all HTTP responses.",
        })

    # Check 7: X-Content-Type-Options
    xcto = resp_headers.get("x-content-type-options")
    if xcto and "nosniff" in xcto.lower():
        findings.append({
            "check_id": "x_content_type_options",
            "category": "security_headers",
            "title": "X-Content-Type-Options (MIME Sniffing Protection)",
            "severity": "pass",
            "points_earned": 5,
            "points_possible": 5,
            "description": "'nosniff' directive active, instructing browsers to strictly adhere to declared MIME types.",
            "details": f"x-content-type-options: {xcto}",
            "recommendation": "Maintain 'X-Content-Type-Options: nosniff' across all static and dynamic assets.",
        })
    else:
        findings.append({
            "check_id": "x_content_type_options",
            "category": "security_headers",
            "title": "Missing X-Content-Type-Options Header",
            "severity": "low",
            "points_earned": 0,
            "points_possible": 5,
            "description": "Missing 'nosniff' directive allows older browsers to sniff MIME types, potentially treating benign uploads as executable scripts.",
            "details": "Header 'X-Content-Type-Options' was not detected.",
            "recommendation": "Add 'X-Content-Type-Options: nosniff' header to all server responses.",
        })

    # Check 8: Referrer-Policy
    referrer = resp_headers.get("referrer-policy")
    safe_referrer_values = ("no-referrer", "strict-origin-when-cross-origin", "strict-origin", "same-origin")
    if referrer and any(v in referrer.lower() for v in safe_referrer_values):
        findings.append({
            "check_id": "referrer_policy",
            "category": "security_headers",
            "title": "Referrer-Policy Privacy Controls",
            "severity": "pass",
            "points_earned": 5,
            "points_possible": 5,
            "description": f"Enforces safe Referrer-Policy ('{referrer}'), preventing leakage of sensitive URL paths to third parties.",
            "details": f"referrer-policy: {referrer}",
            "recommendation": "Keep Referrer-Policy set to 'strict-origin-when-cross-origin' or 'no-referrer'.",
        })
    else:
        findings.append({
            "check_id": "referrer_policy",
            "category": "security_headers",
            "title": "Missing or Unsafe Referrer-Policy Header",
            "severity": "low",
            "points_earned": 0,
            "points_possible": 5,
            "description": "Absence of a restrictive Referrer-Policy allows full URL parameters (potentially containing tokens or IDs) to leak in Referer headers.",
            "details": f"Referrer-Policy: {referrer if referrer else 'Not Specified'}",
            "recommendation": "Set 'Referrer-Policy: strict-origin-when-cross-origin' on all endpoints.",
        })

    # Check 9: Permissions-Policy
    permissions = resp_headers.get("permissions-policy") or resp_headers.get("feature-policy")
    if permissions:
        findings.append({
            "check_id": "permissions_policy",
            "category": "security_headers",
            "title": "Permissions-Policy Hardware Controls",
            "severity": "pass",
            "points_earned": 5,
            "points_possible": 5,
            "description": "Permissions-Policy is declared, disabling or restricting browser APIs like camera, microphone, and geolocation.",
            "details": f"permissions-policy: {permissions[:120]}...",
            "recommendation": "Regularly review enabled browser hardware capabilities.",
        })
    else:
        findings.append({
            "check_id": "permissions_policy",
            "category": "security_headers",
            "title": "Missing Permissions-Policy Header",
            "severity": "low",
            "points_earned": 0,
            "points_possible": 5,
            "description": "Permissions-Policy (formerly Feature-Policy) is not defined, leaving browser device capabilities uncurated.",
            "details": "Header 'Permissions-Policy' was not found.",
            "recommendation": "Configure 'Permissions-Policy: camera=(), microphone=(), geolocation=()' to restrict unused client features.",
        })

    # Checks 10, 11, 12: Cookie Security (Secure, HttpOnly, SameSite)
    if not cookies_list:
        # If no cookies are set, that's completely safe (no vulnerable session cookies)
        findings.append({
            "check_id": "cookie_secure_flag",
            "category": "cookie_security",
            "title": "Cookie Secure Flag Configuration",
            "severity": "pass",
            "points_earned": 5,
            "points_possible": 5,
            "description": "No cookies were transmitted in response headers, eliminating cookie interception vectors.",
            "details": "No Set-Cookie headers detected.",
            "recommendation": "Ensure future cookies explicitly use the 'Secure' attribute.",
        })
        findings.append({
            "check_id": "cookie_httponly_flag",
            "category": "cookie_security",
            "title": "Cookie HttpOnly Protection",
            "severity": "pass",
            "points_earned": 5,
            "points_possible": 5,
            "description": "No cookies detected; no client-side DOM script access risks.",
            "details": "No Set-Cookie headers detected.",
            "recommendation": "Ensure session identifiers use the 'HttpOnly' flag.",
        })
        findings.append({
            "check_id": "cookie_samesite_attribute",
            "category": "cookie_security",
            "title": "Cookie SameSite CSRF Mitigations",
            "severity": "pass",
            "points_earned": 5,
            "points_possible": 5,
            "description": "No cookies detected requiring SameSite restriction.",
            "details": "No Set-Cookie headers detected.",
            "recommendation": "Set 'SameSite=Lax' or 'SameSite=Strict' on state-altering session cookies.",
        })
    else:
        missing_secure = []
        missing_httponly = []
        missing_samesite = []

        for c in cookies_list:
            raw_c = c["raw"]
            c_name = raw_c.split("=")[0].strip() if "=" in raw_c else "cookie"
            parts = [p.strip().lower() for p in raw_c.split(";")]

            if "secure" not in parts:
                missing_secure.append(c_name)
            if "httponly" not in parts:
                missing_httponly.append(c_name)
            if not any(p.startswith("samesite=") for p in parts):
                missing_samesite.append(c_name)

        # Check 10: Secure Flag
        if not missing_secure:
            findings.append({
                "check_id": "cookie_secure_flag",
                "category": "cookie_security",
                "title": "Cookie Secure Flag Enforced",
                "severity": "pass",
                "points_earned": 5,
                "points_possible": 5,
                "description": "All observed Set-Cookie directives enforce the 'Secure' attribute, guaranteeing TLS-only transmission.",
                "details": f"Audited {len(cookies_list)} cookie(s). All have Secure attribute.",
                "recommendation": "Maintain Secure attribute on all cookies.",
            })
        else:
            findings.append({
                "check_id": "cookie_secure_flag",
                "category": "cookie_security",
                "title": "Insecure Cookies Transmitted Without Secure Flag",
                "severity": "medium",
                "points_earned": 0,
                "points_possible": 5,
                "description": f"Cookie(s) {', '.join(missing_secure[:3])} lack the 'Secure' flag, allowing cleartext transmission over unencrypted HTTP.",
                "details": f"Affected cookie(s): {', '.join(missing_secure)}",
                "recommendation": "Append '; Secure' to all Set-Cookie directives.",
            })

        # Check 11: HttpOnly Flag
        if not missing_httponly:
            findings.append({
                "check_id": "cookie_httponly_flag",
                "category": "cookie_security",
                "title": "Cookie HttpOnly Attribute Enforced",
                "severity": "pass",
                "points_earned": 5,
                "points_possible": 5,
                "description": "Cookies specify 'HttpOnly', mitigating credential exfiltration in the event of XSS vulnerabilities.",
                "details": f"Audited {len(cookies_list)} cookie(s). All have HttpOnly flag.",
                "recommendation": "Continue using HttpOnly on authentication tokens.",
            })
        else:
            findings.append({
                "check_id": "cookie_httponly_flag",
                "category": "cookie_security",
                "title": "Cookies Accessible to JavaScript (Missing HttpOnly)",
                "severity": "medium",
                "points_earned": 0,
                "points_possible": 5,
                "description": f"Cookie(s) {', '.join(missing_httponly[:3])} lack 'HttpOnly' and can be read by JavaScript via document.cookie.",
                "details": f"Affected cookie(s): {', '.join(missing_httponly)}",
                "recommendation": "Append '; HttpOnly' to all sensitive authentication and session cookies.",
            })

        # Check 12: SameSite Attribute
        if not missing_samesite:
            findings.append({
                "check_id": "cookie_samesite_attribute",
                "category": "cookie_security",
                "title": "Cookie SameSite CSRF Protections",
                "severity": "pass",
                "points_earned": 5,
                "points_possible": 5,
                "description": "Cookies enforce SameSite=Lax or SameSite=Strict, preventing Cross-Site Request Forgery (CSRF).",
                "details": f"Audited {len(cookies_list)} cookie(s).",
                "recommendation": "Use SameSite=Strict for high-privilege operations and SameSite=Lax for standard web sessions.",
            })
        else:
            findings.append({
                "check_id": "cookie_samesite_attribute",
                "category": "cookie_security",
                "title": "Missing SameSite Attribute on Cookies",
                "severity": "medium",
                "points_earned": 0,
                "points_possible": 5,
                "description": f"Cookie(s) {', '.join(missing_samesite[:3])} do not declare SameSite, allowing cross-site origin inclusion.",
                "details": f"Affected cookie(s): {', '.join(missing_samesite)}",
                "recommendation": "Add '; SameSite=Lax' to avoid unauthorized cross-site requests.",
            })

    # Check 13: Server Information Disclosure
    server_header = resp_headers.get("server", "")
    x_powered_by = resp_headers.get("x-powered-by", "")
    x_aspnet = resp_headers.get("x-aspnet-version", "")

    has_version_leak = any(char.isdigit() for char in server_header)
    has_powered_by = bool(x_powered_by or x_aspnet)

    if not has_powered_by and (not server_header or not has_version_leak):
        findings.append({
            "check_id": "server_information_disclosure",
            "category": "information_disclosure",
            "title": "Server Information Disclosure Sanitized",
            "severity": "pass",
            "points_earned": 15,
            "points_possible": 15,
            "description": "Server headers do not disclose sensitive internal software versions or technology banners.",
            "details": f"Server: {server_header or 'Suppressed'} | X-Powered-By: None",
            "recommendation": "Keep server banner masking enabled in reverse proxies (e.g., Cloudflare, NGINX).",
        })
    elif has_powered_by:
        leak_banner = x_powered_by or x_aspnet
        findings.append({
            "check_id": "server_information_disclosure",
            "category": "information_disclosure",
            "title": "Backend Framework Exposure via X-Powered-By",
            "severity": "low",
            "points_earned": 5,
            "points_possible": 15,
            "description": f"Technology banner '{leak_banner}' is publicly exposed, helping attackers tailor targeted CVE exploits.",
            "details": f"X-Powered-By: {leak_banner}",
            "recommendation": "Disable the X-Powered-By header in your application framework configuration.",
        })
    else:
        findings.append({
            "check_id": "server_information_disclosure",
            "category": "information_disclosure",
            "title": "Detailed Server Version Disclosure",
            "severity": "low",
            "points_earned": 8,
            "points_possible": 15,
            "description": f"Server header reveals specific software and patch versions: '{server_header}'.",
            "details": f"Server: {server_header}",
            "recommendation": "Configure ServerTokens Prod (Apache) or server_tokens off (NGINX) to hide version numbers.",
        })

    # Calculate overall score, grade, and category breakdown
    total_score, grade, category_scores = compute_scan_score(findings)
    duration_ms = int((time.time() - start_time) * 1000)

    # Sort findings: Critical -> High -> Medium -> Low -> Info -> Pass
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4, "pass": 5}
    findings.sort(key=lambda x: severity_order.get(x["severity"], 99))

    return {
        "target_url": normalized_url,
        "hostname": hostname,
        "score": total_score,
        "grade": grade,
        "category_scores": category_scores,
        "findings": findings,
        "findings_count": sum(1 for f in findings if f["severity"] != "pass"),
        "raw_headers": raw_headers,
        "response_status": response_status,
        "response_protocol": response_protocol,
        "duration_ms": duration_ms,
        "disclaimer": DISCLAIMER,
    }

