# Plan implementación — IA Groq + datos públicos (slices 1–5)

**Estado:** IMPLEMENTADO EN LOCAL (2026-08-13) — probar con GROQ_API_KEY  
**Aprobación:** “adelante slices 1-5”

## Entregado
- Módulo `ia` (cliente Groq, safety, 3 servicios, router)
- UI: IaPanel en panorama/sala/reiv + página clasificar
- Seeds INEGI ampliados
- Guion demo + `.env.example`

## No-regresión
- Contratos previos intactos; IA es módulo aparte
- Sin sensibles en payload Groq
