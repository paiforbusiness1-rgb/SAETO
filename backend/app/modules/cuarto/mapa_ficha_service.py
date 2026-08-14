"""Mapas estáticos tipo portal (OSM + calor) para fichas PDF del cuarto."""

from __future__ import annotations

import json
import math
from functools import lru_cache
from io import BytesIO
from pathlib import Path
from collections.abc import Callable
from typing import Any

import httpx
from PIL import Image, ImageDraw, ImageFont

from app.shared.seed_loader import BACKEND_ROOT

GEO_DIR = BACKEND_ROOT / "data" / "geo"
TILE_CACHE = BACKEND_ROOT / "data" / "cache" / "osm_tiles"
TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
USER_AGENT = "SAETO-CuartoDiagnostico/1.0 (contacto: mesa-oriente; uso institucional)"
TILE_SIZE = 256
DEFAULT_ZONA = "#5a7a6a"
STROKE_RGBA = (255, 255, 255, 170)
TITLE_BG = (15, 28, 36, 230)
ACCENT = "#c4a35a"
TEAL = "#7eb8a2"
MARKER = "#c4a35a"
WHITE = "#ffffff"
FILL_OPACITY = 0.55


@lru_cache(maxsize=1)
def _alcaldias() -> dict[str, Any]:
    path = GEO_DIR / "alcaldias-oriente.json"
    if not path.exists():
        return {"type": "FeatureCollection", "features": []}
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


