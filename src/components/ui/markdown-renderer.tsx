import React from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Lightweight, safe Markdown renderer for PhishGuard educational articles.
 * Parses headings, bullet lists, ordered lists, inline bold/code, and callout tips.
 */
export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let inList = false;
  let listItems: React.ReactNode[] = [];
  let inOrderedList = false;
  let orderedItems: React.ReactNode[] = [];

  function flushList() {
    if (inList) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="space-y-2 my-3 pl-1">
          {listItems}
        </ul>
      );
      inList = false;
      listItems = [];
    }
    if (inOrderedList) {
      elements.push(
        <ol key={`ol-${elements.length}`} className="space-y-2 my-3 pl-1">
          {orderedItems}
        </ol>
      );
      inOrderedList = false;
      orderedItems = [];
    }
  }

  function renderInline(text: string): React.ReactNode {
    // Regex for bold **text**, code `code`, and links
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="font-extrabold text-[#1F2F3D] dark:text-[#F1F5F9]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 rounded-md font-mono text-[11px] bg-slate-100 dark:bg-slate-800 text-[#0B5FFF] font-semibold border border-slate-200 dark:border-slate-700"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  }

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      return;
    }

    // Heading 2 (##)
    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2
          key={index}
          className="text-base font-extrabold text-[#1F2F3D] dark:text-[#F1F5F9] mt-5 mb-2 tracking-tight flex items-center gap-2"
        >
          <span className="w-1.5 h-4 rounded-full bg-[#0B5FFF]" />
          <span>{line.replace(/^## /, "")}</span>
        </h2>
      );
      return;
    }

    // Heading 3 (###)
    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3
          key={index}
          className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9] mt-4 mb-1.5"
        >
          {line.replace(/^### /, "")}
        </h3>
      );
      return;
    }

    // Unordered List item (- or *)
    if (line.startsWith("- ") || line.startsWith("* ")) {
      if (inOrderedList) flushList();
      inList = true;
      const itemText = line.replace(/^[-*]\s+/, "");
      listItems.push(
        <li key={`li-${index}`} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0B5FFF] mt-1.5 shrink-0" />
          <span>{renderInline(itemText)}</span>
        </li>
      );
      return;
    }

    // Ordered List item (1. 2. etc)
    const matchOrdered = line.match(/^(\d+)\.\s+(.*)$/);
    if (matchOrdered) {
      if (inList) flushList();
      inOrderedList = true;
      const num = matchOrdered[1];
      const itemText = matchOrdered[2];
      orderedItems.push(
        <li key={`ol-li-${index}`} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <span className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#0B5FFF] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
            {num}
          </span>
          <span className="flex-1">{renderInline(itemText)}</span>
        </li>
      );
      return;
    }

    // Standard Paragraph
    flushList();
    elements.push(
      <p key={index} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed my-2">
        {renderInline(line)}
      </p>
    );
  });

  flushList();

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
}
