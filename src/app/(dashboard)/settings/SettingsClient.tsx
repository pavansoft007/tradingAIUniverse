"use client";

import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import Switch from "@mui/material/Switch";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { PageHeader } from "@/components/common/PageHeader";
import { useThemeStore } from "@/store/useThemeStore";

export default function SettingsClient() {
  const { mode, setTheme } = useThemeStore();

  return (
    <>
      <PageHeader
        title="Settings"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Settings" }]}
      />

      <Grid container spacing={2}>
        {/* Appearance */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader
              title="Appearance"
              titleTypographyProps={{ variant: "subtitle1", fontWeight: 600 }}
            />
            <CardContent sx={{ pt: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="body2">Theme</Typography>
                <ToggleButtonGroup
                  value={mode}
                  exclusive
                  onChange={(_, v) => v && setTheme(v)}
                  size="small"
                >
                  <ToggleButton value="light" aria-label="light mode">
                    <LightModeIcon fontSize="small" sx={{ mr: 0.5 }} />
                    Light
                  </ToggleButton>
                  <ToggleButton value="dark" aria-label="dark mode">
                    <DarkModeIcon fontSize="small" sx={{ mr: 0.5 }} />
                    Dark
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Notifications */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader
              title="Notifications"
              titleTypographyProps={{ variant: "subtitle1", fontWeight: 600 }}
            />
            <CardContent sx={{ pt: 0 }}>
              {[
                "Price alerts",
                "Order fills",
                "AI signal updates",
                "Portfolio changes",
              ].map((label, i) => (
                <Box key={label}>
                  <FormControlLabel
                    control={<Switch defaultChecked={i < 3} />}
                    label={<Typography variant="body2">{label}</Typography>}
                    sx={{ width: "100%", justifyContent: "space-between", ml: 0 }}
                    labelPlacement="start"
                  />
                  {i < 3 && <Divider />}
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
