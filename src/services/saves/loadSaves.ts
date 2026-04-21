import { savesDb } from '@/db/savesDb';

export async function loadSaves() {
  return savesDb.saves
    .orderBy('lastPlayedAt')
    .reverse()
    .toArray();
}