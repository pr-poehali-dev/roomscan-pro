import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { getToken, type User } from "@/lib/api";
// Главная и Проекты — eager (нужны сразу при входе)
import HomeSection from "@/components/sections/HomeSection";
import { ProjectsSection, ProfileSection } from "@/components/sections/UserSections";
import type { Section } from "./types";

// Все остальные секции — lazy с авто-ретраем (устойчивость к устаревшим чанкам после деплоя)
const ScanSection = lazyWithRetry(() => import("@/components/scan/ScanSection"));
const PlannerSection = lazyWithRetry(() => import("@/components/sections/PlannerSection"));
const CatalogSection = lazyWithRetry(() => import("@/components/sections/CatalogSection"));
const TileCatalogSection = lazyWithRetry(() => import("@/components/sections/TileCatalogSection"));
const WallsSection = lazyWithRetry(() => import("@/components/sections/WallsSection"));
const CalcSection = lazyWithRetry(() => import("@/components/sections/CalcSection"));
const ExportSection = lazyWithRetry(() =>
  import("@/components/sections/ExportHelpSection").then((m) => ({ default: m.ExportSection })),
);
const HelpSection = lazyWithRetry(() =>
  import("@/components/sections/ExportHelpSection").then((m) => ({ default: m.HelpSection })),
);
const UseCasesSection = lazyWithRetry(() => import("@/components/sections/UseCasesSection"));
const StylesSection = lazyWithRetry(() => import("@/components/sections/StylesSection"));
const StagingSection = lazyWithRetry(() => import("@/components/sections/StagingSection"));
const OpeningsSection = lazyWithRetry(() => import("@/components/sections/OpeningsSection"));
const PartnersSection = lazyWithRetry(() => import("@/components/sections/PartnersSection"));
const PricingSection = lazyWithRetry(() => import("@/components/sections/PricingSection"));
const EngineeringSection = lazyWithRetry(() => import("@/components/sections/EngineeringSection"));
const ModularHousesSection = lazyWithRetry(() => import("@/components/sections/ModularHousesSection"));
const ConverterSection = lazyWithRetry(() => import("@/components/sections/ConverterSection"));
const BrandsSection = lazyWithRetry(() => import("@/components/sections/BrandsSection"));
const LearnSection = lazyWithRetry(() => import("@/components/sections/LearnSection"));
const AdminOffice = lazyWithRetry(() => import("@/components/admin/AdminOffice"));

/**
 * Рендер активной секции по id. Все lazy-импорты собраны здесь —
 * родительский Index не знает про конкретные секции, только про маршрутизацию.
 */
interface Props {
  active: Section;
  user: User;
  setActive: (s: Section) => void;
  logout: () => void;
}

export default function SectionRouter({ active, user, setActive, logout }: Props) {
  switch (active) {
    case "home": return <HomeSection onNavigate={(s) => setActive(s as Section)} userName={user?.name} />;
    case "projects": return <ProjectsSection token={getToken()} onNavigate={(s) => setActive(s as Section)} />;
    case "scan": return <ScanSection />;
    case "usecases": return <UseCasesSection onNavigate={(s) => setActive(s as Section)} />;
    case "planner": return <PlannerSection onNavigate={(s) => setActive(s as Section)} />;
    case "catalog": return <CatalogSection />;
    case "tiles": return <TileCatalogSection />;
    case "walls": return <WallsSection onNavigate={(s) => setActive(s as Section)} />;
    case "styles": return <StylesSection />;
    case "calc": return <CalcSection />;
    case "openings": return <OpeningsSection />;
    case "staging": return <StagingSection />;
    case "engineering": return <EngineeringSection />;
    case "modular-houses": return <ModularHousesSection />;
    case "converter": return <ConverterSection />;
    case "brands": return <BrandsSection />;
    case "learn": return <LearnSection onNavigate={(s) => setActive(s as Section)} />;
    case "export": return <ExportSection />;
    case "pricing": return <PricingSection />;
    case "partners": return <PartnersSection />;
    case "admin": return <AdminOffice />;
    case "profile": return <ProfileSection user={user} onLogout={logout} />;
    case "help": return <HelpSection />;
    default: return <HomeSection onNavigate={(s) => setActive(s as Section)} userName={user?.name} />;
  }
}