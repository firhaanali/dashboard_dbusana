/**
 * Import Success Notifications Utility
 * 
 * Enhanced notifications untuk import berhasil dengan detail statistics
 * dan action buttons untuk navigasi ke halaman terkait - DISABLED
 */

// Notifications disabled per user request

interface ImportSuccessData {
  imported: number;
  total: number;
  errors?: number;
  duplicates?: number;
  fileName?: string;
  type: 'sales' | 'products' | 'stock' | 'advertising';
  processingTime?: number;
  summary?: {
    [key: string]: any;
  };
}

interface NotificationAction {
  label: string;
  onClick: () => void;
}

class ImportSuccessNotifications {
  /**
   * Show enhanced success notification with statistics
   */
  showImportSuccess(data: ImportSuccessData, customActions?: NotificationAction[]): void {
    const {
      imported,
      total,
      errors = 0,
      duplicates = 0,
      fileName,
      type,
      processingTime,
      summary
    } = data;

    // Calculate success rate
    const successRate = total > 0 ? Math.round((imported / total) * 100) : 0;
    
    // Create detailed description
    let description = `${imported} dari ${total} records berhasil diimport`;
    
    if (successRate === 100) {
      description = `✨ Perfect! Semua ${imported} records berhasil diimport`;
    } else if (successRate >= 90) {
      description = `🎯 Excellent! ${imported} dari ${total} records berhasil diimport (${successRate}%)`;
    } else if (successRate >= 75) {
      description = `👍 Good! ${imported} dari ${total} records berhasil diimport (${successRate}%)`;
    } else {
      description = `⚠️ ${imported} dari ${total} records berhasil diimport (${successRate}%)`;
    }

    // Add error info if any
    if (errors > 0) {
      description += `\n${errors} records gagal`;
    }
    
    if (duplicates > 0) {
      description += `\n${duplicates} records duplikat dilewati`;
    }

    // Add processing time if available
    if (processingTime) {
      description += `\nWaktu proses: ${processingTime}ms`;
    }

    // Determine toast type based on success rate
    const toastType = successRate === 100 ? 'success' : successRate >= 75 ? 'success' : 'warning';
    
    // Create action button
    const defaultAction = this.getDefaultAction(type);
    const actions = customActions || [defaultAction];

    // Toast notifications disabled
    console.log(`Import ${toastType}:`, description);

    // Show additional detailed toast if there are errors
    if (errors > 0 || duplicates > 0) {
      setTimeout(() => {
        this.showDetailedSummary(data);
      }, 1000);
    }

    // Log success to console for debugging
    console.log(`✅ ${this.getTypeLabel(type)} Import Success:`, {
      imported,
      total,
      successRate: `${successRate}%`,
      errors,
      duplicates,
      fileName,
      processingTime: processingTime ? `${processingTime}ms` : 'N/A',
      summary
    });
  }

  /**
   * Show detailed summary in a separate toast
   */
  private showDetailedSummary(data: ImportSuccessData): void {
    const { type, summary, errors, duplicates } = data;
    
    let summaryText = `📊 Detail Import ${this.getTypeLabel(type)}:`;
    
    if (summary) {
      Object.entries(summary).forEach(([key, value]) => {
        summaryText += `\n• ${key}: ${value}`;
      });
    }
    
    if (errors > 0) {
      summaryText += `\n• Records gagal: ${errors}`;
    }
    
    if (duplicates > 0) {
      summaryText += `\n• Records duplikat: ${duplicates}`;
    }

    // Summary toast disabled
    console.log('Import Summary:', summaryText);
  }

  /**
   * Show full detailed report
   */
  private showFullReport(data: ImportSuccessData): void {
    const report = this.generateDetailedReport(data);
    
    // Full report toast disabled
    console.log('Full Report:', report);
  }

