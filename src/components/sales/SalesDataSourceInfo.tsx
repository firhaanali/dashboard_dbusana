import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Calendar } from 'lucide-react';

interface SalesDataSourceInfoProps {
  recordsCount: number;
}

export function SalesDataSourceInfo({ recordsCount }: SalesDataSourceInfoProps) {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-sm text-blue-700">
          <Calendar className="w-4 h-4" />
          <span>
            Data dari import: {recordsCount} records | 
            Terakhir update: {new Date().toLocaleString('id-ID')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}