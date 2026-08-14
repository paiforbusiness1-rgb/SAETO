"""PDF de diagnóstico por caso — género de lámina densa, dominio territorial SAETO."""

from __future__ import annotations

from datetime import date
from io import BytesIO

from fastapi import HTTPException
from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.modules.consumibles import cruce_service, tematicos_service
from app.modules.cuarto import caso_service
from app.modules.cuarto.schemas import CasoSituacion
from app.shared import seed_loader

C_BG = HexColor("#0f1c24")
C_MID = HexColor("#1a3340")
C_ACCENT = HexColor("#c4a35a")
C_TEAL = HexColor("#7eb8a2")
C_TEXT = HexColor("#1a2420")
C_MUTED = HexColor("#4a5c56")
C_RULE = HexColor("#c5d0cb")
C_ROW = HexColor("#eef3f0")


def _cfg() -> dict:
    return seed_loader.load_cuarto_reporte() or {}


def _fecha_mesa() -> str:
    meses = _cfg().get("meses") or []
    hoy = date.today()
    mes = meses[hoy.month - 1] if len(meses) >= hoy.month else str(hoy.month)
    return f"{hoy.day} de {mes} de {hoy.year}"


def _titulo_seccion(slug: str, fallback: str) -> str:
    for s in _cfg().get("secciones") or []:
        if s.get("slug") == slug:
            return str(s.get("titulo") or fallback)
    return fallback


def _styles() -> dict[str, ParagraphStyle]:
    return {
        "cover_kicker": ParagraphStyle(
            "cover_kicker", fontName="Helvetica", fontSize=10, textColor=C_ACCENT,
            alignment=TA_CENTER, spaceAfter=6,
        ),
        "cover_brand": ParagraphStyle(
            "cover_brand", fontName="Helvetica-Bold", fontSize=36, textColor=white,
            alignment=TA_CENTER, spaceAfter=8, leading=42,
        ),
        "cover_sub": ParagraphStyle(
            "cover_sub", fontName="Helvetica", fontSize=12, textColor=C_TEAL,
            alignment=TA_CENTER, leading=16, spaceAfter=18,
        ),
        "cover_title": ParagraphStyle(
            "cover_title", fontName="Helvetica-Bold", fontSize=22, textColor=white,
            alignment=TA_CENTER, leading=28, spaceAfter=8,
        ),
        "cover_meta": ParagraphStyle(
            "cover_meta", fontName="Helvetica", fontSize=11, textColor=HexColor("#d5e0db"),
            alignment=TA_CENTER, leading=16,
        ),
        "h1": ParagraphStyle(
            "h1", fontName="Helvetica-Bold", fontSize=16, textColor=C_BG,
            spaceAfter=8, spaceBefore=2,
        ),
        "lead": ParagraphStyle(
            "lead", fontName="Helvetica", fontSize=10, textColor=C_TEXT,
            leading=14, alignment=TA_JUSTIFY, spaceAfter=8,
        ),
        "meta": ParagraphStyle(
            "meta", fontName="Helvetica", fontSize=8.5, textColor=C_MUTED,
            leading=12, spaceAfter=6,
        ),
        "cell": ParagraphStyle(
            "cell", fontName="Helvetica", fontSize=8, textColor=C_TEXT, leading=11,
        ),
        "cell_b": ParagraphStyle(
            "cell_b", fontName="Helvetica-Bold", fontSize=8, textColor=C_TEXT, leading=11,
        ),
        "th": ParagraphStyle(
            "th", fontName="Helvetica-Bold", fontSize=8, textColor=white, leading=11,
        ),
        "kpi_l": ParagraphStyle(
            "kpi_l", fontName="Helvetica", fontSize=7.5, textColor=C_MUTED, alignment=TA_CENTER,
        ),
        "kpi_v": ParagraphStyle(
            "kpi_v", fontName="Helvetica-Bold", fontSize=13, textColor=C_BG, alignment=TA_CENTER, leading=16,
        ),
        "fact": ParagraphStyle(
            "fact", fontName="Helvetica", fontSize=9.5, textColor=C_TEXT, leading=13, leftIndent=8, spaceAfter=4,
        ),
        "rec": ParagraphStyle(
            "rec", fontName="Helvetica", fontSize=10, textColor=C_TEXT, leading=14,
            leftIndent=10, spaceAfter=6,
        ),
        "date": ParagraphStyle(
            "date", fontName="Helvetica-Bold", fontSize=9, textColor=HexColor("#8b3a32"),
        ),
    }


