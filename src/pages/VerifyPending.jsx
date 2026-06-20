import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import { toast } from "@/components/ui/use-toast";

export default function VerifyPending() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email") || "";
  const username = searchParams.get("username") || "";

  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      // Set username and email_verified after login
      try {
        await base44.auth.updateMe({
          username: username || undefined,
          email_verified: true,
          avatar: username
            ? `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(username)}`
            : undefined,
        });
      } catch (e) {
        // Non-critical if updateMe fails
      }
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "验证码无效");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({ title: "验证邮件已重新发送", description: "请检查您的邮箱" });
    } catch (err) {
      setError(err.message || "重新发送失败");
    }
  };

  return (
    <AuthLayout
      icon={Mail}
      title="验证您的邮箱"
      subtitle={`验证邮件已发送至 ${email}，请检查邮箱`}
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <p className="text-sm text-muted-foreground text-center mb-6">
        输入您收到的6位验证码
      </p>

      <div className="flex justify-center mb-6">
        <InputOTP
          maxLength={6}
          value={otpCode}
          onChange={setOtpCode}
          autoFocus
          autoComplete="one-time-code"
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      <Button
        className="w-full h-12 font-medium"
        onClick={handleVerify}
        disabled={loading || otpCode.length < 6}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            验证中...
          </>
        ) : (
          "验证"
        )}
      </Button>

      <div className="flex items-center justify-between mt-4 text-sm">
        <Link to="/login" className="text-muted-foreground hover:text-foreground">
          返回登录
        </Link>
        <button onClick={handleResend} className="text-primary font-medium hover:underline">
          重新发送验证邮件
        </button>
      </div>
    </AuthLayout>
  );
}