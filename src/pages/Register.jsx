import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, Mail, Lock, User, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";
import HoneypotField from "@/components/HoneypotField";

// reCAPTCHA v3 scaffold — loads script if VITE_RECAPTCHA_SITE_KEY is set
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  useEffect(() => {
    if (RECAPTCHA_SITE_KEY) {
      const script = document.createElement("script");
      script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  const getRecaptchaToken = async () => {
    if (RECAPTCHA_SITE_KEY && window.grecaptcha) {
      try {
        return await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: "register" });
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Honeypot check — silently return success to bot
    if (honeypot) {
      toast({ title: "注册成功，欢迎加入邻里荟" });
      window.location.href = "/";
      return;
    }

    if (username.length < 3 || username.length > 20) {
      setError("用户名长度需为3-20个字符");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("用户名只能包含字母、数字和下划线");
      return;
    }
    if (password.length < 8) {
      setError("密码至少8个字符");
      return;
    }
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }
    if (!agreeTerms) {
      setError("请同意使用条款");
      return;
    }

    setLoading(true);
    try {
      // Pre-registration check (rate limit, suspicious username, reCAPTCHA)
      const recaptchaToken = await getRecaptchaToken();
      const checkRes = await base44.functions.invoke("checkRegistration", {
        username,
        honeypot,
        recaptcha_token: recaptchaToken,
      });
      if (checkRes.data.honeypot_caught) {
        toast({ title: "注册成功，欢迎加入邻里荟" });
        window.location.href = "/";
        return;
      }
      if (!checkRes.data.allowed) {
        setError(checkRes.data.error || "注册失败");
        return;
      }

      await base44.auth.register({ email, password });
      try {
        await base44.auth.loginViaEmailPassword(email, password);
        await base44.auth.updateMe({
          username,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username)}`,
        });
        // Send verification email (auto-verifies if email service fails)
        await base44.functions.invoke("sendVerificationEmail");
      } catch (loginErr) {
        navigate("/login");
        return;
      }
      toast({ title: "注册成功，请验证邮箱" });
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "注册失败");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/");
  };

  return (
    <AuthLayout
      icon={UserPlus}
      title="创建账号"
      subtitle="加入邻里荟社区"
      footer={
        <>
          已有账号？{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            登录
          </Link>
        </>
      }
    >
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-6"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        使用Google登录
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">或</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">用户名</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="username"
              type="text"
              autoFocus
              placeholder="3-20个字符，字母数字下划线"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">邮箱</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">密码</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="至少8个字符"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">确认密码</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="再次输入密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Checkbox
            id="terms"
            checked={agreeTerms}
            onCheckedChange={setAgreeTerms}
            className="mt-0.5"
          />
          <Label htmlFor="terms" className="text-sm font-normal cursor-pointer leading-relaxed">
            我已阅读并同意{" "}
            <Link to="/terms" className="text-primary hover:underline">使用条款</Link>
            {" "}和{" "}
            <Link to="/privacy" className="text-primary hover:underline">隐私政策</Link>
          </Label>
        </div>
        <HoneypotField value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              创建中...
            </>
          ) : (
            "创建账号"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}