"use client";

import SearchIcon     from "@mui/icons-material/Search";
import Autocomplete   from "@mui/material/Autocomplete";
import Box            from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import TextField      from "@mui/material/TextField";
import Typography     from "@mui/material/Typography";
import { useScripSearch } from "@/hooks/useScripSearch";
import type { ScripSearchResult } from "@/lib/api/angelone/scrip.api";
import type { AngelExchange } from "@/types/angel-order.types";

// ── Props ─────────────────────────────────────────────────────────────────────

interface ScripSearchProps {
  exchange:  AngelExchange;
  value:     string;         // current tradingsymbol
  error?:    string;
  onSelect:  (scrip: ScripSearchResult) => void;
  size?:     "small" | "medium";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ScripSearch({ exchange, value, error, onSelect, size = "small" }: ScripSearchProps) {
  const { results, isLoading, query, setQuery } = useScripSearch(exchange);

  return (
    <Autocomplete<ScripSearchResult>
      freeSolo={false}
      options={results}
      loading={isLoading}
      inputValue={query || value}
      noOptionsText={query.length >= 2 ? "No results" : "Type to search"}
      filterOptions={(x) => x}             // server-side filtering
      getOptionLabel={(o) =>
        typeof o === "string" ? o : `${o.tradingsymbol} — ${o.name}`
      }
      isOptionEqualToValue={(o, v) => o.symboltoken === v.symboltoken}
      onInputChange={(_, val, reason) => {
        if (reason === "input") setQuery(val);
      }}
      onChange={(_, val) => {
        if (val && typeof val !== "string") {
          onSelect(val);
          setQuery(val.tradingsymbol);
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Symbol"
          size={size}
          error={!!error}
          helperText={error}
          placeholder="e.g. RELIANCE, TCS, HDFCBANK"
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                {isLoading
                  ? <CircularProgress size={14} />
                  : <SearchIcon sx={{ fontSize: 16, color: "text.disabled" }} />}
              </InputAdornment>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option.symboltoken}>
          <Box sx={{ display: "flex", flexDirection: "column", py: 0.25, width: "100%" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace" }}>
                {option.tradingsymbol}
              </Typography>
              <Typography sx={{ fontSize: 10.5, color: "text.secondary", ml: 1 }}>
                {option.exchange}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 11, color: "text.secondary" }} noWrap>
              {option.name}
            </Typography>
          </Box>
        </Box>
      )}
    />
  );
}
