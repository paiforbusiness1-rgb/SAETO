import { Route, Routes } from "react-router-dom";
import { ActoresListPage, ActorDetailPage } from "../modules/actores/ActoresPages";
import {
  CapturaActorFormPage,
  CapturaActoresListPage,
} from "../modules/captura/CapturaActoresPages";
import { CapturaBriefPage } from "../modules/captura/CapturaBriefPage";
import {
  CapturaCoyunturaFormPage,
  CapturaCoyunturaListPage,
} from "../modules/captura/CapturaCoyunturaPages";
import {
  CapturaDiscursoFormPage,
  CapturaDiscursoListPage,
} from "../modules/captura/CapturaDiscursoPages";
import { CapturaHubPage } from "../modules/captura/CapturaHubPage";
import { CapturaIndicadoresPage } from "../modules/captura/CapturaIndicadoresPage";
import {
  CapturaReivFormPage,
  CapturaReivsListPage,
} from "../modules/captura/CapturaReivsPages";
import { CatalogosHubPage } from "../modules/catalogos/CatalogosHubPage";
import { DiscursoNivelesCatalogPage } from "../modules/catalogos/DiscursoNivelesCatalogPage";
import { TemasCatalogPage } from "../modules/catalogos/TemasCatalogPage";
import { TerritorioCatalogPage } from "../modules/catalogos/TerritorioCatalogPage";
import { UmbralesCatalogPage } from "../modules/catalogos/UmbralesCatalogPage";
import { CoyunturaDetailPage, CoyunturaListPage } from "../modules/coyuntura/CoyunturaPages";
import { AcercaPage } from "../modules/dashboard/AcercaPage";
import { DashboardPage } from "../modules/dashboard/DashboardPage";
import {
  DiscursoDetailPage,
  DiscursoListPage,
} from "../modules/discurso/DiscursoPages";
import {
  ObservatorioDetailPage,
  ObservatorioListPage,
} from "../modules/observatorio/ObservatorioPages";
import { ReporteActoresPage } from "../modules/reportes/ReporteActoresPage";
import { ReporteCicloVitalPage } from "../modules/reportes/ReporteCicloVitalPage";
import { ReporteContextoInegiPage } from "../modules/reportes/ReporteContextoInegiPage";
import { ReporteCoyunturaPage } from "../modules/reportes/ReporteCoyunturaPage";
import { ReporteDeudasPage } from "../modules/reportes/ReporteDeudasPage";
import { ReporteDiscursoMesaPage } from "../modules/reportes/ReporteDiscursoMesaPage";
import { ReporteEjecutivoPage } from "../modules/reportes/ReporteEjecutivoPage";
import { ReporteTerritorioPage } from "../modules/reportes/ReporteTerritorioPage";
import { ReportesHubPage } from "../modules/reportes/ReportesHubPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/reportes" element={<ReportesHubPage />} />
      <Route path="/reportes/ejecutivo" element={<ReporteEjecutivoPage />} />
      <Route path="/reportes/ciclo-vital" element={<ReporteCicloVitalPage />} />
      <Route path="/reportes/territorio" element={<ReporteTerritorioPage />} />
      <Route path="/reportes/actores" element={<ReporteActoresPage />} />
      <Route path="/reportes/coyuntura" element={<ReporteCoyunturaPage />} />
      <Route path="/reportes/discurso-mesa" element={<ReporteDiscursoMesaPage />} />
      <Route path="/reportes/contexto-inegi" element={<ReporteContextoInegiPage />} />
      <Route path="/reportes/deudas" element={<ReporteDeudasPage />} />

      <Route path="/observatorio" element={<ObservatorioListPage />} />
      <Route path="/observatorio/:slug" element={<ObservatorioDetailPage />} />

      <Route path="/coyuntura" element={<CoyunturaListPage />} />
      <Route path="/coyuntura/:slug" element={<CoyunturaDetailPage />} />

      <Route path="/actores" element={<ActoresListPage />} />
      <Route path="/actores/:slug" element={<ActorDetailPage />} />
      <Route path="/discurso" element={<DiscursoListPage />} />
      <Route path="/discurso/:slug" element={<DiscursoDetailPage />} />

      <Route path="/catalogos" element={<CatalogosHubPage />} />
      <Route path="/catalogos/territorio" element={<TerritorioCatalogPage />} />
      <Route path="/catalogos/temas" element={<TemasCatalogPage />} />
      <Route path="/catalogos/umbrales" element={<UmbralesCatalogPage />} />
      <Route path="/catalogos/discurso" element={<DiscursoNivelesCatalogPage />} />

      <Route path="/captura" element={<CapturaHubPage />} />
      <Route path="/captura/actores" element={<CapturaActoresListPage />} />
      <Route path="/captura/actores/:slug" element={<CapturaActorFormPage />} />
      <Route path="/captura/reivindicaciones" element={<CapturaReivsListPage />} />
      <Route
        path="/captura/reivindicaciones/:slug"
        element={<CapturaReivFormPage />}
      />
      <Route path="/captura/coyuntura" element={<CapturaCoyunturaListPage />} />
      <Route path="/captura/coyuntura/:slug" element={<CapturaCoyunturaFormPage />} />
      <Route path="/captura/discurso" element={<CapturaDiscursoListPage />} />
      <Route path="/captura/discurso/:slug" element={<CapturaDiscursoFormPage />} />
      <Route path="/captura/indicadores" element={<CapturaIndicadoresPage />} />
      <Route path="/captura/brief" element={<CapturaBriefPage />} />

      <Route path="/acerca" element={<AcercaPage />} />
    </Routes>
  );
}
