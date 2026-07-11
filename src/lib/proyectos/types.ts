/**
 * Tipos y catálogos del módulo Proyectos (obras). Compartidos entre server
 * actions y UI. Sin lógica de servidor aquí (seguro para importar en cliente).
 */

export type EstadoObra =
  | "planificacion"
  | "en_curso"
  | "pausada"
  | "terminada";

export type Proyecto = {
  id: string;
  nombre: string;
  ubicacion: string | null;
  cliente: string | null;
  estado: EstadoObra;
  fecha_inicio: string | null;
  fecha_fin_estimada: string | null;
  avance: number;
  presupuesto: number | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
};

/** Datos que captura el formulario (crear/editar). */
export type ProyectoInput = {
  nombre: string;
  ubicacion: string | null;
  cliente: string | null;
  estado: EstadoObra;
  fecha_inicio: string | null;
  fecha_fin_estimada: string | null;
  avance: number;
  presupuesto: number | null;
  notas: string | null;
};

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
