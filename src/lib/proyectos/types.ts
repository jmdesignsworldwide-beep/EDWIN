/**
 * Tipos y catálogos del módulo Proyectos (obras). Compartidos entre server
 * actions y UI. Sin lógica de servidor aquí (seguro para importar en cliente).
 */

export type EstadoObra =
  | "planificacion"
  | "en_curso"
  | "pausada"
  | "terminada";

export type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: "admin" | "usuario";
  activo: boolean;
  must_change_password: boolean;
  created_at: string;
};

export type ClienteTipo = "persona" | "empresa";

export type Cliente = {
  id: string;
  /** Nombre visible: persona → nombre completo; empresa → razón social. */
  nombre: string;
  tipo: ClienteTipo;
  telefono: string | null;
  /** Cédula (persona) o RNC (empresa) según el tipo. */
  cedula_rnc: string | null;
  email: string | null;
  direccion: string | null;
  /** Persona de contacto dentro de la empresa. */
  contacto_nombre: string | null;
  contacto_telefono: string | null;
  /** false = creado por quick-add, faltan datos por completar. */
  datos_completos: boolean;
  created_at: string;
  updated_at: string;
};

/** Datos del formulario de cliente (completo o quick-add). */
export type ClienteInput = {
  nombre: string;
  tipo: ClienteTipo;
  telefono: string | null;
  cedula_rnc: string | null;
  email: string | null;
  direccion: string | null;
  contacto_nombre: string | null;
  contacto_telefono: string | null;
};

export const TIPOS_CLIENTE: { value: ClienteTipo; label: string }[] = [
  { value: "persona", label: "Persona" },
  { value: "empresa", label: "Empresa" },
];

export const CLIENTE_TIPO_LABEL: Record<ClienteTipo, string> = {
  persona: "Persona",
  empresa: "Empresa",
};

/** Badge por tipo de cliente. Contraste verificado en ambos temas. */
export const CLIENTE_TIPO_BADGE: Record<
  ClienteTipo,
  { badge: string; label: string }
> = {
  persona: {
    badge:
      "bg-sky-500/12 text-sky-700 dark:text-sky-300 ring-1 ring-inset ring-sky-500/25",
    label: "Persona",
  },
  empresa: {
    badge:
      "bg-violet-500/12 text-violet-700 dark:text-violet-300 ring-1 ring-inset ring-violet-500/25",
    label: "Empresa",
  },
};

/** Etiqueta del documento según el tipo (cédula para persona, RNC para empresa). */
export function documentoLabel(tipo: ClienteTipo): string {
  return tipo === "empresa" ? "RNC" : "Cédula";
}

/**
 * Un cliente está "completo" cuando tiene los datos clave de su tipo:
 * nombre, teléfono y documento; y para empresa, además persona de contacto.
 */
export function clienteCompleto(c: {
  tipo: ClienteTipo;
  nombre: string | null;
  telefono: string | null;
  cedula_rnc: string | null;
  contacto_nombre?: string | null;
}): boolean {
  if (!c.nombre?.trim()) return false;
  if (!c.telefono?.trim()) return false;
  if (!c.cedula_rnc?.trim()) return false;
  if (c.tipo === "empresa" && !c.contacto_nombre?.trim()) return false;
  return true;
}

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
  /** Hora esperada de entrada de la obra (para tarde/temprano). Null = default. */
  hora_entrada_esperada: string | null;
  // ── Datos detallados (todos opcionales) ──
  tipo_obra: string | null;
  metros: number | null;
  direccion: string | null;
  telefono_obra: string | null;
  encargado_id: string | null;
  /** Encargado embebido (personal a cargo). */
  encargado_rel?: { id: string; nombre: string } | null;
  anticipo_monto: number | null;
  anticipo_metodo: MetodoAnticipo | null;
  /** Ruta del archivo inicial en Storage (bucket privado "obras"). */
  archivo_inicial: string | null;
  // ── Rentabilidad ──
  costo_estimado: number | null;
  precio_venta: number | null;
  notas: string | null;
  etapas: Etapa[];
  /** Presente en el detalle de la obra (getProyecto / listado). */
  materiales?: Material[];
  /** Personal asignado a la obra (personal_obra). */
  equipo?: AsignacionEnObra[];
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

export type EstadoAsistencia = "presente" | "ausente" | "medio";

