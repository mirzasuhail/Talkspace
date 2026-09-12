import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config';

export class StorageService {
  private static supabase: SupabaseClient | null = null;

  public static isConfigured(): boolean {
    return Boolean(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_SERVICE_ROLE_KEY);
  }

  private static getClient(): SupabaseClient {
    if (!this.supabase) {
      if (!this.isConfigured()) {
        throw new Error('Supabase credentials (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are not configured.');
      }
      this.supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      });
    }
    return this.supabase;
  }

  /**
   * Upload image buffer to Supabase Storage (or local fallback in dev if unconfigured)
   */
  static async uploadBuffer(objectPath: string, buffer: Buffer, contentType: string): Promise<string> {
    if (this.isConfigured()) {
      const client = this.getClient();
      const { error } = await client.storage
        .from(CONFIG.SUPABASE_STORAGE_BUCKET)
        .upload(objectPath, buffer, {
          contentType,
          upsert: true,
        });

      if (error) {
        console.error(`[Supabase Storage Error] Failed to upload ${objectPath}:`, error.message);
        throw new Error(`Storage upload failed: ${error.message}`);
      }

      return objectPath;
    } else {
      // Development-only fallback when SUPABASE_URL is not set locally
      const safeLocalName = objectPath.replace(/\//g, '_');
      const localPath = path.join(CONFIG.UPLOAD_DIR, safeLocalName);
      const dir = path.dirname(localPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      await fs.promises.writeFile(localPath, buffer);
      return objectPath;
    }
  }

  /**
   * Generates a short-lived signed URL for accessing a private Supabase Storage object
   */
  static async getSignedUrl(objectPath: string, expiresInSeconds = 3600): Promise<string | null> {
    if (this.isConfigured()) {
      const client = this.getClient();
      const { data, error } = await client.storage
        .from(CONFIG.SUPABASE_STORAGE_BUCKET)
        .createSignedUrl(objectPath, expiresInSeconds);

      if (error || !data?.signedUrl) {
        console.warn(`[Supabase Storage Warning] Could not create signed URL for ${objectPath}:`, error?.message);
        return null;
      }

      return data.signedUrl;
    } else {
      return null;
    }
  }

  /**
   * Delete an object from Supabase Storage
   */
  static async deleteFile(objectPath: string): Promise<void> {
    if (!objectPath) return;

    if (this.isConfigured()) {
      try {
        const client = this.getClient();
        const { error } = await client.storage
          .from(CONFIG.SUPABASE_STORAGE_BUCKET)
          .remove([objectPath]);

        if (error) {
          console.warn(`[Supabase Storage Warning] Failed to delete file ${objectPath}:`, error.message);
        }
      } catch (err: any) {
        console.warn(`[Supabase Storage Warning] Exception deleting file ${objectPath}:`, err.message);
      }
    } else {
      try {
        const safeLocalName = objectPath.replace(/\//g, '_');
        const localPath = path.join(CONFIG.UPLOAD_DIR, safeLocalName);
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
        }
      } catch {}
    }
  }

  /**
   * Delete all objects under a room path prefix (e.g. rooms/{roomId}/)
   */
  static async deleteFilesForRoom(roomId: string): Promise<void> {
    if (!roomId) return;
    const prefix = `rooms/${roomId}`;

    if (this.isConfigured()) {
      try {
        const client = this.getClient();
        const { data: mainFiles } = await client.storage
          .from(CONFIG.SUPABASE_STORAGE_BUCKET)
          .list(`${prefix}/images`);

        const { data: thumbFiles } = await client.storage
          .from(CONFIG.SUPABASE_STORAGE_BUCKET)
          .list(`${prefix}/thumbnails`);

        const pathsToDelete: string[] = [];

        if (mainFiles && mainFiles.length > 0) {
          for (const f of mainFiles) {
            if (f.name) pathsToDelete.push(`${prefix}/images/${f.name}`);
          }
        }
        if (thumbFiles && thumbFiles.length > 0) {
          for (const f of thumbFiles) {
            if (f.name) pathsToDelete.push(`${prefix}/thumbnails/${f.name}`);
          }
        }

        if (pathsToDelete.length > 0) {
          console.log(`[Supabase Storage] Purging ${pathsToDelete.length} objects for expired room #${roomId}...`);
          const { error } = await client.storage
            .from(CONFIG.SUPABASE_STORAGE_BUCKET)
            .remove(pathsToDelete);

          if (error) {
            console.warn(`[Supabase Storage Warning] Room purge error:`, error.message);
          }
        }
      } catch (err: any) {
        console.warn(`[Supabase Storage Warning] Exception during room storage purge:`, err.message);
      }
    }
  }
}
