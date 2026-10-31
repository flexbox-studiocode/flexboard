export function Badge({ children, tone = "neutral", className = "" }) {
  return (
    <span className={`badge badge--${tone} ${className}`}>{children}</span>
  );
}
export function Avatar({ name = "", src, className = "" }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("id-ID");
  return (
    <span className={`avatar ${className}`} aria-hidden="true">
      {src ? <img src={src} alt="" /> : initials || "—"}
    </span>
  );
}
export function ProgressBar({
  value,
  label = "Progres",
  unavailableLabel = "Belum diatur",
}) {
  const valid =
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100;
  return (
    <div className="progress-block">
      <div className="progress-block__label">
        <span>{label}</span>
        <strong>{valid ? `${Math.round(value)}%` : unavailableLabel}</strong>
      </div>
      {valid ? (
        <progress max="100" value={value} aria-label={label} />
      ) : (
        <div className="progress-track" aria-hidden="true" />
      )}
    </div>
  );
}
export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}
export function Panel({ children, className = "", ...props }) {
  return (
    <section {...props} className={`panel ${className}`}>
      {children}
    </section>
  );
}
