import { useEffect, useMemo, useState } from "react";
import { supabase } from "../db/supabase";

type Estado = "Libre" | "Separado" | "Vendido";
type Lote = {
  id: number;
  manzana: string;
  numero: number;
  estado: Estado;
  precio: number | null;
  area: number | null;
  perimetro: number | null;
  codigo: string;
};

export default function AdminPanel() {
  const [rows, setRows] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lote | null>(null);
  const [draft, setDraft] = useState<Partial<Lote>>({});

  const money = (v: number | null | undefined) =>
    v == null
      ? "-"
      : `S/ ${v.toLocaleString("es-PE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;

  const statusPill = (s: Estado) => {
    const base = "px-2 py-0.5 rounded-full text-xs font-semibold";
    if (s === "Libre")
      return (
        <span className={`${base} bg-green-100 text-green-700`}>
          Disponible
        </span>
      );
    if (s === "Separado")
      return (
        <span className={`${base} bg-amber-100 text-amber-700`}>Separado</span>
      );
    return <span className={`${base} bg-red-100 text-red-700`}>Vendido</span>;
  };

  // Carga inicial
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const { data: auth } = await supabase.auth.getSession();
        if (!auth.session?.user) {
          window.location.href = "/login";
          return;
        }
        const { data, error } = await supabase
          .from("lotes")
          .select(
            "id, manzana, numero, estado, precio, area, perimetro, codigo"
          )
          .order("manzana", { ascending: true })
          .order("numero", { ascending: true });
        if (error) throw error;
        if (!cancel) setRows((data ?? []) as Lote[]);
      } catch (e: any) {
        if (!cancel) setErr(e?.message ?? "Error cargando lotes");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  // Agrupar por manzana
  const groups = useMemo(() => {
    const map = new Map<string, Lote[]>();
    for (const r of rows) {
      if (!map.has(r.manzana)) map.set(r.manzana, []);
      map.get(r.manzana)!.push(r);
    }
    for (const [, arr] of map) arr.sort((a, b) => a.numero - b.numero);
    return Array.from(map.entries()).sort(([a], [b]) =>
      a.localeCompare(b, "es", { numeric: true })
    );
  }, [rows]);

  // Update
  const updateRow = async (id: number, patch: Partial<Lote>) => {
    setSavingId(id);
    setErr(null);
    try {
      const { error } = await supabase.from("lotes").update(patch).eq("id", id);
      if (error) throw error;
      setRows((prev) =>
        prev.map((r) => (r.id === id ? ({ ...r, ...patch } as Lote) : r))
      );
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo guardar");
    } finally {
      setSavingId(null);
    }
  };

  // Modal helpers
  const openModal = (r: Lote) => {
    setEditing(r);
    setDraft({ estado: r.estado, precio: r.precio });
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setDraft({});
  };
  const saveModal = async () => {
    if (!editing) return;
    await updateRow(editing.id, {
      estado: draft.estado as Estado,
      precio: draft.precio ?? null,
    });
    closeModal();
  };

  // ESC para cerrar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    if (modalOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  if (loading) return <div className="p-4">Cargando…</div>;
  if (err) return <div className="p-4 text-red-600">{err}</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {groups.map(([manzana, lotes]) => (
        <section key={manzana} className="mb-10">
          <h2 className="text-2xl font-semibold mb-3 text-black">
            Manzana {manzana}
          </h2>

          <div className="overflow-x-auto rounded border border-gray-300 shadow-sm">
            <table className="min-w-full table-fixed divide-y-2 divide-gray-200">
              {/* 👉 MISMO colgroup en TODAS las tablas para simetría */}
              <colgroup>
                <col className="w-2/5" /> {/* Lote Name */}
                <col className="w-1/5" /> {/* Status */}
                <col className="w-1/5" /> {/* Price */}
                <col className="w-1/5" /> {/* Actions */}
              </colgroup>

              <thead className="bg-gray-200 text-left">
                <tr>
                  <th className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">
                    Lote Name
                  </th>
                  <th className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">
                    Status
                  </th>
                  <th className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">
                    Price
                  </th>
                  <th className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {lotes.map((r) => (
                  <tr key={r.id} className="text-gray-900">
                    <td className="px-3 py-2 whitespace-nowrap font-medium">
                      Lote {r.numero}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {statusPill(r.estado)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {money(r.precio)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <button
                        onClick={() => openModal(r)}
                        className="px-4 py-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}

                {lotes.length === 0 && (
                  <tr>
                    <td
                      className="px-3 py-4 text-center text-slate-500"
                      colSpan={4}
                    >
                      No hay lotes en esta manzana.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {/* Modal */}
      {modalOpen && editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-3xl font-semibold mb-6 text-black">
              Lote {editing.numero}
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Estado
                </label>
                <select
                  className="w-full rounded-full border px-4 py-3 text-slate-800"
                  value={(draft.estado as Estado) ?? editing.estado}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      estado: e.target.value as Estado,
                    }))
                  }
                >
                  <option value="Libre">Disponible</option>
                  <option value="Separado">Separado</option>
                  <option value="Vendido">Vendido</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Precio (S/.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded-full border px-4 py-3 text-slate-800"
                  value={draft.precio ?? editing.precio ?? ""}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    setDraft((d) => ({
                      ...d,
                      precio: v === "" ? null : Number(v),
                    }));
                  }}
                />
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <button
                onClick={saveModal}
                disabled={savingId === editing.id}
                className="rounded-full bg-green-700 px-8 py-4 text-white font-medium hover:bg-rose-700 disabled:opacity-60"
              >
                Guardar
              </button>
              <button
                onClick={closeModal}
                className="rounded-full bg-rose-600 px-8 py-4 text-white font-medium hover:bg-rose-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
