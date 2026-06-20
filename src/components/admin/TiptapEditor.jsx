import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Link } from "@tiptap/extension-link";
import { Placeholder } from "@tiptap/extension-placeholder";
import { CustomImage } from "./CustomImageExtension";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered,
  Link as LinkIcon, Image as ImageIcon, Undo, Redo, Loader2,
} from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";

export default function TiptapEditor({ value, onChange }) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const lastHtmlRef = useRef(value || "");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "开始编写内容... 点击工具栏图片按钮插入图片" }),
      CustomImage,
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastHtmlRef.current = html;
      onChange(html);
    },
  });

  // Sync external content changes (e.g. loading an existing post) without resetting cursor on internal edits
  useEffect(() => {
    if (!editor) return;
    if (value !== lastHtmlRef.current) {
      lastHtmlRef.current = value || "";
      editor.commands.setContent(value || "", false);
    }
  }, [value, editor]);

  const failedFileRef = useRef(null);

  const handleImageUpload = useCallback(async (file) => {
    if (!file || !editor) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      editor.chain().focus().setImage({ src: file_url, width: "100%" }).run();
      toast({ title: "上传成功" });
      failedFileRef.current = null;
    } catch (err) {
      failedFileRef.current = file;
      toast({
        title: "上传失败，请重试",
        variant: "destructive",
        action: (
          <ToastAction altText="重试" onClick={() => handleImageUpload(failedFileRef.current)}>
            重试
          </ToastAction>
        ),
      });
    } finally {
      setUploading(false);
    }
  }, [editor, toast]);

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
    e.target.value = "";
  };

  const setLink = () => {
    const url = window.prompt("链接 URL");
    if (url === null) return;
    if (url === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  if (!editor) return null;

  const Btn = ({ onClick, isActive, disabled, children, title }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2.5 rounded transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center ${
        isActive ? "bg-primary/15 text-primary" : "text-gray-600 hover:bg-muted"
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center gap-1 flex-wrap p-2 border-b bg-muted/30">
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} title="加粗">
          <Bold className="h-4 w-4" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} title="斜体">
          <Italic className="h-4 w-4" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive("heading", { level: 2 })} title="标题2">
          <Heading2 className="h-4 w-4" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive("heading", { level: 3 })} title="标题3">
          <Heading3 className="h-4 w-4" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} title="无序列表">
          <List className="h-4 w-4" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} title="有序列表">
          <ListOrdered className="h-4 w-4" />
        </Btn>
        <Btn onClick={setLink} isActive={editor.isActive("link")} title="链接">
          <LinkIcon className="h-4 w-4" />
        </Btn>
        <Btn onClick={() => fileInputRef.current?.click()} disabled={uploading} title="上传图片">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
        </Btn>
        <div className="w-px h-6 bg-border mx-1" />
        <Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="撤销">
          <Undo className="h-4 w-4" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="重做">
          <Redo className="h-4 w-4" />
        </Btn>
      </div>
      <EditorContent editor={editor} className="tiptap-content" />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
    </div>
  );
}