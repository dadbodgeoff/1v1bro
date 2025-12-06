"""
Integration tests for direct messaging system.
Tests against real Supabase.
"""

import pytest
import uuid
from fastapi.testclient import TestClient


def create_test_user(client: TestClient, email: str, password: str, display_name: str):
    """Helper to create a test user and return token + user data."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": password,
            "display_name": display_name,
        },
    )
    if response.status_code == 422:
        error_msg = response.json().get("error", "")
        if "rate limit" in error_msg.lower():
            pytest.skip("Supabase email rate limit exceeded")
    assert response.status_code == 201, f"Failed to create user: {response.json()}"
    data = response.json()["data"]
    return data["access_token"], data["user"]


def create_friendship(client: TestClient, token1: str, token2: str, user2_id: str):
    """Helper to create a friendship between two users."""
    # User 1 sends request
    send_response = client.post(
        "/api/v1/friends/request",
        json={"user_id": user2_id},
        headers={"Authorization": f"Bearer {token1}"},
    )
    friendship_id = send_response.json()["data"]["friendship_id"]
    
    # User 2 accepts
    client.post(
        f"/api/v1/friends/{friendship_id}/accept",
        headers={"Authorization": f"Bearer {token2}"},
    )
    return friendship_id


class TestConversationsEndpoint:
    """Test GET /messages/conversations endpoint."""

    def test_get_empty_conversations(self, client: TestClient):
        """Test getting conversations when user has none."""
        email = f"empty_conv_{uuid.uuid4().hex[:8]}@test.com"
        token, user = create_test_user(client, email, "TestPass123!", "Empty Conv User")
        
        response = client.get(
            "/api/v1/messages/conversations",
            headers={"Authorization": f"Bearer {token}"},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["conversations"] == []
        assert data["data"]["total_unread"] == 0

    def test_get_conversations_with_messages(self, client: TestClient):
        """Test getting conversations after sending messages."""
        email1 = f"conv_test1_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"conv_test2_{uuid.uuid4().hex[:8]}@test.com"
        
        token1, user1 = create_test_user(client, email1, "TestPass123!", "Conv User One")
        token2, user2 = create_test_user(client, email2, "TestPass123!", "Conv User Two")
        
        # Create friendship
        create_friendship(client, token1, token2, user2["id"])
        
        # Send a message
        client.post(
            f"/api/v1/messages/{user2['id']}",
            json={"content": "Hello!"},
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        # Check conversations for User 1
        response = client.get(
            "/api/v1/messages/conversations",
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]["conversations"]) == 1
        conv = data["data"]["conversations"][0]
        assert conv["friend_id"] == user2["id"]
        assert conv["friend_display_name"] == "Conv User Two"
        assert conv["last_message"]["content"] == "Hello!"
        assert conv["unread_count"] == 0  # Sender doesn't have unread

    def test_conversations_show_unread_count(self, client: TestClient):
        """Test that unread count is correct for recipient."""
        email1 = f"unread_test1_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"unread_test2_{uuid.uuid4().hex[:8]}@test.com"
        
        token1, user1 = create_test_user(client, email1, "TestPass123!", "Unread One")
        token2, user2 = create_test_user(client, email2, "TestPass123!", "Unread Two")
        
        create_friendship(client, token1, token2, user2["id"])
        
        # Send 3 messages from User 1 to User 2
        for i in range(3):
            client.post(
                f"/api/v1/messages/{user2['id']}",
                json={"content": f"Message {i+1}"},
                headers={"Authorization": f"Bearer {token1}"},
            )
        
        # Check User 2's conversations - should have 3 unread
        response = client.get(
            "/api/v1/messages/conversations",
            headers={"Authorization": f"Bearer {token2}"},
        )
        
        data = response.json()
        assert data["data"]["conversations"][0]["unread_count"] == 3
        assert data["data"]["total_unread"] == 3


class TestSendMessageEndpoint:
    """Test POST /messages/{friend_id} endpoint."""

    def test_send_message_to_friend(self, client: TestClient):
        """Test sending a message to a friend."""
        email1 = f"send_msg1_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"send_msg2_{uuid.uuid4().hex[:8]}@test.com"
        
        token1, user1 = create_test_user(client, email1, "TestPass123!", "Sender")
        token2, user2 = create_test_user(client, email2, "TestPass123!", "Receiver")
        
        create_friendship(client, token1, token2, user2["id"])
        
        response = client.post(
            f"/api/v1/messages/{user2['id']}",
            json={"content": "Hello, friend!"},
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["content"] == "Hello, friend!"
        assert data["data"]["sender_id"] == user1["id"]
        assert "id" in data["data"]
        assert "conversation_id" in data["data"]
        assert "created_at" in data["data"]

    def test_cannot_message_non_friend(self, client: TestClient):
        """Test that you cannot message someone who isn't a friend."""
        email1 = f"non_friend_msg1_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"non_friend_msg2_{uuid.uuid4().hex[:8]}@test.com"
        
        token1, user1 = create_test_user(client, email1, "TestPass123!", "Non Friend Msg One")
        token2, user2 = create_test_user(client, email2, "TestPass123!", "Non Friend Msg Two")
        
        # Don't create friendship
        response = client.post(
            f"/api/v1/messages/{user2['id']}",
            json={"content": "Hello stranger!"},
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        assert response.status_code == 403
        data = response.json()
        assert data["success"] is False

    def test_message_content_validation_empty(self, client: TestClient):
        """Test that empty messages are rejected."""
        email1 = f"empty_msg1_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"empty_msg2_{uuid.uuid4().hex[:8]}@test.com"
        
        token1, user1 = create_test_user(client, email1, "TestPass123!", "Empty Msg One")
        token2, user2 = create_test_user(client, email2, "TestPass123!", "Empty Msg Two")
        
        create_friendship(client, token1, token2, user2["id"])
        
        response = client.post(
            f"/api/v1/messages/{user2['id']}",
            json={"content": ""},
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        assert response.status_code == 422

    def test_message_content_validation_too_long(self, client: TestClient):
        """Test that messages over 500 chars are rejected."""
        email1 = f"long_msg1_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"long_msg2_{uuid.uuid4().hex[:8]}@test.com"
        
        token1, user1 = create_test_user(client, email1, "TestPass123!", "Long Msg One")
        token2, user2 = create_test_user(client, email2, "TestPass123!", "Long Msg Two")
        
        create_friendship(client, token1, token2, user2["id"])
        
        long_content = "x" * 501
        response = client.post(
            f"/api/v1/messages/{user2['id']}",
            json={"content": long_content},
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        assert response.status_code == 422

    def test_message_at_max_length(self, client: TestClient):
        """Test that 500 char messages are accepted."""
        email1 = f"max_msg1_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"max_msg2_{uuid.uuid4().hex[:8]}@test.com"
        
        token1, user1 = create_test_user(client, email1, "TestPass123!", "Max Msg One")
        token2, user2 = create_test_user(client, email2, "TestPass123!", "Max Msg Two")
        
        create_friendship(client, token1, token2, user2["id"])
        
        max_content = "x" * 500
        response = client.post(
            f"/api/v1/messages/{user2['id']}",
            json={"content": max_content},
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        assert response.status_code == 201


class TestGetMessagesEndpoint:
    """Test GET /messages/{friend_id} endpoint."""

    def test_get_message_history(self, client: TestClient):
        """Test getting message history with a friend."""
        email1 = f"history1_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"history2_{uuid.uuid4().hex[:8]}@test.com"
        
        token1, user1 = create_test_user(client, email1, "TestPass123!", "History One")
        token2, user2 = create_test_user(client, email2, "TestPass123!", "History Two")
        
        create_friendship(client, token1, token2, user2["id"])
        
        # Send messages back and forth
        client.post(
            f"/api/v1/messages/{user2['id']}",
            json={"content": "Hey!"},
            headers={"Authorization": f"Bearer {token1}"},
        )
        client.post(
            f"/api/v1/messages/{user1['id']}",
            json={"content": "Hi there!"},
            headers={"Authorization": f"Bearer {token2}"},
        )
        client.post(
            f"/api/v1/messages/{user2['id']}",
            json={"content": "How are you?"},
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        # Get history from User 1's perspective
        response = client.get(
            f"/api/v1/messages/{user2['id']}",
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]["messages"]) == 3
        
        # Messages should be in chronological order
        messages = data["data"]["messages"]
        assert messages[0]["content"] == "Hey!"
        assert messages[1]["content"] == "Hi there!"
        assert messages[2]["content"] == "How are you?"

    def test_get_messages_pagination(self, client: TestClient):
        """Test message pagination with before_id."""
        email1 = f"page1_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"page2_{uuid.uuid4().hex[:8]}@test.com"
        
        token1, user1 = create_test_user(client, email1, "TestPass123!", "Page One")
        token2, user2 = create_test_user(client, email2, "TestPass123!", "Page Two")
        
        create_friendship(client, token1, token2, user2["id"])
        
        # Send 5 messages
        for i in range(5):
            client.post(
                f"/api/v1/messages/{user2['id']}",
                json={"content": f"Message {i+1}"},
                headers={"Authorization": f"Bearer {token1}"},
            )
        
        # Get first 3 messages
        response = client.get(
            f"/api/v1/messages/{user2['id']}?limit=3",
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        data = response.json()
        assert len(data["data"]["messages"]) == 3
        assert data["data"]["has_more"] is True

    def test_cannot_get_messages_from_non_friend(self, client: TestClient):
        """Test that you cannot get messages from non-friend."""
        email1 = f"no_access1_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"no_access2_{uuid.uuid4().hex[:8]}@test.com"
        
        token1, user1 = create_test_user(client, email1, "TestPass123!", "No Access One")
        token2, user2 = create_test_user(client, email2, "TestPass123!", "No Access Two")
        
        # Don't create friendship
        response = client.get(
            f"/api/v1/messages/{user2['id']}",
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        assert response.status_code == 403


class TestMarkAsReadEndpoint:
    """Test POST /messages/{friend_id}/read endpoint."""

    def test_mark_messages_as_read(self, client: TestClient):
        """Test marking messages as read."""
        email1 = f"read1_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"read2_{uuid.uuid4().hex[:8]}@test.com"
        
        token1, user1 = create_test_user(client, email1, "TestPass123!", "Read One")
        token2, user2 = create_test_user(client, email2, "TestPass123!", "Read Two")
        
        create_friendship(client, token1, token2, user2["id"])
        
        # User 1 sends messages to User 2
        for i in range(3):
            client.post(
                f"/api/v1/messages/{user2['id']}",
                json={"content": f"Message {i+1}"},
                headers={"Authorization": f"Bearer {token1}"},
            )
        
        # Verify User 2 has unread messages
        conv_response = client.get(
            "/api/v1/messages/conversations",
            headers={"Authorization": f"Bearer {token2}"},
        )
        assert conv_response.json()["data"]["total_unread"] == 3
        
        # User 2 marks as read
        response = client.post(
            f"/api/v1/messages/{user1['id']}/read",
            headers={"Authorization": f"Bearer {token2}"},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["marked_count"] == 3
        
        # Verify unread count is now 0
        conv_response = client.get(
            "/api/v1/messages/conversations",
            headers={"Authorization": f"Bearer {token2}"},
        )
        assert conv_response.json()["data"]["total_unread"] == 0

    def test_mark_read_idempotent(self, client: TestClient):
        """Test that marking as read multiple times is safe."""
        email1 = f"idem1_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"idem2_{uuid.uuid4().hex[:8]}@test.com"
        
        token1, user1 = create_test_user(client, email1, "TestPass123!", "Idem One")
        token2, user2 = create_test_user(client, email2, "TestPass123!", "Idem Two")
        
        create_friendship(client, token1, token2, user2["id"])
        
        # Send a message
        client.post(
            f"/api/v1/messages/{user2['id']}",
            json={"content": "Hello"},
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        # Mark as read twice
        response1 = client.post(
            f"/api/v1/messages/{user1['id']}/read",
            headers={"Authorization": f"Bearer {token2}"},
        )
        response2 = client.post(
            f"/api/v1/messages/{user1['id']}/read",
            headers={"Authorization": f"Bearer {token2}"},
        )
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        assert response1.json()["data"]["marked_count"] == 1
        assert response2.json()["data"]["marked_count"] == 0


class TestUnreadCountEndpoint:
    """Test GET /messages/unread/count endpoint."""

    def test_get_unread_count(self, client: TestClient):
        """Test getting total unread count."""
        email1 = f"count1_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"count2_{uuid.uuid4().hex[:8]}@test.com"
        email3 = f"count3_{uuid.uuid4().hex[:8]}@test.com"
        
        token1, user1 = create_test_user(client, email1, "TestPass123!", "Count One")
        token2, user2 = create_test_user(client, email2, "TestPass123!", "Count Two")
        token3, user3 = create_test_user(client, email3, "TestPass123!", "Count Three")
        
        # Create friendships
        create_friendship(client, token1, token2, user2["id"])
        create_friendship(client, token1, token3, user3["id"])
        
        # User 2 sends 2 messages to User 1
        for i in range(2):
            client.post(
                f"/api/v1/messages/{user1['id']}",
                json={"content": f"From User 2: {i+1}"},
                headers={"Authorization": f"Bearer {token2}"},
            )
        
        # User 3 sends 3 messages to User 1
        for i in range(3):
            client.post(
                f"/api/v1/messages/{user1['id']}",
                json={"content": f"From User 3: {i+1}"},
                headers={"Authorization": f"Bearer {token3}"},
            )
        
        # User 1 should have 5 total unread
        response = client.get(
            "/api/v1/messages/unread/count",
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["unread_count"] == 5

    def test_unread_count_zero_when_no_messages(self, client: TestClient):
        """Test unread count is 0 when no messages."""
        email = f"zero_count_{uuid.uuid4().hex[:8]}@test.com"
        token, user = create_test_user(client, email, "TestPass123!", "Zero Count")
        
        response = client.get(
            "/api/v1/messages/unread/count",
            headers={"Authorization": f"Bearer {token}"},
        )
        
        assert response.status_code == 200
        assert response.json()["data"]["unread_count"] == 0


class TestBidirectionalMessaging:
    """Test bidirectional messaging scenarios."""

    def test_both_users_can_message(self, client: TestClient):
        """Test that both users can send and receive messages."""
        email1 = f"bidir1_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"bidir2_{uuid.uuid4().hex[:8]}@test.com"
        
        token1, user1 = create_test_user(client, email1, "TestPass123!", "Bidir One")
        token2, user2 = create_test_user(client, email2, "TestPass123!", "Bidir Two")
        
        create_friendship(client, token1, token2, user2["id"])
        
        # User 1 sends to User 2
        response1 = client.post(
            f"/api/v1/messages/{user2['id']}",
            json={"content": "Hello from User 1"},
            headers={"Authorization": f"Bearer {token1}"},
        )
        assert response1.status_code == 201
        
        # User 2 sends to User 1
        response2 = client.post(
            f"/api/v1/messages/{user1['id']}",
            json={"content": "Hello from User 2"},
            headers={"Authorization": f"Bearer {token2}"},
        )
        assert response2.status_code == 201
        
        # Both should see the same conversation
        conv1 = client.get(
            f"/api/v1/messages/{user2['id']}",
            headers={"Authorization": f"Bearer {token1}"},
        )
        conv2 = client.get(
            f"/api/v1/messages/{user1['id']}",
            headers={"Authorization": f"Bearer {token2}"},
        )
        
        # Same conversation_id
        assert conv1.json()["data"]["messages"][0]["conversation_id"] == \
               conv2.json()["data"]["messages"][0]["conversation_id"]
        
        # Both see 2 messages
        assert len(conv1.json()["data"]["messages"]) == 2
        assert len(conv2.json()["data"]["messages"]) == 2

    def test_conversation_sorted_by_recent(self, client: TestClient):
        """Test that conversations are sorted by most recent activity."""
        email1 = f"sort1_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"sort2_{uuid.uuid4().hex[:8]}@test.com"
        email3 = f"sort3_{uuid.uuid4().hex[:8]}@test.com"
        
        token1, user1 = create_test_user(client, email1, "TestPass123!", "Sort One")
        token2, user2 = create_test_user(client, email2, "TestPass123!", "Sort Two")
        token3, user3 = create_test_user(client, email3, "TestPass123!", "Sort Three")
        
        create_friendship(client, token1, token2, user2["id"])
        create_friendship(client, token1, token3, user3["id"])
        
        # Message User 2 first
        client.post(
            f"/api/v1/messages/{user2['id']}",
            json={"content": "First conversation"},
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        # Then message User 3
        client.post(
            f"/api/v1/messages/{user3['id']}",
            json={"content": "Second conversation"},
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        # User 3's conversation should be first (most recent)
        response = client.get(
            "/api/v1/messages/conversations",
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        convs = response.json()["data"]["conversations"]
        assert len(convs) == 2
        assert convs[0]["friend_id"] == user3["id"]
        assert convs[1]["friend_id"] == user2["id"]
