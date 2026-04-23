"""Testes de integração do bounded context identity."""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_login_me_refresh_logout_flow(client: TestClient, admin_login: dict[str, str]) -> None:
    me_response = client.get("/api/v1/identity/me", headers={"Authorization": admin_login["Authorization"]})
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "admin@example.com"

    refresh_response = client.post(
        "/api/v1/identity/refresh",
        json={"refresh_token": admin_login["refresh_token"]},
    )
    assert refresh_response.status_code == 200
    rotated = refresh_response.json()
    assert rotated["refresh_token"] != admin_login["refresh_token"]

    logout_response = client.post(
        "/api/v1/identity/logout",
        json={"refresh_token": rotated["refresh_token"]},
    )
    assert logout_response.status_code == 200

    invalid_refresh = client.post(
        "/api/v1/identity/refresh",
        json={"refresh_token": rotated["refresh_token"]},
    )
    assert invalid_refresh.status_code == 401


def test_identity_admin_user_management_and_password_reset(
    client: TestClient,
    admin_login: dict[str, str],
) -> None:
    headers = {"Authorization": admin_login["Authorization"]}

    create_response = client.post(
        "/api/v1/identity/users",
        headers=headers,
        json={
            "name": "Operador",
            "email": "operador@example.com",
            "password": "Senha@1234",
            "role": "user",
            "is_active": True,
        },
    )
    assert create_response.status_code == 201
    created_user = create_response.json()

    list_response = client.get("/api/v1/identity/users", headers=headers)
    assert list_response.status_code == 200
    assert list_response.json()["total"] == 2

    detail_response = client.get(
        f"/api/v1/identity/users/{created_user['id']}",
        headers=headers,
    )
    assert detail_response.status_code == 200
    assert detail_response.json()["email"] == "operador@example.com"

    update_response = client.put(
        f"/api/v1/identity/users/{created_user['id']}",
        headers=headers,
        json={"role": "admin", "is_active": False},
    )
    assert update_response.status_code == 200
    assert update_response.json()["role"] == "admin"
    assert update_response.json()["is_active"] is False

    login_inactive = client.post(
        "/api/v1/identity/login",
        json={"email": "operador@example.com", "password": "Senha@1234"},
    )
    assert login_inactive.status_code == 401

    reactivate_response = client.put(
        f"/api/v1/identity/users/{created_user['id']}",
        headers=headers,
        json={"is_active": True, "role": "user"},
    )
    assert reactivate_response.status_code == 200

    reset_response = client.post(
        f"/api/v1/identity/users/{created_user['id']}/reset-password",
        headers=headers,
    )
    assert reset_response.status_code == 200
    reset_payload = reset_response.json()
    assert "token=" in reset_payload["reset_url"]

    consume_response = client.post(
        "/api/v1/identity/password-resets/consume",
        json={
            "reset_token": reset_payload["reset_token"],
            "new_password": "NovaSenha@1234",
        },
    )
    assert consume_response.status_code == 200

    old_login = client.post(
        "/api/v1/identity/login",
        json={"email": "operador@example.com", "password": "Senha@1234"},
    )
    assert old_login.status_code == 401

    new_login = client.post(
        "/api/v1/identity/login",
        json={"email": "operador@example.com", "password": "NovaSenha@1234"},
    )
    assert new_login.status_code == 200


def test_existing_admin_routes_require_admin(client: TestClient, admin_login: dict[str, str]) -> None:
    unauthorized_stats = client.get("/admin/stats")
    assert unauthorized_stats.status_code == 401

    authorized_stats = client.get(
        "/admin/stats",
        headers={"Authorization": admin_login["Authorization"]},
    )
    assert authorized_stats.status_code == 200
    assert "users" in authorized_stats.json()

    reset_response = client.post(
        "/admin/reset-database",
        headers={"Authorization": admin_login["Authorization"]},
    )
    assert reset_response.status_code == 200

    relogin = client.post(
        "/api/v1/identity/login",
        json={"email": "admin@example.com", "password": "Admin@12345"},
    )
    assert relogin.status_code == 200
