import { cn } from '@/utils/helpers'

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const colorIndex = name ? name.charCodeAt(0) % 6 : 0
  // Enterprise gradients - no teal, purple, or violet
  const gradients = [
    'from-indigo-500 to-indigo-600',
    'from-emerald-500 to-emerald-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-rose-600',
    'from-blue-500 to-blue-600',
    'from-slate-500 to-slate-600',
  ]

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={cn('rounded-full object-cover ring-2 ring-slate-700/50', sizes[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold text-white',
        'bg-gradient-to-br ring-2 ring-slate-700/50',
        gradients[colorIndex],
        sizes[size],
        className
      )}
    >
      {initials}
    </div>
  )
}
