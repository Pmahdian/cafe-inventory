import { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
}

export function Card({
  children,
  className = '',
  hover = false,
  ...rest
}: CardProps) {
  return (
    <div
      {...rest}
      className={`
        relative rounded-2xl
        bg-[var(--surface)]
        border border-[var(--border)]
        shadow-[0_1px_2px_rgba(0,0,0,0.03),0_1px_6px_-2px_rgba(0,0,0,0.02)]
        dark:shadow-[0_1px_2px_rgba(0,0,0,0.3)]
        transition-all duration-200
        ${hover ? 'hover:border-[var(--muted-2)]/30 hover:shadow-md' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}