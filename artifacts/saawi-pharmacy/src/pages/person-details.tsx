import { useRoute, Link } from "wouter";
import { 
  useGetPerson, useCompletePerson, useUpdateRecord,
  getGetPersonQueryKey, getGetBatchQueryKey, getGetStatsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { 
  ArrowRight, User, MapPin, Phone, Receipt, CheckCircle2, Package, Tag, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function PersonDetails() {
  const [, params] = useRoute("/persons/:id");
  const personId = parseInt(params?.id || "0");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isPharmacy = user?.role === "pharmacy";

  const { data: person, isLoading } = useGetPerson(personId, { query: { enabled: !!personId } });

  const completeMutation = useCompletePerson({
    mutation: {
      onSuccess: () => {
        toast.success("تم تأكيد الاستلام بنجاح");
        queryClient.invalidateQueries({ queryKey: getGetPersonQueryKey(personId) });
        if (person?.batch_id) queryClient.invalidateQueries({ queryKey: getGetBatchQueryKey(person?.batch_id) });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
      },
      onError: () => toast.error("حدث خطأ في التسجيل")
    }
  });

  const updateRecordMutation = useUpdateRecord({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPersonQueryKey(personId) });
      }
    }
  });

  const handleToggleStatus = (recordId: number, status: 'ordered' | 'prepared' | 'ready') => {
    if (!isPharmacy) return;
    const updatePayload = { ordered: false, prepared: false, ready: false };
    if (status === 'ordered') updatePayload.ordered = true;
    if (status === 'prepared') { updatePayload.ordered = true; updatePayload.prepared = true; }
    if (status === 'ready') { updatePayload.ordered = true; updatePayload.prepared = true; updatePayload.ready = true; }
    
    updateRecordMutation.mutate({ recordId, data: updatePayload });
  };

  if (isLoading) return <div className="p-8 space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-64 w-full" /></div>;
  if (!person) return <div className="p-8 text-center text-red-500 font-bold">المستفيد غير موجود</div>;

  const allDrugsReady = person.records.length > 0 && person.records.every(r => r.ready);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm font-medium text-muted-foreground mb-4 overflow-x-auto whitespace-nowrap">
        <Link href="/batches" className="hover:text-primary transition-colors">الدفعات</Link>
        <ArrowRight className="w-4 h-4 mx-2 shrink-0 rotate-180" />
        <Link href={`/batches/${person.batch_id}`} className="hover:text-primary transition-colors">{person.batch_name}</Link>
        <ArrowRight className="w-4 h-4 mx-2 shrink-0 rotate-180" />
        <span className="text-foreground font-bold">{person.full_name}</span>
      </div>

      {/* Header Profile */}
      <div className="bg-card rounded-3xl p-6 md:p-8 shadow-sm border border-border/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-start md:items-center gap-5">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${person.is_complete ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-primary/10 text-primary'}`}>
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
              {person.full_name}
              {person.is_complete && <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full flex items-center gap-1 font-bold"><CheckCircle2 className="w-4 h-4"/> مستلم</span>}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-muted-foreground font-medium text-sm">
              <span className="flex items-center gap-1.5"><Phone className="w-4 h-4"/> <span dir="ltr">{person.ph_number}</span></span>
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4"/> {person.location}</span>
              <span className="flex items-center gap-1.5"><Receipt className="w-4 h-4"/> {person.inv_number}</span>
            </div>
          </div>
        </div>

        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 min-w-[200px] text-center w-full md:w-auto">
          <p className="text-sm font-bold text-primary mb-1">إجمالي الفاتورة</p>
          <p className="text-3xl font-black text-primary">{person.total_cost.toLocaleString()} <span className="text-base">ج.م</span></p>
        </div>
      </div>

      {/* Drugs List */}
      <div className="bg-card rounded-3xl shadow-sm border border-border/50 overflow-hidden">
        <div className="p-6 border-b border-border/50 flex items-center gap-3">
          <Package className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-foreground">الأدوية المطلوبة ({person.records.length})</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-muted/30 text-muted-foreground border-b border-border/50">
              <tr>
                <th className="p-4 font-bold">اسم الدواء</th>
                <th className="p-4 font-bold">النوع</th>
                <th className="p-4 font-bold">السعر النهائي</th>
                <th className="p-4 font-bold w-[300px]">حالة التجهيز</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {person.records.map(record => (
                <tr key={record.record_id} className="hover:bg-muted/10 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-base text-foreground">{record.drug.ar_name}</p>
                    <p className="text-muted-foreground text-xs" dir="ltr">{record.drug.en_name}</p>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${record.drug.local_or_not ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      <Tag className="w-3 h-3" />
                      {record.drug.local_or_not ? 'محلي' : 'مستورد'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-black text-lg text-primary">{record.final_price} ج.م</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Button 
                        variant={record.ordered ? "default" : "outline"} 
                        size="sm" 
                        disabled={!isPharmacy || updateRecordMutation.isPending}
                        onClick={() => handleToggleStatus(record.record_id, 'ordered')}
                        className={`rounded-full px-3 sm:px-4 text-xs sm:text-sm font-bold ${record.ordered ? 'bg-red-500 hover:bg-red-600 shadow-sm shadow-red-500/20' : ''}`}
                      >
                        {record.ordered && <Check className="w-3 h-3 mr-1"/>} طُلب
                      </Button>
                      <div className={`h-0.5 w-4 sm:w-8 ${record.prepared ? 'bg-orange-500' : 'bg-border'}`}></div>
                      <Button 
                        variant={record.prepared ? "default" : "outline"} 
                        size="sm" 
                        disabled={!isPharmacy || updateRecordMutation.isPending}
                        onClick={() => handleToggleStatus(record.record_id, 'prepared')}
                        className={`rounded-full px-3 sm:px-4 text-xs sm:text-sm font-bold ${record.prepared ? 'bg-orange-500 hover:bg-orange-600 shadow-sm shadow-orange-500/20' : ''}`}
                      >
                        {record.prepared && <Check className="w-3 h-3 mr-1"/>} جُهِّز
                      </Button>
                      <div className={`h-0.5 w-4 sm:w-8 ${record.ready ? 'bg-green-500' : 'bg-border'}`}></div>
                      <Button 
                        variant={record.ready ? "default" : "outline"} 
                        size="sm" 
                        disabled={!isPharmacy || updateRecordMutation.isPending}
                        onClick={() => handleToggleStatus(record.record_id, 'ready')}
                        className={`rounded-full px-3 sm:px-4 text-xs sm:text-sm font-bold ${record.ready ? 'bg-green-500 hover:bg-green-600 shadow-sm shadow-green-500/20' : ''}`}
                      >
                        {record.ready && <Check className="w-3 h-3 mr-1"/>} جاهز
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Footer */}
      {isPharmacy && !person.is_complete && (
        <div className="bg-card p-6 rounded-3xl shadow-lg border border-border/50 sticky bottom-20 md:bottom-6 z-40 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">تأكيد تسليم الدواء</h3>
            <p className="text-muted-foreground text-sm">يجب أن تكون جميع الأدوية بحالة "جاهز" قبل التأكيد</p>
          </div>
          <Button 
            size="lg"
            disabled={!allDrugsReady || completeMutation.isPending}
            onClick={() => completeMutation.mutate({ personId })}
            className={`h-14 px-8 rounded-xl font-bold text-lg transition-all ${allDrugsReady ? 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/30 text-white hover:-translate-y-1' : 'bg-muted text-muted-foreground'}`}
          >
            <CheckCircle2 className="w-6 h-6 ml-2" />
            {completeMutation.isPending ? 'جاري التأكيد...' : 'تسجيل الاستلام'}
          </Button>
        </div>
      )}
    </div>
  );
}
