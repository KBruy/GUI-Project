"""[B-02 - modele i błędy] Kody i klucze błędów API oraz wyjątek AppError.

Każdy błąd API ma kształt {"error": {"code", "messageKey", "details"}} (rozdz. 5.6 dokumentu technicznego).
messageKey to klucz tłumaczenia; tekst komunikatu wyświetla frontend ze swojego słownika.
"""

from pydantic import BaseModel

# Kod błędu → klucz tłumaczenia. Nowy kod wymaga przekazania klucza do słownika frontendu.
MESSAGE_KEYS: dict[str, str] = {
    # Ogólne błędy żądań.
    "VALIDATION_FAILED": "errors.validationFailed",
    "PROJECT_NOT_FOUND": "errors.projectNotFound",
    "INVALID_FILE": "errors.invalidFile",
    "SERVER_ERROR": "errors.serverError",
    "NOT_FOUND": "errors.notFound",
    # Problemy z kształtem danych (zły typ, brak pola, nieznane pole).
    "INVALID_FIELD": "errors.invalidField",
    # Reguły poprawności sceny (rozdz. 5.5); sprawdza je services/validation.py.
    "UNSUPPORTED_SCHEMA_VERSION": "errors.unsupportedSchemaVersion",
    "NAME_REQUIRED": "errors.nameRequired",
    "INVALID_SCENE_SIZE": "errors.invalidSceneSize",
    "LAYER_LIMIT": "errors.layerLimit",
    "DUPLICATE_ID": "errors.duplicateId",
    "ASSET_NOT_FOUND": "errors.assetNotFound",
    "ASSET_WRONG_MODULE": "errors.assetWrongModule",
    "ASSET_SIZE_MISMATCH": "errors.assetSizeMismatch",
    "SCALE_OUT_OF_RANGE": "errors.scaleOutOfRange",
    "ROTATION_OUT_OF_RANGE": "errors.rotationOutOfRange",
    "OBJECT_OUT_OF_BOUNDS": "errors.objectOutOfBounds",
    # Zarezerwowany: kolizje sprawdza silnik, backend dopiero po prototypie (B-10).
    "COLLISION": "errors.collision",
}


class Issue(BaseModel):
    """Jeden problem w danych; lista problemów trafia do details.issues odpowiedzi 422."""

    code: str
    messageKey: str
    # Uzupełniane tylko, gdy problem dotyczy konkretnej warstwy lub obiektu.
    layerId: str | None = None
    objectId: str | None = None
    # Ścieżka do błędnego pola, np. "layers[0].objects[1].x" (tylko przy INVALID_FIELD).
    field: str | None = None

    @classmethod
    def of(cls, code: str, **where: str) -> "Issue":
        """Tworzy problem o danym kodzie; messageKey bierze z MESSAGE_KEYS.

        where to opcjonalne layerId, objectId lub field, np. Issue.of("LAYER_LIMIT") albo Issue.of(..., layerId="l1").
        """
        return cls(code=code, messageKey=MESSAGE_KEYS[code], **where)

    def to_dict(self) -> dict:
        """Zwraca słownik bez pól równych None."""
        return self.model_dump(exclude_none=True)


class AppError(Exception):
    """Błąd zgłaszany przez kod aplikacji; handler w error_handlers.py zamienia go na odpowiedź JSON."""

    def __init__(self, code: str, status_code: int, issues: list[Issue] | None = None):
        super().__init__(code)
        self.code = code
        self.status_code = status_code
        self.issues = issues or []


def error_body(code: str, issues: list[Issue] | None = None) -> dict:
    """Buduje treść odpowiedzi błędu.

    VALIDATION_FAILED ma zawsze details.issues (czasem pustą listę); inne błędy mają details: {}.
    """
    if code == "VALIDATION_FAILED" or issues:
        details = {"issues": [issue.to_dict() for issue in issues or []]}
    else:
        details = {}
    return {"error": {"code": code, "messageKey": MESSAGE_KEYS[code], "details": details}}
