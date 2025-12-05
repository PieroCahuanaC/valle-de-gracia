// src/components/MapLeaflet.tsx
import { useEffect, useRef } from "react";

type Pin = { x: number; y: number; label?: string };

type Props = {
  // Imagen personalizada (CRS.Simple)
  imageUrl?: string; // p.ej. "/mapa.webp" o URL pública
  imageWidth?: number; // px
  imageHeight?: number; // px

  // Mapa web normal (OSM)
  center?: [number, number];
  zoom?: number;

  // Marcadores opcionales en coords de imagen (x, y)
  pins?: Pin[];

  // GeoJSON existente (opcional)
  geojsonUrl?: string; // si lo sirves desde /public/data/lotes.json
  // o pásalo ya importado:
  geojsonData?: any;

  // Activar modo captura de polígonos (por defecto: true si hay imagen)
  enableDraw?: boolean;

  height?: number; // no se usa con Tailwind full-screen, pero lo dejo por compat
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
  height = 500,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: any;
    let Lmod: any;
    let previewLayer: any = null;
    let drawnLayer: any = null;
    const points: [number, number][] = []; // almacenamos [lat,lng] = [y,x] para captura

    const off = () => {
      try {
        map && map.remove();
      } catch {}
      window.removeEventListener("keydown", onKey);
    };

    const styleByEstado = (feature: any) => {
      const estado = feature?.properties?.estado ?? "Libre";
      const color =
        estado === "Vendido"
          ? "#ef4444" // rojo
          : estado === "Separado"
          ? "#f59e0b" // naranja
          : "#10b981"; // verde
      return { color, weight: 1, fillOpacity: 0.35 };
    };

    const drawPreview = () => {
      if (previewLayer) {
        try {
          previewLayer.remove();
        } catch {}
        previewLayer = null;
      }
      if (points.length >= 2) {
        // Vista previa usa [lat,lng]
        previewLayer = Lmod.polygon(points, {
          color: "#06b6d4",
          weight: 1,
          dashArray: "4 4",
          fillOpacity: 0.1,
        }).addTo(map);
      }
    };

    // ⌨️ Teclas: R = reset, F = finalizar y copiar Feature
    const onKey = (ev: KeyboardEvent) => {
      const k = ev.key.toLowerCase();
      if (k === "r") {
        // Reset preview
        points.length = 0;
        if (previewLayer) {
          try {
            previewLayer.remove();
          } catch {}
          previewLayer = null;
        }
        console.log("↩️ Reiniciado. Empieza a clicar vértices de nuevo.");
      }
      if (k === "f") {
        if (points.length < 3) {
          console.log(
            "⚠️ Necesitas al menos 3 puntos para cerrar un polígono."
          );
          return;
        }

        // 1) Cerrar polígono en coords Leaflet [lat,lng] para previsualizar
        const ringLatLng = [...points, points[0]]; // [lat,lng] = [y,x]

        // 2) 🔧 Convertir a GeoJSON estándar [x,y] antes de guardar
        const ringXY = ringLatLng.map(([lat, lng]) => [lng, lat]);

        const feature = {
          type: "Feature",
          properties: {
            manzana: "A",
            numero: 1,
            codigo: "A-1",
            estado: "Libre",
            area: 200,
          },
          geometry: { type: "Polygon", coordinates: [ringXY] }, // ✅ GeoJSON correcto
        };

        const text = JSON.stringify(feature, null, 2);
        navigator.clipboard?.writeText(text).then(
          () =>
            console.log(
              "✅ Feature (GeoJSON) copiado al portapapeles:\n",
              text
            ),
          () => console.log("📋 Copia falló, aquí tienes:\n", text)
        );

        // 3) Mostrarlo como capa definitiva (usamos [lat,lng] para Leaflet)
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

      // Si NO cargas el CSS en tu layout, descomenta esto:
      // if (!document.querySelector('link[data-leaflet]')) {
      //   const link = document.createElement("link");
      //   link.rel = "stylesheet";
      //   link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      //   link.setAttribute("data-leaflet", "true");
      //   document.head.appendChild(link);
      // }

      if (!ref.current) return;

      const usingImage = Boolean(imageUrl && imageWidth && imageHeight);
      const shouldDraw = enableDraw ?? usingImage; // por defecto, dibujar solo si hay imagen

      if (usingImage) {
        // 🔹 Modo “plano” con imagen y CRS.Simple
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

        // Helper (x,y) -> [y, x]
        const toLatLng = (x: number, y: number) => [y, x] as [number, number];

        // Marcadores opcionales
        pins.forEach((p) => {
          L.marker(toLatLng(p.x, p.y))
            .addTo(map)
            .bindPopup(p.label ?? `(${p.x}, ${p.y})`);
        });

        // Cargar GeoJSON existente si se provee (se asume estándar [x,y])
        const loadAndAddGeoJSON = async () => {
          try {
            let data: any = geojsonData;
            if (!data && geojsonUrl) {
              const res = await fetch(geojsonUrl);
              data = await res.json();
            }
            if (data) {
              L.geoJSON(data, {
                style: styleByEstado,
                onEachFeature: (feature, layer) => {
                  const p = (feature as any).properties || {};
                  layer.bindPopup(
                    `<b>${p.codigo ?? ""}</b><br/>Estado: ${
                      p.estado ?? "?"
                    }<br/>Área: ${p.area ?? "?"} m²`
                  );
                },
              }).addTo(map);
            }
          } catch (e) {
            console.warn("No se pudo cargar el GeoJSON:", e);
          }
        };
        await loadAndAddGeoJSON();

        // ✍️ Captura de vértices para nuevos polígonos
        if (shouldDraw) {
          map.on("click", (e: any) => {
            // Guardamos clics en [lat,lng] (Leaflet)
            const p: [number, number] = [e.latlng.lat, e.latlng.lng];
            points.push(p);
            drawPreview();
            console.log(`[${p[0].toFixed(6)}, ${p[1].toFixed(6)}],`);
          });
          window.addEventListener("keydown", onKey);
        }
      } else {
        // 🔹 Modo mapa OSM normal
        map = L.map(ref.current).setView(center, zoom);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);
        L.marker(center).addTo(map).bindPopup("📍 Ejemplo").openPopup();
      }
    })();

    return () => off();
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
    height,
  ]);

  // Con Tailwind, el contenedor padre debe ser full-screen (w-screen h-screen)
  return <div ref={ref} className="w-full h-full" />;
}
