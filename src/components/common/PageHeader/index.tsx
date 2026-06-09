import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import type { ReactNode } from "react";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
  badge?: ReactNode;
}

export function PageHeader({ title, subtitle, breadcrumbs, actions, badge }: PageHeaderProps) {
  return (
    <Box sx={{ mb: 3 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 1 }} aria-label="breadcrumb">
          {breadcrumbs.map((crumb, i) =>
            crumb.href && i < breadcrumbs.length - 1 ? (
              <Link key={crumb.label} href={crumb.href} style={{ textDecoration: "none" }}>
                <Typography
                  sx={{
                    fontSize: 12,
                    color: "text.secondary",
                    "&:hover": { color: "primary.light" },
                    transition: "color 0.15s",
                  }}
                >
                  {crumb.label}
                </Typography>
              </Link>
            ) : (
              <Typography key={crumb.label} sx={{ fontSize: 12, color: "text.primary", fontWeight: 500 }}>
                {crumb.label}
              </Typography>
            ),
          )}
        </Breadcrumbs>
      )}

      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography
              sx={{
                fontSize: { xs: 20, sm: 24 },
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
              }}
            >
              {title}
            </Typography>
            {badge}
          </Box>
          {subtitle && (
            <Typography sx={{ mt: 0.5, fontSize: 13.5, color: "text.secondary" }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && <Box sx={{ flexShrink: 0 }}>{actions}</Box>}
      </Box>
    </Box>
  );
}