def _p(text: object, style: ParagraphStyle) -> Paragraph:
    raw = "" if text is None else str(text)
    raw = (
        raw.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\n", "<br/>")
    )
    return Paragraph(raw, style)


def _fmt(n: int | float | None) -> str:
    if n is None:
        return "—"
    return f"{int(round(n)):,}".replace(",", " ")


def _table(data: list[list], col_widths: list[float]) -> Table:
    sty = TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, 0), C_MID),
            ("TEXTCOLOR", (0, 0), (-1, 0), white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("GRID", (0, 0), (-1, -1), 0.3, C_RULE),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, C_ROW]),
        ]
    )
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(sty)
    return t


def _kpis(items: list[tuple[str, str]], width: float) -> Table:
    s = _styles()
    n = max(len(items), 1)
    w = width / n
    cells = [
        [
            Table(
                [[_p(lab, s["kpi_l"])], [_p(val, s["kpi_v"])]],
                colWidths=[w - 4],
            )
            for lab, val in items
        ]
    ]
    t = Table(cells, colWidths=[w] * n)
    t.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.4, C_RULE),
                ("INNERGRID", (0, 0), (-1, -1), 0.3, C_RULE),
                ("BACKGROUND", (0, 0), (-1, -1), HexColor("#f7faf8")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return t


def _header_footer(canvas, doc, caso: CasoSituacion) -> None:
    canvas.saveState()
    w, h = landscape(A4)
    canvas.setFillColor(C_BG)
    canvas.rect(0, h - 14 * mm, w, 14 * mm, fill=1, stroke=0)
    canvas.setFillColor(C_ACCENT)
    canvas.rect(0, h - 14.8 * mm, w, 1.2 * mm, fill=1, stroke=0)
    canvas.setFillColor(white)
    canvas.setFont("Helvetica-Bold", 10)
    canvas.drawString(16 * mm, h - 9 * mm, "SAETO")
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(C_TEAL)
    canvas.drawString(32 * mm, h - 9 * mm, caso.nombre)
    canvas.setFillColor(white)
    canvas.drawRightString(w - 16 * mm, h - 9 * mm, _cfg().get("portada", {}).get("territorio", ""))
    canvas.setFillColor(C_MID)
    canvas.rect(0, 0, w, 10 * mm, fill=1, stroke=0)
    canvas.setFillColor(HexColor("#c9d6d0"))
    canvas.setFont("Helvetica", 7)
    pie = str(_cfg().get("pie") or "SAETO")
    canvas.drawString(16 * mm, 4 * mm, pie)
    canvas.drawRightString(w - 16 * mm, 4 * mm, f"{doc.page}")
    canvas.restoreState()


def _cover(caso: CasoSituacion, width: float) -> list:
    s = _styles()
    portada = _cfg().get("portada") or {}
    demanda = caso.demanda.titulo if caso.demanda else caso.tema_nombre
    inner = [
        Spacer(1, 28 * mm),
        _p(str(portada.get("kicker") or "").upper(), s["cover_kicker"]),
        _p(str(portada.get("producto") or "SAETO"), s["cover_brand"]),
        _p(str(portada.get("producto_largo") or ""), s["cover_sub"]),
        Spacer(1, 8 * mm),
        _p(str(portada.get("tipo_documento") or "Diagnóstico"), s["cover_kicker"]),
        _p(caso.nombre, s["cover_title"]),
        _p(caso.subtitulo or caso.resumen, s["cover_meta"]),
        Spacer(1, 10 * mm),
        _p(
            f"{portada.get('territorio') or ''}  ·  {demanda}  ·  {_fecha_mesa()}",
            s["cover_meta"],
        ),
        Spacer(1, 16 * mm),
        _p(
            "Lámina para mesa: un problema, el recorte territorial, la gente impactada, "
            "lo que se decidió y la recomendación. No clona boletines de incidencia delictiva.",
            s["cover_meta"],
        ),
    ]
    shell = Table([[inner]], colWidths=[width])
    shell.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), C_BG),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 18),
                ("LEFTPADDING", (0, 0), (-1, -1), 18),
                ("RIGHTPADDING", (0, 0), (-1, -1), 18),
            ]
        )
    )
    return [shell]


