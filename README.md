# Residencial Valle de Gracia - Plano Interactivo

Aplicacion web que muestra un plano interactivo de la Residencial Valle de Gracia, permitiendo a los usuarios explorar los lotes disponibles, ver su estado (Libre, Separado, Vendido) y obtener informacion detallada de cada uno. Incluye un panel de administracion protegido para gestionar los lotes.

## Que hace la aplicacion

### Vista publica (Plano interactivo)

- Muestra un mapa interactivo del plano de la residencial sobre una imagen personalizada del terreno
- Los lotes se dibujan como poligonos con colores segun su estado:
  - Verde: Libre
  - Amarillo: Separado
  - Rojo: Vendido
- Al hacer clic en un lote se muestra un popup con informacion detallada: codigo, manzana, numero de lote, estado, area (m2), perimetro (m) y precio (S/)
- Botones integrados en el mapa para contacto directo por WhatsApp y para ver la ubicacion en Google Maps

### Panel de administracion

- Acceso protegido con autenticacion mediante Supabase Auth
- Tabla con todos los lotes registrados en la base de datos
- Permite editar estado, precio, area y perimetro de cada lote
- Filtros por manzana y estado para una gestion rapida

## Stack tecnologico

| Tecnologia     | Uso                                             |
| -------------- | ----------------------------------------------- |
| Astro          | Framework principal (SSG con islas de React)    |
| React          | Componentes interactivos (mapa, admin, login)   |
| TailwindCSS v4 | Estilos y diseno responsivo                     |
| Leaflet        | Renderizado del mapa interactivo con CRS.Simple |
| Supabase       | Base de datos (tabla `lotes`) y autenticacion   |

## Estructura del proyecto

```
src/
  pages/
    index.astro          # Pagina principal con el plano interactivo
    login.astro          # Pagina de inicio de sesion
    admin/index.astro    # Panel de administracion
  components/
    Header.astro         # Encabezado del sitio
    Mapa.astro           # Carga los 10 archivos GeoJSON y renderiza el mapa
    MapLeaflet.tsx       # Componente React del mapa con Leaflet
    Overlays.tsx         # Botones de WhatsApp y Google Maps sobre el mapa
    LoginForm.tsx        # Formulario de inicio de sesion
    AdminPanelUI.tsx     # Panel CRUD para gestionar lotes
    AdminHeader.tsx      # Encabezado del panel admin
    Coordenadas.tsx      # Herramienta auxiliar para capturar coordenadas
  data/
    lotes_A.json ... lotes_J.json  # GeoJSON con los poligonos de cada manzana (A-J)
  db/
    supabase.ts          # Cliente de Supabase
```

## Como funciona

1. Los datos geometricos de los lotes (poligonos) se almacenan localmente en 10 archivos GeoJSON, uno por cada manzana (A hasta J)
2. Al cargar la pagina, se combinan todos los GeoJSON y se renderizan sobre la imagen del plano usando Leaflet con CRS.Simple
3. Al mismo tiempo, se consultan los datos actualizados de la tabla `lotes` en Supabase (estado, precio, area, etc.) y se enriquecen los poligonos con esa informacion
4. El administrador puede iniciar sesion y modificar los datos de cada lote desde el panel de administracion
