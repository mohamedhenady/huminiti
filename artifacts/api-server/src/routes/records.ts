import { Router, type IRouter, type Request, type Response } from "express";
import { db, recordsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.put("/:recordId", async (req: Request, res: Response) => {
  const recordId = parseInt(req.params.recordId);
  const { ordered, prepared, ready } = req.body;
  
  const updates: Partial<typeof recordsTable.$inferInsert> = {};
  if (ordered !== undefined) updates.ordered = ordered;
  if (prepared !== undefined) updates.prepared = prepared;
  if (ready !== undefined) updates.ready = ready;
  
  const [updated] = await db.update(recordsTable).set(updates).where(eq(recordsTable.record_id, recordId)).returning();
  if (!updated) return res.status(404).json({ error: "السجل غير موجود" });
  
  res.json(updated);
});

export default router;