def _page_panorama(caso: CasoSituacion, width: float) -> list:
    s = _styles()
    d = caso.demanda
    story: list = [
        _p(_titulo_seccion("panorama", "Panorama del caso"), s["h1"]),
        _p(caso.resumen, s["lead"]),
    ]
    kpis = [
        ("Tema", caso.tema_nombre),
        ("Población", _fmt(caso.impacto.poblacion_total)),
        ("Viviendas", _fmt(caso.impacto.viviendas_total)),
        ("Lista nominal", _fmt(caso.impacto.lista_nominal_total)),
    ]
    if d:
        kpis.insert(1, ("Semáforo", d.semaforo_etiqueta))
        kpis.append(("Ciclo", f"{d.fase_ciclo_nombre} · {d.sentido_ciclo}"))
    story.append(_kpis(kpis, width))
    story.append(Spacer(1, 4 * mm))
    if d:
        story.append(_p(f"Reivindicación ancla: {d.titulo} · {d.zona_nombre}", s["meta"]))
        if d.resumen_deuda:
            story.append(_p(d.resumen_deuda, s["lead"]))
    if caso.entonces and caso.ahora:
        story.append(_p(_titulo_seccion("impacto", "Entonces y ahora"), s["h1"]))
        story.append(
            _table(
                [
                    [
                        _p("Corte", s["th"]),
                        _p("Población", s["th"]),
                        _p("Intensidad", s["th"]),
                        _p("Lectura", s["th"]),
                    ],
                    [
                        _p(caso.entonces.etiqueta, s["cell_b"]),
                        _p(_fmt(caso.entonces.poblacion), s["cell"]),
                        _p(str(caso.entonces.intensidad), s["cell"]),
                        _p(caso.entonces.nota, s["cell"]),
                    ],
                    [
                        _p(caso.ahora.etiqueta, s["cell_b"]),
                        _p(_fmt(caso.ahora.poblacion), s["cell"]),
                        _p(str(caso.ahora.intensidad), s["cell"]),
                        _p(caso.ahora.nota, s["cell"]),
                    ],
                ],
                [38 * mm, 32 * mm, 28 * mm, width - 98 * mm],
            )
        )
    story.append(Spacer(1, 3 * mm))
    story.append(_p(str(_cfg().get("nota_mapa") or ""), s["meta"]))
    return story


