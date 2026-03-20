import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 will-change-transform active:scale-[0.99] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[var(--shadow-glow)] hover:scale-[1.02] hover:bg-primary/90',
        secondary:
          'bg-secondary/70 text-secondary-foreground backdrop-blur hover:scale-[1.02] hover:bg-secondary/70',
        outline:
          'border border-border/70 bg-background/40 backdrop-blur hover:scale-[1.02] hover:bg-accent/40 hover:text-accent-foreground',
        ghost:
          'bg-transparent hover:scale-[1.02] hover:bg-accent/40 hover:text-accent-foreground',
        destructive:
          'bg-destructive text-destructive-foreground hover:scale-[1.02] hover:bg-destructive/90',
        link: 'text-primary underline-offset-4 hover:underline hover:opacity-90',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-2xl px-3',
        lg: 'h-11 rounded-2xl px-8',
        icon: 'h-10 w-10 rounded-2xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    )
  },
)

Button.displayName = 'Button'
