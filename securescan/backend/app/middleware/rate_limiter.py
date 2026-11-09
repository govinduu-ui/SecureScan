from slowapi import Limiter
from slowapi.util import get_remote_address

# Rate limiter instance using remote client IP address
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["120/minute"],
    storage_uri="memory://",
)

