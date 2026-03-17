"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AuthProvider } from "@/lib/auth-context";
import AppLayout from "@/components/layout/AppLayout";
import TopBar from "@/components/layout/TopBar";
import { getBatches, createBatch, importExcel } from "@/lib/api";
import { Plus, Upload, Package, Users, CheckCircle, Activity } from "lucide-react";

interface Batch {
  id: string;
  name: string;
  is_complete: boolean;
  created_at: string;
}

function BatchesContent() {
  const { isPharmacy } = useAuth();
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [importBatchId, setImportBatchId] = useState("");
  const [showImport, setShowImport] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getBatches();
      setBatches(res.data);
    } catch {/* ignore */} finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await createBatch({ name: newName });
      setBatches((p) => [res.data, ...p]);
      setNewName("");
      setShowForm(false);
    } catch {/* ignore */} finally {
      setCreating(false);
    }
  };

  const handleImport = async (batchId: string, file: File) => {
    try {
      await importExcel(batchId, file);
      alert("تم الاستيراد بنجاح ✅");
    } catch { alert("حدث خطأ أثناء الاستيراد ❌"); }
  };

  const total = batches.length;
  const ongoing = batches.filter((b) => !b.is_complete).length;
  const completed = batches.filter((b) => b.is_complete).length;

  return (
    <div className="pb-20 lg:pb-0">
      <TopBar title="الدفعات" />
      <div className="p-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "إجمالي الدفعات", value: total, icon: Package, color: "text-primary bg-blue-50" },
            { label: "الدفعات الجارية", value: ongoing, icon: Activity, color: "text-warning bg-orange-50" },
            { label: "الدفعات المكتملة", value: completed, icon: CheckCircle, color: "text-secondary bg-green-50" },
            { label: "إجمالي الأشخاص", value: "—", icon: Users, color: "text-text-secondary bg-gray-50" },
          ].map((s) => (
            <div key={s.label} className="card p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-text-primary">{s.value}</p>
              <p className="text-xs text-text-secondary mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Header + Actions */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">قائمة الدفعات</h2>
          {isPharmacy && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" /> دفعة جديدة
              </button>
              <label className="btn-outline flex items-center gap-2 text-sm cursor-pointer">
                <Upload className="w-4 h-4" /> استيراد Excel
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0] && importBatchId) {
                      handleImport(importBatchId, e.target.files[0]);
                    } else {
                      alert("اختار دفعة الأول من القائمة");
                    }
                  }}
                />
              </label>
            </div>
          )}
        </div>

        {/* Create form */}
        {showForm && (
          <div className="card p-5">
            <form onSubmit={handleCreate} className="flex gap-3">
              <input
                className="input flex-1"
                placeholder="اسم الدفعة الجديدة"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
              <button type="submit" disabled={creating} className="btn-primary text-sm">
                {creating ? "..." : "إنشاء"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline text-sm">
                إلغاء
              </button>
            </form>
          </div>
        )}

        {/* Batches Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-5 bg-gray-100 rounded w-2/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/3 mb-4" />
                <div className="h-2 bg-gray-100 rounded w-full mb-6" />
                <div className="h-9 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : batches.length === 0 ? (
          <div className="card p-16 text-center">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-text-secondary font-medium">لا توجد دفعات بعد</p>
            {isPharmacy && (
              <button onClick={() => setShowForm(true)} className="btn-primary mt-4 text-sm">
                <Plus className="w-4 h-4 inline ml-1" /> أضف دفعة جديدة
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map((batch) => (
              <div key={batch.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-text-primary text-base">{batch.name}</h3>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    batch.is_complete
                      ? "bg-green-100 text-secondary"
                      : "bg-orange-100 text-warning"
                  }`}>
                    {batch.is_complete ? "مكتملة ✅" : "جارية ⏳"}
                  </span>
                </div>

                {/* Progress placeholder */}
                <div className="mb-4">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: batch.is_complete ? "100%" : "45%" }}
                    />
                  </div>
                  <p className="text-xs text-text-secondary mt-1">نسبة التقدم</p>
                </div>

                {isPharmacy && (
                  <select
                    className="input text-xs mb-3"
                    defaultValue=""
                    onChange={(e) => setImportBatchId(e.target.value)}
                  >
                    <option value="" disabled>اختار لاستيراد Excel</option>
                    <option value={batch.id}>{batch.name}</option>
                  </select>
                )}

                <button
                  onClick={() => router.push(`/batches/${batch.id}`)}
                  className="btn-primary w-full text-sm py-2"
                >
                  عرض التفاصيل
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BatchesPage() {
  return (
    <AuthProvider>
      <AppLayout>
        <BatchesContent />
      </AppLayout>
    </AuthProvider>
  );
}
