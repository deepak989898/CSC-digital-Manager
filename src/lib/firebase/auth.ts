import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
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

async function findStaffInvite(email: string): Promise<(StaffMember & { id: string }) | null> {
  const db = getClientDb();
  const q = query(collection(db, "staff"), where("email", "==", email.toLowerCase()));
  const snap = await getDocs(q);
  const invite = snap.docs.find((d) => {
    const data = d.data();
    return data.status === "invited" || data.status === "active";
  });
  if (!invite) return null;
  return { id: invite.id, ...invite.data() } as StaffMember & { id: string };
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
    photoURL,
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

  await setDoc(doc(db, "users", userId), userProfile);
  await setDoc(doc(db, "shops", userId), shop);

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
    photoURL,
    isActive: true,
    profileComplete: true,
    isStaff: true,
    permissions: staff.permissions,
    staffId: staff.id,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await setDoc(doc(db, "users", userId), userProfile);
  await updateDoc(doc(db, "staff", staff.id), {
    linkedUserId: userId,
    status: "active",
    updatedAt: timestamp,
  });
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const auth = getClientAuth();
  const db = getClientDb();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });

  const userId = credential.user.uid;
  const staffInvite = await findStaffInvite(email);

  if (staffInvite) {
    await setupStaffUser(userId, email, displayName, staffInvite);
  } else {
    await setupShopOwner(userId, email, displayName);
  }

  return credential.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const auth = getClientAuth();
  const credential = await signInWithEmailAndPassword(auth, email, password);
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
    const staffInvite = await findStaffInvite(email);

    if (staffInvite) {
      await setupStaffUser(userId, email, displayName, staffInvite, credential.user.photoURL || undefined);
    } else {
      await setupShopOwner(userId, email, displayName, credential.user.photoURL || undefined);
    }
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
