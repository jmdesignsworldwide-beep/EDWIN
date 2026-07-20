import {
  LayoutDashboard,
  HardHat,
  Wallet,
  CalendarRange,
  Boxes,
  Truck,
  ShoppingCart,
  Landmark,
  Users,
  ClipboardCheck,
  Banknote,
  Wrench,
  FileText,
  BarChart3,
  UserSquare2,
  ShieldCheck,
  Camera,
  Bell,
  ListChecks,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Optional badge count placeholder for future wiring. */
  badge?: number;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

/**
 * Sidebar navigation — room for 15+ modules. These are navigable placeholders
 * in Tanda 1; each business module lands in a later wave.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    title: "General",
    items: [
      { label: "Panel", href: "/dashboard", icon: LayoutDashboard },
      { label: "Obras", href: "/obras", icon: HardHat },
      { label: "Clientes", href: "/clientes", icon: UserSquare2 },
    ],
  },
  {
    title: "Planificación",
    items: [
      { label: "Presupuestos", href: "/presupuestos", icon: Wallet },
      { label: "Cronograma", href: "/cronograma", icon: CalendarRange },
      { label: "Documentos", href: "/documentos", icon: FileText },
    ],
  },
  {
    title: "Operación",
    items: [
      { label: "Materiales", href: "/materiales", icon: Boxes },
      { label: "Proveedores", href: "/proveedores", icon: Truck },
      { label: "Compras", href: "/compras", icon: ShoppingCart, badge: 3 },
      { label: "Préstamos", href: "/prestamos", icon: Landmark },
      { label: "Maquinaria", href: "/maquinaria", icon: Wrench },
    ],
  },
  {
    title: "Equipo",
    items: [
      { label: "Personal", href: "/personal", icon: Users },
      { label: "Asistencia", href: "/asistencia", icon: ClipboardCheck },
      { label: "Nómina", href: "/nomina", icon: Banknote },
      { label: "Seguridad", href: "/seguridad", icon: ShieldCheck },
    ],
  },
  {
    title: "Seguimiento",
    items: [
      { label: "Avances", href: "/avances", icon: Camera },
      { label: "Reportes", href: "/reportes", icon: BarChart3 },
      { label: "Pendientes", href: "/pendientes", icon: ListChecks },
      { label: "Notificaciones", href: "/notificaciones", icon: Bell },
    ],
  },
  {
    title: "Sistema",
    items: [{ label: "Configuración", href: "/configuracion", icon: Settings }],
  },
];

/** Flat lookup for titles / breadcrumbs. */
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
