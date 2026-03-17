"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Lock, User, Eye, EyeOff, Pill } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await loginApi(email, password);
      login(res.data);
      router.push("/batches");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr?.response?.data?.detail || "حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-3/5 relative bg-gradient-to-br from-[#1D6FA4] via-[#1a5f8e] to-[#0d3d5e] flex-col items-center justify-center p-12 text-white">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative text-center space-y-8">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Pill className="w-9 h-9 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-2">صيدلية السعوي</h1>
            <div className="w-16 h-1 bg-white/40 mx-auto rounded-full my-4" />
            <h2 className="text-2xl font-semibold text-blue-100">مؤسسة هيومنيتي</h2>
          </div>
          <p className="text-blue-200 text-lg max-w-sm mx-auto leading-relaxed">
            نظام إدارة دفعات الأدوية — مشترك وفعّال
          </p>
          <div className="grid grid-cols-3 gap-4 mt-12">
            {["إدارة الدفعات", "متابعة الأدوية", "تقارير فورية"].map((item) => (
              <div key={item} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center text-sm font-medium">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Pill className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-text-primary">صيدلية السعوي × هيومنيتي</h1>
          </div>

          <div className="card p-8">
            <h2 className="text-2xl font-bold text-text-primary mb-2">تسجيل الدخول</h2>
            <p className="text-text-secondary text-sm mb-8">أدخل بياناتك للوصول إلى النظام</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">البريد الإلكتروني</label>
                <div className="relative">
                  <input
                    className="input pr-10"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    dir="ltr"
                  />
                  <User className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-text-secondary" />
                </div>
              </div>

              <div>
                <label className="label">كلمة المرور</label>
                <div className="relative">
                  <input
                    className="input pr-10 pl-10"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    dir="ltr"
                  />
                  <Lock className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-text-secondary" />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute top-1/2 -translate-y-1/2 left-3 text-text-secondary hover:text-primary transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-danger rounded-lg px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-base mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    جارٍ الدخول...
                  </span>
                ) : "دخول"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
