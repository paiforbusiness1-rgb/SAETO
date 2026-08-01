"""Genera plantillas percepción y diagnóstico + índice. Ejecutar desde backend/."""
from __future__ import annotations

import json
from pathlib import Path

CFG = Path(__file__).resolve().parents[1] / "config"


def op(*pairs: tuple[str, str]) -> list[dict]:
    return [{"slug": s, "nombre": n} for s, n in pairs]


def escala(mn: int, mx: int) -> list[dict]:
    return [{"slug": str(i), "nombre": str(i)} for i in range(mn, mx + 1)]


EDAD = op(
    ("menor_18", "Menor de 18 años"),
    ("18_29", "18 a 29 años"),
    ("30_44", "30 a 44 años"),
    ("45_59", "45 a 59 años"),
    ("60_mas", "60 años o más"),
)
SEXO = op(
    ("mujer", "Mujer"),
    ("hombre", "Hombre"),
    ("otro", "Otro"),
    ("prefiero_no", "Prefiero no responder"),
)


def build_preguntas(adds: list) -> list[dict]:
    out: list[dict] = []
    for i, item in enumerate(adds, start=1):
        p = {
            "slug": item["slug"],
            "texto": item["texto"],
            "tipo": item["tipo"],
            "bloque": item["bloque"],
            "obligatoria": item.get("obligatoria", True),
            "orden": i,
            "opciones": item.get("opciones") or [],
        }
        for k in (
            "max_selecciones",
            "min",
            "max",
            "max_chars",
            "etiqueta_min",
            "etiqueta_max",
        ):
            if k in item:
                p[k] = item[k]
        out.append(p)
    return out


PERC_ADDS = [
    {"slug": "edad", "texto": "Edad", "tipo": "opcion_unica", "bloque": "datos", "opciones": EDAD},
    {"slug": "sexo", "texto": "Sexo", "tipo": "opcion_unica", "bloque": "datos", "opciones": SEXO},
    {
        "slug": "satisfaccion_zona",
        "texto": "En general, ¿qué tan satisfecho(a) está con vivir en esta zona?",
        "tipo": "opcion_unica",
        "bloque": "calidad_vida",
        "opciones": op(
            ("muy_satisfecho", "Muy satisfecho(a)"),
            ("satisfecho", "Satisfecho(a)"),
            ("neutral", "Ni satisfecho(a) ni insatifecho(a)"),
            ("insatisfecho", "Insatisfecho(a)"),
            ("muy_insatisfecho", "Muy insatisfecho(a)"),
        ),
    },
    {
        "slug": "comparacion_5_anos",
        "texto": "En comparación con hace cinco años, considera que esta zona está:",
        "tipo": "opcion_unica",
        "bloque": "calidad_vida",
        "opciones": op(
            ("mucho_mejor", "Mucho mejor"),
            ("mejor", "Mejor"),
            ("igual", "Igual"),
            ("peor", "Peor"),
            ("mucho_peor", "Mucho peor"),
        ),
    },
    {
        "slug": "recomienda_zona",
        "texto": "¿Recomendaría esta zona como un buen lugar para vivir?",
        "tipo": "opcion_unica",
        "bloque": "calidad_vida",
        "opciones": op(("si", "Sí"), ("no", "No"), ("no_sabe", "No sabe")),
    },
    {
        "slug": "principales_problemas",
        "texto": "¿Cuáles considera que son los tres principales problemas de esta zona?",
        "tipo": "opcion_multiple",
        "bloque": "problemas",
        "max_selecciones": 3,
        "opciones": op(
            ("inseguridad", "Inseguridad"),
            ("desempleo", "Desempleo"),
            ("corrupcion", "Corrupción"),
            ("falta_agua", "Falta de agua"),
            ("calles_mal_estado", "Calles en mal estado"),
            ("falta_salud", "Falta de servicios de salud"),
            ("contaminacion", "Contaminación"),
            ("transporte_deficiente", "Transporte público deficiente"),
            ("falta_espacios", "Falta de espacios recreativos"),
            ("pobreza", "Pobreza"),
            ("violencia_familiar", "Violencia familiar"),
            ("consumo_drogas", "Consumo de drogas"),
        ),
    },
    {
        "slug": "seguridad_percibida",
        "texto": "¿Qué tan seguro(a) se siente en esta zona?",
        "tipo": "opcion_unica",
        "bloque": "seguridad",
        "opciones": op(
            ("muy_seguro", "Muy seguro(a)"),
            ("seguro", "Seguro(a)"),
            ("poco_seguro", "Poco seguro(a)"),
            ("nada_seguro", "Nada seguro(a)"),
        ),
    },
    {
        "slug": "evita_salir",
        "texto": "¿Evita salir a ciertas horas por temor a la delincuencia?",
        "tipo": "opcion_unica",
        "bloque": "seguridad",
        "opciones": op(
            ("siempre", "Siempre"),
            ("frecuentemente", "Frecuentemente"),
            ("algunas_veces", "Algunas veces"),
            ("nunca", "Nunca"),
        ),
    },
    {
        "slug": "presencia_policial",
        "texto": "¿Considera suficiente la presencia policial en su comunidad?",
        "tipo": "opcion_unica",
        "bloque": "seguridad",
        "opciones": op(("si", "Sí"), ("no", "No"), ("no_sabe", "No sabe")),
    },
]

