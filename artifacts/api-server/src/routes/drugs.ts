import { Router, type IRouter, type Request, type Response } from "express";
import { db, drugsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req: Request, res: Response) => {
  const { search, filter } = req.query;
  
  let drugs = await db.select().from(drugsTable).orderBy(drugsTable.drug_id);
  
  if (search && typeof search === "string") {
    const s = search.toLowerCase();
    drugs = drugs.filter(d => 
      d.ar_name.toLowerCase().includes(s) || 
      d.en_name.toLowerCase().includes(s)
    );
  }
  
  if (filter === "local") {
    drugs = drugs.filter(d => d.local_or_not);
  } else if (filter === "imported") {
    drugs = drugs.filter(d => !d.local_or_not);
  }
  
  res.json({ drugs });
});

router.post("/", async (req: Request, res: Response) => {
  const { ar_name, en_name, price, local_or_not } = req.body;
  
  if (!ar_name || !en_name || price === undefined) {
    return res.status(400).json({ error: "جميع الحقول مطلوبة" });
  }
  
  const [drug] = await db.insert(drugsTable).values({ ar_name, en_name, price, local_or_not }).returning();
  res.status(201).json(drug);
});

router.put("/:drugId", async (req: Request, res: Response) => {
  const drugId = parseInt(req.params.drugId);
  const { ar_name, en_name, price, local_or_not } = req.body;
  
  const updates: Partial<typeof drugsTable.$inferInsert> = {};
  if (ar_name !== undefined) updates.ar_name = ar_name;
  if (en_name !== undefined) updates.en_name = en_name;
  if (price !== undefined) updates.price = price;
  if (local_or_not !== undefined) updates.local_or_not = local_or_not;
  
  const [updated] = await db.update(drugsTable).set(updates).where(eq(drugsTable.drug_id, drugId)).returning();
  if (!updated) return res.status(404).json({ error: "الدواء غير موجود" });
  
  res.json(updated);
});

router.delete("/:drugId", async (req: Request, res: Response) => {
  const drugId = parseInt(req.params.drugId);
  
  const [deleted] = await db.delete(drugsTable).where(eq(drugsTable.drug_id, drugId)).returning();
  if (!deleted) return res.status(404).json({ error: "الدواء غير موجود" });
  
  res.json({ success: true, message: "تم حذف الدواء بنجاح" });
});

export default router;
