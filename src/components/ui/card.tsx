import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div
      {...props}
      className={`bg-white rounded-xl shadow border border-gray-200 ${className || ""}`}
    >
      {children}
    </div>
  );
};

export const CardContent: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div {...props} className={`p-4 ${className || ""}`}>
      {children}
    </div>
  );
};
