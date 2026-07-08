"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Permission } from "@/types";
import { hasPermission, isShopOwnerOrAdmin } from "@/lib/permissions";

export function usePermissions() {
  const { profile } = useAuth();

  const can = (permission: Permission) => hasPermission(profile, permission);
  const isOwner = isShopOwnerOrAdmin(profile);
  const isStaff = profile?.isStaff ?? false;

  return { can, isOwner, isStaff, profile };
}
