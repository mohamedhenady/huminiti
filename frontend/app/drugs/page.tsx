"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { AuthProvider } from "@/lib/auth-context";
import AppLayout from "@/components/layout/AppLayout";
import TopBar from "@/components/layout/TopBar";
import { getDrugs, createDrug, updateDrug, deleteDrug } from "@/lib/api";
import { Plus, Search, Pencil, Trash2, X } from "lucide-react";

interface Drug { id: string; ar_name: string; en_name?: string; price: number; is_local: boolean; }
interface DrugForm { ar_name: string; en_name: string; price: string; is_local: boolean; }

function DrugsContent() {
  const { isPharmacy } = useAuth();
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [editing, setEditing] = useState<Drug | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<DrugForm>({ ar_name: "", en_name: "", price: "", is_local: true });
  const [confirmDelete, setConfirmDelete] = useState<Drug | null>(null);

  const load = async () => {
    setLoading(true);
    try { const r = await getDrugs(search, typeFilter); setDrugs(r.data); }
    catch {/* */} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, typeFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ar_name: "", en_name: "", price: "", is_local: true });
    setShowForm(true);
  };

  const openEdit = (d: Drug) => {
    setEditing(d);
    setForm({ ar_name: d.ar_name, en_name: d.en_name || "", price: String(d.price), is_local: d.is_local });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, price: parseFloat(form.price) };
    try {
      if (editing) await updateDrug(editing.id, payload);
      else await createDrug(payload);
      setShowForm(false); load();
    } catch {/* */}
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try { await deleteDrug(confirmDelete.id); setConfirmDelete(null); load(); } catch {/* */}
  };

  return (
    <div className="pb-20 lg:pb-0">
      <TopBar title="قاموس الأدوية" />
      <div className="p-6 space-y-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input className="input pr-9" placeholder="بحث بالاسم عربي أو إنجليزي..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {[["all", "الكل"], ["local", "محلي"], ["imported", "مستورد"]].map(([v, l]) => (
              <button key={v} onClick={() => setTypeFilter(v)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  typeFilter === v ? "bg-white text-primary shadow-sm" : "text-text-secondary"
                }`}>{l}</button>
            ))}
          </div>
          {isPharmacy && (
            <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> إضافة دواء
            </button>
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="card w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-bold text-lg">{editing ? "تعديل الدواء" : "إضافة دواء جديد"}</h3>
                <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-text-secondary" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">الاسم العربي *</label>
                  <input className="input" required value={form.ar_name}
                    onChange={(e) => setForm({ ...form, ar_name: e.target.value })} />
                </div>
                <div>
                  <label className="label">الاسم الإنجليزي</label>
                  <input className="input" value={form.en_name} dir="ltr"
                    onChange={(e) => setForm({ ...form, en_name: e.target.value })} />
                </div>
                <div>
                  <label className="label">السعر (ج.م) *</label>
                  <input className="input" type="number" step="0.01" required value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })} dir="ltr" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="label mb-0">النوع:</label>
                  <button type="button" onClick={() => setForm({ ...form, is_local: true })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                      form.is_local ? "bg-secondary text-white border-secondary" : "border-border text-text-secondary"
                    }`}>محلي −٢٠٪</button>
                  <button type="button" onClick={() => setForm({ ...form, is_local: false })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                      !form.is_local ? "bg-primary text-white border-primary" : "border-border text-text-secondary"
                    }`}>مستورد −١٠٪</button>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="btn-primary flex-1">{editing ? "حفظ التعديلات" : "إضافة"}</button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">إلغاء</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirm Delete Modal */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="card w-full max-w-sm p-6 text-center">
              <Trash2 className="w-12 h-12 text-danger mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">تأكيد الحذف</h3>
              <p className="text-text-secondary text-sm mb-6">هل أنت متأكد من حذف <strong>{confirmDelete.ar_name}</strong>؟</p>
              <div className="flex gap-3">
                <button onClick={handleDelete} className="flex-1 py-2 bg-danger text-white rounded-lg font-semibold hover:bg-red-600 transition-colors">نعم، احذف</button>
                <button onClick={() => setConfirmDelete(null)} className="btn-outline flex-1">إلغاء</button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border">
              <tr>
                {["الاسم العربي", "الاسم الإنجليزي", "النوع", "السعر", isPharmacy ? "إجراءات" : ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-right font-semibold text-xs text-text-secondary">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-text-secondary">جارٍ التحميل...</td></tr>
              ) : drugs.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-text-secondary">لا توجد أدوية</td></tr>
              ) : drugs.map((d) => (
                <tr key={d.id} className="hover:bg-background transition-colors">
                  <td className="px-4 py-3 font-medium">{d.ar_name}</td>
                  <td className="px-4 py-3 text-text-secondary" dir="ltr">{d.en_name || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      d.is_local ? "bg-green-100 text-secondary" : "bg-blue-100 text-primary"
                    }`}>{d.is_local ? "محلي" : "مستورد"}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold">{d.price.toFixed(2)} ج</td>
                  {isPharmacy && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-blue-50 text-primary transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setConfirmDelete(d)} className="p-1.5 rounded-lg hover:bg-red-50 text-danger transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function DrugsPage() {
  return (
    <AuthProvider>
      <AppLayout>
        <DrugsContent />
      </AppLayout>
    </AuthProvider>
  );
}
