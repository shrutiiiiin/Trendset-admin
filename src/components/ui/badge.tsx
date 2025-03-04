import React from 'react';
import { cn } from '@/lib/utils'; // Assuming you have a utility function for class names

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, className }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        className
      )}
    >
      {children}
    </span>
  );
};

export default Badge;