  /**
   * Generate detailed report text
   */
  private generateDetailedReport(data: ImportSuccessData): string {
    const {
      imported,
      total,
      errors = 0,
      duplicates = 0,
      fileName,
      type,
      processingTime,
      summary
    } = data;

    const timestamp = new Date().toLocaleString('id-ID');
    const successRate = total > 0 ? Math.round((imported / total) * 100) : 0;

    let report = `LAPORAN IMPORT ${this.getTypeLabel(type).toUpperCase()}\n`;
    report += `${'='.repeat(50)}\n`;
    report += `Tanggal & Waktu: ${timestamp}\n`;
    
    if (fileName) {
      report += `File: ${fileName}\n`;
    }
    
    report += `\nRINGKASAN:\n`;
    report += `• Total records: ${total}\n`;
    report += `• Berhasil diimport: ${imported}\n`;
    report += `• Tingkat keberhasilan: ${successRate}%\n`;
    
    if (errors > 0) {
      report += `• Records gagal: ${errors}\n`;
    }
    
    if (duplicates > 0) {
      report += `• Records duplikat: ${duplicates}\n`;
    }
    
    if (processingTime) {
      report += `• Waktu pemrosesan: ${processingTime}ms\n`;
    }

    if (summary && Object.keys(summary).length > 0) {
      report += `\nDETAIL TAMBAHAN:\n`;
      Object.entries(summary).forEach(([key, value]) => {
        report += `• ${key}: ${value}\n`;
      });
    }

    report += `\n${'='.repeat(50)}`;
    report += `\nGenerated by D'Busana Dashboard`;

    return report;
  }

  /**
   * Get human-readable type label
   */
  private getTypeLabel(type: string): string {
    const labels = {
      sales: 'Sales Data',
      products: 'Products Data',
      stock: 'Stock Data',
      advertising: 'Advertising Data'
    };
    
    return labels[type as keyof typeof labels] || type;
  }

  /**
   * Get default action for each import type
   */
  private getDefaultAction(type: string): NotificationAction {
    const actions = {
      sales: {
        label: 'Lihat Sales',
        onClick: () => window.location.href = '/sales'
      },
      products: {
        label: 'Lihat Products',
        onClick: () => window.location.href = '/products'
      },
      stock: {
        label: 'Lihat Stock',
        onClick: () => window.location.href = '/stock'
      },
      advertising: {
        label: 'Lihat Advertising',
        onClick: () => window.location.href = '/advertising'
      }
    };

    return actions[type as keyof typeof actions] || {
      label: 'OK',
      onClick: () => {}
    };
  }

  /**
   * Show quick success notification (simple version)
   */
  showQuickSuccess(type: string, count: number): void {
    const emoji = this.getSuccessEmoji(type);
    const label = this.getTypeLabel(type);
    
    // Quick success toast disabled
    console.log(`${emoji} ${label} Import Berhasil! ${count} records`);
  }

  /**
   * Show import error notification
   */
  showImportError(type: string, error: string): void {
    const label = this.getTypeLabel(type);
    
    // Error toast disabled
    console.error(`${label} Import Error:`, error);
  }

  /**
   * Show import warning notification
   */
  showImportWarning(type: string, message: string): void {
    const label = this.getTypeLabel(type);
    
    // Warning toast disabled
    console.warn(`${label} Import Warning:`, message);
  }

  /**
   * Get appropriate emoji for success
   */
  private getSuccessEmoji(type: string): string {
    const emojis = {
      sales: '💰',
      products: '📦',
      stock: '📊',
      advertising: '📈'
    };
    
    return emojis[type as keyof typeof emojis] || '✅';
  }

  /**
   * Show celebration effect for large imports
   */
  showCelebrationForLargeImport(count: number): void {
    // Celebration toasts disabled
    if (count >= 1000) {
      console.log(`🎊 Wow! Big Import Success! ${count} records imported`);
    } else if (count >= 500) {
      console.log(`🎉 Great Import Success! ${count} records imported`);
    }
  }
}

// Create global instance
const importSuccessNotifications = new ImportSuccessNotifications();

// Export for use in components
export { importSuccessNotifications, type ImportSuccessData, type NotificationAction };

// Add to window for debugging
if (typeof window !== 'undefined') {
  (window as any).importSuccessNotifications = importSuccessNotifications;
}