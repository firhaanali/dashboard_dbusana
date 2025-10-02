import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Supported languages
export type Language = 'id' | 'en';

// Language context interface
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date | string) => string;
  formatNumber: (num: number) => string;
}

// Create language context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Inline translations to avoid JSON import issues
const translations = {
  id: {
    common: {
      loading: 'Memuat...',
      error: 'Terjadi kesalahan',
      success: 'Berhasil',
      save: 'Simpan',
      cancel: 'Batal',
      delete: 'Hapus',
      edit: 'Edit',
      add: 'Tambah',
      search: 'Cari',
      filter: 'Filter',
      export: 'Ekspor',
      import: 'Impor',
      refresh: 'Muat Ulang',
      view: 'Lihat',
      close: 'Tutup',
      confirm: 'Konfirmasi',
      yes: 'Ya',
      no: 'Tidak',
      back: 'Kembali',
      next: 'Selanjutnya',
      previous: 'Sebelumnya',
      settings: 'Pengaturan',
      logout: 'Keluar'
    },
    navigation: {
      dashboard: 'Dashboard',
      sales: 'Penjualan',
      products: 'Produk',
      customers: 'Pelanggan',
      reports: 'Laporan',
      analytics: 'Analitik',
      advertising: 'Iklan',
      forecasting: 'Peramalan',
      cashflow: 'Arus Kas',
      inventory: 'Inventori',
      settings: 'Pengaturan',
      users: 'Pengguna'
    },
    dashboard: {
      title: 'Dashboard D\'Busana',
      welcome: 'Selamat datang di dashboard bisnis fashion D\'Busana',
      overview: 'Ringkasan Bisnis',
      kpi: {
        total_revenue: 'Total Pendapatan',
        total_orders: 'Total Pesanan',
        total_products: 'Total Produk',
        total_customers: 'Total Pelanggan',
        growth_rate: 'Tingkat Pertumbuhan',
        profit_margin: 'Margin Keuntungan',
        conversion_rate: 'Tingkat Konversi',
        avg_order_value: 'Nilai Rata-rata Pesanan'
      }
    },
    analytics: {
      conversion: {
        title: 'Tingkat Konversi per Channel',
        insight: '{{channel}} memiliki conversion rate tertinggi ({{rate}}%), menunjukkan potensi besar untuk ekspansi investasi di channel ini.',
        single_channel: 'Saat ini hanya beroperasi di {{channel}} dengan conversion rate {{rate}}%. Pertimbangkan ekspansi ke marketplace lain untuk diversifikasi risiko.',
        no_data: 'Tidak ada data conversion rates tersedia',
        no_data_description: 'Data akan muncul setelah ada transaksi penjualan'
      },
      strategic: {
        title: 'Analisis Bisnis Strategis',
        subtitle: 'Intelligence & Insights Berbasis Data Real-time',
        kpi_cards: {
          revenue_growth: 'Pertumbuhan Pendapatan',
          growth: 'pertumbuhan',
          profit_margin: 'Margin Keuntungan',
          customer_ltv: 'Nilai Seumur Hidup Pelanggan',
          ratio: 'rasio',
          excellent: 'Sangat Baik',
          fair: 'Cukup',
          needs_improvement: 'Perlu Perbaikan',
          marketing_roi: 'ROI Pemasaran',
          excellent_performance: 'Performa Luar Biasa',
          margin: 'margin',
          healthy: 'Sehat'
        },
        tabs: {
          business_overview: 'Gambaran Bisnis',
          strategic_insights: 'Wawasan Strategis',
          recommendations: 'Rekomendasi',
          performance_analysis: 'Analisis Performa',
          strategic_forecasting: 'Peramalan Strategis'
        },
        marketplace_distribution: {
          title: 'Distribusi Marketplace',
          revenue_share: 'Pangsa Pendapatan'
        },
        operations_efficiency: {
          title: 'Efisiensi Operasional',
          inventory_turnover: 'Perputaran Inventori',
          order_fulfillment: 'Pemenuhan Pesanan',
          operational_costs: 'Biaya Operasional'
        },
        business_health_score: {
          title: 'Skor Kesehatan Bisnis',
          score: 'Skor: {{score}}/100',
          revenue_growth: 'Pertumbuhan Pendapatan',
          profitability: 'Profitabilitas',
          operations: 'Operasional',
          marketing_roi: 'ROI Pemasaran',
          customer_retention: 'Retensi Pelanggan'
        },
        strategic_recommendations: {
          title: 'Rekomendasi Strategis',
          priority: 'Prioritas {{level}}',
          investment_required: 'Investasi Diperlukan',
          payback_period: 'Periode Balik Modal',
          business_impact: 'Dampak Bisnis: {{impact}}%',
          tactical: 'Taktis',
          strategic: 'Strategis',
          operational: 'Operasional'
        },
        conversion_analysis: {
          title: 'Analisis Konversi Real-time',
          marketplace_performance: 'Performa Marketplace',
          no_data: 'Tidak ada data konversi tersedia',
          single_marketplace: 'Beroperasi hanya di {{marketplace}} dengan tingkat konversi {{rate}}%',
          diversification_needed: 'Pertimbangkan diversifikasi ke marketplace lain'
        },
        customer_segments: {
          title: 'Segmentasi Pelanggan',
          premium: 'Premium',
          regular: 'Regular', 
          budget: 'Budget',
          segment_size: 'Ukuran Segmen',
          ltv: 'LTV',
          acquisition_cost: 'Biaya Akuisisi'
        },
        tabs: {
          business_overview: 'Ikhtisar Bisnis',
          strategic_insights: 'Wawasan Strategis',
          recommendations: 'Rekomendasi',
          performance_analysis: 'Analisis Kinerja',
          strategic_forecasting: 'Peramalan Strategis'
        },
        revenue_growth_trend_seasonal_patterns: 'Tren Pertumbuhan Pendapatan & Pola Musiman',
        cost_structure_profitability_analysis: 'Analisis Struktur Biaya & Profitabilitas',
        profitability_metrics: 'Metrik Profitabilitas',
        business_performance_matrix: 'Matriks Kinerja Bisnis',
        revenue_distribution_by_channel: 'Distribusi Pendapatan per Saluran',
        operational_excellence: 'Keunggulan Operasional',
        marketing_performance: 'Kinerja Pemasaran',
        risk_assessment: 'Penilaian Risiko',
        performance_score: 'Skor Kinerja',
        campaign_effectiveness: 'Efektivitas Kampanye',
        inventory_risk: 'Risiko Inventori',
        market_risk: 'Risiko Pasar',
        overall_risk_level: 'Tingkat Risiko Keseluruhan',
        best_conversion_rate: 'Tingkat Konversi Terbaik',
        ltv_cac_ratio: 'Rasio LTV/CAC',
        kpi_impact: 'Dampak KPI',
        time_periods: {
          '3_months': '3 Bulan',
          '6_months': '6 Bulan',
          '1_year': '1 Tahun'
        },
        strategic_recommendations: {
          business_impact: 'Dampak Bisnis {{impact}}%',
          investment_required: 'Investasi Diperlukan',
          payback_period: 'Periode Pengembalian',
          risk_level: 'Tingkat Risiko',
          implementation_steps: 'Langkah Implementasi',
          success_metrics: 'Metrik Keberhasilan',
          no_success_metrics: 'Tidak ada metrik keberhasilan yang didefinisikan'
        },
        operations_efficiency: {
          inventory_turnover: 'Perputaran Inventori',
          order_fulfillment: 'Pemenuhan Pesanan',
          cash_flow_health: 'Kesehatan Arus Kas'
        },
        cash_flow_risk: 'Risiko Arus Kas',
        loading_title: 'Memuat Analisis Strategis...',
        loading_description: 'Menganalisis data bisnis komprehensif',
        error_unable_to_generate: 'Tidak dapat menghasilkan analisis bisnis strategis',
        strategic_business_insights: 'Wawasan Bisnis Strategis',
        data_driven_insights_description: 'Wawasan berbasis data untuk pengambilan keputusan strategis',
        insight_categories: {
          all: 'Semua Kategori',
          growth_opportunities: 'Peluang Pertumbuhan',
          risk_management: 'Manajemen Risiko',
          optimization: 'Optimisasi',
          growth_strategy: 'Strategi Pertumbuhan'
        },
        customer_segments: {
          lifetime_value: 'Nilai Seumur Hidup',
          acquisition_cost: 'Biaya Akuisisi'
        },
        growth_opportunities: {
          tiktok_shop_expansion: 'Ekspansi TikTok Shop',
          premium_segment_growth: 'Pertumbuhan Segmen Premium',
          cross_platform_synergy: 'Sinergi Lintas Platform'
        },
        operational_excellence: {
          multi_channel_platform: 'Platform Multi-Saluran',
          advanced_analytics: 'Analitik Lanjutan',
          supply_chain_optimization: 'Optimisasi Rantai Pasokan'
        },
        insights: {
          anomalous_revenue_spike_title: 'Anomali Lonjakan Pendapatan pada Kategori Fashion Terdeteksi',
          anomalous_revenue_spike_description: 'Model machine learning mendeteksi lonjakan pendapatan 347% pada kategori "Blouse Casual" dalam 14 hari terakhir. Pola ini mengindikasikan tren viral atau endorsement influencer yang tidak terdokumentasi.'
        },
        recommendations: {
          high_value_customer_retention: 'Program Retensi Pelanggan Bernilai Tinggi'
        },
        priority: {
          high: 'Prioritas Tinggi'
        },
        sensitivity: {
          low: 'Rendah - Hanya pola utama',
          medium: 'Sedang - Deteksi seimbang',
          high: 'Tinggi - Analisis detail'
        },
        auto_refresh: 'Pembaruan Otomatis',
        impact_score: 'Skor Dampak',
        cost_breakdown: 'Rincian Biaya',
        scenarios: {
          conservative: 'Skenario Konservatif',
          realistic: 'Skenario Realistis',
          optimistic: 'Skenario Optimis'
        },
        priority: {
          high: 'Prioritas Tinggi',
          medium: 'Prioritas Sedang'
        },
        analysis_sensitivity: 'Sensitivitas Analisis',
        enable_predictions: 'Aktifkan Prediksi',
        strategic_business_recommendations: 'Rekomendasi Bisnis Strategis',
        investment_recommendations_description: 'Rekomendasi investasi yang diprioritaskan berdasarkan dampak bisnis',
        no_implementation_steps: 'Tidak ada langkah implementasi tersedia',
        no_business_recommendations: 'Tidak Ada Rekomendasi Bisnis Tersedia',
        no_business_recommendations_description: 'Rekomendasi strategis akan muncul di sini setelah data yang cukup dianalisis.',
        no_ai_insights_available: 'Belum ada wawasan AI tersedia',
        loading: 'Memuat...',
        generate_ai_insights: 'Buat Wawasan AI',
        last_update: 'Terakhir',
        strategies: {
          marketplace_diversification: 'Strategi Diversifikasi Marketplace',
          shopee_performance_optimization: 'Strategi Optimisasi Performa Shopee',
          dynamic_pricing: 'Implementasi Strategi Penetapan Harga Dinamis'
        },
        implementation: 'Implementasi',
        strategic_implementation_timeline: 'Jadwal Implementasi Strategis',
        multi_channel_platform_implementation: 'Implementasi Platform Multi-Saluran',
        unknown_product: 'Produk Tidak Dikenal',
        categories: {
          risk_management: 'Manajemen Risiko',
          customer_value: 'Nilai Pelanggan'
        },
        analytics_view: 'Tampilan Analitik',
        timeline: 'Jadwal',
        expected_outcome: 'Hasil yang Diharapkan',
        action_items: 'Item Tindakan',
        return_on_investment: 'Pengembalian Investasi',
        revenue_forecast_next_12_months: 'Prakiraan Pendapatan (12 Bulan Ke Depan)',
        market_expansion_potential: 'Potensi Ekspansi Pasar',
        revenue_increase_potential: 'Potensi peningkatan pendapatan',
        premium_customer_base: 'Basis pelanggan premium',
        conversion_improvement: 'Peningkatan konversi',
        investment_impact_projection: 'Proyeksi Dampak Investasi',
        tiktok_shop_expansion_analytics_setup: 'Ekspansi TikTok Shop & Pengaturan Analitik Lanjutan',
        focus_high_roi_initiatives: 'Fokus pada inisiatif ROI tinggi dengan kemenangan cepat',
        system_integration_operational_efficiency: 'Integrasi sistem dan peningkatan efisiensi operasional',
        premium_segment_development_supply_chain: 'Pengembangan Segmen Premium & Optimisasi Rantai Pasokan',
        long_term_growth_initiatives: 'Inisiatif pertumbuhan jangka panjang dan optimisasi biaya',
        performance_optimization_scale_preparation: 'Optimisasi Kinerja & Persiapan Skala',
        fine_tuning_systems_preparing_growth: 'Menyempurnakan sistem dan mempersiapkan pertumbuhan tahun depan',
        predictive_insights: 'Wawasan prediktif',
        every_30_minutes: 'Setiap 30 menit',
        analyzing_business_patterns: 'Menganalisis pola bisnis dan menghasilkan wawasan',
        confidence: 'Keyakinan',
        generating_comparison_analytics: 'Menghasilkan Analitik Perbandingan...',
        processing_analytical_approaches: 'Memproses pendekatan analitik yang berbeda',
        template_based: 'Berbasis Template',
        hybrid: 'Hibrid',
        analysis_period: 'Periode Analisis',
        '3_months': '3 Bulan',
        '6_months': '6 Bulan', 
        '1_year': '1 Tahun',
        performance_insight: 'Wawasan Kinerja',
        impact_score: 'Skor Dampak',
        method_comparison_summary: 'Ringkasan Perbandingan Metode',
        filter_by_category: 'Filter berdasarkan kategori',
        ai_analytics_processing: 'Memproses Analitik AI...',
        ltv_cac_ratio: 'Rasio LTV/CAC',
        plus_30_efficiency: '+30% Efisiensi',
        plus_20_revenue: '+20% Pendapatan',
        payback_8_12_months: 'Pengembalian 8-12 bulan',
        payback_6_9_months: 'Pengembalian 6-9 bulan',
        payback_10_15_months: 'Pengembalian 10-15 bulan',
        toast: {
          success_loaded: 'Analitik Strategis Dimuat',
          success_description: 'Berhasil menghasilkan {{insights}} wawasan dan {{recommendations}} rekomendasi',
          unavailable: 'Analitik Strategis Tidak Tersedia',
          unavailable_description: 'Tidak dapat memuat data analitik strategis',
          engine_error: 'Error engine analitik - menampilkan wawasan cadangan'
        },
        loading: 'Memuat analisis strategis...',
        error: 'Error memuat data analisis',
        no_data: 'Tidak ada data tersedia untuk analisis'
      }
    },
    settings: {
      language: 'Bahasa'
    },
    errors: {
      not_found: 'Data tidak ditemukan'
    }
  },
  en: {
    common: {
      loading: 'Loading...',
      error: 'An error occurred',
      success: 'Success',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      import: 'Import',
      refresh: 'Refresh',
      view: 'View',
      close: 'Close',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      settings: 'Settings',
      logout: 'Logout'
    },
    navigation: {
      dashboard: 'Dashboard',
      sales: 'Sales',
      products: 'Products',
      customers: 'Customers',
      reports: 'Reports',
      analytics: 'Analytics',
      advertising: 'Advertising',
      forecasting: 'Forecasting',
      cashflow: 'Cash Flow',
      inventory: 'Inventory',
      settings: 'Settings',
      users: 'Users'
    },
    dashboard: {
      title: 'D\'Busana Dashboard',
      welcome: 'Welcome to D\'Busana fashion business dashboard',
      overview: 'Business Overview',
      kpi: {
        total_revenue: 'Total Revenue',
        total_orders: 'Total Orders',
        total_products: 'Total Products',
        total_customers: 'Total Customers',
        growth_rate: 'Growth Rate',
        profit_margin: 'Profit Margin',
        conversion_rate: 'Conversion Rate',
        avg_order_value: 'Average Order Value'
      }
    },
    analytics: {
      conversion: {
        title: 'Conversion Rates by Channel',
        insight: '{{channel}} has the highest conversion rate ({{rate}}%), showing great potential for expanding investment in this channel.',
        single_channel: 'Currently operating only on {{channel}} with conversion rate {{rate}}%. Consider expanding to other marketplaces for risk diversification.',
        no_data: 'No conversion rates data available',
        no_data_description: 'Data will appear after sales transactions'
      },
      strategic: {
        title: 'Strategic Business Analytics',
        subtitle: 'Real-time Data-Driven Intelligence & Insights',
        kpi_cards: {
          revenue_growth: 'Revenue Growth',
          growth: 'growth',
          profit_margin: 'Profit Margin',
          customer_ltv: 'Customer Lifetime Value',
          ratio: 'ratio',
          excellent: 'Excellent',
          fair: 'Fair',
          needs_improvement: 'Needs Improvement',
          marketing_roi: 'Marketing ROI',
          excellent_performance: 'Excellent Performance',
          margin: 'margin',
          healthy: 'Healthy'
        },
        tabs: {
          business_overview: 'Business Overview',
          strategic_insights: 'Strategic Insights',
          recommendations: 'Recommendations',
          performance_analysis: 'Performance Analysis',
          strategic_forecasting: 'Strategic Forecasting'
        },
        marketplace_distribution: {
          title: 'Marketplace Distribution',
          revenue_share: 'Revenue Share'
        },
        operations_efficiency: {
          title: 'Operations Efficiency',
          inventory_turnover: 'Inventory Turnover',
          order_fulfillment: 'Order Fulfillment',
          operational_costs: 'Operational Costs'
        },
        business_health_score: {
          title: 'Business Health Score',
          score: 'Score: {{score}}/100',
          revenue_growth: 'Revenue Growth',
          profitability: 'Profitability',
          operations: 'Operations',
          marketing_roi: 'Marketing ROI',
          customer_retention: 'Customer Retention'
        },
        strategic_recommendations: {
          title: 'Strategic Recommendations',
          priority: 'Priority {{level}}',
          investment_required: 'Investment Required',
          payback_period: 'Payback Period',
          business_impact: 'Business Impact: {{impact}}%',
          tactical: 'Tactical',
          strategic: 'Strategic',
          operational: 'Operational'
        },
        conversion_analysis: {
          title: 'Real-time Conversion Analysis',
          marketplace_performance: 'Marketplace Performance',
          no_data: 'No conversion data available',
          single_marketplace: 'Operating only on {{marketplace}} with {{rate}}% conversion rate',
          diversification_needed: 'Consider diversifying to other marketplaces'
        },
        customer_segments: {
          title: 'Customer Segmentation',
          premium: 'Premium',
          regular: 'Regular',
          budget: 'Budget',
          segment_size: 'Segment Size',
          ltv: 'LTV',
          acquisition_cost: 'Acquisition Cost'
        },
        tabs: {
          business_overview: 'Business Overview',
          strategic_insights: 'Strategic Insights',
          recommendations: 'Recommendations',
          performance_analysis: 'Performance Analysis',
          strategic_forecasting: 'Strategic Forecasting'
        },
        revenue_growth_trend_seasonal_patterns: 'Revenue Growth Trend & Seasonal Patterns',
        cost_structure_profitability_analysis: 'Cost Structure & Profitability Analysis',
        profitability_metrics: 'Profitability Metrics',
        business_performance_matrix: 'Business Performance Matrix',
        revenue_distribution_by_channel: 'Revenue Distribution by Channel',
        operational_excellence: 'Operational Excellence',
        marketing_performance: 'Marketing Performance',
        risk_assessment: 'Risk Assessment',
        performance_score: 'Performance Score',
        campaign_effectiveness: 'Campaign Effectiveness',
        inventory_risk: 'Inventory Risk',
        market_risk: 'Market Risk',
        overall_risk_level: 'Overall Risk Level',
        best_conversion_rate: 'Best Conversion Rate',
        ltv_cac_ratio: 'LTV/CAC Ratio',
        kpi_impact: 'KPI Impact',
        time_periods: {
          '3_months': '3 Months',
          '6_months': '6 Months',
          '1_year': '1 Year'
        },
        strategic_recommendations: {
          business_impact: 'Business Impact {{impact}}%',
          investment_required: 'Investment Required',
          payback_period: 'Payback Period',
          risk_level: 'Risk Level',
          implementation_steps: 'Implementation Steps',
          success_metrics: 'Success Metrics',
          no_success_metrics: 'No success metrics defined'
        },
        operations_efficiency: {
          inventory_turnover: 'Inventory Turnover',
          order_fulfillment: 'Order Fulfillment',
          cash_flow_health: 'Cash Flow Health'
        },
        cash_flow_risk: 'Cash Flow Risk',
        loading_title: 'Loading Strategic Analytics...',
        loading_description: 'Analyzing comprehensive business data',
        error_unable_to_generate: 'Unable to generate strategic business analytics',
        strategic_business_insights: 'Strategic Business Insights',
        data_driven_insights_description: 'Data-driven insights for strategic decision making',
        insight_categories: {
          all: 'All Categories',
          growth_opportunities: 'Growth Opportunities',
          risk_management: 'Risk Management',
          optimization: 'Optimization',
          growth_strategy: 'Growth Strategy'
        },
        customer_segments: {
          lifetime_value: 'Lifetime Value',
          acquisition_cost: 'Acquisition Cost'
        },
        growth_opportunities: {
          tiktok_shop_expansion: 'TikTok Shop Expansion',
          premium_segment_growth: 'Premium Segment Growth',
          cross_platform_synergy: 'Cross-Platform Synergy'
        },
        operational_excellence: {
          multi_channel_platform: 'Multi-Channel Platform',
          advanced_analytics: 'Advanced Analytics',
          supply_chain_optimization: 'Supply Chain Optimization'
        },
        insights: {
          anomalous_revenue_spike_title: 'Anomalous Revenue Spike in Fashion Category Detected',
          anomalous_revenue_spike_description: 'Machine learning model detected 347% revenue spike in "Blouse Casual" category in the last 14 days. This pattern indicates viral trend or undocumented influencer endorsement.'
        },
        recommendations: {
          high_value_customer_retention: 'High-Value Customer Retention Program'
        },
        priority: {
          high: 'High Priority'
        },
        sensitivity: {
          low: 'Low - Major patterns only',
          medium: 'Medium - Balanced detection',
          high: 'High - Detailed analysis'
        },
        auto_refresh: 'Auto Refresh',
        impact_score: 'Impact Score',
        cost_breakdown: 'Cost Breakdown',
        scenarios: {
          conservative: 'Conservative Scenario',
          realistic: 'Realistic Scenario',
          optimistic: 'Optimistic Scenario'
        },
        priority: {
          high: 'High Priority',
          medium: 'Medium Priority'
        },
        analysis_sensitivity: 'Analysis Sensitivity',
        enable_predictions: 'Enable Predictions',
        strategic_business_recommendations: 'Strategic Business Recommendations',
        investment_recommendations_description: 'Investment recommendations prioritized by business impact',
        no_implementation_steps: 'No implementation steps available',
        no_business_recommendations: 'No Business Recommendations Available',
        no_business_recommendations_description: 'Strategic recommendations will appear here once sufficient data is analyzed.',
        no_ai_insights_available: 'No AI insights available yet',
        loading: 'Loading...',
        generate_ai_insights: 'Generate AI Insights',
        last_update: 'Last',
        strategies: {
          marketplace_diversification: 'Marketplace Diversification Strategy',
          shopee_performance_optimization: 'Shopee Performance Optimization Strategy',
          dynamic_pricing: 'Dynamic Pricing Strategy Implementation'
        },
        implementation: 'Implementation',
        strategic_implementation_timeline: 'Strategic Implementation Timeline',
        multi_channel_platform_implementation: 'Multi-Channel Platform Implementation',
        unknown_product: 'Unknown Product',
        categories: {
          risk_management: 'Risk Management',
          customer_value: 'Customer Value'
        },
        analytics_view: 'Analytics View',
        timeline: 'Timeline',
        expected_outcome: 'Expected Outcome',
        action_items: 'Action Items',
        return_on_investment: 'Return on Investment',
        revenue_forecast_next_12_months: 'Revenue Forecast (Next 12 Months)',
        market_expansion_potential: 'Market Expansion Potential',
        revenue_increase_potential: 'Revenue increase potential',
        premium_customer_base: 'Premium customer base',
        conversion_improvement: 'Conversion improvement',
        investment_impact_projection: 'Investment Impact Projection',
        tiktok_shop_expansion_analytics_setup: 'TikTok Shop Expansion & Advanced Analytics Setup',
        focus_high_roi_initiatives: 'Focus on high-ROI initiatives with quick wins',
        system_integration_operational_efficiency: 'System integration and operational efficiency improvements',
        premium_segment_development_supply_chain: 'Premium Segment Development & Supply Chain Optimization',
        long_term_growth_initiatives: 'Long-term growth initiatives and cost optimization',
        performance_optimization_scale_preparation: 'Performance Optimization & Scale Preparation',
        fine_tuning_systems_preparing_growth: 'Fine-tuning systems and preparing for next year growth',
        predictive_insights: 'Predictive insights',
        every_30_minutes: 'Every 30 minutes',
        analyzing_business_patterns: 'Analyzing business patterns and generating insights',
        confidence: 'Confidence',
        generating_comparison_analytics: 'Generating Comparison Analytics...',
        processing_analytical_approaches: 'Processing different analytical approaches',
        template_based: 'Template-Based',
        hybrid: 'Hybrid',
        analysis_period: 'Analysis Period',
        '3_months': '3 Months',
        '6_months': '6 Months',
        '1_year': '1 Year',
        performance_insight: 'Performance Insight',
        impact_score: 'Impact Score',
        method_comparison_summary: 'Method Comparison Summary',
        filter_by_category: 'Filter by category',
        ai_analytics_processing: 'AI Analytics Processing...',
        ltv_cac_ratio: 'LTV/CAC Ratio',
        plus_30_efficiency: '+30% Efficiency',
        plus_20_revenue: '+20% Revenue',
        payback_8_12_months: '8-12 months payback',
        payback_6_9_months: '6-9 months payback', 
        payback_10_15_months: '10-15 months payback',
        toast: {
          success_loaded: 'Strategic Analytics Loaded',
          success_description: 'Generated {{insights}} insights and {{recommendations}} recommendations',
          unavailable: 'Strategic Analytics Unavailable',
          unavailable_description: 'Unable to load strategic analytics data',
          engine_error: 'Analytics engine error - showing fallback insights'
        },
        loading: 'Loading strategic analytics...',
        error: 'Error loading analytics data',
        no_data: 'No data available for analysis'
      }
    },
    settings: {
      language: 'Language'
    },
    errors: {
      not_found: 'Data not found'
    }
  }
};

