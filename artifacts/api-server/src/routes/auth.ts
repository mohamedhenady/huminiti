import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const sessions = new Map<string, { userId: number; username: string; role: string; displayName: string }>();

router.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "اسم المستخدم وكلمة المرور مطلوبان" });
  }

  const users = await db.select().from(usersTable).where(eq(usersTable.username, username));
  const user = users[0];

  if (!user || user.password_hash !== hashPassword(password)) {
    return res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
  }

  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, {
    userId: user.id,
    username: user.username,
    role: user.role,
    displayName: user.display_name,
  });

  res.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      displayName: user.display_name,
    },
    token,
  });
});

router.post("/logout", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token) sessions.delete(token);
  res.json({ success: true, message: "تم تسجيل الخروج" });
});

router.get("/me", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "غير مصرح" });
  
  const session = sessions.get(token);
  if (!session) return res.status(401).json({ error: "الجلسة منتهية" });

  res.json({
    id: session.userId,
    username: session.username,
    role: session.role,
    displayName: session.displayName,
  });
});

export { sessions };
export default router;
