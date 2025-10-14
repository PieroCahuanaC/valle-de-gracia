import { useEffect, useRef } from "react";
import { addStaticOverlays } from "./Overlays";
import { createClient } from "@supabase/supabase-js";

type Pin = { x: number; y: number; label?: string };

type Props = {
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  center?: [number, number];
  zoom?: number;
  pins?: Pin[];
  geojsonUrl?: string;
  geojsonData?: any;
  enableDraw?: boolean;
};

export default function MapLeaflet({
  imageUrl,
  imageWidth,
  imageHeight,
  center = [-12.04318, -77.02824],
  zoom = 13,
  pins = [],
  geojsonUrl,
  geojsonData,
  enableDraw,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: any;
    let Lmod: any;
    let previewLayer: any = null;
    let drawnLayer: any = null;
    const points: [number, number][] = [];

    const cleanup = () => {
      try {
        map && map.remove();
      } catch {}
      window.removeEventListener("keydown", onKey);
    };

    const styleByEstado = (feature: any) => {
      const estado = feature?.properties?.estado ?? "Libre";
      const color =
        estado === "Vendido"
          ? "#ef4444"
          : estado === "Separado"
          ? "#f59e0b"
          : "#10b981";
      return { color, weight: 1, fillOpacity: 0.35 };
    };

    const popupHtml = (p: any) => {
      const estadoClass =
        p.estado === "Vendido"
          ? "text-red-600 border-red-600"
          : p.estado === "Separado"
          ? "text-amber-500 border-amber-500"
          : "text-emerald-600 border-emerald-600";

      const estadoTextClass = estadoClass.split(" ")[0];

      return `
        <div class="font-sans text-[13px] text-gray-800 leading-relaxed min-w-[190px]">
          <div class="font-semibold text-[15px] text-gray-900 border-b-2 ${estadoClass} pb-1 mb-2">
            ${p.codigo ?? "Sin código"}
          </div>
          <div class="flex justify-between"><span class="font-medium">Manzana:</span><span>${
            p.manzana ?? "-"
          }</span></div>
          <div class="flex justify-between"><span class="font-medium">Lote Nº:</span><span>${
            p.numero ?? "-"
          }</span></div>
          <div class="flex justify-between">
            <span class="font-medium">Estado:</span>
            <span class="font-semibold ${estadoTextClass}">${
        p.estado ?? "-"
      }</span>
          </div>
          <div class="flex justify-between"><span class="font-medium">Área:</span><span>${
            p.area != null ? p.area + " m²" : "-"
          }</span></div>
          <div class="flex justify-between"><span class="font-medium">Perímetro:</span><span>${
            p.perimetro != null ? p.perimetro + " m" : "-"
          }</span></div>
          <div class="flex justify-between"><span class="font-medium">Precio:</span><span class="font-semibold text-gray-900">${
            p.precio != null ? "S/ " + Number(p.precio).toLocaleString() : "-"
          }</span></div>
        </div>
      `;
    };

    const drawPreview = () => {
      if (previewLayer) {
        try {
          previewLayer.remove();
        } catch {}
        previewLayer = null;
      }
      if (points.length >= 2) {
        previewLayer = Lmod.polygon(points, {
          color: "#06b6d4",
          weight: 1,
          dashArray: "4 4",
          fillOpacity: 0.1,
        }).addTo(map);
      }
    };

    const onKey = (ev: KeyboardEvent) => {
      const k = ev.key.toLowerCase();
      if (k === "r") {
        points.length = 0;
        if (previewLayer) {
          try {
            previewLayer.remove();
          } catch {}
          previewLayer = null;
        }
      }
      if (k === "f") {
        if (points.length < 3) return;
        const ringLatLng = [...points, points[0]];
        const ringXY = ringLatLng.map(([lat, lng]) => [lng, lat]);
        const feature = {
          type: "Feature",
          properties: {},
          geometry: { type: "Polygon", coordinates: [ringXY] },
        };
        navigator.clipboard?.writeText(JSON.stringify(feature, null, 2));
        if (drawnLayer) {
          try {
            drawnLayer.remove();
          } catch {}
          drawnLayer = null;
        }
        drawnLayer = Lmod.polygon(ringLatLng, {
          color: "#06b6d4",
          weight: 2,
        }).addTo(map);
      }
    };

    (async () => {
      const L = (await import("leaflet")).default;
      Lmod = L;

      if (!ref.current) return;

      const usingImage = Boolean(imageUrl && imageWidth && imageHeight);
      const shouldDraw = Boolean(enableDraw) && usingImage;

      if (usingImage) {
        map = L.map(ref.current, {
          crs: L.CRS.Simple,
          minZoom: -2,
          maxZoom: 4,
          zoomSnap: 0.25,
          wheelPxPerZoomLevel: 100,
        });

        const bounds = L.latLngBounds([
          [0, 0],
          [imageHeight!, imageWidth!],
        ]);
        L.imageOverlay(imageUrl!, bounds).addTo(map);
        map.fitBounds(bounds);
        map.setMaxBounds(bounds);
        map.setZoom(map.getZoom());

        const toLatLng = (x: number, y: number) => [y, x] as [number, number];

        if (pins.length) {
          pins.forEach((p) => {
            L.marker(toLatLng(p.x, p.y))
              .addTo(map)
              .bindPopup(p.label ?? `(${p.x}, ${p.y})`);
          });
        }

        // 🟢 Crear cliente Supabase (solo en cliente)
        const supabase = createClient(
          import.meta.env.PUBLIC_SUPABASE_URL!,
          import.meta.env.PUBLIC_SUPABASE_KEY!
        );

        const loadAndAddGeoJSON = async () => {
          try {
            let data: any = geojsonData;
            if (!data && geojsonUrl) {
              const res = await fetch(geojsonUrl);
              data = await res.json();
            }

            // 🔹 Trae todos los registros de la tabla lotes
            const { data: lotes, error } = await supabase
              .from("lotes")
              .select("*");
            if (error) console.warn("Error cargando Supabase:", error);

            // 🔹 Enriquecer GeoJSON
            if (lotes && data?.features) {
              data.features = data.features.map((f: any) => {
                const codigo = f.properties?.codigo ?? f.id;
                const encontrado = lotes.find(
                  (l: any) => l.codigo === codigo || l.id === f.id
                );
                return {
                  ...f,
                  properties: {
                    ...f.properties,
                    ...encontrado,
                  },
                };
              });
            }

            // 🔹 Mostrar polígonos
            if (data) {
              L.geoJSON(data, {
                style: styleByEstado,
                onEachFeature: (feature, layer) => {
                  const p = (feature as any).properties || {};
                  layer.bindPopup(popupHtml(p), { maxWidth: 260 });
                },
              }).addTo(map);
            }
          } catch (e) {
            console.warn("No se pudo cargar el GeoJSON o Supabase:", e);
          }
        };

        await loadAndAddGeoJSON();

        if (shouldDraw) {
          map.on("click", (e: any) => {
            const p: [number, number] = [e.latlng.lat, e.latlng.lng];
            points.push(p);
            drawPreview();
          });
          window.addEventListener("keydown", onKey);
        }

        addStaticOverlays(Lmod, map);
      } else {
        map = L.map(ref.current).setView(center, zoom);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);
        L.marker(center).addTo(map).bindPopup("📍 Ejemplo").openPopup();
      }
    })();

    return () => cleanup();
  }, [
    imageUrl,
    imageWidth,
    imageHeight,
    center,
    zoom,
    pins,
    geojsonUrl,
    geojsonData,
    enableDraw,
  ]);

  return <div ref={ref} className="w-full h-full" />;
}
