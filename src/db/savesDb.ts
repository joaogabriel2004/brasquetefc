import Dexie, { Table } from 'dexie';

export type SaveMetaDB = {
  saveId: string;
  coachName: string;
  teamId: string;
  teamName: string;
  season: number;
  createdAt: number;
  lastPlayedAt: number;
};

class BrasqueteSavesDB extends Dexie {
  saves!: Table<SaveMetaDB, string>;

  constructor() {
    super('BrasqueteSavesDB');

    this.version(1).stores({
      saves: 'saveId, coachName, teamId, season, lastPlayedAt'
    });
  }
}

export const savesDb = new BrasqueteSavesDB();
