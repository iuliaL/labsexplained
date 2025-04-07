import React from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { UserIcon } from "./icons/UserIcon";

interface InterpretationProps {
  content: string;
  className?: string;
}

export function Interpretation({ content, className = "" }: InterpretationProps) {
  const interpretationStyles: Components = {
    h3: ({ children }) => <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-3">{children}</h3>,
    p: ({ children }) => <p className="text-sm text-slate-600 mb-3">{children}</p>,
    ul: ({ children }) => <ul className="list-disc list-inside text-sm text-slate-600 mb-3 ml-4">{children}</ul>,
    li: ({ children }) => <li className="mb-1">{children}</li>,
  };

  return (
    <div className={`bg-white rounded-lg border border-slate-200 p-6 ${className}`}>
      <div className="flex gap-3 mb-2">
        <UserIcon className="h-5 w-5 text-blue-600" />
        <h4 className="text-sm font-semibold text-slate-900">Interpretation</h4>
      </div>

      <div className="prose prose-sm max-w-none">
        <ReactMarkdown components={interpretationStyles}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
