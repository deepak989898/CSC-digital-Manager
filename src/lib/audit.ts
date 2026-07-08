import { createDocument } from "@/lib/firebase/firestore";
import { AuditAction } from "@/types";

interface LogAuditParams {
  shopId: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  entityName: string;
  details?: string;
}

export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    await createDocument("auditLogs", {
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      entityName: params.entityName,
      userName: params.userName,
      userEmail: params.userEmail,
      details: params.details,
      userId: params.userId,
      shopId: params.shopId,
    });
  } catch {
    // Audit logging should not block operations
    console.error("Failed to log audit");
  }
}
