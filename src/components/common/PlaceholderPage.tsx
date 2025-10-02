import React from 'react';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description = "Coming Soon - Feature dalam pengembangan" }: PlaceholderPageProps) {
  return (
    <div className="text-center py-12">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}