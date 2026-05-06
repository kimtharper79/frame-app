import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Shoot {
  id: string
  photographerUid?: string      // absent on seed/demo shoots
  photographerName: string
  photographerInitials: string
  title: string
  date: string
  time: string
  location: string
  modelsNeeded: number
  interestedCount?: number      // denormalized count of interested/{userId} docs
  styleMood: string
  equipment: string
  tags: string[]
  bookingLink: string | null
  photoUrl: string | null
  createdBy?: string            // user email
  createdAt?: Timestamp
}

export interface Collab {
  id: string
  posterUid: string
  posterName: string
  posterInitials: string
  title: string
  whatYouNeed: string
  major: string
  deadline: string
  description: string
  lookingFor: string
  createdAt?: Timestamp
}

export interface InterestRecord {
  userId: string
  userEmail: string
  userName: string
  timestamp?: Timestamp
}

export interface Thread {
  id: string
  shootId: string
  shootTitle: string
  photographerUid: string
  photographerName: string
  photographerInitials: string
  modelUid: string
  modelName: string
  modelInitials: string
  participants: string[]
  lastMessage: string
  lastMessageAt?: Timestamp
  unreadFor: string[]
}

export interface ChatMessage {
  id: string
  text: string
  fromUid: string
  createdAt?: Timestamp
}

export interface UserProfile {
  uid: string
  displayName: string
  email: string
  initials: string
  bio: string
  major: string
  role: string                  // Freshman | Sophomore | Junior | Senior | Graduate | Faculty | Alumni
  portfolioUrls: string[]
  profilePhotoUrl?: string
  onboarded?: boolean           // false for new users until they complete the onboarding screen
  interestedShoots?: string[]   // shoot IDs the user has expressed interest in
}

// ─── Shoots ──────────────────────────────────────────────────────────────────

export function subscribeToShoots(cb: (shoots: Shoot[]) => void) {
  const q = query(collection(db, 'shoots'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Shoot)))
  }, (err) => console.error('shoots error:', err))
}

export async function createShoot(data: Omit<Shoot, 'id' | 'createdAt' | 'interestedCount'>) {
  return addDoc(collection(db, 'shoots'), { ...data, interestedCount: 0, createdAt: serverTimestamp() })
}

export async function deleteShoot(id: string) {
  await deleteDoc(doc(db, 'shoots', id))
}

// ─── Interest ────────────────────────────────────────────────────────────────

/**
 * Mark a user's interest in a shoot.
 * Writes three places atomically:
 *  1. shoots/{shootId}/interested/{userId}  — the record
 *  2. shoots/{shootId}.interestedCount      — denormalized count (increment)
 *  3. users/{userId}.interestedShoots       — array on user profile for quick lookup
 */
export async function markInterest(
  shootId: string,
  userId: string,
  userEmail: string,
  userName: string,
) {
  await setDoc(doc(db, 'shoots', shootId, 'interested', userId), {
    userId,
    userEmail,
    userName,
    timestamp: serverTimestamp(),
  })
  await updateDoc(doc(db, 'shoots', shootId), {
    interestedCount: increment(1),
  })
  await updateDoc(doc(db, 'users', userId), {
    interestedShoots: arrayUnion(shootId),
  })
}

/** Subscribe to everyone who has expressed interest in a given shoot (for photographer view). */
export function subscribeToShootInterested(
  shootId: string,
  cb: (records: InterestRecord[]) => void,
) {
  return onSnapshot(
    collection(db, 'shoots', shootId, 'interested'),
    (snap) => cb(snap.docs.map(d => d.data() as InterestRecord)),
    (err) => console.error('interested error:', err),
  )
}

// ─── Collabs ─────────────────────────────────────────────────────────────────

export function subscribeToCollabs(cb: (collabs: Collab[]) => void) {
  const q = query(collection(db, 'collabs'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Collab)))
  }, (err) => console.error('collabs error:', err))
}