def _page_intensidad(caso: CasoSituacion, width: float) -> list:
    s = _styles()
    story: list = [
        _p(_titulo_seccion("intensidad", "Intensidad territorial"), s["h1"]),
        _p("Recorte del caso por colonia. El color de banda equivale al semáforo de lámina.", s["lead"]),
    ]
    head = [
        _p("Colonia", s["th"]),
        _p("Alcaldía", s["th"]),
        _p("Intensidad", s["th"]),
        _p("Banda", s["th"]),
        _p("Dato clave", s["th"]),
    ]
    rows = [head]
    for c in caso.celdas:
        dato = ""
        if c.metrica_valor is not None:
            clave = (c.metrica_clave or "métrica").replace("_", " ")
            dato = f"{clave}: {c.metrica_valor}"
        elif c.nota_mesa:
            dato = c.nota_mesa
        rows.append(
            [
                _p(c.colonia_nombre, s["cell_b"]),
                _p(c.zona_nombre, s["cell"]),
                _p(f"{c.score:.0f}", s["cell"]),
                _p(c.banda_nombre, s["cell"]),
                _p(dato, s["cell"]),
            ]
        )
    if len(rows) > 1:
        story.append(_table(rows, [48 * mm, 38 * mm, 24 * mm, 28 * mm, width - 138 * mm]))
    if caso.por_zona:
        story.append(Spacer(1, 5 * mm))
        story.append(_p("Agregado por alcaldía", s["h1"]))
        zrows = [[_p("Alcaldía", s["th"]), _p("Índice", s["th"]), _p("Banda", s["th"])]]
        for z in caso.por_zona:
            zrows.append(
                [
                    _p(z.zona_nombre, s["cell_b"]),
                    _p(f"{z.score:.1f}", s["cell"]),
                    _p(z.banda_nombre, s["cell"]),
                ]
            )
        story.append(_table(zrows, [70 * mm, 30 * mm, 40 * mm]))
    return story


def _page_impacto(caso: CasoSituacion, width: float) -> list:
    s = _styles()
    story: list = [
        _p(_titulo_seccion("impacto", "A quién impacta"), s["h1"]),
        _p(
            "Cifras agregadas, sin datos personales: población, densidad, viviendas y lista nominal.",
            s["lead"],
        ),
        _kpis(
            [
                ("Población", _fmt(caso.impacto.poblacion_total)),
                ("Viviendas", _fmt(caso.impacto.viviendas_total)),
                ("Lista nominal", _fmt(caso.impacto.lista_nominal_total)),
                (
                    "Densidad prom.",
                    f"{_fmt(caso.impacto.densidad_promedio)} hab/km²"
                    if caso.impacto.densidad_promedio is not None
                    else "—",
                ),
            ],
            width,
        ),
        Spacer(1, 4 * mm),
    ]
    rows = [
        [
            _p("Colonia", s["th"]),
            _p("Alcaldía", s["th"]),
            _p("Población", s["th"]),
            _p("Densidad", s["th"]),
            _p("Viviendas", s["th"]),
            _p("Lista nominal", s["th"]),
        ]
    ]
    for c in caso.impacto.colonias:
        rows.append(
            [
                _p(c.colonia_nombre, s["cell_b"]),
                _p(c.zona_nombre, s["cell"]),
                _p(_fmt(c.poblacion), s["cell"]),
                _p(_fmt(c.densidad), s["cell"]),
                _p(_fmt(c.viviendas), s["cell"]),
                _p(_fmt(c.lista_nominal), s["cell"]),
            ]
        )
    if len(rows) > 1:
        story.append(_table(rows, [48 * mm, 38 * mm, 28 * mm, 28 * mm, 28 * mm, width - 170 * mm]))
    if caso.impacto.actores:
        story.append(Spacer(1, 4 * mm))
        story.append(_p("Liderazgos en el recorte (nombres públicos de mesa)", s["meta"]))
        story.append(_p(", ".join(caso.impacto.actores), s["lead"]))
    return story


