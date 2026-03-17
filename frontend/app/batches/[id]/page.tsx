"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AuthProvider } from "@/lib/auth-context";
import AppLayout from "@/components/layout/AppLayout";
import TopBar from "@/components/layout/TopBar";
import { getBatch, getPersonsByBatch, createPerson } from "@/lib/api";
import { Plus, Search, ChevronLeft } from "lucide-react";
import Link from "next/link";

interface Person {
  id: string; full_name: string; ph_number: string; location: string;
  inv_number: string; is_complete: boolean; total_cost: number;
  records?: { status: string }[];
}
interface Batch { id: string; name: string; is_complete: boolean; }

function BatchDetailContent({ batchId }: { batchId: string }) {
  const { isPharmacy } = useAuth();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: "", ph_number: "", location: "", inv_number: "" });

  const load = async () => {
    setLoading(true);
    try {
      const [b, p] = await Promise.all([getBatch(batchId), getPersonsByBatch(batchId, search, filter)]);
      setBatch(b.data); setPersons(p.data);
    } catch {/* */} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, filter]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPerson({ ...form, batch_id: batchId });
      setForm({ full_name: "", ph_number: "", location: "", inv_number: "" });
      setShowForm(false); load();
    } catch {/* */}
  };

  const totalPersons = persons.length;
  const received = persons.filter((p) => p.is_complete).length;
  const pct = totalPersons ? Math.round((received / totalPersons) * 100) : 0;

  return (
    <div className="pb-20 lg:pb-0">
      <TopBar
        title={batch?.name || "..."}
        breadcrumb={[{ label: "الدفعات", href: "/batches" }, { label: batch?.name || "" }]}
      />
      <div className="p-6 space-y-5">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-5 md:col-span-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-text-secondary">نسبة الاستلام</p>
                <p className="text-2xl font-bold text-text-primary">{received} / {totalPersons}</p>
              </div>
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                batch?.is_complete ? "bg-green-100 text-secondary" : "bg-orange-100 text-warning"
              }`}>
                {batch?.is_complete ? "مكتملة" : "جارية"}
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-text-secondary mt-1">{pct}% من الأشخاص استلموا</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <input
              className="input pr-9"
              placeholder="بحث بالاسم أو رقم الفاتورة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {[["all", "الكل"], ["pending", "لم يستلم"], ["received", "استلم"]].map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === val ? "bg-white text-primary shadow-sm" : "text-text-secondary"
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
          {isPharmacy && (
            <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> إضافة شخص
            </button>
          )}
        </div>

        {/* Add Person Form */}
        {showForm && (
          <div className="card p-5">
            <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="label">الاسم *</label>
                <input className="input" required value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="label">رقم الهاتف</label>
                <input className="input" value={form.ph_number}
                  onChange={(e) => setForm({ ...form, ph_number: e.target.value })} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="label">العنوان</label>
                <input className="input" value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="label">رقم الفاتورة</label>
                <input className="input" value={form.inv_number}
                  onChange={(e) => setForm({ ...form, inv_number: e.target.value })} />
              </div>
              <div className="col-span-2 flex gap-3 mt-2">
                <button type="submit" className="btn-primary text-sm">حفظ</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline text-sm">إلغاء</button>
              </div>
            </form>
          </div>
        )}

        {/* Persons Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-text-secondary">جارٍ التحميل...</div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-background border-b border-border">
                    <tr>
                      {["الاسم", "الهاتف", "العنوان", "رقم الفاتورة", "تقدم الأدوية", "الاستلام", ""].map((h) => (
                        <th key={h} className="px-4 py-3 text-right font-semibold text-text-secondary text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {persons.map((p) => {
                      const ordered = p.records?.filter((r) => r.status === "ordered").length || 0;
                      const prepared = p.records?.filter((r) => r.status === "prepared").length || 0;
                      const ready = p.records?.filter((r) => r.status === "ready").length || 0;
                      return (
                        <tr key={p.id} className="hover:bg-background transition-colors">
                          <td className="px-4 py-3 font-medium text-text-primary">{p.full_name}</td>
                          <td className="px-4 py-3 text-text-secondary" dir="ltr">{p.ph_number || "—"}</td>
                          <td className="px-4 py-3 text-text-secondary">{p.location || "—"}</td>
                          <td className="px-4 py-3 text-text-secondary">{p.inv_number || "—"}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-danger/20 text-danger text-xs flex items-center justify-center font-bold">{ordered}</span>
                              <span className="w-5 h-5 rounded-full bg-warning/20 text-warning text-xs flex items-center justify-center font-bold">{prepared}</span>
                              <span className="w-5 h-5 rounded-full bg-secondary/20 text-secondary text-xs flex items-center justify-center font-bold">{ready}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {p.is_complete
                              ? <span className="text-secondary">✅ استلم</span>
                              : <span className="text-text-secondary">⏳ لم يستلم</span>}
                          </td>
                          <td className="px-4 py-3">
                            <Link href={`/batches/${batchId}/person/${p.id}`}
                              className="text-primary text-xs font-semibold hover:underline flex items-center gap-1">
                              عرض <ChevronLeft className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {persons.length === 0 && (
                  <div className="p-10 text-center text-text-secondary text-sm">لا يوجد أشخاص</div>
                )}
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-border">
                {persons.map((p) => (
                  <Link key={p.id} href={`/batches/${batchId}/person/${p.id}`}
                    className="block p-4 hover:bg-background">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{p.full_name}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{p.ph_number} · {p.location}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_complete ? "bg-green-100 text-secondary" : "bg-gray-100 text-text-secondary"}`}>
                        {p.is_complete ? "استلم ✅" : "⏳"}
                      </span>
                    </div>
                  </Link>
                ))}
                {persons.length === 0 && (
                  <div className="p-8 text-center text-text-secondary text-sm">لا يوجد أشخاص</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BatchDetailPage({ params }: { params: { id: string } }) {
  return (
    <AuthProvider>
      <AppLayout>
        <BatchDetailContent batchId={params.id} />
      </AppLayout>
    </AuthProvider>
  );
}