# Fix typo in neutral label
PERC_ADDS[2]["opciones"][2]["nombre"] = "Ni satisfecho(a) ni insatisfecho(a)"

for slug, texto in [
    ("svc_agua", "Agua potable"),
    ("svc_alumbrado", "Alumbrado público"),
    ("svc_basura", "Recolección de basura"),
    ("svc_pavimentacion", "Pavimentación de calles"),
    ("svc_parques", "Parques y áreas verdes"),
    ("svc_transporte", "Transporte público"),
]:
    PERC_ADDS.append(
        {
            "slug": slug,
            "texto": f"Califique el servicio: {texto} (1=Muy malo … 5=Muy bueno)",
            "tipo": "escala",
            "bloque": "servicios",
            "opciones": escala(1, 5),
            "min": 1,
            "max": 5,
            "etiqueta_min": "Muy malo",
            "etiqueta_max": "Muy bueno",
        }
    )

PERC_ADDS.extend(
    [
        {
            "slug": "confianza_gobierno",
            "texto": "¿Qué tanto confía en el gobierno?",
            "tipo": "opcion_unica",
            "bloque": "gobierno",
            "opciones": op(
                ("mucho", "Mucho"),
                ("algo", "Algo"),
                ("poco", "Poco"),
                ("nada", "Nada"),
            ),
        },
        {
            "slug": "autoridades_escuchan",
            "texto": "¿Considera que las autoridades escuchan las necesidades de la ciudadanía?",
            "tipo": "opcion_unica",
            "bloque": "gobierno",
            "opciones": op(
                ("siempre", "Siempre"),
                ("frecuentemente", "Frecuentemente"),
                ("algunas_veces", "Algunas veces"),
                ("nunca", "Nunca"),
            ),
        },
        {
            "slug": "transparencia",
            "texto": "¿Qué tan transparente considera la actuación del gobierno?",
            "tipo": "opcion_unica",
            "bloque": "gobierno",
            "opciones": op(
                ("muy_transparente", "Muy transparente"),
                ("transparente", "Transparente"),
                ("poco_transparente", "Poco transparente"),
                ("nada_transparente", "Nada transparente"),
            ),
        },
        {
            "slug": "programa_social",
            "texto": "¿Usted o algún integrante de su hogar recibe actualmente algún apoyo o programa social del gobierno?",
            "tipo": "opcion_unica",
            "bloque": "gobierno",
            "opciones": op(
                ("federal", "Sí, del gobierno federal"),
                ("local", "Sí, del gobierno local"),
                ("varios", "Sí, de más de un nivel de gobierno"),
                ("ninguno", "No recibe ningún apoyo"),
                ("no_sabe", "No sabe / Prefiere no responder"),
            ),
        },
        {
            "slug": "programas_mejoran_vida",
            "texto": "En su opinión, los programas y apoyos sociales que otorgan los gobiernos federal, estatal y municipal contribuyen a mejorar la calidad de vida de la población.",
            "tipo": "opcion_unica",
            "bloque": "gobierno",
            "opciones": op(
                ("totalmente_acuerdo", "Totalmente de acuerdo"),
                ("de_acuerdo", "De acuerdo"),
                ("neutral", "Ni de acuerdo ni en desacuerdo"),
                ("desacuerdo", "En desacuerdo"),
                ("totalmente_desacuerdo", "Totalmente en desacuerdo"),
            ),
        },
        {
            "slug": "satisfaccion_acceso_programas",
            "texto": "¿Qué tan satisfecho(a) está con la información y facilidad para acceder a los programas sociales gubernamentales?",
            "tipo": "opcion_unica",
            "bloque": "gobierno",
            "opciones": op(
                ("muy_satisfecho", "Muy satisfecho(a)"),
                ("satisfecho", "Satisfecho(a)"),
                ("poco_satisfecho", "Poco satisfecho(a)"),
                ("nada_satisfecho", "Nada satisfecho(a)"),
                ("desconozco", "Desconozco los programas existentes"),
            ),
        },
        {
            "slug": "desempeno_gobierno",
            "texto": "En una escala del 1 al 10, ¿cómo califica el desempeño del gobierno?",
            "tipo": "escala",
            "bloque": "gobierno",
            "opciones": escala(1, 10),
            "min": 1,
            "max": 10,
        },
        {
            "slug": "participo_actividad",
            "texto": "¿Ha participado en alguna actividad comunitaria o consulta ciudadana durante el último año?",
            "tipo": "opcion_unica",
            "bloque": "participacion",
            "opciones": op(("si", "Sí"), ("no", "No")),
        },
        {
            "slug": "dispuesto_participar",
            "texto": "¿Estaría dispuesto(a) a participar en actividades para mejorar su comunidad?",
            "tipo": "opcion_unica",
            "bloque": "participacion",
            "opciones": op(("si", "Sí"), ("no", "No"), ("tal_vez", "Tal vez")),
        },
        {
            "slug": "mejor_forma_escucha",
            "texto": "¿Cuál considera que es la mejor forma para que el gobierno conozca las necesidades de la población?",
            "tipo": "opcion_unica",
            "bloque": "participacion",
            "opciones": op(
                ("asambleas", "Asambleas comunitarias"),
                ("encuestas", "Encuestas ciudadanas"),
                ("redes", "Redes sociales"),
                ("comites", "Comités vecinales"),
                ("apps", "Aplicaciones móviles"),
                ("oficinas", "Atención directa en oficinas"),
            ),
        },
        {
            "slug": "gusta_zona",
            "texto": "¿Qué es lo que más le gusta de esta zona?",
            "tipo": "texto",
            "bloque": "abiertas",
            "obligatoria": False,
            "max_chars": 500,
        },
        {
            "slug": "preocupa_zona",
            "texto": "¿Qué es lo que más le preocupa de esta zona?",
            "tipo": "texto",
            "bloque": "abiertas",
            "obligatoria": False,
            "max_chars": 500,
        },
        {
            "slug": "cambiaria_zona",
            "texto": "Si pudiera cambiar una sola cosa de esta zona, ¿qué cambiaría?",
            "tipo": "texto",
            "bloque": "abiertas",
            "obligatoria": False,
            "max_chars": 500,
        },
    ]
)

