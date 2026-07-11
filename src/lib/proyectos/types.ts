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

export type EstadoEtapa = "pendiente" | "en_curso" | "completada" | "retrasada";

export type Etapa = {
  id: string;
  obra_id: string;
  nombre: string;
  estado: EstadoEtapa;
  completada: boolean;
  orden: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  porcentaje: number | null;
  notas: string | null;
};

/** Datos que captura el formulario de etapa. */
export type EtapaInput = {
  nombre: string;
  estado: EstadoEtapa;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  porcentaje: number;
  notas: string | null;
};

export const ESTADOS_ETAPA: { value: EstadoEtapa; label: string }[] = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_curso", label: "En curso" },
  { value: "completada", label: "Completada" },
  { value: "retrasada", label: "Retrasada" },
];

export const ESTADO_ETAPA_LABEL: Record<EstadoEtapa, string> = {
  pendiente: "Pendiente",
  en_curso: "En curso",
  completada: "Completada",
  retrasada: "Retrasada",
};

/**
 * Badge por estado de etapa. Contraste verificado en ambos temas
 * (texto -700 en claro / -300 en oscuro). Se usa también para el color de la
 * barra del Gantt (ver ETAPA_BAR).
 */
export const ESTADO_ETAPA_BADGE: Record<
  EstadoEtapa,
  { badge: string; dot: string }
> = {
  pendiente: {
    badge:
      "bg-slate-500/12 text-slate-700 dark:text-slate-300 ring-1 ring-inset ring-slate-500/25",
    dot: "bg-slate-500",
  },
  en_curso: {
    badge:
      "bg-sky-500/12 text-sky-700 dark:text-sky-300 ring-1 ring-inset ring-sky-500/25",
    dot: "bg-sky-500",
  },
  completada: {
    badge:
      "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-500/25",
    dot: "bg-emerald-500",
  },
  retrasada: {
    badge:
      "bg-rose-500/12 text-rose-700 dark:text-rose-300 ring-1 ring-inset ring-rose-500/25",
    dot: "bg-rose-500",
  },
};

/** Color de relleno de la barra del Gantt por estado (legible en ambos temas). */
export const ETAPA_BAR: Record<EstadoEtapa, string> = {
  pendiente: "bg-slate-400 dark:bg-slate-500",
  en_curso: "bg-sky-500",
  completada: "bg-emerald-500",
  retrasada: "bg-rose-500",
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
  /** Presente en el detalle de la obra (getProyecto / listado). */
  materiales?: Material[];
  created_at: string;
  updated_at: string;
};

export type Material = {
  id: string;
  obra_id: string;
  etapa_id: string | null;
  proveedor_id: string | null;
  proveedor_rel: { id: string; nombre: string } | null;
  nombre: string;
  unidad: string | null;
  cantidad_comprada: number | null;
  cantidad_usada: number | null;
  costo_unitario: number | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
};

export type MaterialInput = {
  nombre: string;
  etapa_id: string | null;
  proveedor_id: string | null;
  unidad: string | null;
  cantidad_comprada: number | null;
  cantidad_usada: number | null;
  costo_unitario: number | null;
  notas: string | null;
};

export type Proveedor = {
  id: string;
  nombre: string;
  telefono: string | null;
  rnc_cedula: string | null;
  categoria: string | null;
  contacto: string | null;
  notas: string | null;
  compras?: Compra[];
  created_at: string;
  updated_at: string;
};

export type ProveedorInput = {
  nombre: string;
  telefono: string | null;
  rnc_cedula: string | null;
  categoria: string | null;
  contacto: string | null;
  notas: string | null;
};

export type Compra = {
  id: string;
  proveedor_id: string;
  obra_id: string | null;
  fecha: string;
  descripcion: string | null;
  monto: number | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
};

export type CompraInput = {
  obra_id: string | null;
  fecha: string;
  descripcion: string | null;
  monto: number | null;
  notas: string | null;
};

