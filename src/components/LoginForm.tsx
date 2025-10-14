import { useState } from "react";
import { supabase } from "@/db/supabase";

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL ?? "admin@lotizador.com";
const ADMIN_CODE = import.meta.env.VITE_ADMIN_CODE ?? "72900580";

export default function LoginForm() {
  const [numero, setNumero] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      // Validaciones mínimas
      if (!/^\d{1,}$/.test(numero)) {
        throw new Error("El número debe contener solo dígitos.");
      }
      if (ADMIN_CODE && numero !== ADMIN_CODE) {
        throw new Error("Número incorrecto.");
      }

      // Siempre usamos el email fijo del admin
      const email = ADMIN_EMAIL;

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pass, // la contraseña real del admin en Supabase
      });
      if (error) throw error;

      window.location.href = "/admin";
    } catch (e: any) {
      setErr(e.message ?? "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const goHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-[70vh] w-full flex flex-col items-center justify-start pt-8 sm:pt-12">
      {/* Encabezado */}
      <div className="mb-6 flex items-center gap-3">
        <svg
          viewBox="0 0 24 24"
          className="h-10 w-10 text-black"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.33 0-8 2.17-8 4.5V20a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1.5C20 16.17 16.33 14 12 14Z" />
          <path d="M20 8.5a3.5 3.5 0 0 0-3.5 3.5v3.5l3.5 1.5 3.5-1.5V12A3.5 3.5 0 0 0 20 8.5Z" />
        </svg>
        <h1 className="text-3xl font-semibold text-black">AdminPanel</h1>
      </div>

      {/* Tarjeta del login */}
      <div className="w-full max-w-xl rounded-3xl bg-white shadow-xl border border-gray-200 p-6 sm:p-8">
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-base font-medium text-gray-800 mb-2">
              Número de acceso
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d*"
              required
              value={numero}
              onChange={(e) => setNumero(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-full border border-gray-300 px-4 py-3 h-12 text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-rose-400"
              placeholder="Ej: 75340287"
              autoComplete="one-time-code"
            />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-800 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full rounded-full border border-gray-300 px-4 py-3 h-12 text-gray-900 outline-none focus:ring-2 focus:ring-rose-400"
              autoComplete="current-password"
              placeholder="••••••"
            />
          </div>

          {err && (
            <div className="text-sm text-red-700 border border-red-200 bg-red-50 px-4 py-3 rounded-xl">
              {err}
            </div>
          )}

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 rounded-full bg-rose-600 py-4 text-white text-base font-medium hover:bg-rose-700 transition disabled:opacity-60"
            >
              {loading ? "Iniciando…" : "Iniciar sesión"}
            </button>
          </div>
        </form>
      </div>

      <button
        onClick={goHome}
        className="mt-6 text-gray-700 text-base font-medium hover:text-rose-600 transition"
      >
        ← Regresar al inicio
      </button>
    </div>
  );
}
