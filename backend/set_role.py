from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

# إعدادات الاتصال
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or "placeholder" in key:
    print("❌ خطأ: يرجى وضع SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY في ملف backend/.env أولاً")
    exit()

supabase = create_client(url, key)

def set_user_role(email, role, name):
    # البحث عن المستخدم بالبريد الإلكتروني
    # ملاحظة: admin.list_users() تعيد قائمة بالمستخدمين
    users = supabase.auth.admin.list_users()
    target_user = next((u for u in users if u.email == email), None)
    
    if not target_user:
        print(f"❌ لم يتم العثور على مستخدم بالبريد: {email}")
        return

    # تحديث البيانات (Metadata)
    res = supabase.auth.admin.update_user_by_id(
        target_user.id,
        {
            "user_metadata": {
                "role": role,
                "full_name": name
            }
        }
    )
    print(f"✅ تم بنجاح! المستخدم {email} أصبح الآن بصلاحية: {role}")

if __name__ == "__main__":
    email_to_update = "ad@gmail.com"
    set_user_role(email_to_update, "pharmacy", "مدير النظام")
