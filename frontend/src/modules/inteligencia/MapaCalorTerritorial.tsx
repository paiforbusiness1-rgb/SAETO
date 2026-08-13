import { useEffect, useMemo } from "react";
import L from "leaflet";
import type { PathOptions } from "leaflet";
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { CeldaCalor } from "../../shared/api/types";
import alcaldias from "./geo/alcaldias-oriente.json";
import colonias from "./geo/colonias-demo.json";
import styles from "./InteligenciaPages.module.css";

type Props = {
  celdas: CeldaCalor[];
  porZona: CeldaCalor[];
  onSelectColonia?: (slug: string) => void;
  onSelectZona?: (slug: string) => void;
};

type ZonaFeatureProps = { slug?: string; nombre?: string };
type ColoniaFeature = {
  type: "Feature";
  properties: { slug?: string; nombre?: string; zona?: string };
  geometry: { type: "Point"; coordinates: [number, number] };
};

type AlcaldiasFc = {
  type: "FeatureCollection";
  features: {
    type: "Feature";
    properties: ZonaFeatureProps;
    geometry: Record<string, unknown>;
  }[];
};

const alcaldiasFc = alcaldias as unknown as AlcaldiasFc;
const coloniasFc = colonias as unknown as {
  type: "FeatureCollection";
  features: ColoniaFeature[];
};

function FitBounds({ data }: { data: AlcaldiasFc }) {
  const map = useMap();
  useEffect(() => {
    const layer = L.geoJSON(data as never);
    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.06));
    }
  }, [data, map]);
  return null;
}

export function MapaCalorTerritorial({
  celdas,
  porZona,
  onSelectColonia,
  onSelectZona,
}: Props) {
  const colorZona = useMemo(() => {
    const map = new Map<string, string>();
    for (const z of porZona) map.set(z.zona_slug, z.color || "#3dba7c");
    return map;
  }, [porZona]);

  const metaZona = useMemo(() => {
    const map = new Map<string, CeldaCalor>();
    for (const z of porZona) map.set(z.zona_slug, z);
    return map;
  }, [porZona]);

  const colorColonia = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of celdas) {
      if (c.colonia_slug) map.set(c.colonia_slug, c.color || "#3dba7c");
    }
    return map;
  }, [celdas]);

  const metaColonia = useMemo(() => {
    const map = new Map<string, CeldaCalor>();
    for (const c of celdas) {
      if (c.colonia_slug) map.set(c.colonia_slug, c);
    }
    return map;
  }, [celdas]);

  const styleKey = useMemo(
    () =>
      porZona.map((z) => `${z.zona_slug}:${z.banda}:${z.score}`).join("|") +
      "|" +
      celdas.map((c) => `${c.colonia_slug}:${c.score}`).join("|"),
    [porZona, celdas],
  );

  const styleFeature = (feature?: {
    properties?: ZonaFeatureProps;
  }): PathOptions => {
    const slug = feature?.properties?.slug || "";
    return {
      fillColor: colorZona.get(slug) || "#5a7a6a",
      fillOpacity: 0.55,
      color: "rgba(255,255,255,0.65)",
      weight: 1.5,
    };
  };

  return (
    <div className={styles.mapWrap}>
      <MapContainer
        className={styles.mapLeaflet}
        center={[19.32, -99.05]}
        zoom={11}
        scrollWheelZoom
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds data={alcaldiasFc} />
        <GeoJSON
          key={styleKey}
          data={alcaldiasFc as never}
          style={styleFeature as never}
          onEachFeature={(feature, layer) => {
            const props = feature.properties as ZonaFeatureProps;
            const slug = props?.slug || "";
            const nombre = props?.nombre || slug;
            const meta = metaZona.get(slug);
            const label = meta
              ? `${nombre}: ${meta.banda_nombre} (score ${meta.score})`
              : nombre;
            layer.bindTooltip(label);
            layer.on({
              click: () => onSelectZona?.(slug),
            });
          }}
        />
        {coloniasFc.features.map((f) => {
          const slug = f.properties?.slug || "";
          const nombre = f.properties?.nombre || slug;
          const [lng, lat] = f.geometry.coordinates;
          const meta = metaColonia.get(slug);
          const fill = colorColonia.get(slug) || "#c4a35a";
          return (
            <CircleMarker
              key={`${slug}-${meta?.score ?? 0}`}
              center={[lat, lng]}
              radius={11}
              pathOptions={{
                color: "rgba(255,255,255,0.85)",
                weight: 2,
                fillColor: fill,
                fillOpacity: 0.9,
              }}
              eventHandlers={{
                click: () => onSelectColonia?.(slug),
              }}
            >
              <Tooltip direction="top" offset={[0, -4]} opacity={0.95}>
                {meta
                  ? `${nombre}: ${meta.banda_nombre} (${meta.score})`
                  : nombre}
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
      <p className={styles.mapCredit}>
        Mapa base OpenStreetMap · polígonos de alcaldías vía OSM Nominatim · calor
        SAETO
      </p>
    </div>
  );
}
