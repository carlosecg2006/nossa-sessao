import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { env } from './env'

let app: FirebaseApp | null = null
let firestore: Firestore | null = null
let authPromise: Promise<void> | null = null

function getApp(): FirebaseApp {
  if (!app) {
    app =
      getApps()[0] ??
      initializeApp({
        apiKey: env('VITE_FIREBASE_API_KEY'),
        authDomain: env('VITE_FIREBASE_AUTH_DOMAIN'),
        projectId: env('VITE_FIREBASE_PROJECT_ID'),
        storageBucket: env('VITE_FIREBASE_STORAGE_BUCKET'),
        messagingSenderId: env('VITE_FIREBASE_MESSAGING_SENDER_ID'),
        appId: env('VITE_FIREBASE_APP_ID'),
      })
  }
  return app
}

export function db(): Firestore {
  return (firestore ??= getFirestore(getApp()))
}

export function ensureAuth(): Promise<void> {
  if (!authPromise) {
    // Promise.resolve().then so a synchronous throw (missing/invalid apiKey) becomes a rejection.
    authPromise = Promise.resolve().then(() => signInAnonymously(getAuth(getApp()))).then(
      () => undefined,
      (err) => {
        authPromise = null
        throw err
      },
    )
  }
  return authPromise
}