def _page_cruce(caso: CasoSituacion, width: float) -> list:
    s = _styles()
    story: list = [
        _p(_titulo_seccion("cruce", "Cruce electoral × problemática"), s["h1"]),
        _p(str(_cfg().get("nota_electoral") or ""), s["lead"]),
    ]
    wanted = {c.colonia_slug for c in caso.celdas if c.colonia_slug}
    cruce = [
        c
        for c in cruce_service.celdas_cruce(caso.tema)
        if not wanted or c.colonia_slug in wanted
    ]
    rows = [
        [
            _p("Colonia", s["th"]),
            _p("Problema", s["th"]),
            _p("Índice electoral", s["th"]),
            _p("Densidad", s["th"]),
            _p("Cruce", s["th"]),
            _p("Banda", s["th"]),
        ]
    ]
    for c in cruce:
        rows.append(
            [
                _p(c.colonia_nombre, s["cell_b"]),
                _p(f"{(c.intensidad_tema or 0):.0f}", s["cell"]),
                _p(f"{(c.indice_electoral or 0):.0f}", s["cell"]),
                _p(_fmt(c.densidad), s["cell"]),
                _p(f"{c.score:.1f}", s["cell"]),
                _p(c.banda_nombre, s["cell"]),
            ]
        )
    if len(rows) > 1:
        story.append(_table(rows, [50 * mm, 28 * mm, 32 * mm, 32 * mm, 24 * mm, width - 166 * mm]))
    else:
        story.append(_p("Sin cruce cargado para este recorte.", s["meta"]))

    demo = tematicos_service.demografia_map()
    hist_rows = [
        [
            _p("Colonia", s["th"]),
            _p("2021 fuerza A", s["th"]),
            _p("2021 fuerza B", s["th"]),
            _p("2024 fuerza A", s["th"]),
            _p("2024 fuerza B", s["th"]),
            _p("Participación", s["th"]),
        ]
    ]
    for slug in wanted:
        row = demo.get(slug) or {}
        h = {str(x.get("eleccion")): x for x in (row.get("historicidad") or [])}
        a21, b21 = h.get("2021") or {}, h.get("2024") or {}
        hist_rows.append(
            [
                _p(row.get("nombre") or slug, s["cell_b"]),
                _p(_pct(a21.get("fuerza_a")), s["cell"]),
                _p(_pct(a21.get("fuerza_b")), s["cell"]),
                _p(_pct(b21.get("fuerza_a")), s["cell"]),
                _p(_pct(b21.get("fuerza_b")), s["cell"]),
                _p(_pct(row.get("participacion_pct")), s["cell"]),
            ]
        )
    if len(hist_rows) > 1:
        story.append(Spacer(1, 5 * mm))
        story.append(_p("Tendencia de voto 2021–2024 (recorte del caso)", s["h1"]))
        story.append(_table(hist_rows, [48 * mm, 32 * mm, 32 * mm, 32 * mm, 32 * mm, width - 176 * mm]))
    return story


def _pct(v: object) -> str:
    if v is None or v == "":
        return "—"
    try:
        return f"{float(v):.1f} %"
    except (TypeError, ValueError):
        return "—"


def _page_instalaciones(caso: CasoSituacion, width: float) -> list | None:
    if not caso.instalaciones:
        return None
    s = _styles()
    story: list = [
        _p(_titulo_seccion("instalaciones", "Infraestructura del recorte"), s["h1"]),
        _p("Puntos temáticos del recorte (pipas, tanques, circuitos u otros según el caso).", s["lead"]),
    ]
    rows = [
        [
            _p("Punto", s["th"]),
            _p("Tipo", s["th"]),
            _p("Colonia", s["th"]),
            _p("Estado", s["th"]),
            _p("Nota de mesa", s["th"]),
        ]
    ]
    for p in caso.instalaciones:
        rows.append(
            [
                _p(p.nombre, s["cell_b"]),
                _p(p.tipo_nombre, s["cell"]),
                _p(p.colonia_nombre, s["cell"]),
                _p(p.estado_nombre, s["cell"]),
                _p(p.nota, s["cell"]),
            ]
        )
    story.append(_table(rows, [52 * mm, 32 * mm, 40 * mm, 32 * mm, width - 156 * mm]))
    return story


