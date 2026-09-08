import { ArrowRight } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; tone?: 'force' | 'matter' | 'sound' | 'magnet' | 'light' | 'air' | 'heat' | 'plant' | 'earth' | 'float' | 'dissolve' | 'circuit' | 'seed' | 'friction' | 'absorb' | 'color' | 'surface' | 'reaction' | 'mint'; icon?: boolean };

export function PrimaryButton({ children, tone = 'mint', icon = true, className = '', ...props }: Props) {
  return <button className={`primary-button ${tone} ${className}`} {...props}>{children}{icon && <ArrowRight size={22} />}</button>;
}
