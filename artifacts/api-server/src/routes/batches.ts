import { Router, type IRouter, type Request, type Response } from "express";
import { db, batchesTable, personsTable, recordsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (_req: Request, res: Response) => {
  const batches = await db.select().from(batchesTable).orderBy(batchesTable.batch_id);
  
  const result = await Promise.all(batches.map(async (batch) => {
    const persons = await db.select().from(personsTable).where(eq(personsTable.batch_id, batch.batch_id));
    const complete_count = persons.filter(p => p.is_complete).length;
    const total_cost_before = persons.reduce((sum, p) => sum + (p.total_cost || 0), 0);
    
    const costs = await Promise.all(persons.map(async (p) => {
      const recs = await db.select().from(recordsTable).where(eq(recordsTable.person_id, p.person_id));
      return recs.reduce((sum, r) => sum + (r.final_price || 0), 0);
    }));
    
    const total_cost_after = costs.reduce((a, b) => a + b, 0);
    
    return {
      batch_id: batch.batch_id,
      batch_name: batch.batch_name,
      is_complete: batch.is_complete,
      persons_count: persons.length,
      complete_count,
      total_cost_before,
      total_cost_after,
    };
  }));
  
  res.json({ batches: result });
});

router.post("/", async (req: Request, res: Response) => {
  const { batch_name } = req.body;
  if (!batch_name) return res.status(400).json({ error: "اسم الدفعة مطلوب" });
  
  const [batch] = await db.insert(batchesTable).values({ batch_name, is_complete: false }).returning();
  res.status(201).json(batch);
});

router.get("/:batchId", async (req: Request, res: Response) => {
  const batchId = parseInt(req.params.batchId);
  const batches = await db.select().from(batchesTable).where(eq(batchesTable.batch_id, batchId));
  if (!batches[0]) return res.status(404).json({ error: "الدفعة غير موجودة" });
  
  const batch = batches[0];
  const persons = await db.select().from(personsTable).where(eq(personsTable.batch_id, batchId));
  const complete_count = persons.filter(p => p.is_complete).length;
  const total_cost_before = persons.reduce((sum, p) => sum + (p.total_cost || 0), 0);
  
  const costs = await Promise.all(persons.map(async (p) => {
    const recs = await db.select().from(recordsTable).where(eq(recordsTable.person_id, p.person_id));
    return recs.reduce((sum, r) => sum + (r.final_price || 0), 0);
  }));
  const total_cost_after = costs.reduce((a, b) => a + b, 0);
  
  res.json({
    batch_id: batch.batch_id,
    batch_name: batch.batch_name,
    is_complete: batch.is_complete,
    persons_count: persons.length,
    complete_count,
    total_cost_before,
    total_cost_after,
  });
});

router.put("/:batchId", async (req: Request, res: Response) => {
  const batchId = parseInt(req.params.batchId);
  const { batch_name, is_complete } = req.body;
  
  const updates: Partial<typeof batchesTable.$inferInsert> = {};
  if (batch_name !== undefined) updates.batch_name = batch_name;
  if (is_complete !== undefined) updates.is_complete = is_complete;
  
  const [updated] = await db.update(batchesTable).set(updates).where(eq(batchesTable.batch_id, batchId)).returning();
  if (!updated) return res.status(404).json({ error: "الدفعة غير موجودة" });
  
  res.json(updated);
});

export default router;
