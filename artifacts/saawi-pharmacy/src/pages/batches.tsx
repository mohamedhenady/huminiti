import { useState } from "react";
import { Link } from "wouter";
import { useGetBatches, useGetStats, useCreateBatch, getGetBatchesQueryKey, getGetStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Plus, Download, Package, CheckCircle2, CircleDashed, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

export default function Batches() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isPharmacy = user?.role === "pharmacy";

  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: batchesRes, isLoading: batchesLoading } = useGetBatches();

  const [newBatchName, setNewBatchName] = useState("");
  const [isNewBatchOpen, setIsNewBatchOpen] = useState(false);

  const createBatchMutation = useCreateBatch({
    mutation: {
      onSuccess: () => {
        toast.success("تم إنشاء الدفعة بنجاح");
        setNewBatchName("");
        setIsNewBatchOpen(false);
        queryClient.invalidateQueries({ queryKey: getGetBatchesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
      },
      onError: () => toast.error("حدث خطأ أثناء إنشاء الدفعة")
    }
  });

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchName.trim()) return;
    createBatchMutation.mutate({ data: { batch_name: newBatchName } });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">إدارة الدفعات</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">تتبع حالة الدفعات ومعدلات الإنجاز</p>
        </div>
        
        {isPharmacy && (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Dialog open={isNewBatchOpen} onOpenChange={setIsNewBatchOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1 sm:flex-none h-12 px-6 rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all text-base font-bold">
                  <Plus className="w-5 h-5 ml-2" />
                  دفعة جديدة
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-2xl p-6 border-0 shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-primary mb-4">إنشاء دفعة جديدة</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateBatch} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">اسم الدفعة</label>
                    <Input 
                      placeholder="مثال: دفعة شهر أكتوبر ٢٠٢٣" 
                      value={newBatchName}
                      onChange={e => setNewBatchName(e.target.value)}
                      className="h-12 rounded-xl text-base border-2 focus-visible:ring-primary/20"
                      autoFocus
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={createBatchMutation.isPending || !newBatchName.trim()} 
                    className="w-full h-12 text-lg font-bold rounded-xl"
                  >
                    {createBatchMutation.isPending ? "جاري الإنشاء..." : "إنشاء الدفعة"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { title: "إجمالي الدفعات", value: stats?.total_batches || 0, icon: Package, color: "text-blue-500", bg: "bg-blue-50" },
          { title: "الدفعات الجارية", value: stats?.active_batches || 0, icon: CircleDashed, color: "text-orange-500", bg: "bg-orange-50" },
          { title: "الدفعات المكتملة", value: stats?.complete_batches || 0, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
          { title: "إجمالي المستفيدين", value: stats?.total_persons || 0, icon: Users, color: "text-purple-500", bg: "bg-purple-50" },
        ].map((stat, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={idx} 
            className="bg-card rounded-2xl p-5 md:p-6 shadow-sm border border-border/50 flex flex-col hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-muted-foreground text-sm md:text-base">{stat.title}</h3>
            </div>
            <p className="text-3xl md:text-4xl font-black text-foreground">{statsLoading ? "-" : stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Batches Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {batchesLoading ? (
          [1,2,3].map(i => <div key={i} className="h-64 bg-card rounded-2xl animate-pulse border border-border/50" />)
        ) : batchesRes?.batches.length === 0 ? (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-border/50 rounded-2xl bg-card">
            <Package className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">لا توجد دفعات حالياً</h3>
            <p className="text-muted-foreground mb-6">ابدأ بإنشاء دفعة جديدة لتسجيل المستفيدين والأدوية.</p>
          </div>
        ) : (
          batchesRes?.batches.map((batch, idx) => {
            const progress = batch.persons_count === 0 ? 0 : (batch.complete_count / batch.persons_count) * 100;
            return (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + (idx * 0.05) }}
                key={batch.batch_id} 
                className="bg-card rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-border/50 hover:shadow-xl hover:border-primary/20 transition-all duration-300 flex flex-col group"
              >
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-extrabold text-foreground line-clamp-2">{batch.batch_name}</h3>
                  <div className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold ${batch.is_complete ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {batch.is_complete ? 'مكتملة' : 'جارية'}
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div>
                    <div className="flex justify-between text-sm mb-2 font-medium">
                      <span className="text-muted-foreground">نسبة التسليم</span>
                      <span className="text-primary">{batch.complete_count} من {batch.persons_count} استلموا</span>
                    </div>
                    <Progress value={progress} className="h-2.5 bg-muted" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 font-medium">التكلفة قبل الخصم</p>
                      <p className="font-semibold text-foreground line-through decoration-muted-foreground/50">{batch.total_cost_before.toLocaleString()} ج.م</p>
                    </div>
                    <div>
                      <p className="text-xs text-primary mb-1 font-bold">التكلفة بعد الخصم</p>
                      <p className="font-extrabold text-primary text-lg">{batch.total_cost_after.toLocaleString()} ج.م</p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-2">
                  <Link href={`/batches/${batch.batch_id}`} className="w-full flex items-center justify-center h-12 bg-muted/50 hover:bg-primary hover:text-primary-foreground text-foreground font-bold rounded-xl transition-colors group/btn">
                    عرض التفاصيل
                    <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover/btn:-translate-x-1" />
                  </Link>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