export async function createCollab(data: Omit<Collab, 'id' | 'createdAt'>) {
  return addDoc(collection(db, 'collabs'), { ...data, createdAt: serverTimestamp() })
}

export async function deleteCollab(id: string) {
  await deleteDoc(doc(db, 'collabs', id))
}

// ─── Threads ─────────────────────────────────────────────────────────────────

export function makeThreadId(shootId: string, modelUid: string) {
  return `${shootId}_${modelUid}`
}

export async function getOrCreateThread(
  shoot: Pick<Shoot, 'id' | 'title' | 'photographerUid' | 'photographerName' | 'photographerInitials'>,
  model: { uid: string; displayName: string; initials: string }
): Promise<string> {
  const tid = makeThreadId(shoot.id, model.uid)
  const ref = doc(db, 'threads', tid)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    await setDoc(ref, {
      shootId: shoot.id,
      shootTitle: shoot.title,
      photographerUid: shoot.photographerUid,
      photographerName: shoot.photographerName,
      photographerInitials: shoot.photographerInitials,
      modelUid: model.uid,
      modelName: model.displayName,
      modelInitials: model.initials,
      participants: [shoot.photographerUid, model.uid],
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      unreadFor: [],
    })
  }

  return tid
}

export function subscribeToThreads(uid: string, cb: (threads: Thread[]) => void) {
  const q = query(collection(db, 'threads'), where('participants', 'array-contains', uid))
  return onSnapshot(q, (snap) => {
    const threads = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Thread))
      .sort((a, b) => {
        const aMs = a.lastMessageAt?.toMillis?.() ?? 0
        const bMs = b.lastMessageAt?.toMillis?.() ?? 0
        return bMs - aMs
      })
    cb(threads)
  }, (err) => console.error('threads error:', err))
}

export function subscribeToMessages(threadId: string, cb: (msgs: ChatMessage[]) => void) {
  const q = query(collection(db, 'threads', threadId, 'messages'), orderBy('createdAt', 'asc'))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)))
  }, (err) => console.error('messages error:', err))
}

export async function sendMessage(
  threadId: string,
  fromUid: string,
  text: string,
  otherUid: string
) {
  await addDoc(collection(db, 'threads', threadId, 'messages'), {
    text,
    fromUid,
    createdAt: serverTimestamp(),
  })
  await updateDoc(doc(db, 'threads', threadId), {
    lastMessage: text,
    lastMessageAt: serverTimestamp(),
    unreadFor: arrayUnion(otherUid),
  })
}

export async function markThreadRead(threadId: string, uid: string) {
  await updateDoc(doc(db, 'threads', threadId), {
    unreadFor: arrayRemove(uid),
  })
}

// ─── User profiles ────────────────────────────────────────────────────────────

export async function getOrCreateUserProfile(uid: string, email: string): Promise<UserProfile> {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (snap.exists()) return { uid, ...snap.data() } as UserProfile

  const { name, initials } = nameFromEmail(email)
  const profile: Omit<UserProfile, 'uid'> = {
    displayName: name,
    email,
    initials,
    bio: '',
    major: 'Photography BFA',
    role: 'Student',
    portfolioUrls: [],
    profilePhotoUrl: '',
    onboarded: false,       // triggers the onboarding screen on first login
    interestedShoots: [],
  }
  await setDoc(ref, profile)
  return { uid, ...profile }
}

export async function updateUserProfile(uid: string, data: Partial<Omit<UserProfile, 'uid'>>) {
  await updateDoc(doc(db, 'users', uid), data)
}

export function subscribeToUserProfile(uid: string, cb: (p: UserProfile | null) => void) {
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    cb(snap.exists() ? ({ uid, ...snap.data() } as UserProfile) : null)
  })
}

function nameFromEmail(email: string): { name: string; initials: string } {
  const username = email.split('@')[0]
  const parts = username.split(/[._-]/).filter(Boolean)
  const name = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  const initials = parts
    .map(p => p.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
  return {
    name: name || username,
    initials: initials || username.slice(0, 2).toUpperCase(),
  }
}
