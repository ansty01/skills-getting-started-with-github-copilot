from urllib.parse import quote


def test_signup_adds_participant(client):
    email = "newstudent@mergington.edu"
    path = f"/activities/{quote('Chess Club')}/signup"
    resp = client.post(path, params={"email": email})
    assert resp.status_code == 200
    assert "Signed up" in resp.json().get("message", "")

    # verify participant present
    all_ = client.get("/activities").json()
    assert email in all_["Chess Club"]["participants"]


def test_duplicate_signup_returns_400(client):
    # michael@mergington.edu is pre-registered in Chess Club
    email = "michael@mergington.edu"
    path = f"/activities/{quote('Chess Club')}/signup"
    resp = client.post(path, params={"email": email})
    assert resp.status_code == 400


def test_max_participants_blocked(client):
    # create a temporary small activity and attempt to overfill it
    from src.app import activities

    activities["Tiny Club"] = {
        "description": "small",
        "schedule": "n/a",
        "max_participants": 1,
        "participants": []
    }

    path = f"/activities/{quote('Tiny Club')}/signup"
    r1 = client.post(path, params={"email": "a@x.com"})
    assert r1.status_code == 200
    r2 = client.post(path, params={"email": "b@x.com"})
    assert r2.status_code == 400


def test_delete_unregister(client):
    # remove existing participant
    path = f"/activities/{quote('Chess Club')}/signup"
    resp = client.delete(path, params={"email": "michael@mergington.edu"})
    assert resp.status_code == 200

    data = client.get("/activities").json()
    assert "michael@mergington.edu" not in data["Chess Club"]["participants"]
