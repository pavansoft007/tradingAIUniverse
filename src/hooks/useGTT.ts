"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelGTTRule,
  createGTTRule,
  getGTTRuleDetails,
  getGTTRuleList,
  modifyGTTRule,
} from "@/lib/api/angelone/gtt.api";
import { sessionUtil } from "@/lib/utils/session";
import type {
  CreateGTTRequest,
  GTTStatus,
  ModifyGTTRequest,
} from "@/types/angel-gtt.types";

// ── Query keys ────────────────────────────────────────────────────────────────

export const GTT_KEYS = {
  list:    (statuses: GTTStatus[]) => ["gtt", "list", ...statuses] as const,
  details: (id: number)           => ["gtt", "details", id]        as const,
};

// ── List ──────────────────────────────────────────────────────────────────────

export function useGTTRules(statuses: GTTStatus[] = ["NEW", "ACTIVE"]) {
  const isAuth = typeof window !== "undefined" && !!sessionUtil.loadJWT();
  return useQuery({
    queryKey:        GTT_KEYS.list(statuses),
    enabled:         isAuth,
    queryFn:         () => getGTTRuleList({ status: statuses, page: 1, count: 50 }),
    refetchInterval: 30_000,
    staleTime:       25_000,
    retry:           false,
  });
}

// ── Single rule details ───────────────────────────────────────────────────────

export function useGTTRuleDetails(id: number | null) {
  const isAuth = typeof window !== "undefined" && !!sessionUtil.loadJWT();
  return useQuery({
    queryKey: GTT_KEYS.details(id ?? 0),
    enabled:  isAuth && id !== null,
    queryFn:  () => getGTTRuleDetails(id!),
    retry:    false,
  });
}

// ── Create ────────────────────────────────────────────────────────────────────

export function useCreateGTT() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn:  (req: CreateGTTRequest) => createGTTRule(req),
    onSuccess:   () => qc.invalidateQueries({ queryKey: ["gtt"] }),
  });
}

// ── Modify ────────────────────────────────────────────────────────────────────

export function useModifyGTT() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn:  (req: ModifyGTTRequest) => modifyGTTRule(req),
    onSuccess:   () => qc.invalidateQueries({ queryKey: ["gtt"] }),
  });
}

// ── Cancel ────────────────────────────────────────────────────────────────────

export function useCancelGTT() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn:  (id: number) => cancelGTTRule(id),
    onSuccess:   () => qc.invalidateQueries({ queryKey: ["gtt"] }),
  });
}
