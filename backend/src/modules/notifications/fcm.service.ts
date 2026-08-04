import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FcmToken } from './fcm-token.entity';

type AdminMessaging = {
  send: (msg: {
    token: string;
    notification: { title: string; body: string };
    data?: Record<string, string>;
  }) => Promise<string>;
};

/**
 * Push notifications vía Firebase Cloud Messaging.
 * Se activa SOLO si existe la variable FIREBASE_SERVICE_ACCOUNT (JSON del proyecto Firebase).
 * El SDK firebase-admin se carga de forma perezosa para no afectar el arranque.
 */
@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);
  private messaging: AdminMessaging | null | undefined;

  constructor(
    @InjectRepository(FcmToken)
    private readonly tokens: Repository<FcmToken>,
  ) {}

  private enabled(): boolean {
    return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT);
  }

  private async getMessaging(): Promise<AdminMessaging | null> {
    if (this.messaging !== undefined) return this.messaging;
    if (!this.enabled()) {
      this.messaging = null;
      return null;
    }
    try {
      const { initializeApp, getApps, cert } =
        await import('firebase-admin/app');
      const { getMessaging } = await import('firebase-admin/messaging');
      if (getApps().length === 0) {
        initializeApp({
          credential: cert(
            JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string),
          ),
        });
      }
      this.messaging = getMessaging() as unknown as AdminMessaging;
    } catch (err) {
      this.logger.warn(
        `FCM deshabilitado por configuración inválida: ${(err as Error).message}`,
      );
      this.messaging = null;
    }
    return this.messaging;
  }

  async register(
    userId: number,
    token: string,
    device?: string,
  ): Promise<void> {
    const existing = await this.tokens.findOne({ where: { token } });
    if (existing) {
      await this.tokens.update(existing.id, {
        userId,
        device: device ?? existing.device,
      });
      return;
    }
    await this.tokens.save(
      this.tokens.create({ userId, token, device: device ?? null }),
    );
  }

  async remove(userId: number, token: string): Promise<void> {
    await this.tokens.delete({ userId, token });
  }

  async pushToUser(
    userId: number,
    title: string,
    body?: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    const messaging = await this.getMessaging();
    if (!messaging) return;
    const tokens = await this.tokens.find({ where: { userId } });
    if (tokens.length === 0) return;
    const payload: Record<string, string> = {};
    if (data) {
      for (const [k, v] of Object.entries(data))
        payload[k] = typeof v === 'string' ? v : JSON.stringify(v);
    }
    for (const t of tokens) {
      messaging
        .send({
          token: t.token,
          notification: { title, body: body ?? '' },
          data: payload,
        })
        .catch((err) => {
          const code = (err as { code?: string })?.code;
          if (
            code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token'
          ) {
            this.tokens.delete({ token: t.token }).catch(() => undefined);
          }
        });
    }
  }
}
