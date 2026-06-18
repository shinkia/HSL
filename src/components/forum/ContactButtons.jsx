import React from "react";
import { Phone, MessageCircle, Send, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ContactButtons({ post }) {
  const hasContact = post.contact_whatsapp || post.contact_phone || post.contact_telegram || post.contact_link;

  if (!hasContact) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">联系方式</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
        {post.contact_whatsapp && (
          <a
            href={`https://wa.me/${post.contact_whatsapp.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button
              className="w-full h-14 bg-[#25D366] hover:bg-[#20BD5A] text-white text-base gap-3 rounded-xl"
              size="lg"
            >
              <MessageCircle className="h-5 w-5" />
              WhatsApp 联系
            </Button>
          </a>
        )}

        {post.contact_phone && (
          <a href={`tel:${post.contact_phone}`} className="block">
            <Button
              variant="outline"
              className="w-full h-14 text-base gap-3 rounded-xl border-2"
              size="lg"
            >
              <Phone className="h-5 w-5" />
              {post.contact_phone}
            </Button>
          </a>
        )}

        {post.contact_telegram && (
          <a
            href={`https://t.me/${post.contact_telegram.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button
              className="w-full h-14 bg-[#0088cc] hover:bg-[#0077b5] text-white text-base gap-3 rounded-xl"
              size="lg"
            >
              <Send className="h-5 w-5" />
              Telegram 联系
            </Button>
          </a>
        )}

        {post.contact_link && (
          <a
            href={post.contact_link}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button
              variant="outline"
              className="w-full h-14 text-base gap-3 rounded-xl border-2"
              size="lg"
            >
              <ExternalLink className="h-5 w-5" />
              {post.contact_link_label || "了解更多"}
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}