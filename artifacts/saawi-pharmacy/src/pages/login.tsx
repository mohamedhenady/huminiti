import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLogin } from "@workspace/api-client-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Lock, Eye, EyeOff, Pill, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { motion } from "framer-motion";

const loginSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        login(data);
        setLocation("/batches");
      },
      onError: (err: any) => {
        setErrorMsg(err.error || "بيانات الدخول غير صحيحة");
      }
    }
  });

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = (data: LoginFormValues) => {
    setErrorMsg("");
    loginMutation.mutate({ data });
  };

  return (
    <div className="min-h-screen w-full flex bg-background" dir="rtl">
      {/* Visual Left Side (hidden on mobile) */}
      <div className="hidden lg:flex w-[60%] relative bg-primary items-center justify-center overflow-hidden">
        <img 
          src={`${import.meta.env.BASE_URL}images/medical-bg.png`} 
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50" 
          alt="Medical Background" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2, duration: 0.8 }}
          className="z-10 text-center text-primary-foreground max-w-lg px-8"
        >
          <div className="bg-white/20 p-6 rounded-3xl backdrop-blur-md inline-block mb-8 shadow-2xl">
            <Pill className="w-20 h-20 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold mb-4 leading-tight">نظام إدارة دفعات الأدوية</h1>
          <p className="text-lg opacity-90 leading-relaxed">
            المنصة المتكاملة لإدارة صرف وتجهيز الأدوية بالتعاون بين صيدلية السعوي والمؤسسة الإنسانية.
          </p>
        </motion.div>
      </div>

      {/* Form Right Side */}
      <div className="w-full lg:w-[40%] flex items-center justify-center p-8 sm:p-12 relative bg-card shadow-2xl z-10">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          className="w-full max-w-sm"
        >
          <div className="lg:hidden flex justify-center mb-8">
            <div className="bg-primary/10 p-4 rounded-2xl text-primary">
              <Pill className="w-12 h-12" />
            </div>
          </div>
          
          <div className="text-center lg:text-right mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-2">تسجيل الدخول</h2>
            <p className="text-muted-foreground">أدخل بيانات الاعتماد للمتابعة</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                        <Input 
                          {...field} 
                          placeholder="اسم المستخدم" 
                          className="pl-4 pr-12 h-14 rounded-xl border-2 focus-visible:ring-primary/20 text-base"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                        <Input 
                          {...field} 
                          type={showPassword ? "text" : "password"} 
                          placeholder="كلمة المرور" 
                          className="pl-12 pr-12 h-14 rounded-xl border-2 focus-visible:ring-primary/20 text-base"
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {errorMsg && (
                <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="font-medium">{errorMsg}</p>
                </div>
              )}

              <Button 
                type="submit" 
                disabled={loginMutation.isPending}
                className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                {loginMutation.isPending ? "جاري الدخول..." : "دخول"}
              </Button>
            </form>
          </Form>
        </motion.div>
      </div>
    </div>
  );
}
