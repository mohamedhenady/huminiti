import { useState } from "react";
import { useRoute, Link } from "wouter";
import { 
  useGetBatch, useUpdateBatch, useGetBatchPersons, useImportBatchData,
  getGetBatchQueryKey, getGetBatchPersonsQueryKey, getGetStatsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useDebounce } from "@/hooks/use-debounce";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { 
  ArrowRight, Search, FileSpreadsheet, Plus, Upload, CheckCircle2, 
  CircleDashed, MapPin, Phone, Receipt, User, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export default function BatchDetails() {
  const [, params] = useRoute("/batches/:id");
  const batchId = parseInt(params?.id || "0");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isPharmacy = user?.role === "pharmacy";

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [filter, setFilter] = useState<"all" | "complete" | "incomplete">("all");

  const { data: batch, isLoading: batchLoading } = useGetBatch(batchId, { query: { enabled: !!batchId } });
  const { data: personsRes, isLoading: personsLoading } = useGetBatchPersons(batchId, 
    { search: debouncedSearch, filter: filter },
    { query: { enabled: !!batchId } }
  );

  const updateBatchMutation = useUpdateBatch({
    mutation: {
      onSuccess: () => {
        toast.success("تم تحديث حالة الدفعة");
        queryClient.invalidateQueries({ queryKey: getGetBatchQueryKey(batchId) });
      }
    }
  });

  // Excel Import Logic
  const [isImportOpen, setIsImportOpen] = useState(false);
  const importMutation = useImportBatchData({
    mutation: {
      onSuccess: (res) => {
        toast.success(`تم استيراد ${res.imported_count} سجل بنجاح`);
        setIsImportOpen(false);
        queryClient.invalidateQueries({ queryKey: getGetBatchQueryKey(batchId) });
        queryClient.invalidateQueries({ queryKey: getGetBatchPersonsQueryKey(batchId) });
      },
      onError: () => toast.error("حدث خطأ في الاستيراد. تأكد من مطابقة أعمدة الإكسل.")
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        
        if (data.length > 0) {
          importMutation.mutate({ batchId, data: { data: data as any } });
        } else {
          toast.error("الملف فارغ");
        }
      } catch (err) {
        toast.error("فشل في قراءة الملف");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ""; // reset
  };

  const progress = batch ? (batch.persons_count === 0 ? 0 : (batch.complete_count / batch.persons_count) * 100) : 0;

  if (batchLoading) return <div className="p-8 space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-40 w-full" /></div>;
  if (!batch) return <div className="p-8 text-center text-red-500 font-bold">الدفعة غير موجودة</div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Breadcrumb & Header */}
      <div className="flex items-center text-sm font-medium text-muted-foreground mb-2">
        <Link href="/batches" className="hover:text-primary transition-colors">الدفعات</Link>
        <ArrowRight className="w-4 h-4 mx-2 rotate-180" />
        <span className="text-foreground">{batch.batch_name}</span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl shadow-sm border border-border/50">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
            {batch.batch_name}
            <span className={`px-3 py-1 rounded-lg text-sm font-bold ${batch.is_complete ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
              {batch.is_complete ? 'مكتملة' : 'جارية'}
            </span>
          </h1>
        </div>
        {isPharmacy && (
          <div className="flex gap-3 w-full md:w-auto">
            <Button 
              variant="outline" 
              className="flex-1 md:flex-none border-2 font-bold"
              onClick={() => updateBatchMutation.mutate({ batchId, data: { is_complete: !batch.is_complete } })}
            >
              {batch.is_complete ? 'إعادة فتح الدفعة' : 'إنهاء الدفعة'}
            </Button>
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1 md:flex-none bg-[#217346] hover:bg-[#1e613b] text-white shadow-lg font-bold border-0">
                  <FileSpreadsheet className="w-4 h-4 ml-2" /> استيراد إكسل
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">استيراد بيانات المستفيدين</DialogTitle>
                </DialogHeader>
                <div className="p-8 border-2 border-dashed border-primary/30 rounded-2xl text-center hover:bg-primary/5 transition-colors relative cursor-pointer group mt-4">
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} disabled={importMutation.isPending} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  <Upload className="w-12 h-12 text-primary mx-auto mb-4 group-hover:-translate-y-1 transition-transform" />
                  <h3 className="font-bold text-lg mb-2">{importMutation.isPending ? "جاري الاستيراد..." : "اسحب وأفلت ملف الإكسل هنا"}</h3>
                  <p className="text-muted-foreground text-sm">يجب أن يحتوي الملف على أعمدة (الاسم، الهاتف، الخ)</p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50">
          <h3 className="text-muted-foreground font-semibold mb-4 text-sm">معدل الإنجاز</h3>
          <div className="flex justify-between items-end mb-2">
            <span className="text-3xl font-black text-primary">{Math.round(progress)}%</span>
            <span className="text-sm font-bold text-muted-foreground mb-1">{batch.complete_count} من {batch.persons_count}</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50">
          <h3 className="text-muted-foreground font-semibold mb-2 text-sm">التكلفة الإجمالية (قبل الخصم)</h3>
          <p className="text-3xl font-black text-foreground">{batch.total_cost_before.toLocaleString()} <span className="text-base text-muted-foreground font-semibold">ج.م</span></p>
        </div>
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 bg-primary/5 border-primary/20">
          <h3 className="text-primary font-bold mb-2 text-sm">التكلفة الصافية (بعد الخصم)</h3>
          <p className="text-3xl font-black text-primary">{batch.total_cost_after.toLocaleString()} <span className="text-base font-semibold">ج.م</span></p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card p-4 rounded-2xl shadow-sm border border-border/50">
        <Tabs defaultValue="all" value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full sm:w-auto" dir="rtl">
          <TabsList className="h-12 w-full sm:w-auto bg-muted/50 p-1">
            <TabsTrigger value="all" className="font-bold text-sm px-6 h-10 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">الكل</TabsTrigger>
            <TabsTrigger value="incomplete" className="font-bold text-sm px-6 h-10 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-orange-600">قيد التجهيز</TabsTrigger>
            <TabsTrigger value="complete" className="font-bold text-sm px-6 h-10 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-green-600">تم التسليم</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="بحث بالاسم أو رقم الفاتورة..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-4 pr-10 h-12 rounded-xl bg-muted/20 border-border/50 focus-visible:ring-primary/20"
          />
        </div>
      </div>

      {/* Persons List */}
      {personsLoading ? (
        <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div>
      ) : personsRes?.persons.length === 0 ? (
        <div className="py-12 text-center bg-card rounded-2xl border border-border/50">
          <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="font-bold text-lg text-muted-foreground">لا يوجد مستفيدين مطابقين للبحث</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {personsRes?.persons.map(person => (
            <Link key={person.person_id} href={`/persons/${person.person_id}`}>
              <div className="bg-card hover:bg-primary/5 border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${person.is_complete ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground line-clamp-1">{person.full_name}</h4>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Receipt className="w-3 h-3" /> {person.inv_number}
                      </div>
                    </div>
                  </div>
                  {person.is_complete ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                  ) : (
                    <Clock className="w-6 h-6 text-orange-400 shrink-0" />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4 text-sm bg-muted/30 p-3 rounded-xl">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground mb-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> العنوان</span>
                    <span className="font-semibold line-clamp-1" title={person.location}>{person.location}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground mb-1 flex items-center gap-1"><Phone className="w-3 h-3"/> الهاتف</span>
                    <span className="font-semibold" dir="ltr">{person.ph_number}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-border/50">
                  <div className="flex items-center gap-3 rtl:flex-row-reverse text-sm font-bold" dir="ltr">
                    <span className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-1 rounded-lg" title="طُلب">
                      <CircleDashed className="w-4 h-4"/> {person.ordered_count}
                    </span>
                    <span className="flex items-center gap-1 bg-orange-50 text-orange-600 px-2 py-1 rounded-lg" title="جُهِّز">
                      <CircleDashed className="w-4 h-4"/> {person.prepared_count}
                    </span>
                    <span className="flex items-center gap-1 bg-green-50 text-green-600 px-2 py-1 rounded-lg" title="جاهز">
                      <CheckCircle2 className="w-4 h-4"/> {person.ready_count}
                    </span>
                  </div>
                  
                  <div className="text-left">
                    <span className="text-primary font-black text-lg">{person.total_cost.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground mr-1">ج.م</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
