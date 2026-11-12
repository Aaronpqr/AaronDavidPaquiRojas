import type { ReactNode } from 'react';

interface HeaderFooterProps {
  author: string;
  topic: string;
  slideNumber: number;
  date: string;
  children: ReactNode;
}

/** Cabecera y pie de los slides de desarrollo (no se usa en la portada). */
export function HeaderFooter({ author, topic, slideNumber, date, children }: HeaderFooterProps) {
  return (
    <div className="flex h-full flex-col">
      <header className="flex justify-between border-b border-slate-200 px-[3cqw] py-[1.2cqw] text-[1.6cqw] text-slate-500">
        <span>{topic}</span>
        <span>{author}</span>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      <footer className="flex justify-between border-t border-slate-200 px-[3cqw] py-[1.2cqw] text-[1.6cqw] text-slate-500">
        <span>{date}</span>
        <span>{slideNumber}</span>
      </footer>
    </div>
  );
}
