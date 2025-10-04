import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`border border-gray-300 p-2 rounded w-full ${className}`}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
