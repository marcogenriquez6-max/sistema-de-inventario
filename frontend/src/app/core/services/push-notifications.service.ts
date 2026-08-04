import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  vapidKey: string;
}

/**
 * Notificaciones push vía Firebase Cloud Messaging.
 * Se activa SOLO si el hosting sirve /firebase-config.json (ver public/firebase-config.example.json).
 * El SDK de Firebase se importa de forma diferida para no inflar el bundle inicial.
 */
@Injectable({ providedIn: 'root' })
export class PushNotificationsService {
  private initialized = false;
  private done: Promise<boolean> | null = null;

  constructor(private api: ApiService) {}

  init(): Promise<boolean> {
    if (this.done) return this.done;
    this.done = this.initialize();
    return this.done;
  }

  private async initialize(): Promise<boolean> {
    if (this.initialized) return true;
    if (!('serviceWorker' in navigator) || !('Notification' in window)) return false;
    if (Notification.permission !== 'granted' && Notification.permission !== 'default') return false;

    let config: FirebaseConfig | null = null;
    try {
      const res = await fetch('/firebase-config.json', { cache: 'no-cache' });
      if (!res.ok) return false;
      config = (await res.json()) as FirebaseConfig;
      if (!config?.messagingSenderId) return false;
    } catch {
      return false;
    }

    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => undefined);
    }

    try {
      const { initializeApp } = await import('firebase/app');
      const { getMessaging, getToken } = await import('firebase/messaging');
      const app = initializeApp({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
      });
      const messaging = getMessaging(app);
      const token = await getToken(messaging, { vapidKey: config.vapidKey, serviceWorkerRegistration: swReg });

      if (token && this.api) {
        await this.api
          .post('/notifications/fcm-token', { token })
          .toPromise()
          .catch(() => undefined);
      }
      this.initialized = true;
      return true;
    } catch {
      return false;
    }
  }
}
