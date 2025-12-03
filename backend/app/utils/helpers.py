"""
Generic utility helpers.
"""

import secrets
import string
import time
from typing import Set


# Characters used for lobby codes (uppercase alphanumeric, excluding confusing chars)
LOBBY_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # No I, O, 0, 1
LOBBY_CODE_LENGTH = 6


def generate_lobby_code(length: int = LOBBY_CODE_LENGTH) -> str:
    """
    Generate a random alphanumeric lobby code.
    
    Uses cryptographically secure random selection.
    Excludes confusing characters (I, O, 0, 1).
    
    Args:
        length: Code length (default 6)
        
    Returns:
        Uppercase alphanumeric code
    """
    return "".join(secrets.choice(LOBBY_CODE_CHARS) for _ in range(length))


def generate_unique_lobby_code(
    existing_codes: Set[str],
    length: int = LOBBY_CODE_LENGTH,
    max_attempts: int = 100,
) -> str:
    """
    Generate a lobby code that doesn't exist in the given set.
    
    Args:
        existing_codes: Set of codes already in use
        length: Code length
        max_attempts: Max generation attempts before raising
        
    Returns:
        Unique lobby code
        
    Raises:
        RuntimeError: If unable to generate unique code
    """
    for _ in range(max_attempts):
        code = generate_lobby_code(length)
        if code not in existing_codes:
            return code
    raise RuntimeError(f"Failed to generate unique code after {max_attempts} attempts")


def get_timestamp_ms() -> int:
    """
    Get current timestamp in milliseconds.
    
    Returns:
        Unix timestamp in milliseconds
    """
    return int(time.time() * 1000)


def get_timestamp_seconds() -> int:
    """
    Get current timestamp in seconds.
    
    Returns:
        Unix timestamp in seconds
    """
    return int(time.time())


def is_valid_lobby_code(code: str) -> bool:
    """
    Validate lobby code format.
    
    Args:
        code: Code to validate
        
    Returns:
        True if valid format, False otherwise
    """
    if not code or len(code) != LOBBY_CODE_LENGTH:
        return False
    return all(c in LOBBY_CODE_CHARS for c in code.upper())