@lru_cache(maxsize=1)
def _colonias() -> dict[str, Any]:
    path = GEO_DIR / "colonias-demo.json"
    if not path.exists():
        return {"type": "FeatureCollection", "features": []}
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def _font(size: int) -> ImageFont.ImageFont:
    candidates = [
        Path(r"C:\Windows\Fonts\arial.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
        Path("/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"),
        Path("/System/Library/Fonts/Supplemental/Arial.ttf"),
    ]
    for path in candidates:
        if path.exists():
            try:
                return ImageFont.truetype(str(path), size=size)
            except OSError:
                continue
    return ImageFont.load_default()


def _hex_rgb(value: str) -> tuple[int, int, int]:
    h = (value or DEFAULT_ZONA).lstrip("#")
    if len(h) != 6:
        h = "5a7a6a"
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def _hex_rgba(value: str, alpha: float) -> tuple[int, int, int, int]:
    r, g, b = _hex_rgb(value)
    return r, g, b, max(0, min(255, int(round(alpha * 255))))


def _ring_points(ring: list) -> list[tuple[float, float]]:
    out: list[tuple[float, float]] = []
    for pt in ring:
        if len(pt) >= 2:
            out.append((float(pt[0]), float(pt[1])))
    return out


def _feature_rings(feature: dict) -> list[list[tuple[float, float]]]:
    geom = feature.get("geometry") or {}
    gtype = geom.get("type")
    coords = geom.get("coordinates") or []
    rings: list[list[tuple[float, float]]] = []
    if gtype == "Polygon":
        if coords:
            rings.append(_ring_points(coords[0]))
    elif gtype == "MultiPolygon":
        for poly in coords:
            if poly:
                rings.append(_ring_points(poly[0]))
    return [r for r in rings if len(r) >= 3]


def _feature_coords(feature: dict) -> list[tuple[float, float]]:
    geom = feature.get("geometry") or {}
    gtype = geom.get("type")
    coords = geom.get("coordinates") or []
    pts: list[tuple[float, float]] = []
    if gtype in ("Polygon", "MultiPolygon"):
        for ring in _feature_rings(feature):
            pts.extend(ring)
    elif gtype == "Point" and len(coords) >= 2:
        pts.append((float(coords[0]), float(coords[1])))
    return pts


def _bbox(
    features: list[dict],
    pad: float = 0.06,
) -> tuple[float, float, float, float]:
    pts: list[tuple[float, float]] = []
    for f in features:
        pts.extend(_feature_coords(f))
    if not pts:
        return (-99.15, 19.12, -98.95, 19.45)
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    minx, maxx = min(xs), max(xs)
    miny, maxy = min(ys), max(ys)
    dx = max((maxx - minx) * pad, 0.01)
    dy = max((maxy - miny) * pad, 0.01)
    return minx - dx, miny - dy, maxx + dx, maxy + dy


def _lon_to_tile(lon: float, zoom: int) -> float:
    return (lon + 180.0) / 360.0 * (2**zoom)


def _lat_to_tile(lat: float, zoom: int) -> float:
    lat = max(min(lat, 85.05112878), -85.05112878)
    rad = math.radians(lat)
    return (1.0 - math.log(math.tan(rad) + 1.0 / math.cos(rad)) / math.pi) / 2.0 * (
        2**zoom
    )


def _choose_zoom(
    bbox: tuple[float, float, float, float],
    width: int,
    height: int,
    margin: int = 24,
) -> int:
    minx, miny, maxx, maxy = bbox
    usable_w = max(width - 2 * margin, 64)
    usable_h = max(height - 2 * margin - 40, 64)
    for z in range(16, 8, -1):
        dx = abs(_lon_to_tile(maxx, z) - _lon_to_tile(minx, z)) * TILE_SIZE
        dy = abs(_lat_to_tile(miny, z) - _lat_to_tile(maxy, z)) * TILE_SIZE
        if dx <= usable_w and dy <= usable_h:
            return z
    return 11


def _load_cached_tile(z: int, x: int, y: int) -> Image.Image | None:
    cache_path = TILE_CACHE / f"{z}_{x}_{y}.png"
    if not cache_path.exists():
        return None
    try:
        return Image.open(cache_path).convert("RGB")
    except OSError:
        return None


def _save_tile(z: int, x: int, y: int, content: bytes) -> Image.Image | None:
    TILE_CACHE.mkdir(parents=True, exist_ok=True)
    cache_path = TILE_CACHE / f"{z}_{x}_{y}.png"
    try:
        cache_path.write_bytes(content)
        return Image.open(BytesIO(content)).convert("RGB")
    except OSError:
        return None


def _render_basemap(
    bbox: tuple[float, float, float, float],
    width: int,
    height: int,
) -> tuple[Image.Image, Callable[[float, float], tuple[int, int]]] | None:
    """Devuelve imagen RGB base + proyector lon/lat → px, o None si fallan tiles."""
    zoom = _choose_zoom(bbox, width, height)
    minx, miny, maxx, maxy = bbox
    cx = (_lon_to_tile(minx, zoom) + _lon_to_tile(maxx, zoom)) / 2
    cy = (_lat_to_tile(miny, zoom) + _lat_to_tile(maxy, zoom)) / 2

    # Esquina superior-izquierda en coordenadas de tile-píxel
    left = cx * TILE_SIZE - width / 2
    top = cy * TILE_SIZE - height / 2

    x0 = int(math.floor(left / TILE_SIZE))
    y0 = int(math.floor(top / TILE_SIZE))
    x1 = int(math.floor((left + width) / TILE_SIZE))
    y1 = int(math.floor((top + height) / TILE_SIZE))

    canvas = Image.new("RGB", (width, height), (232, 236, 232))
    got_any = False
    missing: list[tuple[int, int]] = []

    for ty in range(y0, y1 + 1):
        for tx in range(x0, x1 + 1):
            n = 2**zoom
            if tx < 0 or ty < 0 or tx >= n or ty >= n:
                continue
            tile = _load_cached_tile(zoom, tx, ty)
            if tile is None:
                missing.append((tx, ty))
                continue
            got_any = True
            canvas.paste(tile, (int(tx * TILE_SIZE - left), int(ty * TILE_SIZE - top)))

    if missing:
        try:
            with httpx.Client(timeout=12.0, headers={"User-Agent": USER_AGENT}) as client:
                for tx, ty in missing:
                    url = TILE_URL.format(z=zoom, x=tx, y=ty)
                    try:
                        resp = client.get(url)
                        if resp.status_code != 200:
                            continue
                        tile = _save_tile(zoom, tx, ty, resp.content)
                        if tile is None:
                            continue
                        got_any = True
                        canvas.paste(
                            tile,
                            (int(tx * TILE_SIZE - left), int(ty * TILE_SIZE - top)),
                        )
                    except Exception:
                        continue
        except Exception:
            pass

    if not got_any:
        return None

    def project(lon: float, lat: float) -> tuple[int, int]:
        x = int(_lon_to_tile(lon, zoom) * TILE_SIZE - left)
        y = int(_lat_to_tile(lat, zoom) * TILE_SIZE - top)
        return x, y

    return canvas, project


def _project_flat(
    lon: float,
    lat: float,
    bbox: tuple[float, float, float, float],
    width: int,
    height: int,
    margin: int = 28,
) -> tuple[int, int]:
    minx, miny, maxx, maxy = bbox
    usable_w = max(width - 2 * margin, 1)
    usable_h = max(height - 2 * margin - 36, 1)
    span_x = max(maxx - minx, 1e-9)
    span_y = max(maxy - miny, 1e-9)
    scale = min(usable_w / span_x, usable_h / span_y)
    ox = margin + (usable_w - scale * span_x) / 2
    oy = margin + 36 + (usable_h - scale * span_y) / 2
    x = int(ox + (lon - minx) * scale)
    y = int(oy + (maxy - lat) * scale)
    return x, y


def _draw_feature_poly(
    overlay: Image.Image,
    feature: dict,
    project,
    fill: str,
    opacity: float = FILL_OPACITY,
    outline_width: int = 2,
) -> None:
    draw = ImageDraw.Draw(overlay, "RGBA")
    fill_c = _hex_rgba(fill, opacity)
    for ring in _feature_rings(feature):
        pts = [project(lon, lat) for lon, lat in ring]
        if len(pts) < 3:
            continue
        draw.polygon(pts, fill=fill_c)
        if outline_width > 0:
            draw.line(pts + [pts[0]], fill=STROKE_RGBA, width=outline_width)


def _focus_bbox(
    alcaldias: list[dict],
    colonias: list[dict],
    color_zonas: dict[str, str],
    color_colonias: dict[str, str],
    focus_zonas: set[str],
    focus_colonias: set[str],
    marcadores: list[dict[str, Any]],
) -> tuple[float, float, float, float]:
    """Encuadre al recorte del caso (prioriza colonias del tema)."""
    zonas = focus_zonas or set(color_zonas.keys())
    cols = focus_colonias or set(color_colonias.keys())

    colonia_feats: list[dict] = []
    for f in colonias:
        slug = (f.get("properties") or {}).get("slug") or ""
        if slug in cols or slug in color_colonias:
            colonia_feats.append(f)

    for m in marcadores:
        colonia_feats.append(
            {
                "geometry": {
                    "type": "Point",
                    "coordinates": [float(m["lng"]), float(m["lat"])],
                }
            }
        )

    # 1) Si hay colonias/marcadores del caso → zoom al clúster (más cercano)
    if colonia_feats:
        return _bbox(colonia_feats, pad=0.55)

    # 2) Si no, polígono(s) de alcaldía del caso
    zona_feats: list[dict] = []
    for f in alcaldias:
        slug = (f.get("properties") or {}).get("slug") or ""
        if slug in zonas or slug in color_zonas:
            zona_feats.append(f)
    if zona_feats:
        return _bbox(zona_feats, pad=0.14)

    return _bbox(alcaldias, pad=0.08)


def _compose_map(
    *,
    titulo: str,
    subtitulo: str,
    color_zonas: dict[str, str],
    color_colonias: dict[str, str],
    focus_zonas: set[str],
    focus_colonias: set[str],
    marcadores: list[dict[str, Any]],
    leyenda: list[tuple[str, str]],
    width: int,
    height: int,
) -> bytes:
    alcaldias = list(_alcaldias().get("features") or [])
    colonias = list(_colonias().get("features") or [])

    bbox = _focus_bbox(
        alcaldias,
        colonias,
        color_zonas,
        color_colonias,
        focus_zonas,
        focus_colonias,
        marcadores,
    )

    hi_w, hi_h = width * 2, height * 2
    base_pack = _render_basemap(bbox, hi_w, hi_h)
    if base_pack is None:
        base = Image.new("RGB", (hi_w, hi_h), (244, 247, 245))
        project = lambda lon, lat: _project_flat(lon, lat, bbox, hi_w, hi_h)
    else:
        base, project = base_pack

    overlay = Image.new("RGBA", (hi_w, hi_h), (0, 0, 0, 0))

    # Alcaldías del recorte (calor del caso) + vecinas tenues si entran al frame
    for f in alcaldias:
        slug = (f.get("properties") or {}).get("slug") or ""
        fill = color_zonas.get(slug) or DEFAULT_ZONA
        opacity = FILL_OPACITY if slug in color_zonas else 0.28
        outline = 4 if slug in color_zonas else 2
        _draw_feature_poly(
            overlay, f, project, fill, opacity=opacity, outline_width=outline
        )

    img = Image.alpha_composite(base.convert("RGBA"), overlay)
    draw = ImageDraw.Draw(img, "RGBA")
    font_title = _font(34)
    font_sub = _font(22)
    font_small = _font(18)

    # Cabecera compacta
    draw.rectangle((0, 0, hi_w, 56), fill=TITLE_BG)
    draw.text((24, 14), titulo[:72], fill=_hex_rgb(WHITE), font=font_title)
    if subtitulo:
        draw.text(
            (hi_w - 24, 18),
            subtitulo[:40],
            fill=_hex_rgb(ACCENT),
            font=font_sub,
            anchor="ra",
        )

    # Colonias del caso en grande; otras solo si caen en el encuadre
    minx, miny, maxx, maxy = bbox
    for f in colonias:
        props = f.get("properties") or {}
        slug = props.get("slug") or ""
        geom = f.get("geometry") or {}
        coords = geom.get("coordinates") or []
        if len(coords) < 2:
            continue
        lon, lat = float(coords[0]), float(coords[1])
        in_frame = minx <= lon <= maxx and miny <= lat <= maxy
        if slug not in color_colonias and not in_frame:
            continue
        x, y = project(lon, lat)
        if slug in color_colonias:
            fill = color_colonias[slug]
            r = 22
            draw.ellipse(
                (x - r, y - r, x + r, y + r),
                fill=_hex_rgba(fill, 0.92),
                outline=(255, 255, 255, 230),
                width=4,
            )
        elif in_frame:
            r = 9
            draw.ellipse(
                (x - r, y - r, x + r, y + r),
                fill=_hex_rgba(ACCENT, 0.7),
                outline=(255, 255, 255, 180),
                width=2,
            )

    for m in marcadores:
        x, y = project(float(m["lng"]), float(m["lat"]))
        color = str(m.get("color") or MARKER)
        r = 12
        draw.ellipse(
            (x - r, y - r, x + r, y + r),
            fill=_hex_rgba(color, 0.95),
            outline=(26, 26, 26, 230),
            width=3,
        )

    if leyenda:
        box_h = 28 + 28 * len(leyenda)
        lx, ly = 20, hi_h - box_h - 28
        draw.rounded_rectangle(
            (lx - 8, ly - 10, lx + 280, hi_h - 22),
            radius=10,
            fill=(255, 255, 255, 220),
            outline=(183, 196, 190, 255),
        )
        draw.text((lx, ly - 4), "Leyenda", fill=(26, 36, 32, 255), font=font_small)
        for i, (label, color) in enumerate(leyenda):
            yy = ly + 22 + i * 28
            draw.rectangle(
                (lx, yy, lx + 22, yy + 16),
                fill=_hex_rgb(color),
                outline=(26, 36, 32, 255),
            )
            draw.text(
                (lx + 32, yy - 2),
                label[:30],
                fill=(26, 36, 32, 255),
                font=font_small,
            )

    draw.text(
        (hi_w - 20, hi_h - 16),
        "Mapa base OpenStreetMap · calor SAETO",
        fill=_hex_rgb(TEAL),
        font=font_small,
        anchor="rd",
    )

    # Downsample → anti-alias limpio; JPEG para fichas livianas
    final = img.convert("RGB").resize((width, height), Image.Resampling.LANCZOS)
    out = BytesIO()
    final.save(out, format="JPEG", quality=90, optimize=True)
    return out.getvalue()


def render_mapa_ficha(
    *,
    titulo: str,
    subtitulo: str = "",
    color_zonas: dict[str, str] | None = None,
    color_colonias: dict[str, str] | None = None,
    focus_zonas: set[str] | None = None,
    focus_colonias: set[str] | None = None,
    marcadores: list[dict[str, Any]] | None = None,
    leyenda: list[tuple[str, str]] | None = None,
    width: int = 1100,
    height: int = 700,
) -> bytes:
    """JPEG del recorte con base OSM y calor (zoom al caso, no a todo Oriente)."""
    cz = color_zonas or {}
    cc = color_colonias or {}
    return _compose_map(
        titulo=titulo,
        subtitulo=subtitulo,
        color_zonas=cz,
        color_colonias=cc,
        focus_zonas=focus_zonas or set(cz.keys()),
        focus_colonias=focus_colonias or set(cc.keys()),
        marcadores=marcadores or [],
        leyenda=leyenda or [],
        width=width,
        height=height,
    )


def leyenda_bandas(items: list[tuple[str, str]]) -> list[tuple[str, str]]:
    """Deduplica (nombre, color) preservando orden."""
    seen: set[str] = set()
    out: list[tuple[str, str]] = []
    for nombre, color in items:
        key = f"{nombre}|{color}"
        if key in seen:
            continue
        seen.add(key)
        out.append((nombre, color))
    return out[:6]
