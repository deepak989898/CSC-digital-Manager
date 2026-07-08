"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/config";
import { getUserProfile, getShop } from "@/lib/firebase/auth";
import { UserProfile, Shop } from "@/types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  shop: Shop | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  shop: null,
  loading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async (firebaseUser: User) => {
    const userProfile = await getUserProfile(firebaseUser.uid);
    setProfile(userProfile);

    if (userProfile && userProfile.role !== "super_admin") {
      const shopData = await getShop(userProfile.shopId);
      setShop(shopData);
    } else {
      setShop(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadUserData(user);
  }, [user, loadUserData]);

  useEffect(() => {
    const auth = getClientAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await loadUserData(firebaseUser);
      } else {
        setProfile(null);
        setShop(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [loadUserData]);

  return (
    <AuthContext.Provider value={{ user, profile, shop, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
