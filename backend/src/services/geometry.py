"""Geometria obiektów sceny potrzebna do sprawdzania kolizji.

Wzory są takie same jak w silniku (engine/src/geometry/), żeby backend i edytor liczyły kolizje identycznie.
"""

import math

from src.schemas.scene import SceneObject


def corners(scene_object: SceneObject) -> list[tuple[float, float]]:
    """Zwraca cztery narożniki obiektu po skalowaniu i obrocie wokół jego środka (x, y).

    Kolejność (przed obrotem): lewy górny, prawy górny, prawy dolny, lewy dolny.
    """
    # Połowa szerokości i wysokości po skalowaniu.
    half_width = scene_object.width * scene_object.scaleX / 2
    half_height = scene_object.height * scene_object.scaleY / 2
    angle = math.radians(scene_object.rotation)
    cos = math.cos(angle)
    sin = math.sin(angle)
    # Położenie narożników względem środka, zanim obiekt zostanie obrócony.
    offsets = [(-half_width, -half_height), (half_width, -half_height), (half_width, half_height), (-half_width, half_height)]
    result = []
    for dx, dy in offsets:
        # Wzór na obrót punktu wokół środka. Y rośnie w dół, więc dodatni kąt obraca zgodnie z ruchem wskazówek zegara.
        result.append((scene_object.x + dx * cos - dy * sin, scene_object.y + dx * sin + dy * cos))
    return result
