"""URL validation, SSRF protection, and DNS resolution for the scanner."""

import ipaddress
import socket
from urllib.parse import urlparse
from typing import Tuple, List

import dns.resolver


# Cloud metadata endpoints to block
BLOCKED_HOSTNAMES = {
    "metadata.google.internal",
    "metadata.goog",
    "169.254.169.254",
    "metadata.azure.com",
}


class ValidationError(Exception):
    """Raised when URL validation fails."""
    pass


def _is_private_ip(ip_str: str) -> bool:
    """Check if an IP address is private, loopback, link-local, or reserved."""
    try:
        addr = ipaddress.ip_address(ip_str)
    except ValueError:
        return True  # If we can't parse it, block it

    # Block loopback
    if addr.is_loopback:
        return True

    # Block private ranges
    if addr.is_private:
        return True

    # Block link-local (includes 169.254.x.x for cloud metadata)
    if addr.is_link_local:
        return True

    # Block reserved
    if addr.is_reserved:
        return True

    # Block multicast
    if addr.is_multicast:
        return True

    # Block unspecified (0.0.0.0, ::)
    if addr.is_unspecified:
        return True

    # Additional IPv6 checks
    if isinstance(addr, ipaddress.IPv6Address):
        # Block fc00::/7 (unique local)
        if addr in ipaddress.ip_network("fc00::/7"):
            return True
        # Block fe80::/10 (link-local)
        if addr in ipaddress.ip_network("fe80::/10"):
            return True

    return False


def resolve_hostname(hostname: str) -> List[str]:
    """Resolve a hostname to its IP addresses using DNS.

    Uses native OS socket.getaddrinfo and socket.gethostbyname_ex first for reliable
    resolution across all Windows/Linux/macOS network adapters, with dnspython as a secondary resolver.

    Raises:
        ValidationError: If DNS resolution fails.
    """
    ips: List[str] = []

    # 1. Native OS getaddrinfo (resolves via system DNS stack on Windows/Linux)
    try:
        addr_info = socket.getaddrinfo(hostname, None, socket.AF_UNSPEC, socket.SOCK_STREAM)
        for item in addr_info:
            ip = item[4][0]
            if ip and ip not in ips:
                ips.append(ip)
    except Exception:
        pass

    # 2. Native OS gethostbyname_ex as additional fallback
    if not ips:
        try:
            _, _, host_ips = socket.gethostbyname_ex(hostname)
            for ip in host_ips:
                if ip and ip not in ips:
                    ips.append(ip)
        except Exception:
            pass

    if ips:
        return ips

    # 3. Secondary fallback via dnspython with explicit public nameservers
    try:
        resolver = dns.resolver.Resolver()
        resolver.nameservers = ["8.8.8.8", "1.1.1.1", "8.8.4.4", "1.0.0.1"]
        resolver.timeout = 5
        resolver.lifetime = 5

        # Try A records
        try:
            answers = resolver.resolve(hostname, "A")
            ips.extend([str(rdata) for rdata in answers])
        except Exception:
            pass

        # Try AAAA records
        try:
            answers = resolver.resolve(hostname, "AAAA")
            ips.extend([str(rdata) for rdata in answers])
        except Exception:
            pass

        if ips:
            return list(dict.fromkeys(ips))
    except Exception:
        pass

    if not ips:
        raise ValidationError(f"DNS resolution failed for '{hostname}'. Please check domain spelling and network connectivity.")

    return list(dict.fromkeys(ips))


def validate_url(url: str) -> Tuple[str, str]:
    """Validate a URL for safe scanning.

    Checks:
    - Protocol must be HTTP or HTTPS
    - Hostname must resolve via DNS
    - Resolved IPs must not be private/loopback/link-local
    - Hostname must not be a cloud metadata endpoint

    Args:
        url: The URL to validate.

    Returns:
        Tuple of (validated_url, hostname).

    Raises:
        ValidationError: If the URL fails any validation check.
    """
    clean_url = url.strip()

    # Normalize internal spaces (e.g. 'https:// www.example.com')
    if "://" in clean_url:
        scheme, rest = clean_url.split("://", 1)
        clean_url = f"{scheme.strip().lower()}://{rest.strip()}"
    elif not clean_url.startswith(("http://", "https://", "ftp://", "file://", "gopher://")):
        clean_url = f"https://{clean_url}"

    # Parse URL
    parsed = urlparse(clean_url)

    # Restrict protocols
    if parsed.scheme not in ("http", "https"):
        raise ValidationError(f"Unsupported protocol: {parsed.scheme}. Only HTTP and HTTPS are allowed.")

    hostname = parsed.hostname
    if not hostname:
        raise ValidationError("No hostname found in URL")

    # Strip port for hostname checks
    hostname_lower = hostname.lower()

    # Block cloud metadata endpoints
    if hostname_lower in BLOCKED_HOSTNAMES:
        raise ValidationError(f"Blocked hostname: {hostname}. Cloud metadata endpoints are not allowed.")

    # Check if hostname is a raw IP address
    try:
        ip = ipaddress.ip_address(hostname)
        if _is_private_ip(hostname):
            raise ValidationError(
                f"Blocked IP address: {hostname}. Private, loopback, and reserved IPs are not allowed."
            )
        return clean_url, hostname
    except ValueError:
        pass  # Not a raw IP, proceed with DNS resolution

    # Resolve DNS and check all IPs
    resolved_ips = resolve_hostname(hostname)
    for ip in resolved_ips:
        if _is_private_ip(ip):
            raise ValidationError(
                f"Domain {hostname} resolves to private/reserved IP {ip}. Scanning is not allowed."
            )

    return clean_url, hostname


def validate_redirect_url(url: str) -> bool:
    """Validate that a redirect destination is safe to follow.

    Returns True if the URL is safe, False otherwise.
    """
    try:
        validate_url(url)
        return True
    except ValidationError:
        return False
