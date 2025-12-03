"""
Structured logging configuration.
Provides JSON-formatted logs for production and readable logs for development.
"""

import logging
import sys
from datetime import datetime
from typing import Any

import json

from app.core.config import get_settings


class JSONFormatter(logging.Formatter):
    """JSON log formatter for production environments."""

    def format(self, record: logging.LogRecord) -> str:
        log_data: dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Add extra fields
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        if hasattr(record, "user_id"):
            log_data["user_id"] = record.user_id
        if hasattr(record, "lobby_code"):
            log_data["lobby_code"] = record.lobby_code

        return json.dumps(log_data)


class DevFormatter(logging.Formatter):
    """Readable log formatter for development."""

    COLORS = {
        "DEBUG": "\033[36m",     # Cyan
        "INFO": "\033[32m",      # Green
        "WARNING": "\033[33m",   # Yellow
        "ERROR": "\033[31m",     # Red
        "CRITICAL": "\033[35m",  # Magenta
    }
    RESET = "\033[0m"

    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelname, self.RESET)
        timestamp = datetime.now().strftime("%H:%M:%S")
        
        # Build prefix with optional context
        prefix_parts = [f"{color}{record.levelname}{self.RESET}"]
        if hasattr(record, "request_id"):
            prefix_parts.append(f"[{record.request_id[:8]}]")
        
        prefix = " ".join(prefix_parts)
        return f"{timestamp} {prefix} {record.getMessage()}"


def setup_logging() -> logging.Logger:
    """
    Configure application logging.
    Uses JSON format in production, readable format in development.
    """
    settings = get_settings()
    
    # Create logger
    logger = logging.getLogger("app")
    logger.setLevel(logging.DEBUG if settings.DEBUG else logging.INFO)
    
    # Remove existing handlers
    logger.handlers.clear()
    
    # Create handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.DEBUG if settings.DEBUG else logging.INFO)
    
    # Set formatter based on environment
    if settings.DEBUG:
        handler.setFormatter(DevFormatter())
    else:
        handler.setFormatter(JSONFormatter())
    
    logger.addHandler(handler)
    
    # Prevent propagation to root logger
    logger.propagate = False
    
    return logger


def get_logger(name: str = "app") -> logging.Logger:
    """Get a logger instance with the given name."""
    return logging.getLogger(name)


# Initialize default logger
logger = setup_logging()
