import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';

interface AccessibleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  descriptionId?: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function AccessibleDialog({
  open,
  onOpenChange,
  title,
  description,
  descriptionId = 'dialog-description',
  children,
  className = '',
  icon
}: AccessibleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`theme-transition ${className}`}
        aria-describedby={description ? descriptionId : undefined}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground dark:text-foreground">
            {icon}
            {title}
          </DialogTitle>
          {description && (
            <div 
              id={descriptionId}
              className="text-sm text-muted-foreground mt-1"
            >
              {description}
            </div>
          )}
        </DialogHeader>
        
        <div className="theme-transition">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}