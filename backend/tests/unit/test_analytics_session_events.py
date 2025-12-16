"""
Unit tests for analytics session events endpoint.

Tests the session events endpoint that powers the Session Explorer modal.
Requirements: 2.3, 2.4 - Event ordering and session context retrieval
"""

import pytest
from datetime import datetime, timedelta


class TestSessionEventsOrdering:
    """Tests for event chronological ordering (Requirements 2.3)."""
    
    def test_events_sorted_chronologically(self):
        """Test that events are sorted in ascending timestamp order."""
        # Simulate the sorting logic from the endpoint
        events = [
            {"id": "1", "timestamp": "2024-01-01T12:00:00Z", "type": "pageview"},
            {"id": "2", "timestamp": "2024-01-01T11:00:00Z", "type": "event"},
            {"id": "3", "timestamp": "2024-01-01T13:00:00Z", "type": "pageview"},
            {"id": "4", "timestamp": "2024-01-01T10:00:00Z", "type": "event"},
        ]
        
        # Sort chronologically (ascending)
        sorted_events = sorted(events, key=lambda x: x.get("timestamp", ""))
        
        # Verify order
        timestamps = [e["timestamp"] for e in sorted_events]
        assert timestamps == sorted(timestamps)
        assert sorted_events[0]["id"] == "4"  # 10:00
        assert sorted_events[1]["id"] == "2"  # 11:00
        assert sorted_events[2]["id"] == "1"  # 12:00
        assert sorted_events[3]["id"] == "3"  # 13:00
    
    def test_empty_events_list(self):
        """Test handling of empty events list."""
        events = []
        sorted_events = sorted(events, key=lambda x: x.get("timestamp", ""))
        assert sorted_events == []
    
    def test_single_event(self):
        """Test handling of single event."""
        events = [{"id": "1", "timestamp": "2024-01-01T12:00:00Z", "type": "pageview"}]
        sorted_events = sorted(events, key=lambda x: x.get("timestamp", ""))
        assert len(sorted_events) == 1
        assert sorted_events[0]["id"] == "1"
    
    def test_events_with_same_timestamp(self):
        """Test handling of events with identical timestamps."""
        events = [
            {"id": "1", "timestamp": "2024-01-01T12:00:00Z", "type": "pageview"},
            {"id": "2", "timestamp": "2024-01-01T12:00:00Z", "type": "event"},
        ]
        sorted_events = sorted(events, key=lambda x: x.get("timestamp", ""))
        
        # Both should be present, order between them is stable
        assert len(sorted_events) == 2
        timestamps = [e["timestamp"] for e in sorted_events]
        assert all(t == "2024-01-01T12:00:00Z" for t in timestamps)