DIAG_ADDS = [
    {"slug": "edad", "texto": "Edad", "tipo": "opcion_unica", "bloque": "datos", "opciones": EDAD},
    {"slug": "sexo", "texto": "Sexo", "tipo": "opcion_unica", "bloque": "datos", "opciones": SEXO},
    {
        "slug": "personas_hogar",
        "texto": "Número de personas que habitan en su hogar",
        "tipo": "numero",
        "bloque": "datos",
    },
    {
        "slug": "menores_hogar",
        "texto": "¿Cuántos menores de edad viven en su hogar?",
        "tipo": "opcion_unica",
        "bloque": "datos",
        "opciones": op(
            ("ninguno", "Ninguno"),
            ("1_2", "1-2"),
            ("3_4", "3-4"),
            ("mas_4", "Más de 4"),
        ),
    },
    {
        "slug": "agua_potable",
        "texto": "¿Su vivienda cuenta con agua potable?",
        "tipo": "opcion_unica",
        "bloque": "servicios",
        "opciones": op(
            ("continua", "Sí, de manera continua"),
            ("interrupciones", "Sí, pero con interrupciones frecuentes"),
            ("no", "No"),
        ),
    },
    {
        "slug": "drenaje",
        "texto": "¿Cuenta con drenaje?",
        "tipo": "opcion_unica",
        "bloque": "servicios",
        "opciones": op(("si", "Sí"), ("no", "No")),
    },
    {
        "slug": "basura_califica",
        "texto": "¿Cómo califica el servicio de recolección de basura?",
        "tipo": "opcion_unica",
        "bloque": "servicios",
        "opciones": op(
            ("muy_bueno", "Muy bueno"),
            ("bueno", "Bueno"),
            ("regular", "Regular"),
            ("malo", "Malo"),
            ("muy_malo", "Muy malo"),
        ),
    },
    {
        "slug": "estado_calles",
        "texto": "¿Cómo considera el estado de las calles de esta zona?",
        "tipo": "opcion_unica",
        "bloque": "servicios",
        "opciones": op(
            ("muy_bueno", "Muy bueno"),
            ("bueno", "Bueno"),
            ("regular", "Regular"),
            ("malo", "Malo"),
            ("muy_malo", "Muy malo"),
        ),
    },
    {
        "slug": "alumbrado_suficiente",
        "texto": "¿Existe suficiente alumbrado público en su comunidad?",
        "tipo": "opcion_unica",
        "bloque": "servicios",
        "opciones": op(("si", "Sí"), ("no", "No")),
    },
    {
        "slug": "servicio_salud",
        "texto": "¿Cuenta con algún servicio de salud?",
        "tipo": "opcion_unica",
        "bloque": "salud",
        "opciones": op(
            ("imss", "IMSS"),
            ("issste", "ISSSTE"),
            ("insabi", "INSABI/Servicios estatales"),
            ("privado", "Privado"),
            ("ninguno", "Ninguno"),
        ),
    },
    {
        "slug": "acceso_medico",
        "texto": "¿Qué tan fácil es acceder a servicios médicos en la zona donde vive?",
        "tipo": "opcion_unica",
        "bloque": "salud",
        "opciones": op(
            ("muy_facil", "Muy fácil"),
            ("facil", "Fácil"),
            ("dificil", "Difícil"),
            ("muy_dificil", "Muy difícil"),
        ),
    },
    {
        "slug": "necesidad_salud",
        "texto": "¿Cuál es la principal necesidad en materia de salud?",
        "tipo": "opcion_unica",
        "bloque": "salud",
        "opciones": op(
            ("centros", "Más centros de salud"),
            ("medicamentos", "Medicamentos"),
            ("especialistas", "Especialistas"),
            ("psicologica", "Atención psicológica"),
            ("urgencias", "Servicios de urgencias"),
        ),
    },
    {
        "slug": "escuelas_cerca",
        "texto": "¿Hay suficientes escuelas cerca de su domicilio?",
        "tipo": "opcion_unica",
        "bloque": "educacion",
        "opciones": op(("si", "Sí"), ("no", "No")),
    },
    {
        "slug": "problema_educativo",
        "texto": "¿Cuál considera que es el principal problema educativo de esta zona?",
        "tipo": "opcion_unica",
        "bloque": "educacion",
        "opciones": op(
            ("falta_escuelas", "Falta de escuelas"),
            ("desercion", "Deserción escolar"),
            ("infraestructura", "Infraestructura deficiente"),
            ("becas", "Falta de becas"),
            ("internet", "Falta de acceso a internet"),
        ),
    },
    {
        "slug": "situacion_laboral",
        "texto": "Situación laboral actual",
        "tipo": "opcion_unica",
        "bloque": "economia",
        "opciones": op(
            ("empleado", "Empleado"),
            ("desempleado", "Desempleado"),
            ("independiente", "Trabajador independiente"),
            ("estudiante", "Estudiante"),
            ("jubilado", "Jubilado"),
            ("hogar", "Ama de casa"),
        ),
    },
    {
        "slug": "oportunidades_empleo",
        "texto": "¿Considera que existen suficientes oportunidades de empleo en esta zona?",
        "tipo": "opcion_unica",
        "bloque": "economia",
        "opciones": op(("si", "Sí"), ("no", "No")),
    },
    {
        "slug": "necesidad_economica",
        "texto": "¿Cuál es la principal necesidad económica de su comunidad?",
        "tipo": "opcion_unica",
        "bloque": "economia",
        "opciones": op(
            ("empleos", "Más empleos"),
            ("capacitacion", "Capacitación laboral"),
            ("emprender", "Apoyos para emprender"),
            ("seguridad_economica", "Mayor seguridad económica"),
        ),
    },
    {
        "slug": "seguridad_percibida",
        "texto": "¿Se siente seguro en esta zona?",
        "tipo": "opcion_unica",
        "bloque": "seguridad",
        "opciones": op(
            ("muy_seguro", "Muy seguro"),
            ("seguro", "Seguro"),
            ("poco_seguro", "Poco seguro"),
            ("nada_seguro", "Nada seguro"),
        ),
    },
    {
        "slug": "victima_delito",
        "texto": "¿Ha sido víctima de algún delito en el último año?",
        "tipo": "opcion_unica",
        "bloque": "seguridad",
        "opciones": op(("si", "Sí"), ("no", "No")),
    },
    {
        "slug": "problemas_seguridad",
        "texto": "¿Cuáles son los principales problemas de seguridad? (Puede marcar más de una opción)",
        "tipo": "opcion_multiple",
        "bloque": "seguridad",
        "max_selecciones": 5,
        "opciones": op(
            ("robo", "Robo"),
            ("drogas", "Consumo de drogas"),
            ("violencia_familiar", "Violencia familiar"),
            ("pandillas", "Pandillas"),
            ("falta_vigilancia", "Falta de vigilancia policial"),
        ),
    },
    {
        "slug": "prioridades_comunidad",
        "texto": "Seleccione las tres necesidades más importantes de esta zona",
        "tipo": "opcion_multiple",
        "bloque": "prioridades",
        "max_selecciones": 3,
        "opciones": op(
            ("seguridad", "Seguridad pública"),
            ("agua", "Agua potable"),
            ("pavimentacion", "Pavimentación de calles"),
            ("empleo", "Empleo"),
            ("salud", "Salud"),
            ("educacion", "Educación"),
            ("transporte", "Transporte público"),
            ("alumbrado", "Alumbrado público"),
            ("areas_verdes", "Áreas verdes y recreativas"),
            ("jovenes", "Programas para jóvenes"),
            ("adultos_mayores", "Atención a adultos mayores"),
            ("medio_ambiente", "Medio ambiente"),
        ),
    },
    {
        "slug": "calidad_vida_10",
        "texto": "En una escala del 1 al 10, ¿cómo califica la calidad de vida en esta zona?",
        "tipo": "escala",
        "bloque": "prioridades",
        "opciones": escala(1, 10),
        "min": 1,
        "max": 10,
    },
    {
        "slug": "programa_social",
        "texto": "¿Usted o algún integrante de su hogar recibe actualmente algún apoyo o programa social del gobierno?",
        "tipo": "opcion_unica",
        "bloque": "prioridades",
        "opciones": op(
            ("federal", "Sí, del gobierno federal"),
            ("local", "Sí, del gobierno local"),
            ("varios", "Sí, de más de un nivel de gobierno"),
            ("ninguno", "No recibe ningún apoyo"),
            ("no_sabe", "No sabe / Prefiere no responder"),
        ),
    },
]


