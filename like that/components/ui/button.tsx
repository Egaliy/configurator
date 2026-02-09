import * as React from "react"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "secondary" | "outline"
  size?: "sm" | "default"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg text-base font-normal tracking-tighter transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 disabled:pointer-events-none disabled:opacity-50"
    
    const sizeStyles = {
      sm: "h-8 px-3 text-sm",
      default: "h-10 px-4 py-2",
    }
    
    const variants = {
      default: "bg-white text-black hover:opacity-90 border-0",
      ghost: "hover:bg-white/10 text-white/80 hover:text-white border border-transparent",
      secondary: "bg-white/5 text-white border border-white/10 hover:bg-white/10",
      outline: "bg-transparent text-white border border-white/20 hover:bg-white/10",
    }

    return (
      <button
        className={`${baseStyles} ${sizeStyles[size]} ${variants[variant]} ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
