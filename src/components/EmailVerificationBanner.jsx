import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/use-toast";
import { MailWarning } from "lucide-react";

export default function EmailVerificationBanner({ user }) {
  const [sending, setSending] = useState(false);

  if (!user || user.email_verified) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      const res = await base44.functions.invoke("resendVerification");
      if (res.data.already_verified) {
        toast({ title: "您的邮箱已验证" });
      } else if (res.data.success) {
        toast({ title: "验证邮件已发送，请查收" });
      } else {
        toast({ title: res.data.error || "发送失败", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "发送失败，请稍后重试", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-amber-800">
        <MailWarning className="h-4 w-4 shrink-0" />
        <span>请验证您的邮箱才能发帖和评论</span>
        <button
          onClick={handleResend}
          disabled={sending}
          className="ml-2 text-primary font-medium hover:underline disabled:opacity-50"
        >
          {sending ? "发送中..." : "重新发送验证邮件"}
        </button>
      </div>
    </div>
  );
}