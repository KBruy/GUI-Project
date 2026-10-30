"""Testy formatu błędów: każdy błąd API ma kształt {"error": ...} i nigdy {"detail": ...}."""

import json

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from src.config import Settings
from src.errors import MESSAGE_KEYS, AppError, Issue, error_body
from src.main import create_app
from src.schemas.scene import Scene


@pytest.fixture
def client() -> TestClient:
    """Klient aplikacji z dodatkowymi endpointami testowymi, które rzucają wybrane błędy."""
    app = create_app(Settings(client_origins=["http://localhost:5173"]))

    @app.post("/test/scene")
    def accept_scene(scene: Scene) -> dict:
        return {"name": scene.name}

    @app.get("/test/app-error")
    def raise_app_error() -> None:
        raise AppError("VALIDATION_FAILED", 422, [Issue.of("LAYER_LIMIT")])

    @app.get("/test/not-found")
    def raise_not_found() -> None:
        raise AppError("PROJECT_NOT_FOUND", 404)

    @app.get("/test/crash")
    def crash() -> None:
        raise RuntimeError("nieprzewidziany błąd")

    @app.get("/test/bad-request")
    def bad_request() -> None:
        # Tak FastAPI zgłasza ciało żądania, którego nie umie przetworzyć.
        raise HTTPException(status_code=400, detail="There was an error parsing the body")

    @app.get("/test/bad-response", response_model=Scene)
    def bad_response() -> dict:
        # Odpowiedź niezgodna z response_model to błąd serwera, nie klienta.
        return {"name": "bez reszty pól"}

    return TestClient(app)


def test_message_keys_follow_naming_convention():
    for code, key in MESSAGE_KEYS.items():
        assert code.isupper()
        assert key.startswith("errors.")
        assert "_" not in key


def test_issue_omits_empty_ids():
    assert Issue.of("LAYER_LIMIT").to_dict() == {"code": "LAYER_LIMIT", "messageKey": "errors.layerLimit"}


def test_issue_keeps_layer_and_object_ids():
    issue = Issue.of("SCALE_OUT_OF_RANGE", layerId="l1", objectId="o7")

    assert issue.to_dict() == {
        "code": "SCALE_OUT_OF_RANGE",
        "messageKey": "errors.scaleOutOfRange",
        "layerId": "l1",
        "objectId": "o7",
    }


def test_error_body_without_issues_has_empty_details():
    assert error_body("SERVER_ERROR") == {
        "error": {"code": "SERVER_ERROR", "messageKey": "errors.serverError", "details": {}}
    }


def test_validation_failed_always_has_issues_list():
    assert error_body("VALIDATION_FAILED")["error"]["details"] == {"issues": []}


def test_valid_scene_passes_through_endpoint(client, scene_data):
    response = client.post("/test/scene", json=scene_data)

    assert response.status_code == 200
    assert response.json() == {"name": "Wioska"}


def test_app_error_returns_its_code_and_issues(client):
    response = client.get("/test/app-error")

    assert response.status_code == 422
    assert response.json() == {
        "error": {
            "code": "VALIDATION_FAILED",
            "messageKey": "errors.validationFailed",
            "details": {"issues": [{"code": "LAYER_LIMIT", "messageKey": "errors.layerLimit"}]},
        }
    }


def test_app_error_without_issues_has_empty_details(client):
    response = client.get("/test/not-found")

    assert response.status_code == 404
    assert response.json()["error"] == {
        "code": "PROJECT_NOT_FOUND",
        "messageKey": "errors.projectNotFound",
        "details": {},
    }


def test_wrong_scene_shape_returns_invalid_field_issues(client, scene_data):
    scene_data["layers"][0]["objects"][0]["x"] = "100"
    del scene_data["name"]

    response = client.post("/test/scene", json=scene_data)

    assert response.status_code == 422
    body = response.json()
    assert "detail" not in body
    assert body["error"]["code"] == "VALIDATION_FAILED"
    # Wszystkie problemy naraz, każdy ze ścieżką do pola.
    assert body["error"]["details"]["issues"] == [
        {"code": "INVALID_FIELD", "messageKey": "errors.invalidField", "field": "name"},
        {"code": "INVALID_FIELD", "messageKey": "errors.invalidField", "field": "layers[0].objects[0].x"},
    ]


def test_invalid_json_returns_validation_failed_without_field(client):
    response = client.post(
        "/test/scene", content=b"{nie json", headers={"Content-Type": "application/json"}
    )

    assert response.status_code == 422
    assert response.json()["error"]["details"]["issues"] == [
        {"code": "INVALID_FIELD", "messageKey": "errors.invalidField"}
    ]


def test_unknown_url_returns_not_found(client):
    response = client.get("/api/nie-ma-takiego")

    assert response.status_code == 404
    assert response.json() == {
        "error": {"code": "NOT_FOUND", "messageKey": "errors.notFound", "details": {}}
    }


def test_wrong_method_returns_not_found_code(client):
    response = client.delete("/api/health")

    assert response.status_code == 405
    assert response.json()["error"]["code"] == "NOT_FOUND"


def test_unexpected_exception_returns_server_error(client):
    response = client.get("/test/crash")

    assert response.status_code == 500
    assert response.json() == {
        "error": {"code": "SERVER_ERROR", "messageKey": "errors.serverError", "details": {}}
    }
    # Treść wyjątku nie może wyciec do odpowiedzi.
    assert "nieprzewidziany" not in response.text


def test_server_error_has_cors_header(client):
    response = client.get("/test/crash", headers={"Origin": "http://localhost:5173"})

    # Bez nagłówka CORS przeglądarka ukryłaby odpowiedź 500 i frontend pokazałby tylko błąd sieci.
    assert response.status_code == 500
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_error_responses_have_cors_header(client, scene_data):
    del scene_data["name"]
    origin = {"Origin": "http://localhost:5173"}

    not_found = client.get("/api/nie-ma-takiego", headers=origin)
    assert not_found.status_code == 404
    assert not_found.headers["access-control-allow-origin"] == "http://localhost:5173"

    invalid = client.post("/test/scene", json=scene_data, headers=origin)
    assert invalid.status_code == 422
    assert invalid.headers["access-control-allow-origin"] == "http://localhost:5173"


@pytest.mark.parametrize("value", ["NaN", "Infinity", "-Infinity"])
def test_nan_and_infinity_return_invalid_field(client, scene_data, value):
    # json.dumps nie wyśle NaN, więc wartość jest wstawiana do tekstu JSON ręcznie.
    text = json.dumps(scene_data).replace('"x": 100', f'"x": {value}')

    response = client.post("/test/scene", content=text, headers={"Content-Type": "application/json"})

    assert response.status_code == 422
    assert response.json()["error"]["details"]["issues"] == [
        {"code": "INVALID_FIELD", "messageKey": "errors.invalidField", "field": "layers[0].objects[0].x"}
    ]


def test_unreadable_body_returns_invalid_file(client):
    response = client.get("/test/bad-request")

    assert response.status_code == 400
    assert response.json() == {
        "error": {"code": "INVALID_FILE", "messageKey": "errors.invalidFile", "details": {}}
    }


def test_wrong_response_shape_returns_server_error(client):
    response = client.get("/test/bad-response")

    assert response.status_code == 500
    assert response.json()["error"]["code"] == "SERVER_ERROR"


def test_wrong_method_keeps_allow_header(client):
    assert client.delete("/api/health").headers["allow"] == "GET"