// Language provider component
interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  // Get initial language from localStorage or default to Indonesian
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dbusana-language');
      return (saved as Language) || 'id';
    }
    return 'id';
  });

  // Update localStorage when language changes
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dbusana-language', lang);
    }
  };

  // Translation function with parameter interpolation
  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    if (typeof value !== 'string') {
      console.warn(`Translation missing for key: ${key} in language: ${language}`);
      return key;
    }
    
    // Replace parameters in the text
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match: string, paramKey: string) => {
        return params[paramKey]?.toString() || match;
      });
    }
    
    return value;
  };

  // Format currency based on language
  const formatCurrency = (amount: number): string => {
    if (language === 'id') {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    }
  };

  // Format date based on language
  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (language === 'id') {
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(dateObj);
    } else {
      return new Intl.DateTimeFormat('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(dateObj);
    }
  };

  // Format number based on language
  const formatNumber = (num: number): string => {
    if (language === 'id') {
      return new Intl.NumberFormat('id-ID').format(num);
    } else {
      return new Intl.NumberFormat('en-US').format(num);
    }
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    formatCurrency,
    formatDate,
    formatNumber
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook to use language context
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Utility hook for quick translation access
export function useTranslation() {
  const { t, formatCurrency, formatDate, formatNumber, language } = useLanguage();
  return { t, formatCurrency, formatDate, formatNumber, language };
}