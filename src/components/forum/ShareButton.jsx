import React, { useState } from "react";
import { Share2, X, Link2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/use-toast";
import { WhatsAppIcon, TelegramIcon, WeChatIcon, WeiboIcon } from "./BrandIcons";

export default function ShareButton({ post }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const shareUrl = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";
  const shareText = post?.title || "";
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(shareText);

  const trackShare = async () => {
    try {
      await base44.functions.invoke("trackShare", { post_id: post.id });
    } catch (e) {}
  };

  const handleMobileClick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareText, url: shareUrl });
        trackShare();
        return;
      } catch (e) {
        // Fall through to open drawer (user cancelled or error)
      }
    }
    setOpen(true);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "链接已复制" });
    } catch (e) {
      toast({ title: "复制失败" });
    }
    trackShare();
    setOpen(false);
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`, "_blank");
    trackShare();
    setOpen(false);
  };

  const shareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`, "_blank");
    trackShare();
    setOpen(false);
  };

  const shareWeibo = () => {
    window.open(`https://service.weibo.com/share/share.php?url=${encodedUrl}&title=${encodedTitle}`, "_blank");
    trackShare();
    setOpen(false);
  };

  const shareWeChat = () => {
    if (isMobile) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast({ title: "请粘贴到微信" });
      }).catch(() => {
        toast({ title: "复制失败" });
      });
      trackShare();
      setOpen(false);
    } else {
      setQrOpen(true);
      trackShare();
      setOpen(false);
    }
  };

  const shareOptions = (
    <div className="w-full">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="font-medium text-sm">分享到</span>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground p-1">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-1">
        <ShareOption icon={Link2} label="复制链接" onClick={copyLink} />
        <ShareOption icon={WhatsAppIcon} label="WhatsApp" onClick={shareWhatsApp} iconColor="text-green-500" />
        <ShareOption icon={TelegramIcon} label="Telegram" onClick={shareTelegram} iconColor="text-blue-500" />
        <ShareOption icon={WeChatIcon} label="微信" onClick={shareWeChat} iconColor="text-green-500" />
        <ShareOption icon={WeiboIcon} label="微博" onClick={shareWeibo} iconColor="text-red-500" />
      </div>
    </div>
  );

  const buttonClass = "flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition-colors";
  const buttonContent = (
    <>
      <Share2 className="h-3.5 w-3.5" />
      <span>分享</span>
    </>
  );

  return (
    <>
      {isMobile ? (
        <>
          <button onClick={handleMobileClick} className={buttonClass}>
            {buttonContent}
          </button>
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerContent>
              <div className="px-2 pb-4">
                {shareOptions}
              </div>
            </DrawerContent>
          </Drawer>
        </>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button className={buttonClass}>
              {buttonContent}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0" align="end">
            {shareOptions}
          </PopoverContent>
        </Popover>
      )}

      {/* WeChat QR code modal (desktop only) */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>扫码在微信中打开</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}`}
              alt="QR Code"
              className="w-48 h-48"
            />
            <p className="text-sm text-muted-foreground mt-3">使用微信扫一扫</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ShareOption({ icon: Icon, label, onClick, iconColor }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
    >
      <span className={iconColor}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}