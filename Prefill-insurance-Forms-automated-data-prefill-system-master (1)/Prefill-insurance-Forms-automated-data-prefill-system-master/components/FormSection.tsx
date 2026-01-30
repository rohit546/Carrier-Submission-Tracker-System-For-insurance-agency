import React from 'react'

interface FormSectionProps {
  title: string
  children: React.ReactNode
  className?: string
}

export const FormSection: React.FC<FormSectionProps> = ({ 
  title, 
  children, 
  className = '' 
}) => {
  return (
    <div className={`mb-8 ${className}`}>
      <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
        {title}
      </h2>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}