export type Asistencia = {
  id: string;
  persona_id: string;
  obra_id: string;
  fecha: string;
  estado: EstadoAsistencia;
  horas: number | null;
  hora_entrada: string | null;
  hora_salida: string | null;
  /** Motivo de falta o tardanza (texto libre). */
  excusa: string | null;
  notas: string | null;
};

/** Hora de entrada esperada por defecto del sistema (si la obra no define una). */
export const HORA_ENTRADA_DEFAULT = "08:00";

export type PuntualidadEstado = "a_tiempo" | "tarde" | "temprano";

/**
 * Calcula la puntualidad comparando la hora de llegada con la esperada.
 * Tolerancia: hasta 5 min tarde = a tiempo; más de 10 min antes = temprano.
 * Devuelve null si no hay hora de llegada.
 */
export function puntualidad(
  horaEntrada: string | null,
  esperada: string | null = HORA_ENTRADA_DEFAULT,
): { estado: PuntualidadEstado; minutos: number } | null {
  if (!horaEntrada) return null;
  const toMin = (t: string): number | null => {
    const m = /^(\d{1,2}):(\d{2})/.exec(t);
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  };
  const l = toMin(horaEntrada);
  const e = toMin(esperada || HORA_ENTRADA_DEFAULT);
  if (l == null || e == null) return null;
  const diff = l - e; // positivo = tarde
  if (diff > 5) return { estado: "tarde", minutos: diff };
  if (diff < -10) return { estado: "temprano", minutos: -diff };
  return { estado: "a_tiempo", minutos: 0 };
}

export const PUNTUALIDAD_BADGE: Record<
  PuntualidadEstado,
  { badge: string; label: string }
> = {
  a_tiempo: {
    badge: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-500/25",
    label: "A tiempo",
  },
  tarde: {
    badge: "bg-amber-500/12 text-amber-700 dark:text-amber-300 ring-1 ring-inset ring-amber-500/25",
    label: "Tarde",
  },
  temprano: {
    badge: "bg-sky-500/12 text-sky-700 dark:text-sky-300 ring-1 ring-inset ring-sky-500/25",
    label: "Temprano",
  },
};

/** Texto corto de puntualidad, p.ej. "Tarde · 25 min". */
export function puntualidadLabel(p: { estado: PuntualidadEstado; minutos: number }): string {
  if (p.estado === "a_tiempo") return "A tiempo";
  return `${p.estado === "tarde" ? "Tarde" : "Temprano"} · ${p.minutos} min`;
}

/** Fila del pase de lista: persona asignada + su asistencia del día (si hay). */
export type PaseListaRow = {
  persona: {
    id: string;
    nombre: string;
    oficio: string | null;
    telefono: string | null;
    activo: boolean;
  };
  rol_en_obra: string | null;
  asistencia: Asistencia | null;
};

export const ESTADOS_ASISTENCIA: {
  value: EstadoAsistencia;
  label: string;
  corto: string;
}[] = [
  { value: "presente", label: "Presente", corto: "P" },
  { value: "medio", label: "Medio día", corto: "½" },
  { value: "ausente", label: "Ausente", corto: "A" },
];

/** Clases por estado. Contraste verificado en ambos temas. `on` = seleccionado. */
export const ESTADO_ASISTENCIA_UI: Record<
  EstadoAsistencia,
  { on: string; dot: string; text: string }
