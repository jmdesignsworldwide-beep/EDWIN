/**
 * Tipos y catálogos del módulo Proyectos (obras). Compartidos entre server
 * actions y UI. Sin lógica de servidor aquí (seguro para importar en cliente).
 */

export type EstadoObra =
  | "planificacion"
  | "en_curso"
  | "pausada"
  | "terminada";

export type Cliente = {
  id: string;
  nombre: string;
  telefono: string | null;
  cedula_rnc: string | null;
  created_at: string;
  updated_at: string;
};

/** Datos cortos del quick-add de cliente. */
export type ClienteInput = {
  nombre: string;
  telefono: string | null;
  cedula_rnc: string | null;
};

export type Etapa = {
  id: string;
  obra_id: string;
  nombre: string;
  completada: boolean;
  orden: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  porcentaje: number | null;
};

/** Etapa en edición dentro del formulario (id ausente = nueva). */
export type EtapaDraft = {
  id?: string;
  nombre: string;
  completada: boolean;
  orden: number;
};

export type Proyecto = {
  id: string;
  nombre: string;
  ubicacion: string | null;
  /** Texto legado (obras anteriores); se prefiere `cliente_rel`. */
  cliente: string | null;
  cliente_id: string | null;
  cliente_rel: Pick<Cliente, "id" | "nombre" | "telefono" | "cedula_rnc"> | null;
  estado: EstadoObra;
  fecha_inicio: string | null;
  fecha_fin_estimada: string | null;
  /** Calculado a partir de las etapas (completadas ÷ total). */
  avance: number;
  presupuesto: number | null;
  notas: string | null;
  etapas: Etapa[];
  created_at: string;
  updated_at: string;
};

/** Datos que captura el formulario de obra (el avance se calcula de etapas). */
export type ProyectoInput = {
  nombre: string;
  ubicacion: string | null;
  cliente_id: string | null;
  estado: EstadoObra;
  fecha_inicio: string | null;
  fecha_fin_estimada: string | null;
  presupuesto: number | null;
  notas: string | null;
};

/** Nombre visible del cliente de una obra (rel o texto legado). */
export function clienteNombre(p: Proyecto): string | null {
  return p.cliente_rel?.nombre ?? p.cliente ?? null;
}

/** Avance calculado desde etapas: completadas ÷ total × 100. */
export function calcularAvance(
  etapas: { completada: boolean }[],
): number {
  if (etapas.length === 0) return 0;
  const done = etapas.filter((e) => e.completada).length;
  return Math.round((done / etapas.length) * 100);
}

/** Valida y normaliza cédula (000-0000000-0) o RNC (9 díg.) dominicano. */
export function normalizarCedulaRnc(
  raw: string,
): { ok: true; value: string | null } | { ok: false; error: string } {
  const s = raw.trim();
  if (s === "") return { ok: true, value: null };
  const digits = s.replace(/\D/g, "");
  if (digits.length === 11) {
    return {
      ok: true,
      value: `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10)}`,
    };
  }
  if (digits.length === 9) {
    return { ok: true, value: digits };
  }
  return {
    ok: false,
    error: "Cédula (11 dígitos) o RNC (9 dígitos) inválido.",
  };
}

export const ESTADOS: { value: EstadoObra; label: string }[] = [
  { value: "planificacion", label: "Planificación" },
  { value: "en_curso", label: "En curso" },
  { value: "pausada", label: "Pausada" },
  { value: "terminada", label: "Terminada" },
];

export const ESTADO_LABEL: Record<EstadoObra, string> = {
  planificacion: "Planificación",
  en_curso: "En curso",
  pausada: "Pausada",
  terminada: "Terminada",
};

/**
 * Clases de badge por estado. Strings literales completos para que Tailwind
 * los incluya. Contraste verificado en AMBOS temas: texto -700 en claro,
 * -300 en oscuro (los badges antes quedaban ilegibles — aquí no).
 */
export const ESTADO_BADGE: Record<
  EstadoObra,
  { badge: string; dot: string }
> = {
  planificacion: {
    badge:
      "bg-sky-500/12 text-sky-700 dark:text-sky-300 ring-1 ring-inset ring-sky-500/25",
    dot: "bg-sky-500",
  },
  en_curso: {
    badge:
      "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-500/25",
    dot: "bg-emerald-500",
  },
  pausada: {
    badge:
      "bg-amber-500/12 text-amber-700 dark:text-amber-300 ring-1 ring-inset ring-amber-500/25",
    dot: "bg-amber-500",
  },
  terminada: {
    badge:
      "bg-violet-500/12 text-violet-700 dark:text-violet-300 ring-1 ring-inset ring-violet-500/25",
    dot: "bg-violet-500",
  },
};

/** Provincias/ciudades comunes de RD (sugerencias para el campo ubicación). */
export const UBICACIONES_RD = [
  "Santiago",
  "Santo Domingo",
  "Distrito Nacional",
  "Punta Cana",
  "La Vega",
  "Nagua",
  "Puerto Plata",
  "San Francisco de Macorís",
  "Moca",
  "La Romana",
  "San Cristóbal",
  "Higüey",
  "Bonao",
  "Baní",
  "San Pedro de Macorís",
];
