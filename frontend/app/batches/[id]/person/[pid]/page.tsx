"use client";
import { useEffect, useState, use } from "react";
import { useAuth } from "@/lib/auth-context";
import { AuthProvider } from "@/lib/auth-context";
import AppLayout from "@/components/layout/AppLayout";
import TopBar from "@/components/layout/TopBar";
import { getPerson, updateRecordStatus, markPersonReceived } from "@/lib/api";

interface DrugRecord {
  id: string; drug_name: string; drug_price: number; final_price: number;
  status: "ordered" | "prepared" | "ready"; drugs?: { is_local: boolean };
}
interface Person {
  id: string; full_name: string; ph_number: string; location: string;
  inv_number: string; is_complete: boolean; total_cost: number;
  records: DrugRecord[];
}

const STATUS_LABELS: Record<string, string> = {
  ordered: "طُلب", prepared: "جُهِّز", ready: "جاهز",
};
const STATUS_ORDER = ["ordered", "prepared", "ready"];

function PersonDetailContent({ batchId, personId }: { batchId: string; personId: string }) {
  const { isPharmacy } = useAuth();
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [receiving, setReceiving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const r = await getPerson(personId); setPerson(r.data); }
    catch {/* */} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleStatusChange = async (recordId: string, status: string) => {
    try {
      await updateRecordStatus(recordId, status);
      load();
    } catch {/* */}
  };

  const handleReceive = async () => {
    setReceiving(true);
    try {
      await markPersonReceived(personId);
      load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      alert(err?.response?.data?.detail || "حدث خطأ");
    } finally { setReceiving(false); }
  };

  const allReady = person?.records?.every((r) => r.status === "ready") ?? false;
  const totalBefore = person?.records?.reduce((s, r) => s + r.drug_price, 0) || 0;
  const totalAfter = person?.records?.reduce((s, r) => s + r.final_price, 0) || 0;

  if (loading) return <div className="p-12 text-center text-text-secondary">جارٍ التحميل...</div>;
  if (!person) return <div className="p-12 text-center text-danger">لم يتم العثور على الشخص</div>;

  return (
    <div className="pb-24 lg:pb-8">
      <TopBar
        title={person.full_name}
        breadcrumb={[
          { label: "الدفعات" }, { label: "تفاصيل الدفعة" }, { label: person.full_name },
        ]}
      />
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-text-primary">{person.full_name}</h2>
              <p className="text-text-secondary text-sm mt-0.5" dir="ltr">{person.ph_number}</p>
            </div>
            <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${
              person.is_complete ? "bg-green-100 text-secondary" : "bg-gray-100 text-text-secondary"
            }`}>
              {person.is_complete ? "استلم ✅" : "لم يستلم ⏳"}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-border">
            <div><p className="text-xs text-text-secondary">📍 العنوان</p><p className="font-semibold text-sm">{person.location || "—"}</p></div>
            <div><p className="text-xs text-text-secondary">🧾 رقم الفاتورة</p><p className="font-semibold text-sm">{person.inv_number || "—"}</p></div>
            <div><p className="text-xs text-text-secondary">التكلفة قبل الخصم</p><p className="font-semibold text-sm text-text-secondary">{totalBefore.toFixed(2)} ج</p></div>
            <div><p className="text-xs text-text-secondary">التكلفة بعد الخصم</p><p className="font-bold text-lg text-primary">{totalAfter.toFixed(2)} ج</p></div>
          </div>
        </div>

        {/* Drugs Table */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-bold text-text-primary">الأدوية ({person.records?.length || 0})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border">
                <tr>
                  {["اسم الدواء", "النوع", "السعر", "بعد الخصم", "الحالة"].map((h) => (
                    <th key={h} className="px-4 py-3 text-right font-semibold text-xs text-text-secondary">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {person.records?.map((rec) => (
                  <tr key={rec.id} className="hover:bg-background transition-colors">
                    <td className="px-4 py-3 font-medium">{rec.drug_name}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        rec.drugs?.is_local !== false
                          ? "bg-green-100 text-secondary"
                          : "bg-blue-100 text-primary"
                      }`}>
                        {rec.drugs?.is_local !== false ? "محلي −٢٠٪" : "مستورد −١٠٪"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{rec.drug_price.toFixed(2)} ج</td>
                    <td className="px-4 py-3 font-semibold text-primary">{rec.final_price.toFixed(2)} ج</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {STATUS_ORDER.map((s) => (
                          <button
                            key={s}
                            disabled={!isPharmacy}
                            onClick={() => isPharmacy && handleStatusChange(rec.id, s)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                              rec.status === s
                                ? s === "ready"
                                  ? "bg-secondary text-white border-secondary"
                                  : s === "prepared"
                                  ? "bg-warning text-white border-warning"
                                  : "bg-danger text-white border-danger"
                                : "bg-white text-text-secondary border-border hover:border-primary"
                            } ${!isPharmacy ? "cursor-default" : "cursor-pointer"}`}
                          >
                            {STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Receive Button — pharmacy only */}
        {isPharmacy && !person.is_complete && (
          <div className="card p-4">
            <button
              onClick={handleReceive}
              disabled={!allReady || receiving}
              title={!allReady ? "لازم كل الأدوية تكون جاهزة الأول" : ""}
              className={`w-full py-3 rounded-xl font-bold text-base transition-all ${
                allReady
                  ? "bg-secondary text-white hover:bg-green-600 cursor-pointer"
                  : "bg-gray-100 text-text-secondary cursor-not-allowed"
              }`}
            >
              {receiving ? "جارٍ التسجيل..." : "✅ تسجيل الاستلام"}
            </button>
            {!allReady && (
              <p className="text-xs text-text-secondary text-center mt-2">
                لازم كل الأدوية تكون حالتها &quot;جاهز&quot; الأول
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PersonDetailPage({ params }: { params: Promise<{ id: string; pid: string }> }) {
  const { id, pid } = use(params);
  return (
    <AuthProvider>
      <AppLayout>
        <PersonDetailContent batchId={id} personId={pid} />
      </AppLayout>
    </AuthProvider>
  );
}