> = {
  presente: {
    on: "bg-emerald-500 text-white border-emerald-500",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  medio: {
    on: "bg-amber-500 text-white border-amber-500",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-300",
  },
  ausente: {
    on: "bg-rose-500 text-white border-rose-500",
    dot: "bg-rose-500",
    text: "text-rose-700 dark:text-rose-300",
  },
};

/** Días trabajados: presente=1, medio=0.5, ausente=0. */
export function diasTrabajados(
  registros: { estado: EstadoAsistencia }[],
): number {
  return registros.reduce(
    (acc, r) => acc + (r.estado === "presente" ? 1 : r.estado === "medio" ? 0.5 : 0),
    0,
  );
}

export type JornalTipo = "dia" | "semana" | "hora";

export type Persona = {
  id: string;
  nombre: string;
  oficio: string | null;
  telefono: string | null;
  cedula: string | null;
  jornal: number | null;
  jornal_tipo: JornalTipo;
  activo: boolean;
  notas: string | null;
  /** Asignaciones a obras (presente en el detalle). */
  obras?: AsignacionDePersona[];
  created_at: string;
  updated_at: string;
};

export type PersonaInput = {
  nombre: string;
  oficio: string | null;
  telefono: string | null;
  cedula: string | null;
  jornal: number | null;
  jornal_tipo: JornalTipo;
  activo: boolean;
  notas: string | null;
};

/** Fila de personal_obra vista desde la persona (con la obra embebida). */
export type AsignacionDePersona = {
  id: string;
  obra_id: string;
  rol_en_obra: string | null;
  obra: { id: string; nombre: string; estado: EstadoObra } | null;
};

/** Fila de personal_obra vista desde la obra (con la persona embebida). */
export type AsignacionEnObra = {
  id: string;
  rol_en_obra: string | null;
  persona: {
    id: string;
    nombre: string;
    oficio: string | null;
    telefono: string | null;
    activo: boolean;
  } | null;
};

export const OFICIOS = [
  "Maestro constructor",
  "Capataz",
  "Albañil",
  "Ayudante",
  "Plomero",
  "Electricista",
  "Operador",
  "Armador",
  "Pintor",
  "Soldador",
];

export const JORNAL_TIPOS: { value: JornalTipo; label: string; corto: string }[] = [
  { value: "dia", label: "Por día", corto: "día" },
  { value: "semana", label: "Por semana", corto: "sem" },
  { value: "hora", label: "Por hora", corto: "hora" },
];

export const JORNAL_TIPO_CORTO: Record<JornalTipo, string> = {
  dia: "día",
  semana: "sem",
  hora: "hora",
};

// ── Nómina ───────────────────────────────────────────────────
// El sistema CALCULA y REGISTRA la nómina. NO paga. "Pagada" es una etiqueta.
// Nómina = días trabajados (asistencia) × jornal/día (personal) + extras − descuentos.
// TODO el cálculo de montos ocurre en el servidor. Estos tipos son solo formas.

export type NominaEstado = "pendiente" | "pagada" | "anulada";
export type MetodoPago = "efectivo" | "transferencia" | "otro";

/** Un extra (bono, horas extra…) o un descuento (adelanto, otro) de una línea. */
export type ConceptoLinea = {
  tipo: "extra" | "descuento";
  concepto: string;
  monto: number;
};

export type NominaLinea = {
  id: string;
  nomina_id: string;
  persona_id: string | null;
  persona_nombre: string;
  dias: number;
  jornal: number;
  jornal_tipo: JornalTipo;
  jornal_diario: number;
  base: number;
  extras: number;
  descuentos: number;
  neto: number;
  conceptos: ConceptoLinea[];
  created_at: string;
};

export type Nomina = {
  id: string;
  desde: string;
  hasta: string;
  estado: NominaEstado;
  total: number;
  fecha_cierre: string;
  fecha_pago: string | null;
  metodo_pago: MetodoPago | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
  /** Presente en el detalle (getNomina). */
  lineas?: NominaLinea[];
  /** Cantidad de personas (para el listado). */
  personas?: number;
};

/**
 * Línea del PREVIEW de nómina: calculada en el servidor a partir de la
 * asistencia y el jornal. No está guardada aún; Edwin le suma extras/descuentos
 * antes de cerrar. La base NUNCA la fija el cliente — se recalcula al guardar.
 */
export type PreviewLinea = {
  persona_id: string;
  persona_nombre: string;
  oficio: string | null;
  dias: number;
  jornal: number;
  jornal_tipo: JornalTipo;
  jornal_diario: number;
  base: number;
  /** Texto legible del cálculo, p. ej. "6.5 días × RD$1,500.00/día = RD$9,750.00". */
  supuesto: string;
};

/** Días laborables por semana y horas por día (para convertir el jornal a /día). */
export const DIAS_POR_SEMANA = 6;
export const HORAS_POR_DIA = 8;

/** Redondeo a 2 decimales estable (evita 0.1+0.2 = 0.30000000000000004). */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Convierte el jornal a monto por día según su unidad (transparente para Edwin). */
export function jornalDiario(jornal: number, tipo: JornalTipo): number {
  if (tipo === "semana") return round2(jornal / DIAS_POR_SEMANA);
  if (tipo === "hora") return round2(jornal * HORAS_POR_DIA);
  return round2(jornal);
}

export const METODOS_PAGO: { value: MetodoPago; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "otro", label: "Otro" },
];

export const METODO_PAGO_LABEL: Record<MetodoPago, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  otro: "Otro",
};

