import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Search } from "lucide-react";

function CharCounter({ value, max }) {
  const len = (value || "").length;
  const color = len > max ? "text-destructive" : len > max * 0.8 ? "text-amber-500" : "text-muted-foreground";
  return <span className={`text-xs ${color}`}>{len}/{max}</span>;
}

export default function SeoPanel({ data, onChange }) {
  const update = (field, value) => onChange({ ...data, [field]: value });

  return (
    <div className="space-y-4 border rounded-xl p-5 bg-card">
      <div className="flex items-center gap-2 mb-2">
        <Search className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">SEO 设置</h3>
      </div>

      {/* Basic SEO */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label className="text-xs">SEO 标题</Label>
            <CharCounter value={data.seo_title} max={60} />
          </div>
          <Input
            value={data.seo_title || ""}
            onChange={(e) => update("seo_title", e.target.value)}
            placeholder="搜索引擎显示的标题"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label className="text-xs">Meta 描述</Label>
            <CharCounter value={data.meta_description} max={160} />
          </div>
          <Textarea
            value={data.meta_description || ""}
            onChange={(e) => update("meta_description", e.target.value)}
            placeholder="搜索结果中显示的描述"
            rows={2}
            className="resize-none"
          />
        </div>

        <div>
          <Label className="text-xs mb-1.5 block">焦点关键词</Label>
          <Input
            value={data.focus_keyword || ""}
            onChange={(e) => update("focus_keyword", e.target.value)}
            placeholder="主要目标关键词"
          />
        </div>
      </div>

      {/* Open Graph */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium">
          Open Graph 设置
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <div>
            <Label className="text-xs mb-1.5 block">OG 标题</Label>
            <Input value={data.og_title || ""} onChange={(e) => update("og_title", e.target.value)} placeholder="社交分享标题" />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">OG 描述</Label>
            <Textarea value={data.og_description || ""} onChange={(e) => update("og_description", e.target.value)} placeholder="社交分享描述" rows={2} className="resize-none" />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">OG 图片 URL</Label>
            <Input value={data.og_image || ""} onChange={(e) => update("og_image", e.target.value)} placeholder="https://..." />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Twitter Card */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium">
          Twitter Card 设置
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <div>
            <Label className="text-xs mb-1.5 block">Twitter 标题</Label>
            <Input value={data.twitter_title || ""} onChange={(e) => update("twitter_title", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">Twitter 描述</Label>
            <Textarea value={data.twitter_description || ""} onChange={(e) => update("twitter_description", e.target.value)} rows={2} className="resize-none" />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">Twitter 图片 URL</Label>
            <Input value={data.twitter_image || ""} onChange={(e) => update("twitter_image", e.target.value)} />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Advanced */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium">
          高级设置
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <div>
            <Label className="text-xs mb-1.5 block">Canonical URL</Label>
            <Input value={data.canonical_url || ""} onChange={(e) => update("canonical_url", e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">Schema 类型</Label>
            <Select value={data.schema_type || "Article"} onValueChange={(v) => update("schema_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Article">Article</SelectItem>
                <SelectItem value="BlogPosting">BlogPosting</SelectItem>
                <SelectItem value="WebPage">WebPage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Noindex</Label>
            <Switch checked={data.noindex || false} onCheckedChange={(v) => update("noindex", v)} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Nofollow</Label>
            <Switch checked={data.nofollow || false} onCheckedChange={(v) => update("nofollow", v)} />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}