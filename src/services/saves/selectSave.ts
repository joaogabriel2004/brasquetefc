import { savesDb } from "@/db/savesDb";

export async function selectSave(saveId: string) {
  console.log("Selecionando save", saveId);
  localStorage.setItem("currentSaveId", saveId);

  await savesDb.saves.update(saveId, {
    lastPlayedAt: Date.now(),
  });
}
