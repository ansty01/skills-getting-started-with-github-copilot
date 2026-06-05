from copy import deepcopy
import pytest
from fastapi.testclient import TestClient
from src.app import app, activities


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_activities():
    """Reset the in-memory activities dict before/after each test to avoid state leakage."""
    original = deepcopy(activities)
    yield
    activities.clear()
    activities.update(deepcopy(original))
