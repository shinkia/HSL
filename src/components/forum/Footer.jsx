import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Site name + tagline */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="/logo.png" alt="Hamsaplou" className="h-9 w-auto" />
              <span className="font-heading font-semibold text-lg">Hamsaplou</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Hamsaplou 社区论坛 — 连接邻里，分享生活。
            </p>
          </div>

          {/* Column 2: About links */}
          <div>
            <h3 className="text-sm font-semibold mb-3">关于</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground transition-colors">关于我们</Link></li>
              <li><Link to="/contact" className="hover:text-foreground transition-colors">联系我们</Link></li>
              <li><Link to="/terms" className="hover:text-foreground transition-colors">使用条款</Link></li>
              <li><Link to="/privacy" className="hover:text-foreground transition-colors">隐私政策</Link></li>
            </ul>
          </div>

          {/* Column 3: Community links */}
          <div>
            <h3 className="text-sm font-semibold mb-3">社区</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/categories" className="hover:text-foreground transition-colors">全部分类</Link></li>
              <li><Link to="/tags" className="hover:text-foreground transition-colors">全部标签</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-6 text-center text-xs text-muted-foreground">
          © 2026 Hamsaplou. All rights reserved.
        </div>
      </div>
    </footer>
  );
}