def _page_hechos(caso: CasoSituacion, width: float) -> list:
    s = _styles()
    story: list = [
        _p(_titulo_seccion("hechos", "Hechos y decisiones"), s["h1"]),
        _p("Acción vecinal, respuesta de gobierno y resultado. Fechas que importan a la mesa.", s["lead"]),
    ]
    if not caso.timeline:
        story.append(_p("Aún no hay eventos de coyuntura ligados a este caso.", s["meta"]))
        return story
    rows = [
        [
            _p("Fecha", s["th"]),
            _p("Hecho", s["th"]),
            _p("Respuesta", s["th"]),
            _p("Resultado", s["th"]),
        ]
    ]
    for e in caso.timeline:
        hecho = e.tipo_nombre
        if e.actor_nombre:
            hecho += f" · {e.actor_nombre}"
        if e.descripcion:
            hecho += f" — {e.descripcion}"
        resp = e.respuesta_nombre
        if e.detalle_respuesta:
            resp += f" — {e.detalle_respuesta}"
        rows.append(
            [
                _p(e.fecha, s["date"]),
                _p(hecho, s["cell"]),
                _p(resp, s["cell"]),
                _p(e.resultado, s["cell"]),
            ]
        )
    story.append(_table(rows, [28 * mm, (width - 28 * mm) * 0.42, (width - 28 * mm) * 0.28, (width - 28 * mm) * 0.30]))
    return story


def _page_lectura(caso: CasoSituacion, _width: float) -> list:
    s = _styles()
    story: list = [
        _p(_titulo_seccion("lectura", "Lectura y recomendaciones de mesa"), s["h1"]),
    ]
    if caso.contexto.texto:
        story.append(_p(caso.contexto.texto, s["lead"]))
    for f in caso.contexto.factores:
        story.append(_p(f"• {f}", s["fact"]))
    story.append(Spacer(1, 3 * mm))
    story.append(_p("Recomendaciones de cobertura (no patrullaje)", s["h1"]))
    if caso.recomendaciones:
        for r in caso.recomendaciones:
            story.append(_p(f"→  {r}", s["rec"]))
    else:
        story.append(_p("Sin recomendaciones cargadas para este tema.", s["meta"]))
    story.append(Spacer(1, 6 * mm))
    story.append(
        _p(
            "El mismo formato sirve cuando la mesa cargue su información operativa. "
            "Este archivo no sustituye el recorrido en pantalla ni las láminas de calor.",
            s["meta"],
        )
    )
    return story


def generar_pdf(slug: str) -> tuple[bytes, str]:
    caso = caso_service.get_caso(slug)
    buf = BytesIO()
    pagesize = landscape(A4)
    width = pagesize[0] - 32 * mm

    def on_later(canvas, doc):
        _header_footer(canvas, doc, caso)

    def on_first(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(C_BG)
        canvas.rect(0, 0, pagesize[0], pagesize[1], fill=1, stroke=0)
        canvas.restoreState()

    doc = SimpleDocTemplate(
        buf,
        pagesize=pagesize,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        topMargin=20 * mm,
        bottomMargin=14 * mm,
        title=f"SAETO · {caso.nombre}",
        author="SAETO",
    )
    story: list = []
    story.extend(_cover(caso, pagesize[0] - 32 * mm))
    bloques = (
        _page_panorama(caso, width),
        _page_intensidad(caso, width),
        _page_impacto(caso, width),
        _page_cruce(caso, width),
        _page_instalaciones(caso, width),
        _page_hechos(caso, width),
        _page_lectura(caso, width),
    )
    for block in bloques:
        if not block:
            continue
        story.append(PageBreak())
        story.extend(block)

    doc.build(story, onFirstPage=on_first, onLaterPages=on_later)
    seed_loader.append_audit(
        {
            "accion": "exportar_diagnostico_caso",
            "recurso": f"caso:{caso.slug}",
            "formato": "pdf",
        }
    )
    filename = f"SAETO-diagnostico-{caso.slug}.pdf"
    return buf.getvalue(), filename


def generar_o_404(slug: str) -> tuple[bytes, str]:
    try:
        return generar_pdf(slug)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="No se pudo armar el diagnóstico. Recalcule el caso e intente de nuevo.",
        ) from exc
