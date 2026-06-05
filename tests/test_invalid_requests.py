from urllib.parse import quote


def test_signup_returns_404_for_missing_activity(client):
    path = f"/activities/{quote('Nonexistent Club')}/signup"
    resp = client.post(path, params={"email": "student@mergington.edu"})
    assert resp.status_code == 404


def test_delete_returns_404_for_unregistered_student(client):
    path = f"/activities/{quote('Chess Club')}/signup"
    resp = client.delete(path, params={"email": "not-registered@mergington.edu"})
    assert resp.status_code == 404


def test_signup_rejects_missing_email(client):
    path = f"/activities/{quote('Chess Club')}/signup"
    resp = client.post(path)
    assert resp.status_code == 422


def test_activity_name_encoding(client):
    from src.app import activities

    activities["New Club"] = {
        "description": "A new club with spaces",
        "schedule": "Fridays",
        "max_participants": 10,
        "participants": []
    }

    path = f"/activities/{quote('New Club')}/signup"
    resp = client.post(path, params={"email": "spacey@mergington.edu"})
    assert resp.status_code == 200
    assert "spacey@mergington.edu" in client.get("/activities").json()["New Club"]["participants"]
