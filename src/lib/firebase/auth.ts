import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
  User,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  writeBatch,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { getClientAuth, getClientDb } from "./config";
import { DEFAULT_SERVICES } from "@/lib/constants";
import { nowISO } from "./firestore";
import { UserProfile, Shop, StaffMember } from "@/types";
import { getActivePlans, createTrialSubscription } from "@/lib/subscription";

const googleProvider = new GoogleAuthProvider();

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 2, waitMs = 350): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) await delay(waitMs);
    }
  }
  throw lastError;
}

async function findStaffInvite(email: string): Promise<(StaffMember & { id: string }) | null> {
  const db = getClientDb();
  try {
    const q = query(collection(db, "staff"), where("email", "==", email.toLowerCase()));
    const snap = await getDocs(q);
    const invite = snap.docs.find((d) => {
      const data = d.data();
      return data.status === "invited" || data.status === "active";
    });
    if (!invite) return null;
    return { id: invite.id, ...invite.data() } as StaffMember & { id: string };
  } catch {
    // New users may not have permission to read staff invites yet.
    return null;
  }
}

async function setupShopOwner(
  userId: string,
  email: string,
  displayName: string,
  photoURL?: string
): Promise<void> {
  const db = getClientDb();
  const timestamp = nowISO();

  const userProfile: Omit<UserProfile, "id"> = {
    userId,
    shopId: userId,
    email,
    role: "shop_owner",
    displayName,
    ...(photoURL ? { photoURL } : {}),
    isActive: true,
    profileComplete: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const shop: Omit<Shop, "id"> = {
    userId,
    shopId: userId,
    shopName: "",
    ownerName: displayName,
    mobile: "",
    email,
    address: "",
    city: "",
    state: "",
    pincode: "",
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await withRetry(async () => {
    await setDoc(doc(db, "users", userId), userProfile);
    await setDoc(doc(db, "shops", userId), shop);
  });

  // Seed defaults without blocking account creation on transient rule timing.
  try {
    const seedServices = async () => {
      const batch = writeBatch(db);
      DEFAULT_SERVICES.forEach((service) => {
        const serviceRef = doc(collection(db, "services"));
        batch.set(serviceRef, {
          ...service,
          userId,
          shopId: userId,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      });
      await batch.commit();
    };

    await withRetry(seedServices);
  } catch (err) {
    console.error("Default services seed failed:", err);
  }

  // Create free trial subscription
  try {
    const plans = await getActivePlans();
    const trialPlan = plans.find((p) => p.isTrial) || plans[0];
    if (trialPlan) {
      await createTrialSubscription(userId, userId, trialPlan);
    }
  } catch {
    // Plans may not be seeded yet
  }
}

async function setupStaffUser(
  userId: string,
  email: string,
  displayName: string,
  staff: StaffMember & { id: string },
  photoURL?: string
): Promise<void> {
  const db = getClientDb();
  const timestamp = nowISO();

  const userProfile: Omit<UserProfile, "id"> = {
    userId,
    shopId: staff.shopId,
    email,
    role: staff.role,
    displayName: displayName || staff.name,
    ...(photoURL ? { photoURL } : {}),
    isActive: true,
    profileComplete: true,
    isStaff: true,
    permissions: staff.permissions,
    staffId: staff.id,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await withRetry(async () => {
    await setDoc(doc(db, "users", userId), userProfile);
    await updateDoc(doc(db, "staff", staff.id), {
      linkedUserId: userId,
      status: "active",
      updatedAt: timestamp,
    });
  });
}

async function bootstrapUserIfMissing(user: User): Promise<void> {
  const db = getClientDb();
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) return;

  const email = user.email || "";
  const displayName = user.displayName || email.split("@")[0] || "User";
  const staffInvite = await findStaffInvite(email);
  if (staffInvite) {
    await setupStaffUser(user.uid, email, displayName, staffInvite, user.photoURL || undefined);
  } else {
    await setupShopOwner(user.uid, email, displayName, user.photoURL || undefined);
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const auth = getClientAuth();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });
  await credential.user.getIdToken(true);

  const userId = credential.user.uid;
  try {
    const staffInvite = await findStaffInvite(email);
    if (staffInvite) {
      await setupStaffUser(userId, email, displayName, staffInvite);
    } else {
      await setupShopOwner(userId, email, displayName);
    }
  } catch (err) {
    // Roll back auth user to avoid "email already in use" after setup failure
    try {
      await deleteUser(credential.user);
    } catch {
      // Ignore rollback error
    }
    throw err;
  }

  return credential.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const auth = getClientAuth();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  await credential.user.getIdToken(true);
  await bootstrapUserIfMissing(credential.user);
  return credential.user;
}

export async function signInWithGoogle(): Promise<User> {
  const auth = getClientAuth();
  const db = getClientDb();
  const credential = await signInWithPopup(auth, googleProvider);
  const userId = credential.user.uid;

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const email = credential.user.email || "";
    const displayName = credential.user.displayName || "User";
    await credential.user.getIdToken(true);
    try {
      const staffInvite = await findStaffInvite(email);
      if (staffInvite) {
        await setupStaffUser(userId, email, displayName, staffInvite, credential.user.photoURL || undefined);
      } else {
        await setupShopOwner(userId, email, displayName, credential.user.photoURL || undefined);
      }
    } catch (err) {
      try {
        await deleteUser(credential.user);
      } catch {
        // Ignore rollback failure
      }
      throw err;
    }
  } else {
    await bootstrapUserIfMissing(credential.user);
  }

  return credential.user;
}

export async function resetPassword(email: string): Promise<void> {
  const auth = getClientAuth();
  await sendPasswordResetEmail(auth, email);
}

export async function logout(): Promise<void> {
  const auth = getClientAuth();
  await signOut(auth);
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const db = getClientDb();
  const snap = await getDoc(doc(db, "users", userId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    ...data,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  } as UserProfile;
}

export async function getShop(shopId: string): Promise<Shop | null> {
  const db = getClientDb();
  const snap = await getDoc(doc(db, "shops", shopId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Shop;
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const db = getClientDb();
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as UserProfile);
}

export async function getAllShops(): Promise<Shop[]> {
  const db = getClientDb();
  const snap = await getDocs(collection(db, "shops"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Shop);
}
