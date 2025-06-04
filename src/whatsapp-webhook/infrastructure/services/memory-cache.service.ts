import { Injectable, Logger } from '@nestjs/common';

interface CacheItem {
  value: string;
  expiresAt: number;
}

@Injectable()
export class MemoryCacheService {
  private readonly logger = new Logger(MemoryCacheService.name);
  private readonly cache = new Map<string, CacheItem>();
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Limpiar cache cada 30 segundos
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 30000);
    
    this.logger.log('Memory cache service initialized (Redis alternative)');
  }

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  async set(key: string, value: string): Promise<void> {
    // Sin expiración por defecto
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 horas por defecto
    });
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (seconds * 1000),
    });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const newValue = current ? parseInt(current) + 1 : 1;
    await this.set(key, newValue.toString());
    return newValue;
  }

  async expire(key: string, seconds: number): Promise<void> {
    const item = this.cache.get(key);
    if (item) {
      item.expiresAt = Date.now() + (seconds * 1000);
    }
  }

  async ttl(key: string): Promise<number> {
    const item = this.cache.get(key);
    if (!item) {
      return -2; // Key no existe
    }

    const remaining = Math.floor((item.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -1; // -1 si ya expiró
  }

  async keys(pattern: string): Promise<string[]> {
    // Implementación simple de pattern matching
    const regex = new RegExp(pattern.replace('*', '.*'));
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }
  // Simular pipeline de Redis
  pipeline(): {
    incr: (key: string) => MemoryCacheService;
    expire: (key: string, seconds: number) => MemoryCacheService;
    exec: () => Promise<Array<[Error | null, any]>>;
  } {
    const operations: Array<() => Promise<any>> = [];
    
    return {
      incr: (key: string) => {
        operations.push(() => this.incr(key));
        return this;
      },
      expire: (key: string, seconds: number) => {
        operations.push(() => this.expire(key, seconds));
        return this;
      },
      exec: async () => {
        const results = [];
        for (const op of operations) {
          try {
            const result = await op();
            results.push([null, result]); // [error, result] format like Redis
          } catch (error) {
            results.push([error, null]);
          }
        }
        return results;
      }
    };
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned ${cleaned} expired cache items`);
    }
  }

  // Eventos simulados (Redis compatibility)
  on(event: string, callback: (error?: any) => void): void {
    if (event === 'connect') {
      setTimeout(() => callback(), 100); // Simular conexión exitosa
    } else if (event === 'error') {
      // No hacer nada, no hay errores en memoria
    }
  }

  onDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
    this.logger.log('Memory cache service destroyed');
  }
} 