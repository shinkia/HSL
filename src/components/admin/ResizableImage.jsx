import { NodeViewWrapper } from "@tiptap/react";
import { useState, useRef, useEffect } from "react";

export default function ResizableImage({ node, updateAttributes, selected }) {
  const { src, alt, width } = node.attrs;
  const [showAlt, setShowAlt] = useState(false);
  const [altValue, setAltValue] = useState(alt || "");
  const containerRef = useRef(null);
  const resizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  useEffect(() => {
    const handleMove = (e) => {
      if (!resizing.current || !containerRef.current) return;
      const parentWidth = containerRef.current.parentElement.offsetWidth;
      const diff = e.clientX - startX.current;
      const newPct = Math.max(20, Math.min(100, startWidth.current + (diff / parentWidth) * 100));
      updateAttributes({ width: newPct + "%" });
    };
    const handleUp = () => { resizing.current = false; };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [updateAttributes]);

  const startResize = (e) => {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = true;
    startX.current = e.clientX;
    startWidth.current = parseFloat(width) || 100;
  };

  return (
    <NodeViewWrapper style={{ display: "block", margin: "16px 0" }}>
      <div
        ref={containerRef}
        style={{ position: "relative", width: width || "100%", margin: "0 auto" }}
        onClick={(e) => { e.stopPropagation(); setShowAlt(!showAlt); }}
      >
        <img
          src={src}
          alt={alt || ""}
          style={{ display: "block", width: "100%", height: "auto", borderRadius: 8, cursor: "pointer" }}
        />
        {selected && (
          <div
            onMouseDown={startResize}
            style={{
              position: "absolute",
              bottom: -6,
              right: -6,
              width: 14,
              height: 14,
              background: "#3b82f6",
              border: "2px solid white",
              borderRadius: "50%",
              cursor: "nwse-resize",
              boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              zIndex: 10,
            }}
          />
        )}
      </div>
      {showAlt && (
        <input
          type="text"
          value={altValue}
          onChange={(e) => setAltValue(e.target.value)}
          onBlur={() => { updateAttributes({ alt: altValue }); }}
          placeholder="输入图片描述 (alt text)..."
          style={{
            width: "100%",
            marginTop: 6,
            padding: "6px 10px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: 13,
            outline: "none",
          }}
        />
      )}
    </NodeViewWrapper>
  );
}