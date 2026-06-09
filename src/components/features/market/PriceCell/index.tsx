"use client";

import { keyframes } from "@emotion/react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState } from "react";

const flashUp = keyframes`
  0%   { background-color: rgba(16, 185, 129, 0.35); }
  100% { background-color: transparent; }
`;
const flashDown = keyframes`
  0%   { background-color: rgba(239, 68, 68, 0.35); }
  100% { background-color: transparent; }
`;

interface PriceCellProps {
  price: number | undefined;
  /** Previous close used to derive change colour when no explicit direction is given */
  prevClose?: number;
  formatFn?: (p: number) => string;
  align?: "left" | "right" | "center";
}

const defaultFormat = (p: number) =>
  `₹${p.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type Flash = "up" | "down" | "none";

export function PriceCell({
  price,
  prevClose,
  formatFn = defaultFormat,
  align = "right",
}: PriceCellProps) {
  const prevRef = useRef<number | undefined>(undefined);
  const [flash, setFlash] = useState<Flash>("none");

  useEffect(() => {
    if (price === undefined) return undefined;
    const prev = prevRef.current;
    prevRef.current = price;
    if (prev !== undefined && prev !== price) {
      setFlash(price > prev ? "up" : "down");
      const id = setTimeout(() => setFlash("none"), 800);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [price]);

  if (price === undefined) {
    return (
      <Typography variant="body2" color="text.disabled" align={align}>
        —
      </Typography>
    );
  }

  const direction =
    prevClose !== undefined && prevClose !== 0
      ? price > prevClose
        ? "up"
        : price < prevClose
          ? "down"
          : "neutral"
      : "neutral";

  const colorMap: Record<string, string> = {
    up: "success.main",
    down: "error.main",
    neutral: "text.primary",
  };

  return (
    <Box
      sx={{
        display: "inline-block",
        px: 0.5,
        borderRadius: 0.5,
        animation:
          flash === "up"
            ? `${flashUp} 0.8s ease-out`
            : flash === "down"
              ? `${flashDown} 0.8s ease-out`
              : "none",
        textAlign: align,
        width: "100%",
      }}
    >
      <Typography
        variant="body2"
        fontWeight={600}
        color={colorMap[direction]}
        fontFamily="monospace"
      >
        {formatFn(price)}
      </Typography>
    </Box>
  );
}
