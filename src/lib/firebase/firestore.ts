import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  QueryConstraint,
  DocumentData,
} from "firebase/firestore";
import { getClientDb } from "./config";

export function nowISO(): string {
  return new Date().toISOString();
}

/** Remove undefined values recursively — Firestore rejects undefined at any depth */
export function cleanFirestoreData<T>(value: T): T {
  if (value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map((item) => cleanFirestoreData(item)) as T;
  }
  if (value !== null && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, cleanFirestoreData(v)])
    ) as T;
  }
  return value;
}

export function toISO(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

export function mapDoc<T>(id: string, data: DocumentData): T {
  const mapped = { ...data, id } as Record<string, unknown>;
  if (mapped.createdAt) mapped.createdAt = toISO(mapped.createdAt);
  if (mapped.updatedAt) mapped.updatedAt = toISO(mapped.updatedAt);
  if (mapped.paymentDate) mapped.paymentDate = toISO(mapped.paymentDate);
  if (mapped.dueDate && mapped.dueDate instanceof Timestamp) {
    mapped.dueDate = toISO(mapped.dueDate);
  }
  return mapped as T;
}

export async function getDocument<T>(collectionName: string, id: string): Promise<T | null> {
  const db = getClientDb();
  const snap = await getDoc(doc(db, collectionName, id));
  if (!snap.exists()) return null;
  return mapDoc<T>(snap.id, snap.data());
}

export async function getDocuments<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const db = getClientDb();
  const q = query(collection(db, collectionName), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapDoc<T>(d.id, d.data()));
}

export async function createDocument<T extends Record<string, unknown>>(
  collectionName: string,
  data: Omit<T, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const db = getClientDb();
  const timestamp = nowISO();
  const cleaned = cleanFirestoreData(
    Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined))
  );
  const ref = await addDoc(collection(db, collectionName), {
    ...cleaned,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  return ref.id;
}

export async function setDocument<T extends Record<string, unknown>>(
  collectionName: string,
  id: string,
  data: Omit<T, "id" | "createdAt" | "updatedAt">,
  merge = true
): Promise<void> {
  const db = getClientDb();
  const timestamp = nowISO();
  const cleaned = cleanFirestoreData(
    Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined))
  );
  await setDoc(
    doc(db, collectionName, id),
    {
      ...cleaned,
      ...(merge ? {} : { createdAt: timestamp }),
      updatedAt: timestamp,
    },
    { merge }
  );
}

export async function updateDocument(
  collectionName: string,
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  const db = getClientDb();
  const cleaned = cleanFirestoreData(
    Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined))
  );
  await updateDoc(doc(db, collectionName, id), {
    ...cleaned,
    updatedAt: nowISO(),
  });
}

export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  const db = getClientDb();
  await deleteDoc(doc(db, collectionName, id));
}

export async function getShopDocuments<T extends { createdAt?: string }>(
  collectionName: string,
  shopId: string,
  extraConstraints: QueryConstraint[] = []
): Promise<T[]> {
  const docs = await getDocuments<T>(collectionName, [
    where("shopId", "==", shopId),
    ...extraConstraints,
  ]);
  return docs.sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}

export async function countShopDocuments(
  collectionName: string,
  shopId: string,
  extraWhere?: QueryConstraint
): Promise<number> {
  const constraints: QueryConstraint[] = [where("shopId", "==", shopId)];
  if (extraWhere) constraints.push(extraWhere);
  const docs = await getDocuments(collectionName, constraints);
  return docs.length;
}

export { collection, doc, query, where, orderBy, limit };
