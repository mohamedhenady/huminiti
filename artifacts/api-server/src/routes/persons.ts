import { Router, type IRouter, type Request, type Response } from "express";
import { db, personsTable, recordsTable, drugsTable, batchesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/batches/:batchId/persons", async (req: Request, res: Response) => {
  const batchId = parseInt(req.params.batchId);
  const { search, filter } = req.query;
  
  let persons = await db.select().from(personsTable).where(eq(personsTable.batch_id, batchId));
  
  if (search && typeof search === "string") {
    const s = search.toLowerCase();
    persons = persons.filter(p => 
      p.full_name.toLowerCase().includes(s) || 
      p.inv_number.toLowerCase().includes(s)
    );
  }
  
  if (filter === "complete") {
    persons = persons.filter(p => p.is_complete);
  } else if (filter === "incomplete") {
    persons = persons.filter(p => !p.is_complete);
  }
  
  const result = await Promise.all(persons.map(async (person) => {
    const records = await db.select().from(recordsTable).where(eq(recordsTable.person_id, person.person_id));
    return {
      ...person,
      ordered_count: records.filter(r => r.ordered).length,
      prepared_count: records.filter(r => r.prepared).length,
      ready_count: records.filter(r => r.ready).length,
      total_drugs: records.length,
    };
  }));
  
  res.json({ persons: result });
});

router.post("/batches/:batchId/persons", async (req: Request, res: Response) => {
  const batchId = parseInt(req.params.batchId);
  const { full_name, ph_number, location, inv_number, drugs } = req.body;
  
  if (!full_name || !ph_number || !location || !inv_number) {
    return res.status(400).json({ error: "جميع الحقول مطلوبة" });
  }
  
  let total_cost = 0;
  const drugList = drugs || [];
  
  if (drugList.length > 0) {
    for (const drugId of drugList) {
      const drug = await db.select().from(drugsTable).where(eq(drugsTable.drug_id, drugId));
      if (drug[0]) {
        const discount = drug[0].local_or_not ? 0.8 : 0.9;
        total_cost += drug[0].price;
      }
    }
  }
  
  const [person] = await db.insert(personsTable).values({
    full_name,
    ph_number,
    location,
    batch_id: batchId,
    is_complete: false,
    total_cost,
    inv_number,
  }).returning();
  
  if (drugList.length > 0) {
    for (const drugId of drugList) {
      const drug = await db.select().from(drugsTable).where(eq(drugsTable.drug_id, drugId));
      if (drug[0]) {
        const discount = drug[0].local_or_not ? 0.8 : 0.9;
        const final_price = drug[0].price * discount;
        await db.insert(recordsTable).values({
          drug_id: drugId,
          person_id: person.person_id,
          batch_id: batchId,
          final_price,
          ordered: false,
          prepared: false,
          ready: false,
        });
      }
    }
    
    const records = await db.select().from(recordsTable).where(eq(recordsTable.person_id, person.person_id));
    const newTotalCost = records.reduce((sum, r) => sum + r.final_price, 0);
    await db.update(personsTable).set({ total_cost: newTotalCost }).where(eq(personsTable.person_id, person.person_id));
    person.total_cost = newTotalCost;
  }
  
  res.status(201).json({
    ...person,
    ordered_count: 0,
    prepared_count: 0,
    ready_count: 0,
    total_drugs: drugList.length,
  });
});

router.post("/batches/:batchId/import", async (req: Request, res: Response) => {
  const batchId = parseInt(req.params.batchId);
  const { data } = req.body;
  
  if (!data || !Array.isArray(data)) {
    return res.status(400).json({ error: "البيانات مطلوبة" });
  }
  
  let imported_count = 0;
  const errors: string[] = [];
  
  for (const row of data) {
    try {
      const full_name = row["الاسم"] || row["full_name"] || row["name"];
      const ph_number = row["الهاتف"] || row["phone"] || row["ph_number"] || "";
      const location = row["العنوان"] || row["location"] || "";
      const inv_number = row["رقم الفاتورة"] || row["invoice"] || row["inv_number"] || "";
      
      if (!full_name) {
        errors.push(`صف بدون اسم: ${JSON.stringify(row)}`);
        continue;
      }
      
      await db.insert(personsTable).values({
        full_name,
        ph_number,
        location,
        batch_id: batchId,
        is_complete: false,
        total_cost: 0,
        inv_number,
      });
      imported_count++;
    } catch (err) {
      errors.push(`خطأ في الصف: ${JSON.stringify(row)}`);
    }
  }
  
  res.json({ success: true, imported_count, errors });
});

router.get("/persons/:personId", async (req: Request, res: Response) => {
  const personId = parseInt(req.params.personId);
  
  const persons = await db.select().from(personsTable).where(eq(personsTable.person_id, personId));
  if (!persons[0]) return res.status(404).json({ error: "الشخص غير موجود" });
  
  const person = persons[0];
  const records = await db.select().from(recordsTable).where(eq(recordsTable.person_id, personId));
  
  const recordsWithDrug = await Promise.all(records.map(async (record) => {
    const drugs = record.drug_id 
      ? await db.select().from(drugsTable).where(eq(drugsTable.drug_id, record.drug_id))
      : [];
    return { ...record, drug: drugs[0] || null };
  }));
  
  let batch_name = "";
  if (person.batch_id) {
    const batches = await db.select().from(batchesTable).where(eq(batchesTable.batch_id, person.batch_id));
    batch_name = batches[0]?.batch_name || "";
  }
  
  res.json({ ...person, batch_name, records: recordsWithDrug });
});

router.put("/persons/:personId", async (req: Request, res: Response) => {
  const personId = parseInt(req.params.personId);
  const { full_name, ph_number, location, inv_number } = req.body;
  
  const updates: Partial<typeof personsTable.$inferInsert> = {};
  if (full_name !== undefined) updates.full_name = full_name;
  if (ph_number !== undefined) updates.ph_number = ph_number;
  if (location !== undefined) updates.location = location;
  if (inv_number !== undefined) updates.inv_number = inv_number;
  
  const [updated] = await db.update(personsTable).set(updates).where(eq(personsTable.person_id, personId)).returning();
  if (!updated) return res.status(404).json({ error: "الشخص غير موجود" });
  
  const records = await db.select().from(recordsTable).where(eq(recordsTable.person_id, personId));
  res.json({
    ...updated,
    ordered_count: records.filter(r => r.ordered).length,
    prepared_count: records.filter(r => r.prepared).length,
    ready_count: records.filter(r => r.ready).length,
    total_drugs: records.length,
  });
});

router.post("/persons/:personId/complete", async (req: Request, res: Response) => {
  const personId = parseInt(req.params.personId);
  
  const records = await db.select().from(recordsTable).where(eq(recordsTable.person_id, personId));
  const allReady = records.length === 0 || records.every(r => r.ready);
  
  if (!allReady) {
    return res.status(400).json({ error: "لازم كل الأدوية تكون جاهزة الأول" });
  }
  
  const [updated] = await db.update(personsTable).set({ is_complete: true }).where(eq(personsTable.person_id, personId)).returning();
  if (!updated) return res.status(404).json({ error: "الشخص غير موجود" });
  
  res.json({
    ...updated,
    ordered_count: records.filter(r => r.ordered).length,
    prepared_count: records.filter(r => r.prepared).length,
    ready_count: records.filter(r => r.ready).length,
    total_drugs: records.length,
  });
});

export default router;
