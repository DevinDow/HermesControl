import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../../lib/utils';

const highlightMatches = (text: any, search?: string) => {
  if (!search || typeof text !== 'string') return text;

  const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedSearch})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === search.toLowerCase() ? (
          <mark key={i} className="bg-[#FFFF00] text-black px-0.5 py-0 rounded" data-search-match="true">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

const ListContext = React.createContext<'ordered' | 'unordered' | null>(null);

export function MarkdownRenderer({
  content,
  search,
}: {
  content: string;
  search?: string;
}) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: (props: any) => (
          <h1 className="text-2xl font-bold text-body-cornsilk mt-12 mb-8 border-b border-[#1F1F1F] pb-4 first:mt-0" {...props}>
            {highlightMatches(props.children, search)}
          </h1>
        ),
        h2: (props: any) => (
          <h2 className="text-lg font-bold text-body-cornsilk mt-8 mb-4 border-l-2 border-[#FFBF00] pl-4 first:mt-0" {...props}>
            {highlightMatches(props.children, search)}
          </h2>
        ),
        h3: (props: any) => (
          <h3 className="text-base font-bold text-body-cornsilk mt-4 mb-3 ml-2 border-l border-gray-700 pl-4 first:mt-0" {...props}>
            {highlightMatches(props.children, search)}
          </h3>
        ),
        h4: (props: any) => (
          <h4 className="text-sm font-bold text-gray-300 mt-2 mb-2 ml-6 first:mt-0" {...props}>
            {highlightMatches(props.children, search)}
          </h4>
        ),
        p: (props: any) => (
          <p className="mb-4 leading-relaxed text-gray-400 ml-2 h2:ml-6 h3:ml-10" {...props}>
            {highlightMatches(props.children, search)}
          </p>
        ),
        a: (props: any) => (
          <a className="text-[#FFBF00] hover:text-[#4A56C0] underline transition-colors" target="_blank" rel="noopener noreferrer" {...props} />
        ),
        table: (props: any) => (
          <div className="my-6 overflow-x-auto rounded-lg border border-[#FFBF00]">
            <table className="w-full border-collapse text-[13px]" {...props} />
          </div>
        ),
        thead: (props: any) => <thead className="bg-[#FFBF00]/20 border-b border-[#FFBF00]" {...props} />,
        th: (props: any) => (
          <th className="px-4 py-2 text-left font-bold text-[#FFBF00] uppercase tracking-wider border-r border-[#FFBF00]/60 last:border-r-0" {...props}>
            {highlightMatches(props.children, search)}
          </th>
        ),
        td: (props: any) => (
          <td className="px-4 py-2 border-t border-r border-[#FFBF00]/60 last:border-r-0 text-[#FFF8DC]" {...props}>
            {highlightMatches(props.children, search)}
          </td>
        ),
        code: ({ inline, className, children, ...props }: any) => {
          const hasNewline = String(children).includes('\n');
          return inline || !hasNewline ? (
            <code className="bg-[#1A1A1A] px-1.5 py-0.5 rounded text-[12px] font-mono text-[#FFBF00]" {...props}>
              {highlightMatches(children, search)}
            </code>
          ) : (
            <pre className="bg-[#080808] border border-[#1F1F1F] p-4 rounded-xl overflow-x-auto my-6 ml-4">
              <code className={cn('text-[12px] font-mono text-[#FFF8DC]', className)} {...props}>
                {children}
              </code>
            </pre>
          );
        },
        ol: ({ children, ...props }: any) => (
          <ListContext.Provider value="ordered">
            <ol className="list-none [counter-reset:li] mb-4" {...props}>
              {children}
            </ol>
          </ListContext.Provider>
        ),
        ul: ({ children, ...props }: any) => (
          <ListContext.Provider value="unordered">
            <ul className="list-none mb-4" {...props}>
              {children}
            </ul>
          </ListContext.Provider>
        ),
        li: ({ children, ...props }: any) => {
          const listType = React.useContext(ListContext);
          return (
            <li className={cn('flex gap-3 text-[14px] text-[#FFF8DC] mb-2', listType === 'ordered' && '[counter-increment:li]')} {...props}>
              <span className="text-[#FFBF00] mt-1.5 font-mono min-w-[1.5em] text-right">
                {listType === 'ordered' ? <span className="before:content-[counter(li)'.']" /> : '•'}
              </span>
              <div className="flex-1">{highlightMatches(children, search)}</div>
            </li>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
