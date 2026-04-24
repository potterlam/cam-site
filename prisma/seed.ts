import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient();

// ─────────────────────────────────────────────────────────────
// EDIT THIS SECTION — Add your punishment sets here
// severity: 1 = mild, 2 = medium, 3 = spicy
// ─────────────────────────────────────────────────────────────
const SETS = [
  {
    name: "飲酒懲罰",
    description: "喝酒相關的懲罰",
    punishments: [
      { description: "喝一口啤酒", severity: 1, order: 1 },
      { description: "乾杯一杯", severity: 2, order: 2 },
      { description: "喝一shot", severity: 3, order: 3 },
      // Add more here...
    ],
  },
  {
    name: "動作懲罰",
    description: "做動作的懲罰",
    punishments: [
      { description: "做10個掌上壓", severity: 1, order: 1 },
      { description: "原地跳10下", severity: 1, order: 2 },
      { description: "表演一個動物叫聲", severity: 2, order: 3 },
      // Add more here...
    ],
  },
  // ── Paste more sets below following the same format ──
  // {
  //   name: "Set Name",
  //   description: "Description",
  //   punishments: [
  //     { description: "Punishment text", severity: 1, order: 1 },
  //   ],
  // },
];
// ─────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding punishment sets...");

  for (const set of SETS) {
    const existing = await db.punishmentSet.findFirst({ where: { name: set.name } });
    if (existing) {
      console.log(`Skipping "${set.name}" — already exists.`);
      continue;
    }

    await db.punishmentSet.create({
      data: {
        name: set.name,
        description: set.description,
        punishments: {
          create: set.punishments,
        },
      },
    });

    console.log(`Created "${set.name}" with ${set.punishments.length} punishments.`);
  }

  console.log("Done!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
