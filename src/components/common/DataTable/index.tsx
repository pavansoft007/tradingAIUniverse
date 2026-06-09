import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Typography from "@mui/material/Typography";
import { useState, type ReactNode } from "react";
import type { SortDirection } from "@/types/common.types";

export interface Column<T> {
  id: keyof T | string;
  label: string;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  width?: number | string;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyField: keyof T;
  loading?: boolean;
  pagination?: boolean;
  totalCount?: number;
  page?: number;
  rowsPerPage?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  rows,
  keyField,
  loading = false,
  pagination = false,
  totalCount = 0,
  page = 0,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
  emptyMessage = "No data available",
}: DataTableProps<T>) {
  const [sortBy, setSortBy] = useState<string>("");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  const handleSort = (colId: string) => {
    if (sortBy === colId) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(colId);
      setSortDir("asc");
    }
  };

  return (
    <Paper>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={String(col.id)}
                  align={col.align ?? "left"}
                  width={col.width}
                  sx={{ fontWeight: 600, whiteSpace: "nowrap" }}
                >
                  {col.sortable ? (
                    <TableSortLabel
                      active={sortBy === String(col.id)}
                      direction={sortBy === String(col.id) ? sortDir : "asc"}
                      onClick={() => handleSort(String(col.id))}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading
              ? Array.from({ length: rowsPerPage }).map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((col) => (
                      <TableCell key={String(col.id)}>
                        <Skeleton />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : rows.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">{emptyMessage}</Typography>
                    </TableCell>
                  </TableRow>
                )
                : rows.map((row) => (
                    <TableRow key={String(row[keyField])} hover>
                      {columns.map((col) => (
                        <TableCell key={String(col.id)} align={col.align ?? "left"}>
                          {col.render
                            ? col.render(row)
                            : String(row[col.id as keyof T] ?? "")}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
          </TableBody>
        </Table>
      </TableContainer>

      {pagination && (
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(_, p) => onPageChange?.(p)}
            onRowsPerPageChange={(e) => onRowsPerPageChange?.(parseInt(e.target.value, 10))}
            rowsPerPageOptions={[10, 25, 50]}
          />
        </Box>
      )}
    </Paper>
  );
}
