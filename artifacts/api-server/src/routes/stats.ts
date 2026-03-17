import { Router, type IRouter, type Request, type Response } from "express";
import { db, batchesTable, personsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/", async (_req: Request, res: Response) => {
  const batches = await db.select().from(batchesTable);
  const persons = await db.select().from(personsTable);
  
  const total_batches = batches.length;
  const complete_batches = batches.filter(b => b.is_complete).length;
  const active_batches = total_batches - complete_batches;
  const total_persons = persons.length;
  
  res.json({ total_batches, active_batches, complete_batches, total_persons });
});

export default router;
