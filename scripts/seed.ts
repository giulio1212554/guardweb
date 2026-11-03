import { fileAdapter } from "../lib/db/file-adapter";
import { isDevMode } from "../lib/env";

async function seed() {
  if (!isDevMode()) {
    console.error("Seed disponibile solo in DEV_MODE");
    process.exit(1);
  }
  console.log("Seeding dati di sviluppo...");
  const existing = await fileAdapter.getDemoCode("GW-TEST-0000");
  if (!existing) {
    await fileAdapter.createDemoCode({
      code: "GW-TEST-0000",
      maxUses: 999,
      expiresAt: null,
      maxScans: 10,
      active: true,
      note: "Codice di test precaricato",
    });
    console.log("  Codice demo GW-TEST-0000 creato");
  }
  await fileAdapter.upsertProfile("pro@test.local", "pro");
  await fileAdapter.upsertProfile("business@test.local", "business");
  await fileAdapter.upsertProfile("none@test.local", "none");
  await fileAdapter.upsertProfile("admin@guardweb.local", "business");
  console.log("  Profili di test creati");
  console.log("Seed completato.");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