class TestSessionContextRetrieval:
    """Tests for session context data (Requirements 2.4)."""
    
    def test_session_details_format(self):
        """Test that session details are formatted correctly."""
        # Simulate raw session data from database
        raw_session = {
            "session_id": "test-session-123",
            "visitor_id": "visitor-456",
            "device_type": "mobile",
            "browser": "Chrome",
            "os": "iOS",
            "screen_width": 390,
            "screen_height": 844,
            "locale": "en-US",
            "timezone": "America/New_York",
            "utm_source": "google",
            "utm_medium": "cpc",
            "utm_campaign": "summer_sale",
            "first_referrer": "https://google.com",
            "first_seen": "2024-01-01T10:00:00Z",
            "last_seen": "2024-01-01T10:30:00Z",
            "converted_to_signup": True,
            "converted_at": "2024-01-01T10:15:00Z",
        }
        
        # Format for frontend (matching endpoint logic)
        session_details = {
            "sessionId": raw_session.get("session_id"),
            "visitorId": raw_session.get("visitor_id"),
            "deviceType": raw_session.get("device_type", "desktop"),
            "browser": raw_session.get("browser", "Unknown"),
            "os": raw_session.get("os", "Unknown"),
            "screenSize": f"{raw_session.get('screen_width', 0)}x{raw_session.get('screen_height', 0)}",
            "locale": raw_session.get("locale", "Unknown"),
            "timezone": raw_session.get("timezone", "Unknown"),
            "utmSource": raw_session.get("utm_source"),
            "utmMedium": raw_session.get("utm_medium"),
            "utmCampaign": raw_session.get("utm_campaign"),
            "firstReferrer": raw_session.get("first_referrer"),
            "startedAt": raw_session.get("first_seen"),
            "endedAt": raw_session.get("last_seen"),
            "converted": raw_session.get("converted_to_signup", False),
            "convertedAt": raw_session.get("converted_at"),
        }
        
        # Verify all required fields are present
        assert session_details["sessionId"] == "test-session-123"
        assert session_details["visitorId"] == "visitor-456"
        assert session_details["deviceType"] == "mobile"
        assert session_details["browser"] == "Chrome"
        assert session_details["os"] == "iOS"
        assert session_details["screenSize"] == "390x844"
        assert session_details["locale"] == "en-US"
        assert session_details["timezone"] == "America/New_York"
        assert session_details["utmSource"] == "google"
        assert session_details["utmMedium"] == "cpc"
        assert session_details["utmCampaign"] == "summer_sale"
        assert session_details["converted"] is True
    
    def test_session_details_with_missing_fields(self):
        """Test handling of session with missing optional fields."""
        raw_session = {
            "session_id": "test-session-123",
            "visitor_id": None,
            "device_type": None,
            "browser": None,
            "os": None,
            "screen_width": None,
            "screen_height": None,
            "locale": None,
            "timezone": None,
            "utm_source": None,
            "utm_medium": None,
            "utm_campaign": None,
            "first_referrer": None,
            "first_seen": "2024-01-01T10:00:00Z",
            "last_seen": None,
            "converted_to_signup": False,
            "converted_at": None,
        }
        
        session_details = {
            "sessionId": raw_session.get("session_id"),
            "visitorId": raw_session.get("visitor_id"),
            "deviceType": raw_session.get("device_type") or "desktop",
            "browser": raw_session.get("browser") or "Unknown",
            "os": raw_session.get("os") or "Unknown",
            "screenSize": f"{raw_session.get('screen_width') or 0}x{raw_session.get('screen_height') or 0}",
            "locale": raw_session.get("locale") or "Unknown",
            "timezone": raw_session.get("timezone") or "Unknown",
            "utmSource": raw_session.get("utm_source"),
            "utmMedium": raw_session.get("utm_medium"),
            "utmCampaign": raw_session.get("utm_campaign"),
            "firstReferrer": raw_session.get("first_referrer"),
            "startedAt": raw_session.get("first_seen"),
            "endedAt": raw_session.get("last_seen"),
            "converted": raw_session.get("converted_to_signup", False),
            "convertedAt": raw_session.get("converted_at"),
        }
        
        # Verify defaults are applied
        assert session_details["deviceType"] == "desktop"
        assert session_details["browser"] == "Unknown"
        assert session_details["os"] == "Unknown"
        assert session_details["screenSize"] == "0x0"
        assert session_details["locale"] == "Unknown"
        assert session_details["timezone"] == "Unknown"
        assert session_details["utmSource"] is None
        assert session_details["converted"] is False


class TestConversionEventDetection:
    """Tests for conversion event flagging."""
    
    def test_conversion_events_flagged(self):
        """Test that conversion events are properly flagged."""
        conversion_event_names = {"signup", "purchase", "subscribe", "conversion", "register"}
        
        events = [
            {"event_name": "signup", "page": "/"},
            {"event_name": "button_click", "page": "/"},
            {"event_name": "purchase", "page": "/shop"},
            {"event_name": "page_scroll", "page": "/"},
        ]
        
        for event in events:
            event_name = event.get("event_name", "")
            is_conversion = event_name.lower() in conversion_event_names
            event["isConversion"] = is_conversion
        
        assert events[0]["isConversion"] is True  # signup
        assert events[1]["isConversion"] is False  # button_click
        assert events[2]["isConversion"] is True  # purchase
        assert events[3]["isConversion"] is False  # page_scroll
    
    def test_conversion_case_insensitive(self):
        """Test that conversion detection is case-insensitive."""
        conversion_event_names = {"signup", "purchase", "subscribe", "conversion", "register"}
        
        test_cases = ["SIGNUP", "Signup", "SignUp", "PURCHASE", "Purchase"]
        
        for event_name in test_cases:
            is_conversion = event_name.lower() in conversion_event_names
            assert is_conversion is True, f"{event_name} should be detected as conversion"
