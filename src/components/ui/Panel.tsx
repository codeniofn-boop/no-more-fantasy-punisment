import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface PanelProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function Panel({ title, subtitle, icon: Icon, action, children, className = "", bodyClassName = "" }: PanelProps) {
  return (
    <section className={`panel rounded-2xl ${className}`}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-ink-600/70 px-5 py-4">
          <div className="flex items-start gap-3">
            {Icon && (
              <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-ink-700 text-shield-400 ring-1 ring-ink-600">
                <Icon className="h-4 w-4" />
              </span>
            )}
            <div>
              {title && <h2 className="text-sm font-semibold tracking-tight text-ink-100">{title}</h2>}
              {subtitle && <p className="mt-0.5 text-xs text-ink-300">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={`px-5 py-4 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
