"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getShopDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  getDocument,
} from "@/lib/firebase/firestore";
import { where } from "firebase/firestore";

export function useShopCollection<T extends { id: string; createdAt?: string }>(
  collectionName: string,
  filters?: { field: string; value: string }[]
) {
  const { profile } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!profile?.shopId) return;
    setLoading(true);
    setError(null);
    try {
      const constraints = filters?.map((f) => where(f.field, "==", f.value)) || [];
      const docs = await getShopDocuments<T>(collectionName, profile.shopId, constraints);
      setData(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [profile?.shopId, collectionName, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const create = async (item: Omit<T, "id" | "createdAt" | "updatedAt">) => {
    const id = await createDocument(collectionName, item as Record<string, unknown>);
    await fetchData();
    return id;
  };

  const update = async (id: string, item: Partial<T>) => {
    await updateDocument(collectionName, id, item as Record<string, unknown>);
    await fetchData();
  };

  const remove = async (id: string) => {
    await deleteDocument(collectionName, id);
    await fetchData();
  };

  const getOne = async (id: string) => {
    return getDocument<T>(collectionName, id);
  };

  return { data, loading, error, create, update, remove, getOne, refetch: fetchData };
}
