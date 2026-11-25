"""Geometria obiektów sceny potrzebna do sprawdzania kolizji.

Wzory są takie same jak w silniku (engine/src/geometry/), żeby backend i edytor liczyły kolizje identycznie.
"""

import math

from src.config import EPSILON
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


def bounding_box(points: list[tuple[float, float]]) -> tuple[float, float, float, float]:
    """Zwraca najmniejszy nieobrócony prostokąt (min_x, min_y, max_x, max_y), w którym mieszczą się punkty."""
    xs = [x for x, _ in points]
    ys = [y for _, y in points]
    return min(xs), min(ys), max(xs), max(ys)


def boxes_overlap(a: tuple[float, float, float, float], b: tuple[float, float, float, float]) -> bool:
    """Sprawdza, czy dwa prostokąty z bounding_box na siebie nachodzą; stykanie się krawędziami to nie kolizja.

    To szybki odsiew przed dokładnym testem SAT: gdy prostokąty otaczające się nie nakładają, obiekty też nie.
    """
    a_min_x, a_min_y, a_max_x, a_max_y = a
    b_min_x, b_min_y, b_max_x, b_max_y = b
    return (
        a_min_x < b_max_x - EPSILON
        and b_min_x < a_max_x - EPSILON
        and a_min_y < b_max_y - EPSILON
        and b_min_y < a_max_y - EPSILON
    )


def overlaps(a: list[tuple[float, float]], b: list[tuple[float, float]]) -> bool:
    """Sprawdza testem SAT, czy dwa obrócone prostokąty (narożniki z corners) na siebie nachodzą.

    Prostokąty nie nachodzą, jeśli istnieje oś, na której ich rzuty („cienie”) się nie nakładają.
    """
    # Dla prostokątów wystarczą 4 osie: kierunki dwóch sąsiednich boków każdego z nich.
    edges = [(a[0], a[1]), (a[1], a[2]), (b[0], b[1]), (b[1], b[2])]
    for start, end in edges:
        dx = end[0] - start[0]
        dy = end[1] - start[1]
        length = math.hypot(dx, dy)
        # Bok o długości 0 (obiekt o zerowym rozmiarze) nie wyznacza kierunku; dzielenie przez 0 byłoby błędem.
        if length < EPSILON:
            continue
        axis_x = dx / length
        axis_y = dy / length
        # Rzut narożników na oś: iloczyn skalarny mówi, jak daleko punkt leży wzdłuż osi.
        a_values = [x * axis_x + y * axis_y for x, y in a]
        b_values = [x * axis_x + y * axis_y for x, y in b]
        # Przerwa między rzutami: ta oś rozdziela prostokąty, więc nie nachodzą na siebie.
        if max(a_values) <= min(b_values) + EPSILON or max(b_values) <= min(a_values) + EPSILON:
            return False
    # Rzuty nakładają się na każdej osi, więc prostokąty na siebie nachodzą.
    return True
