import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
  size?: number;
}

export function LoadingSpinner({ message, fullScreen = false, size = 40 }: LoadingSpinnerProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        ...(fullScreen && {
          position: "fixed",
          inset: 0,
          bgcolor: "background.default",
          zIndex: 9999,
        }),
        ...(!fullScreen && { py: 6 }),
      }}
    >
      <CircularProgress size={size} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );
}