/** Badge por estado de nómina. Contraste verificado en ambos temas. */
export const NOMINA_ESTADO_BADGE: Record<
  NominaEstado,
  { badge: string; dot: string; label: string }
> = {
  pendiente: {
    badge:
      "bg-amber-500/12 text-amber-700 dark:text-amber-300 ring-1 ring-inset ring-amber-500/25",
    dot: "bg-amber-500",
    label: "Pendiente",
  },
  pagada: {
    badge:
      "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-500/25",
    dot: "bg-emerald-500",
    label: "Pagada",
  },
  anulada: {
    badge:
      "bg-slate-500/12 text-slate-600 dark:text-slate-300 ring-1 ring-inset ring-slate-500/25",
    dot: "bg-slate-500",
    label: "Anulada",
  },
};

// ── Bloque 2 · Pagos/entregas y notas del empleado ───────────

export type PagoTipo = "adelanto" | "pago" | "entrega" | "otro";

export type PagoEmpleado = {
  id: string;
  persona_id: string;
  tipo: PagoTipo;
  monto: number;
  concepto: string | null;
  fecha: string;
  origen: "manual" | "nomina";
  saldado: boolean;
  nomina_id: string | null;
  notas: string | null;
  created_at: string;
};

export type PagoInput = {
  tipo: PagoTipo;
  monto: number;
  concepto: string | null;
  fecha: string;
  notas: string | null;
};

export const PAGO_TIPOS: { value: PagoTipo; label: string }[] = [
  { value: "adelanto", label: "Adelanto" },
  { value: "pago", label: "Pago" },
  { value: "entrega", label: "Entrega" },
  { value: "otro", label: "Otro" },
];

export const PAGO_TIPO_LABEL: Record<PagoTipo, string> = {
  adelanto: "Adelanto",
  pago: "Pago",
  entrega: "Entrega",
  otro: "Otro",
};

/** Badge por tipo de pago. Contraste verificado en ambos temas. */
export const PAGO_TIPO_BADGE: Record<PagoTipo, string> = {
  adelanto: "bg-amber-500/12 text-amber-700 dark:text-amber-300 ring-1 ring-inset ring-amber-500/25",
  pago: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-500/25",
  entrega: "bg-sky-500/12 text-sky-700 dark:text-sky-300 ring-1 ring-inset ring-sky-500/25",
  otro: "bg-slate-500/12 text-slate-600 dark:text-slate-300 ring-1 ring-inset ring-slate-500/25",
};

export type NotaTipo = "positiva" | "negativa" | "neutral";

export type NotaEmpleado = {
  id: string;
  persona_id: string;
  nota: string;
  tipo: NotaTipo;
  fecha: string;
  created_at: string;
};

export const NOTA_TIPOS: { value: NotaTipo; label: string }[] = [
  { value: "positiva", label: "Positiva" },
  { value: "negativa", label: "A mejorar" },
  { value: "neutral", label: "Neutral" },
];

export const NOTA_TIPO_BADGE: Record<NotaTipo, { badge: string; label: string; dot: string }> = {
  positiva: {
    badge: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-500/25",
    label: "Positiva",
    dot: "bg-emerald-500",
  },
  negativa: {
    badge: "bg-rose-500/12 text-rose-700 dark:text-rose-300 ring-1 ring-inset ring-rose-500/25",
    label: "A mejorar",
    dot: "bg-rose-500",
  },
  neutral: {
    badge: "bg-slate-500/12 text-slate-600 dark:text-slate-300 ring-1 ring-inset ring-slate-500/25",
    label: "Neutral",
    dot: "bg-slate-500",
  },
};

/** Total entregado (suma de todos los pagos/entregas). */
export function totalEntregado(pagos: { monto: number }[]): number {
  return round2(pagos.reduce((acc, p) => acc + (p.monto ?? 0), 0));
}

/** Adelantos pendientes (aún no saldados en nómina). Base para el Bloque 4. */
export function adelantosPendientes(
  pagos: { tipo: PagoTipo; saldado: boolean; monto: number }[],
): number {
  return round2(
    pagos
      .filter((p) => p.tipo === "adelanto" && !p.saldado)
      .reduce((acc, p) => acc + (p.monto ?? 0), 0),
  );
}

/** Categorías de opciones de selector inteligente (claves en opciones_selector). */
export type CategoriaOpcion =
  | "proveedor_categoria"
  | "oficio"
  | "unidad_material"
  | "tipo_obra"
  | "gasto_categoria";

