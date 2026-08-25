import * as SecureStore from 'expo-secure-store';

import logger from '@/utils/logger';

const STORAGE_KEY = 'inapp_notifications';
const MAX_EVENTS = 50;

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

/**
 * The in-app notification centre's store. Events are produced on device by
 * things the user just did, badge unlocks and perfect scores for now, so
 * they live locally in SecureStore rather than needing a backend feed.
 * Newest first, capped so the list cannot grow forever.
 */
export async function getNotifications(): Promise<InAppNotification[]> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as InAppNotification[]) : [];
  } catch (error) {
    logger.error(`Failed to read in-app notifications: ${error}`);
    return [];
  }
}

export async function getUnreadCount(): Promise<number> {
  const events = await getNotifications();
  return events.filter(event => !event.read).length;
}

export async function addNotification(
  title: string,
  body: string
): Promise<void> {
  try {
    const events = await getNotifications();
    const next: InAppNotification[] = [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title,
        body,
        createdAt: new Date().toISOString(),
        read: false,
      },
      ...events,
    ].slice(0, MAX_EVENTS);
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    logger.error(`Failed to save in-app notification: ${error}`);
  }
}

export async function markAllRead(): Promise<void> {
  try {
    const events = await getNotifications();
    await SecureStore.setItemAsync(
      STORAGE_KEY,
      JSON.stringify(events.map(event => ({ ...event, read: true })))
    );
  } catch (error) {
    logger.error(`Failed to mark notifications read: ${error}`);
  }
}

export async function clearNotifications(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  } catch (error) {
    logger.error(`Failed to clear in-app notifications: ${error}`);
  }
}
