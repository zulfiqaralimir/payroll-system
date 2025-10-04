import React from 'react';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input: React.FC<InputProps> = (props) => {
  return (
    <input
      {...props}
      className={`border rounded px-2 py-1 w-full focus:outline-none focus:ring focus:border-blue-300 ${props.className || ''}`}
    />
  );
};
