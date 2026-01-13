import type { ButtonHTMLAttributes } from "react";

const styles = {
  primary:
    "bg-teal-600 text-white hover:bg-teal-700 focus-visible:outline-teal-600",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
  outline:
    "border border-slate-300 text-slate-700 hover:bg-slate-50 focus-visible:outline-teal-600",
  danger:
    "bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-600",
};

type Variant = keyof typeof styles;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm" | "md";
};

export const Button = ({ variant = "primary", size = "md", className = "", ...props }: ButtonProps) => {
  const sizeStyles = size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-sm";
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-full font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${styles[variant]} ${sizeStyles} ${className}`}
    />
  );
};
