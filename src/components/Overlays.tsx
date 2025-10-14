import type * as L from "leaflet";

type ImageOverlayOpts = {
  x: number;
  y: number;
  w: number;
  h: number;
  url: string;
  opacity?: number;
  className?: string;
  onClick?: () => void;
};

export function addImageOverlayAt(
  Lmod: typeof import("leaflet"),
  map: L.Map,
  o: ImageOverlayOpts
) {
  const bounds = Lmod.latLngBounds([o.y, o.x], [o.y + o.h, o.x + o.w]);
  const overlay = Lmod.imageOverlay(o.url, bounds, {
    opacity: o.opacity ?? 1,
    className: o.className ?? "",
    interactive: Boolean(o.onClick),
  }).addTo(map);
  if (o.onClick) {
    overlay.on("click", o.onClick);
    overlay.getElement()?.classList.add("cursor-pointer");
  }
  return overlay;
}

export function addStaticOverlays(Lmod: typeof import("leaflet"), map: L.Map) {
  const COLOR = "#111";

  // --- BOTÓN 1: WhatsApp ---
  const BTN1 = { x: 1860, y: 500, w: 480, h: 110 }; // ancho aumentado
  const LABEL1 = { w: BTN1.w, h: 50, gap: 12 };

  // Texto "Mayor información"
  const svgLabel1 = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${LABEL1.w}" height="${
    LABEL1.h
  }">
    <style>
      .title { font: 700 40px system-ui, -apple-system, "Segoe UI", Roboto, Arial; fill: ${COLOR}; text-anchor: middle; }
    </style>
    <text x="${LABEL1.w / 2}" y="40" class="title">Mayor información</text>
  </svg>`;
  const labelUrl1 = "data:image/svg+xml;utf8," + encodeURIComponent(svgLabel1);
  addImageOverlayAt(Lmod, map, {
    x: BTN1.x,
    y: BTN1.y + BTN1.h + LABEL1.gap,
    w: LABEL1.w,
    h: LABEL1.h,
    url: labelUrl1,
  });

  // Botón WhatsApp
  const svgBtn1 = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${BTN1.w}" height="${BTN1.h}">
    <rect x="1.5" y="1.5" width="${BTN1.w - 3}" height="${BTN1.h - 3}"
          rx="22" ry="22" fill="#fff" stroke="${COLOR}" stroke-width="3"/>
    <style>
      .label { font: 700 42px system-ui, -apple-system, "Segoe UI", Roboto, Arial; fill: ${COLOR}; }
    </style>
    <text x="130" y="70" class="label">Ir a WhatsApp</text>
  </svg>`;
  const btnUrl1 = "data:image/svg+xml;utf8," + encodeURIComponent(svgBtn1);
  addImageOverlayAt(Lmod, map, {
    x: BTN1.x,
    y: BTN1.y,
    w: BTN1.w,
    h: BTN1.h,
    url: btnUrl1,
    onClick: () => window.open("https://wa.me/51968723979", "_blank"),
  });

  // Logo WhatsApp dentro
  const LOGO1 = { x: BTN1.x + 32, y: BTN1.y + 18, w: 74, h: 74 };
  addImageOverlayAt(Lmod, map, {
    x: LOGO1.x,
    y: LOGO1.y,
    w: LOGO1.w,
    h: LOGO1.h,
    url: "/wspp.png",
    onClick: () => window.open("https://wa.me/51968723979", "_blank"),
  });

  // --- BOTÓN 2: Google Maps ---
  const BTN2 = { x: 1860, y: 750, w: 480, h: 110 }; // ancho aumentado
  const LABEL2 = { w: BTN2.w, h: 50, gap: 12 };

  // Texto "Ubicación"
  const svgLabel2 = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${LABEL2.w}" height="${
    LABEL2.h
  }">
    <style>
      .title { font: 700 40px system-ui, -apple-system, "Segoe UI", Roboto, Arial; fill: ${COLOR}; text-anchor: middle; }
    </style>
    <text x="${LABEL2.w / 2}" y="40" class="title">Ubicación</text>
  </svg>`;
  const labelUrl2 = "data:image/svg+xml;utf8," + encodeURIComponent(svgLabel2);
  addImageOverlayAt(Lmod, map, {
    x: BTN2.x,
    y: BTN2.y + BTN2.h + LABEL2.gap,
    w: LABEL2.w,
    h: LABEL2.h,
    url: labelUrl2,
  });

  // Botón Google Maps
  const svgBtn2 = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${BTN2.w}" height="${BTN2.h}">
    <rect x="1.5" y="1.5" width="${BTN2.w - 3}" height="${BTN2.h - 3}"
          rx="22" ry="22" fill="#fff" stroke="${COLOR}" stroke-width="3"/>
    <style>
      .label { font: 700 42px system-ui, -apple-system, "Segoe UI", Roboto, Arial; fill: ${COLOR}; }
    </style>
    <text x="130" y="70" class="label">Ir a la ubicación</text>
  </svg>`;
  const btnUrl2 = "data:image/svg+xml;utf8," + encodeURIComponent(svgBtn2);
  addImageOverlayAt(Lmod, map, {
    x: BTN2.x,
    y: BTN2.y,
    w: BTN2.w,
    h: BTN2.h,
    url: btnUrl2,
    onClick: () =>
      window.open("https://maps.app.goo.gl/QSLHtTzebHm26LHS6", "_blank"),
  });

  // Logo Google Maps dentro (tú reemplazas el URL)
  const LOGO2 = { x: BTN2.x + 32, y: BTN2.y + 18, w: 74, h: 74 };
  addImageOverlayAt(Lmod, map, {
    x: LOGO2.x,
    y: LOGO2.y,
    w: LOGO2.w,
    h: LOGO2.h,
    url: "/googlemaps.png", //
    onClick: () => window.open("https://maps.google.com", "_blank"),
  });
}
