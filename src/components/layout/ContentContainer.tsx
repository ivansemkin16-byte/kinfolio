import React from 'react';

interface ContentContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const ContentContainer: React.FC<ContentContainerProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`w-full px-4 sm:px-7 lg:px-10 py-6 sm:py-8 ${className}`}>
      {children}
    </div>
  );
};
