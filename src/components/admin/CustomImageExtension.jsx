import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ResizableImage from "./ResizableImage";

export const CustomImage = Image.extend({
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: {
        default: "100%",
        renderHTML: (attrs) => {
          if (!attrs.width) return {};
          return { style: `width: ${attrs.width}` };
        },
        parseHTML: (el) => {
          const style = el.getAttribute("style") || "";
          const match = style.match(/width:\s*([^;]+)/);
          return match ? match[1].trim() : "100%";
        },
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImage);
  },
});