/** Categorías/rubros comunes de proveedores de construcción (RD). */
export const CATEGORIAS_PROVEEDOR = [
  "Ferretería",
  "Bloquera",
  "Agregados",
  "Pinturas",
  "Eléctrico",
  "Plomería",
  "Maderas",
  "Aceros",
  "Transporte",
  "Otros",
];

/** Total comprado a un proveedor (suma de montos de sus compras). */
export function totalComprado(compras: Compra[]): number {
  return compras.reduce((acc, c) => acc + (c.monto ?? 0), 0);
}

/** Fecha de la última compra (ISO) o null. */
export function ultimaCompra(compras: Compra[]): string | null {
  if (compras.length === 0) return null;
  return compras.reduce((max, c) => (c.fecha > max ? c.fecha : max), compras[0].fecha);
}

/** Unidades comunes de construcción (RD). */
export const UNIDADES = [
  "sacos",
  "unidades",
  "m³",
  "galones",
  "quintales",
  "pies",
  "libras",
  "varillas",
  "planchas",
  "metros",
  "rollos",
  "cajas",
];

export type ExistenciaNivel = "ok" | "bajo" | "agotado" | null;

/** Restante = comprada − usada (null si no se lleva cantidad comprada). */
export function materialRestante(m: {
  cantidad_comprada: number | null;
  cantidad_usada: number | null;
}): number | null {
  if (m.cantidad_comprada == null) return null;
  return m.cantidad_comprada - (m.cantidad_usada ?? 0);
}

/** Nivel de existencia con umbral simple (bajo ≤ 15% de lo comprado). */
export function nivelExistencia(m: {
  cantidad_comprada: number | null;
  cantidad_usada: number | null;
}): ExistenciaNivel {
  const rest = materialRestante(m);
  if (rest == null || !m.cantidad_comprada) return null;
  if (rest <= 0) return "agotado";
  if (rest <= m.cantidad_comprada * 0.15) return "bajo";
  return "ok";
}

/** Subtotal del material = comprada × costo unitario (null si falta alguno). */
export function materialSubtotal(m: {
  cantidad_comprada: number | null;
  costo_unitario: number | null;
}): number | null {
  if (m.cantidad_comprada == null || m.costo_unitario == null) return null;
  return m.cantidad_comprada * m.costo_unitario;
}

/** Total de materiales de la obra (suma de subtotales disponibles). */
export function totalMateriales(materiales: Material[]): number {
  return materiales.reduce((acc, m) => acc + (materialSubtotal(m) ?? 0), 0);
}

/** Cuántos materiales tienen alerta de existencia (bajo o agotado). */
export function materialesEnAlerta(materiales: Material[]): number {
  return materiales.filter((m) => {
    const n = nivelExistencia(m);
    return n === "bajo" || n === "agotado";
  }).length;
}

export const EXISTENCIA_BADGE: Record<
  "bajo" | "agotado",
  { badge: string; label: string }
> = {
  bajo: {
    badge:
      "bg-amber-500/12 text-amber-700 dark:text-amber-300 ring-1 ring-inset ring-amber-500/30",
    label: "Existencia baja",
  },
  agotado: {
    badge:
      "bg-rose-500/12 text-rose-700 dark:text-rose-300 ring-1 ring-inset ring-rose-500/30",
    label: "Agotado",
  },
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

/** Avance de la obra: promedio del % de avance de sus etapas. */
export function calcularAvance(
  etapas: { porcentaje: number | null }[],
): number {
  if (etapas.length === 0) return 0;
  const suma = etapas.reduce((acc, e) => acc + (e.porcentaje ?? 0), 0);
  return Math.round(suma / etapas.length);
}

/** Cuántas etapas están completadas. */
export function etapasCompletadas(
  etapas: { estado: EstadoEtapa }[],
): number {
  return etapas.filter((e) => e.estado === "completada").length;
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
