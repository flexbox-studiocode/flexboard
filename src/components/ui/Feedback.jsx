  import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
  import { useId } from "react";
  import { IconButton } from "./Button.jsx";

  const icons = { info: Info, success: CheckCircle2, error: AlertCircle };

  export function Feedback({ tone = "info", title, children, onDismiss }) {
    const titleId = useId();
    const resolvedTone = Object.hasOwn(icons, tone) ? tone : "info";
    const Icon = icons[resolvedTone];

    return (
      <div
        className={`feedback feedback--${resolvedTone}`}
        role={resolvedTone === "error" ? "alert" : "status"}
        aria-labelledby={title ? titleId : undefined}
      >
        <Icon className="feedback__icon" size={22} aria-hidden="true" />
        <div className="feedback__content">
          {title && (
            <h2 className="feedback__title" id={titleId}>
              {title}
            </h2>
          )}
          {children != null && <div className="feedback__body">{children}</div>}
        </div>
        {typeof onDismiss === "function" && (
          <IconButton
            label="Tutup pemberitahuan"
            className="feedback__dismiss"
            onClick={onDismiss}
          >
            <X size={18} aria-hidden="true" />
          </IconButton>
        )}
      </div>
    );
  }