// ── Panel Financiero de Obra ─────────────────────────────────
// El gasto real se calcula en el SERVIDOR. Estos tipos son solo formas.

export type GastoObra = {
  id: string;
  obra_id: string;
  categoria: string;
  concepto: string | null;
  monto: number;
  fecha: string;
  notas: string | null;
  created_at: string;
  updated_at: string;
};

export type GastoInput = {
  categoria: string;
  concepto: string | null;
  monto: number;
  fecha: string;
  notas: string | null;
};

/** Categorías sugeridas de gastos manuales de obra (RD). */
export const CATEGORIAS_GASTO = [
  "Combustible",
  "Transporte",
  "Alquiler de equipo",
  "Permisos",
  "Alimentación",
  "Herramientas",
  "Imprevistos",
  "Otros",
];

/** Desglose del gasto real de una obra (calculado en el servidor). */
export type FinancieroResumen = {
  presupuesto: number | null;
  materiales: number;
  manoObra: number;
  compras: number;
  gastosManuales: number;
  gastado: number;
  restante: number | null;
  /** Porcentaje ejecutado (gastado/presupuesto) o null si no hay presupuesto. */
  ejecutado: number | null;
  /** Semáforo: 'sano' | 'alerta' | 'excedido' | 'sin_presupuesto'. */
  estado: "sano" | "alerta" | "excedido" | "sin_presupuesto";
};

// ── Cobros (dinero que entra del cliente) ──
export type Cobro = {
  id: string;
  obra_id: string;
  monto: number;
  concepto: string | null;
  fecha: string;
  metodo: MetodoAnticipo | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
};

export type CobroInput = {
  monto: number;
  concepto: string | null;
  fecha: string;
  metodo: MetodoAnticipo | null;
  notas: string | null;
};

/** Rentabilidad de una obra: proyectada (estimado) vs. real (gasto del panel). */
export type Rentabilidad = {
  costoEstimado: number | null;
  precioVenta: number | null;
  gastoReal: number;
  proyectadaMonto: number | null;
  proyectadaPct: number | null;
  realMonto: number | null;
  realPct: number | null;
};

/** Enlace de WhatsApp para un teléfono dominicano (+1). Null si no hay número. */
export function whatsappLink(telefono: string | null): string | null {
  if (!telefono) return null;
  let digits = telefono.replace(/\D/g, "");
  if (digits.length === 10) digits = "1" + digits; // 809/829/849 → +1
  if (digits.length < 11) return null;
  return `https://wa.me/${digits}`;
}

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
  hora_entrada_esperada: string | null;
  tipo_obra: string | null;
  metros: number | null;
  direccion: string | null;
  telefono_obra: string | null;
  encargado_id: string | null;
  anticipo_monto: number | null;
  anticipo_metodo: MetodoAnticipo | null;
  archivo_inicial: string | null;
  costo_estimado: number | null;
  precio_venta: number | null;
  notas: string | null;
};

export type MetodoAnticipo = "efectivo" | "transferencia" | "cheque" | "otro";

export const METODOS_ANTICIPO: { value: MetodoAnticipo; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "cheque", label: "Cheque" },
  { value: "otro", label: "Otro" },
];

export const METODO_ANTICIPO_LABEL: Record<MetodoAnticipo, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  cheque: "Cheque",
  otro: "Otro",
};

/** Tipos de obra sugeridos (punto de partida del SmartSelect; Edwin agrega los suyos). */
export const TIPOS_OBRA = [
  "Residencial",
  "Comercial",
  "Remodelación",
  "Ampliación",
  "Reparación",
  "Obra gris",
  "Terminación",
];

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

/**
 * Valida el documento según el tipo de cliente: persona → cédula (11 dígitos),
 * empresa → RNC (9 dígitos). Vacío es válido (queda como dato por completar).
 */
export function normalizarDocumento(
  raw: string,
  tipo: ClienteTipo,
): { ok: true; value: string | null } | { ok: false; error: string } {
  const s = raw.trim();
  if (s === "") return { ok: true, value: null };
  const digits = s.replace(/\D/g, "");
  if (tipo === "empresa") {
    if (digits.length === 9) return { ok: true, value: digits };
    return { ok: false, error: "El RNC debe tener 9 dígitos." };
  }
  if (digits.length === 11) {
    return {
      ok: true,
      value: `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10)}`,
    };
  }
  return { ok: false, error: "La cédula debe tener 11 dígitos (000-0000000-0)." };
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
