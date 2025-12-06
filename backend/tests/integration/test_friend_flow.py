"""
Integration tests for friend system flow.
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


class TestFriendRequestFlow:
    """Test friend request sending and accepting."""

    def test_send_friend_request(self, client: TestClient):
        """Test sending a friend request to another user."""
        # Create two users
        email1 = f"friend_test1_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"friend_test2_{uuid.uuid4().hex[:8]}@test.com"
        
        token1, user1 = create_test_user(client, email1, "TestPass123!", "User One")
        token2, user2 = create_test_user(client, email2, "TestPass123!", "User Two")
        
        # User 1 sends friend request to User 2
        response = client.post(
            "/api/v1/friends/request",
            json={"user_id": user2["id"]},
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["status"] == "pending"
        assert "friendship_id" in data["data"]

    def test_cannot_friend_self(self, client: TestClient):
        """Test that users cannot send friend request to themselves."""
        email = f"friend_self_{uuid.uuid4().hex[:8]}@test.com"
        token, user = create_test_user(client, email, "TestPass123!", "Self User")
        
        response = client.post(
            "/api/v1/friends/request",
            json={"user_id": user["id"]},
            headers={"Authorization": f"Bearer {token}"},
        )
        
        assert response.status_code == 422
        data = response.json()
        assert data["success"] is False

    def test_accept_friend_request(self, client: TestClient):
        """Test accepting a friend request."""
        email1 = f"accept_test1_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"accept_test2_{uuid.uuid4().hex[:8]}@test.com"
        
        token1, user1 = create_test_user(client, email1, "TestPass123!", "Accepter One")
        token2, user2 = create_test_user(client, email2, "TestPass123!", "Accepter Two")
        
        # User 1 sends request
        send_response = client.post(
            "/api/v1/friends/request",
            json={"user_id": user2["id"]},
            headers={"Authorization": f"Bearer {token1}"},
        )
        friendship_id = send_response.json()["data"]["friendship_id"]
        
        # User 2 accepts
        response = client.post(
            f"/api/v1/friends/{friendship_id}/accept",
            headers={"Authorization": f"Bearer {token2}"},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["status"] == "accepted"

    def test_decline_friend_request(self, client: TestClient):
        """Test declining a friend request."""
        email1 = f"decline_test1_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"decline_test2_{uuid.uuid4().hex[:8]}@test.com"
        
        token1, user1 = create_test_user(client, email1, "TestPass123!", "Decliner One")
        token2, user2 = create_test_user(client, email2, "TestPass123!", "Decliner Two")
        
        # User 1 sends request
        send_response = client.post(
            "/api/v1/friends/request",
            json={"user_id": user2["id"]},
            headers={"Authorization": f"Bearer {token1}"},
        )
        friendship_id = send_response.json()["data"]["friendship_id"]
        
        # User 2 declines
        response = client.post(
            f"/api/v1/friends/{friendship_id}/decline",
            headers={"Authorization": f"Bearer {token2}"},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_mutual_request_auto_accepts(self, client: TestClient):
        """Test that if both users send requests, it auto-accepts."""
        email1 = f"mutual_test1_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"mutual_test2_{uuid.uuid4().hex[:8]}@test.com"
        
        token1, user1 = create_test_user(client, email1, "TestPass123!", "Mutual One")
        token2, user2 = create_test_user(client, email2, "TestPass123!", "Mutual Two")
        
        # User 1 sends request to User 2
        client.post(
            "/api/v1/friends/request",
            json={"user_id": user2["id"]},
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        # User 2 sends request to User 1 (should auto-accept)
        response = client.post(
            "/api/v1/friends/request",
            json={"user_id": user1["id"]},
            headers={"Authorization": f"Bearer {token2}"},
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["status"] == "accepted"


class TestFriendsListFlow:
    """Test friends list retrieval."""

    def test_get_empty_friends_list(self, client: TestClient):
        """Test getting friends list when user has no friends."""
        email = f"empty_list_{uuid.uuid4().hex[:8]}@test.com"
        token, user = create_test_user(client, email, "TestPass123!", "Lonely User")
        
        response = client.get(
            "/api/v1/friends",
            headers={"Authorization": f"Bearer {token}"},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["friends"] == []
        assert data["data"]["pending_requests"] == []
        assert data["data"]["sent_requests"] == []

    def test_get_friends_list_with_friends(self, client: TestClient):
        """Test getting friends list with accepted friends."""
        email1 = f"list_test1_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"list_test2_{uuid.uuid4().hex[:8]}@test.com"
        
        token1, user1 = create_test_user(client, email1, "TestPass123!", "List User One")
        token2, user2 = create_test_user(client, email2, "TestPass123!", "List User Two")
        
        # Create friendship
        send_response = client.post(
            "/api/v1/friends/request",
            json={"user_id": user2["id"]},
            headers={"Authorization": f"Bearer {token1}"},
        )
        friendship_id = send_response.json()["data"]["friendship_id"]
        
        client.post(
            f"/api/v1/friends/{friendship_id}/accept",
            headers={"Authorization": f"Bearer {token2}"},
        )
        
        # Check User 1's friends list
        response = client.get(
            "/api/v1/friends",
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]["friends"]) == 1
        assert data["data"]["friends"][0]["user_id"] == user2["id"]
        assert data["data"]["friends"][0]["display_name"] == "List User Two"

    def test_pending_requests_shown(self, client: TestClient):
        """Test that pending requests appear in friends list."""
        email1 = f"pending_test1_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"pending_test2_{uuid.uuid4().hex[:8]}@test.com"
        
        token1, user1 = create_test_user(client, email1, "TestPass123!", "Pending One")
        token2, user2 = create_test_user(client, email2, "TestPass123!", "Pending Two")
        
        # User 1 sends request to User 2
        client.post(
            "/api/v1/friends/request",
            json={"user_id": user2["id"]},
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        # Check User 2's pending requests
        response = client.get(
            "/api/v1/friends",
            headers={"Authorization": f"Bearer {token2}"},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]["pending_requests"]) == 1
        assert data["data"]["pending_requests"][0]["user_id"] == user1["id"]
        
        # Check User 1's sent requests
        response = client.get(
            "/api/v1/friends",
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        data = response.json()
        assert len(data["data"]["sent_requests"]) == 1
        assert data["data"]["sent_requests"][0]["user_id"] == user2["id"]


class TestRemoveFriendFlow:
    """Test removing friends."""

    def test_remove_friend(self, client: TestClient):
        """Test removing an accepted friend."""
        email1 = f"remove_test1_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"remove_test2_{uuid.uuid4().hex[:8]}@test.com"
        
        token1, user1 = create_test_user(client, email1, "TestPass123!", "Remove One")
        token2, user2 = create_test_user(client, email2, "TestPass123!", "Remove Two")
        
        # Create friendship
        send_response = client.post(
            "/api/v1/friends/request",
            json={"user_id": user2["id"]},
            headers={"Authorization": f"Bearer {token1}"},
        )
        friendship_id = send_response.json()["data"]["friendship_id"]
        
        client.post(
            f"/api/v1/friends/{friendship_id}/accept",
            headers={"Authorization": f"Bearer {token2}"},
        )
        
        # User 1 removes User 2
        response = client.delete(
            f"/api/v1/friends/{friendship_id}",
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        
        # Verify friend is removed
        list_response = client.get(
            "/api/v1/friends",
            headers={"Authorization": f"Bearer {token1}"},
        )
        assert len(list_response.json()["data"]["friends"]) == 0


class TestBlockUserFlow:
    """Test blocking users."""

    def test_block_user(self, client: TestClient):
        """Test blocking a user."""
        email1 = f"block_test1_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"block_test2_{uuid.uuid4().hex[:8]}@test.com"
        
        token1, user1 = create_test_user(client, email1, "TestPass123!", "Blocker")
        token2, user2 = create_test_user(client, email2, "TestPass123!", "Blocked")
        
        # User 1 blocks User 2
        response = client.post(
            f"/api/v1/friends/block/{user2['id']}",
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_blocked_user_cannot_send_request(self, client: TestClient):
        """Test that blocked user cannot send friend request."""
        email1 = f"block_req1_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"block_req2_{uuid.uuid4().hex[:8]}@test.com"
        
        token1, user1 = create_test_user(client, email1, "TestPass123!", "Block Req One")
        token2, user2 = create_test_user(client, email2, "TestPass123!", "Block Req Two")
        
        # User 1 blocks User 2
        client.post(
            f"/api/v1/friends/block/{user2['id']}",
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        # User 2 tries to send friend request to User 1
        response = client.post(
            "/api/v1/friends/request",
            json={"user_id": user1["id"]},
            headers={"Authorization": f"Bearer {token2}"},
        )
        
        assert response.status_code == 403
        data = response.json()
        assert data["success"] is False

    def test_get_blocked_users(self, client: TestClient):
        """Test getting list of blocked users."""
        email1 = f"blocked_list1_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"blocked_list2_{uuid.uuid4().hex[:8]}@test.com"
        
        token1, user1 = create_test_user(client, email1, "TestPass123!", "Blocked List One")
        token2, user2 = create_test_user(client, email2, "TestPass123!", "Blocked List Two")
        
        # User 1 blocks User 2
        client.post(
            f"/api/v1/friends/block/{user2['id']}",
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        # Get blocked list
        response = client.get(
            "/api/v1/friends/blocked",
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) == 1
        assert data["data"][0]["user_id"] == user2["id"]

    def test_unblock_user(self, client: TestClient):
        """Test unblocking a user."""
        email1 = f"unblock_test1_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"unblock_test2_{uuid.uuid4().hex[:8]}@test.com"
        
        token1, user1 = create_test_user(client, email1, "TestPass123!", "Unblock One")
        token2, user2 = create_test_user(client, email2, "TestPass123!", "Unblock Two")
        
        # Block then unblock
        client.post(
            f"/api/v1/friends/block/{user2['id']}",
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        response = client.delete(
            f"/api/v1/friends/block/{user2['id']}",
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        assert response.status_code == 200
        
        # Verify unblocked - User 2 can now send request
        response = client.post(
            "/api/v1/friends/request",
            json={"user_id": user1["id"]},
            headers={"Authorization": f"Bearer {token2}"},
        )
        assert response.status_code == 201


class TestUserSearchFlow:
    """Test user search functionality."""

    def test_search_users_by_name(self, client: TestClient):
        """Test searching users by display name."""
        unique_name = f"SearchTarget_{uuid.uuid4().hex[:8]}"
        email1 = f"searcher_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"target_{uuid.uuid4().hex[:8]}@test.com"
        
        token1, user1 = create_test_user(client, email1, "TestPass123!", "Searcher")
        token2, user2 = create_test_user(client, email2, "TestPass123!", unique_name)
        
        # Search for the unique name
        response = client.get(
            f"/api/v1/friends/search?q={unique_name[:10]}",
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        # Should find the user
        found_ids = [u["id"] for u in data["data"]["users"]]
        assert user2["id"] in found_ids

    def test_search_excludes_blocked_users(self, client: TestClient):
        """Test that blocked users don't appear in search."""
        unique_name = f"BlockedSearch_{uuid.uuid4().hex[:8]}"
        email1 = f"search_blocker_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"search_blocked_{uuid.uuid4().hex[:8]}@test.com"
        
        token1, user1 = create_test_user(client, email1, "TestPass123!", "Search Blocker")
        token2, user2 = create_test_user(client, email2, "TestPass123!", unique_name)
        
        # Block the user
        client.post(
            f"/api/v1/friends/block/{user2['id']}",
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        # Search should not find blocked user
        response = client.get(
            f"/api/v1/friends/search?q={unique_name[:10]}",
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        data = response.json()
        found_ids = [u["id"] for u in data["data"]["users"]]
        assert user2["id"] not in found_ids

    def test_search_requires_min_length(self, client: TestClient):
        """Test that search requires minimum query length."""
        email = f"min_search_{uuid.uuid4().hex[:8]}@test.com"
        token, user = create_test_user(client, email, "TestPass123!", "Min Search")
        
        # Single character search should fail validation
        response = client.get(
            "/api/v1/friends/search?q=a",
            headers={"Authorization": f"Bearer {token}"},
        )
        
        assert response.status_code == 422


class TestGameInviteFlow:
    """Test game invite functionality."""

    def test_send_game_invite_to_friend(self, client: TestClient):
        """Test sending a game invite to a friend."""
        email1 = f"invite_sender_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"invite_receiver_{uuid.uuid4().hex[:8]}@test.com"
        
        token1, user1 = create_test_user(client, email1, "TestPass123!", "Invite Sender")
        token2, user2 = create_test_user(client, email2, "TestPass123!", "Invite Receiver")
        
        # Create friendship first
        send_response = client.post(
            "/api/v1/friends/request",
            json={"user_id": user2["id"]},
            headers={"Authorization": f"Bearer {token1}"},
        )
        friendship_id = send_response.json()["data"]["friendship_id"]
        
        client.post(
            f"/api/v1/friends/{friendship_id}/accept",
            headers={"Authorization": f"Bearer {token2}"},
        )
        
        # Send game invite
        response = client.post(
            f"/api/v1/friends/{user2['id']}/invite",
            json={"lobby_code": "ABC123"},
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert "invite_id" in data["data"]
        assert "expires_at" in data["data"]

    def test_cannot_invite_non_friend(self, client: TestClient):
        """Test that you cannot send game invite to non-friend."""
        email1 = f"non_friend_inv1_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"non_friend_inv2_{uuid.uuid4().hex[:8]}@test.com"
        
        token1, user1 = create_test_user(client, email1, "TestPass123!", "Non Friend One")
        token2, user2 = create_test_user(client, email2, "TestPass123!", "Non Friend Two")
        
        # Try to invite without being friends
        response = client.post(
            f"/api/v1/friends/{user2['id']}/invite",
            json={"lobby_code": "ABC123"},
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        assert response.status_code == 403
        data = response.json()
        assert data["success"] is False

    def test_get_pending_invites(self, client: TestClient):
        """Test getting pending game invites."""
        email1 = f"pending_inv1_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"pending_inv2_{uuid.uuid4().hex[:8]}@test.com"
        
        token1, user1 = create_test_user(client, email1, "TestPass123!", "Pending Inv One")
        token2, user2 = create_test_user(client, email2, "TestPass123!", "Pending Inv Two")
        
        # Create friendship
        send_response = client.post(
            "/api/v1/friends/request",
            json={"user_id": user2["id"]},
            headers={"Authorization": f"Bearer {token1}"},
        )
        friendship_id = send_response.json()["data"]["friendship_id"]
        
        client.post(
            f"/api/v1/friends/{friendship_id}/accept",
            headers={"Authorization": f"Bearer {token2}"},
        )
        
        # Send invite
        client.post(
            f"/api/v1/friends/{user2['id']}/invite",
            json={"lobby_code": "XYZ789"},
            headers={"Authorization": f"Bearer {token1}"},
        )
        
        # Get pending invites for User 2
        response = client.get(
            "/api/v1/friends/invites",
            headers={"Authorization": f"Bearer {token2}"},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]["invites"]) == 1
        assert data["data"]["invites"][0]["lobby_code"] == "XYZ789"
        assert data["data"]["invites"][0]["from_user_id"] == user1["id"]

    def test_accept_game_invite(self, client: TestClient):
        """Test accepting a game invite."""
        email1 = f"accept_inv1_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"accept_inv2_{uuid.uuid4().hex[:8]}@test.com"
        
        token1, user1 = create_test_user(client, email1, "TestPass123!", "Accept Inv One")
        token2, user2 = create_test_user(client, email2, "TestPass123!", "Accept Inv Two")
        
        # Create friendship
        send_response = client.post(
            "/api/v1/friends/request",
            json={"user_id": user2["id"]},
            headers={"Authorization": f"Bearer {token1}"},
        )
        friendship_id = send_response.json()["data"]["friendship_id"]
        
        client.post(
            f"/api/v1/friends/{friendship_id}/accept",
            headers={"Authorization": f"Bearer {token2}"},
        )
        
        # Send invite
        invite_response = client.post(
            f"/api/v1/friends/{user2['id']}/invite",
            json={"lobby_code": "GAME01"},
            headers={"Authorization": f"Bearer {token1}"},
        )
        invite_id = invite_response.json()["data"]["invite_id"]
        
        # Accept invite
        response = client.post(
            f"/api/v1/friends/invites/{invite_id}/accept",
            headers={"Authorization": f"Bearer {token2}"},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["lobby_code"] == "GAME01"

    def test_decline_game_invite(self, client: TestClient):
        """Test declining a game invite."""
        email1 = f"decline_inv1_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"decline_inv2_{uuid.uuid4().hex[:8]}@test.com"
        
        token1, user1 = create_test_user(client, email1, "TestPass123!", "Decline Inv One")
        token2, user2 = create_test_user(client, email2, "TestPass123!", "Decline Inv Two")
        
        # Create friendship
        send_response = client.post(
            "/api/v1/friends/request",
            json={"user_id": user2["id"]},
            headers={"Authorization": f"Bearer {token1}"},
        )
        friendship_id = send_response.json()["data"]["friendship_id"]
        
        client.post(
            f"/api/v1/friends/{friendship_id}/accept",
            headers={"Authorization": f"Bearer {token2}"},
        )
        
        # Send invite
        invite_response = client.post(
            f"/api/v1/friends/{user2['id']}/invite",
            json={"lobby_code": "DECL01"},
            headers={"Authorization": f"Bearer {token1}"},
        )
        invite_id = invite_response.json()["data"]["invite_id"]
        
        # Decline invite
        response = client.post(
            f"/api/v1/friends/invites/{invite_id}/decline",
            headers={"Authorization": f"Bearer {token2}"},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True


class TestOnlineStatusSettings:
    """Test online status visibility settings."""

    def test_update_online_status_setting(self, client: TestClient):
        """Test updating online status visibility."""
        email = f"online_setting_{uuid.uuid4().hex[:8]}@test.com"
        token, user = create_test_user(client, email, "TestPass123!", "Online Setting")
        
        # Disable online status
        response = client.put(
            "/api/v1/friends/settings/online-status",
            json={"show_online_status": False},
            headers={"Authorization": f"Bearer {token}"},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["show_online_status"] is False
        
        # Re-enable
        response = client.put(
            "/api/v1/friends/settings/online-status",
            json={"show_online_status": True},
            headers={"Authorization": f"Bearer {token}"},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["show_online_status"] is True