def main() -> None:
    percepcion = {
        "slug": "percepcion_ciudadana",
        "nombre": "Encuesta de Percepción Ciudadana de la zona",
        "disclaimer": (
            "Opinión y percepción sobre condiciones de la zona y desempeño de autoridades. "
            "Confidencial, sin nombre ni teléfono. No sustituye levantamientos formales ni INEGI. "
            "La comunidad se registra con la colonia del catálogo territorial."
        ),
        "max_problemas_prioridad": 3,
        "clave_prioridades": "principales_problemas",
        "bloques": [
            {"slug": "datos", "nombre": "I. Datos generales"},
            {"slug": "calidad_vida", "nombre": "II. Calidad de vida"},
            {"slug": "problemas", "nombre": "III. Percepción de problemas"},
            {"slug": "seguridad", "nombre": "IV. Percepción de seguridad"},
            {"slug": "servicios", "nombre": "V. Evaluación de servicios públicos"},
            {"slug": "gobierno", "nombre": "VI. Percepción del gobierno"},
            {"slug": "participacion", "nombre": "VII. Participación ciudadana"},
            {"slug": "abiertas", "nombre": "VIII. Preguntas abiertas"},
        ],
        "preguntas": build_preguntas(PERC_ADDS),
    }
    diagnostico = {
        "slug": "diagnostico_necesidades",
        "nombre": "Encuesta de Diagnóstico de Necesidades de la zona",
        "disclaimer": (
            "Identifica necesidades y problemáticas para orientar planeación y políticas públicas. "
            "Confidencial, sin nombre ni teléfono. No sustituye levantamientos formales ni INEGI. "
            "La zona/comunidad se registra con la colonia del catálogo territorial."
        ),
        "max_problemas_prioridad": 3,
        "clave_prioridades": "prioridades_comunidad",
        "bloques": [
            {"slug": "datos", "nombre": "I. Datos generales"},
            {"slug": "servicios", "nombre": "II. Servicios públicos"},
            {"slug": "salud", "nombre": "III. Salud"},
            {"slug": "educacion", "nombre": "IV. Educación"},
            {"slug": "economia", "nombre": "V. Economía y empleo"},
            {"slug": "seguridad", "nombre": "VI. Seguridad"},
            {"slug": "prioridades", "nombre": "VII. Prioridades de la comunidad"},
        ],
        "preguntas": build_preguntas(DIAG_ADDS),
    }

    rapida_path = CFG / "encuesta-rapida.json"
    rapida = json.loads(rapida_path.read_text(encoding="utf-8"))
    rapida["clave_prioridades"] = "problemas_prioridad"
    rapida["bloques"] = [
        {"slug": "demografico", "nombre": "Datos generales"},
        {"slug": "prioridades", "nombre": "Prioridades"},
        {"slug": "percepcion", "nombre": "Percepción"},
    ]

    indice = {
        "demo": True,
        "plantillas": [
            {
                "slug": "rapida_mesa",
                "nombre": rapida.get("nombre", "Encuesta rápida de mesa"),
                "archivo": "encuesta-rapida.json",
                "orden": 1,
            },
            {
                "slug": "percepcion_ciudadana",
                "nombre": percepcion["nombre"],
                "archivo": "encuesta-percepcion-ciudadana.json",
                "orden": 2,
            },
            {
                "slug": "diagnostico_necesidades",
                "nombre": diagnostico["nombre"],
                "archivo": "encuesta-diagnostico-necesidades.json",
                "orden": 3,
            },
        ],
    }

    (CFG / "encuesta-percepcion-ciudadana.json").write_text(
        json.dumps(percepcion, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (CFG / "encuesta-diagnostico-necesidades.json").write_text(
        json.dumps(diagnostico, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    rapida_path.write_text(
        json.dumps(rapida, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (CFG / "encuestas-plantillas.json").write_text(
        json.dumps(indice, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print("ok", len(percepcion["preguntas"]), len(diagnostico["preguntas"]))


if __name__ == "__main__":
    main()
