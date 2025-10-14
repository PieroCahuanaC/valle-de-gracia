import { supabase } from "../db/supabase";

export default function AdminHeader() {
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error al cerrar sesión:", error);
        alert("No se pudo cerrar sesión. Intenta nuevamente.");
        return;
      }
      // ✅ Redirige al login solo después de cerrar sesión correctamente
      window.location.href = "/login";
    } catch (err) {
      console.error("Error inesperado:", err);
      alert("Ocurrió un error al cerrar sesión.");
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-6">
        <h1 className="text-lg font-semibold text-gray-800">Admin</h1>
        <nav className="flex items-center gap-6 text-sm">
          <a
            href="/"
            className="text-gray-600 transition hover:text-teal-600 font-medium"
          >
            Regresar al inicio
          </a>
          <button
            onClick={handleLogout}
            className="rounded-md bg-teal-600 px-4 py-2 text-white text-sm font-medium hover:bg-teal-700 transition"
          >
            Cerrar sesión
          </button>
        </nav>
      </div>
    </header>
  );
}
