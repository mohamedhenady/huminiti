import { useState } from "react";
import { useGetDrugs, useCreateDrug, useDeleteDrug, getGetDrugsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";
import { Pill, Plus, Search, Trash2, Tag, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

const drugSchema = z.object({
  ar_name: z.string().min(1, "الاسم العربي مطلوب"),
  en_name: z.string().min(1, "الاسم الإنجليزي مطلوب"),
  price: z.coerce.number().min(0.01, "السعر يجب أن يكون أكبر من 0"),
  local_or_not: z.boolean()
});

type DrugFormValues = z.infer<typeof drugSchema>;

export default function Drugs() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [filter, setFilter] = useState<"all" | "local" | "imported">("all");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: drugsRes, isLoading } = useGetDrugs({ search: debouncedSearch, filter });

  const createMutation = useCreateDrug({
    mutation: {
      onSuccess: () => {
        toast.success("تم إضافة الدواء بنجاح");
        setIsAddOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: getGetDrugsQueryKey() });
      }
    }
  });

  const deleteMutation = useDeleteDrug({
    mutation: {
      onSuccess: () => {
        toast.success("تم حذف الدواء");
        queryClient.invalidateQueries({ queryKey: getGetDrugsQueryKey() });
      }
    }
  });

  const form = useForm<DrugFormValues>({
    resolver: zodResolver(drugSchema),
    defaultValues: { ar_name: "", en_name: "", price: 0, local_or_not: true },
  });

  const onSubmit = (data: DrugFormValues) => {
    createMutation.mutate({ data });
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا الدواء؟")) {
      deleteMutation.mutate({ drugId: id });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
            قاموس الأدوية
          </h1>
          <p className="text-muted-foreground mt-1">إدارة قائمة الأدوية وأسعارها وتصنيفها</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 px-6 rounded-xl bg-primary shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all text-base font-bold">
              <Plus className="w-5 h-5 ml-2" />
              إضافة دواء
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">دواء جديد</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField control={form.control} name="ar_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم بالعربية</FormLabel>
                    <FormControl><Input {...field} className="h-12 rounded-xl" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="en_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم بالإنجليزية</FormLabel>
                    <FormControl><Input {...field} dir="ltr" className="h-12 rounded-xl text-left" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>السعر الأساسي (ج.م)</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} className="h-12 rounded-xl" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="local_or_not" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/50 p-4 bg-muted/20">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-bold">دواء محلي</FormLabel>
                      <p className="text-sm text-muted-foreground">تحديد ما إذا كان الدواء محلي (خصم ٢٠٪) أم مستورد (خصم ١٠٪)</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}/>
                <Button type="submit" disabled={createMutation.isPending} className="w-full h-12 text-lg font-bold rounded-xl mt-4">
                  {createMutation.isPending ? "جاري الحفظ..." : "حفظ الدواء"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card p-4 rounded-2xl shadow-sm border border-border/50">
        <Tabs defaultValue="all" value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full sm:w-auto" dir="rtl">
          <TabsList className="h-12 w-full sm:w-auto bg-muted/50 p-1">
            <TabsTrigger value="all" className="font-bold text-sm px-6 h-10 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">الكل</TabsTrigger>
            <TabsTrigger value="local" className="font-bold text-sm px-6 h-10 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-green-600">محلي</TabsTrigger>
            <TabsTrigger value="imported" className="font-bold text-sm px-6 h-10 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-blue-600">مستورد</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="relative w-full sm:w-80">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="بحث في الأدوية..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-4 pr-10 h-12 rounded-xl bg-muted/20 border-border/50"
          />
        </div>
      </div>

      <div className="bg-card rounded-3xl shadow-sm border border-border/50 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
        ) : drugsRes?.drugs.length === 0 ? (
           <div className="p-16 text-center text-muted-foreground">
             <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
             <p className="font-bold text-lg">لا توجد أدوية مطابقة للبحث</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-muted/50 text-muted-foreground border-b border-border/50">
                <tr>
                  <th className="p-4 px-6 font-bold">الاسم (عربي)</th>
                  <th className="p-4 font-bold">الاسم (إنجليزي)</th>
                  <th className="p-4 font-bold text-center">النوع</th>
                  <th className="p-4 font-bold">السعر الأساسي</th>
                  <th className="p-4 px-6 font-bold text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {drugsRes?.drugs.map(drug => (
                  <tr key={drug.drug_id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4 px-6 font-bold text-base">{drug.ar_name}</td>
                    <td className="p-4 text-muted-foreground font-medium" dir="ltr">{drug.en_name}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${drug.local_or_not ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        <Tag className="w-3 h-3" />
                        {drug.local_or_not ? 'محلي (-٢٠٪)' : 'مستورد (-١٠٪)'}
                      </span>
                    </td>
                    <td className="p-4 font-black text-primary text-lg">{drug.price} <span className="text-xs font-semibold text-muted-foreground">ج.م</span></td>
                    <td className="p-4 px-6 text-left">
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 rounded-full" onClick={() => handleDelete(drug.drug_id)}>
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
