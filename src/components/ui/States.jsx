import { AlertCircle, CircleDashed, Inbox, LoaderCircle } from "lucide-react";
import { Button } from "./Button.jsx";

function State({
  icon: Icon,
  title,
  description,
  children,
  tone = "neutral",
  live = false,
}) {
  return (
    <div className={`state state--${tone}`} role={live ? "status" : undefined}>
      <span className="state__icon">
        <Icon size={25} aria-hidden="true" />
      </span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {children && <div className="state__actions">{children}</div>}
    </div>
  );
}
export function LoadingState({ title = "Memuat data…", description }) {
  return (
    <div className="state" role="status">
      <LoaderCircle className="spin" aria-hidden="true" />
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  );
}
export function EmptyState({
  title = "Belum ada data",
  description,
  children,
}) {
  return (
    <State icon={Inbox} title={title} description={description}>
      {children}
    </State>
  );
}
export function ErrorState({
  title = "Data tidak dapat dimuat",
  description = "Coba kembali beberapa saat lagi.",
  onRetry,
  children,
}) {
  return (
    <State
      icon={AlertCircle}
      tone="error"
      title={title}
      description={description}
      live
    >
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Coba lagi
        </Button>
      )}
      {children}
    </State>
  );
}
export function UnavailableState({
  title = "Layanan belum tersedia",
  description = "Tampilan sudah disiapkan. Data akan tersedia setelah kontrak API disepakati dan backend terhubung.",
  children,
}) {
  return (
    <State
      icon={CircleDashed}
      tone="unavailable"
      title={title}
      description={description}
    >
      {children}
    </State>
  );
}
