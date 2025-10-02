-- Add advertising/marketing data table to D'Busana Fashion Dashboard
-- Migration 003: Add advertising data tracking

-- Create enum types for advertising
CREATE TYPE "CampaignType" AS ENUM ('search', 'display', 'video', 'shopping', 'social', 'influencer', 'email', 'affiliate');
CREATE TYPE "Platform" AS ENUM ('google_ads', 'facebook_ads', 'instagram_ads', 'tiktok_ads', 'shopee_ads', 'tokopedia_ads', 'lazada_ads', 'youtube_ads', 'linkedin_ads', 'twitter_ads', 'other');

-- Update ImportType enum to include advertising
ALTER TYPE "ImportType" ADD VALUE 'advertising';

-- Create advertising_data table
CREATE TABLE "advertising_data" (
    "id" TEXT NOT NULL,
    "campaign_name" TEXT NOT NULL,
    "campaign_type" "CampaignType" NOT NULL,
    "platform" "Platform" NOT NULL,
    "ad_group_name" TEXT,
    "keyword" TEXT,
    "ad_creative" TEXT,
    "date_range_start" TIMESTAMP(3) NOT NULL,
    "date_range_end" TIMESTAMP(3) NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cpc" DOUBLE PRECISION,
    "cpm" DOUBLE PRECISION,
    "cpa" DOUBLE PRECISION,
    "ctr" DOUBLE PRECISION,
    "conversion_rate" DOUBLE PRECISION,
    "roas" DOUBLE PRECISION,
    "marketplace" TEXT,
    "import_batch_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advertising_data_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "advertising_data" ADD CONSTRAINT "advertising_data_import_batch_id_fkey" FOREIGN KEY ("import_batch_id") REFERENCES "import_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes for performance
CREATE INDEX "advertising_data_campaign_name_idx" ON "advertising_data"("campaign_name");
CREATE INDEX "advertising_data_platform_idx" ON "advertising_data"("platform");
CREATE INDEX "advertising_data_date_range_start_idx" ON "advertising_data"("date_range_start");
CREATE INDEX "advertising_data_date_range_end_idx" ON "advertising_data"("date_range_end");
CREATE INDEX "advertising_data_marketplace_idx" ON "advertising_data"("marketplace");

-- Insert sample advertising data for testing
INSERT INTO "advertising_data" (
    "id",
    "campaign_name",
    "campaign_type",
    "platform",
    "ad_group_name",
    "keyword",
    "ad_creative",
    "date_range_start",
    "date_range_end",
    "impressions",
    "clicks",
    "conversions",
    "cost",
    "revenue",
    "cpc",
    "cpm",
    "cpa",
    "ctr",
    "conversion_rate",
    "roas",
    "marketplace",
    "created_at",
    "updated_at"
) VALUES 
    (
        'sample_ad_001',
        'Fashion Summer Collection 2024',
        'social',
        'tiktok_ads',
        'Women Clothing',
        'dress fashion trendy',
        'Summer Dress Collection Video',
        '2024-01-01 00:00:00',
        '2024-01-31 23:59:59',
        15000,
        450,
        25,
        750000,
        2500000,
        1666.67,
        50000,
        30000,
        3.0,
        5.56,
        3.33,
        'TikTok Shop',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'sample_ad_002',
        'Ramadan Fashion Collection',
        'search',
        'google_ads',
        'Muslim Fashion',
        'baju muslim ramadan',
        'Elegant Ramadan Collection',
        '2024-03-01 00:00:00',
        '2024-04-30 23:59:59',
        25000,
        800,
        60,
        1200000,
        6000000,
        1500,
        48000,
        20000,
        3.2,
        7.5,
        5.0,
        'Shopee',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'sample_ad_003',
        'Back to School Fashion',
        'display',
        'facebook_ads',
        'Student Fashion',
        'seragam sekolah fashion',
        'Back to School Banner',
        '2024-07-01 00:00:00',
        '2024-08-31 23:59:59',
        30000,
        600,
        40,
        900000,
        4000000,
        1500,
        30000,
        22500,
        2.0,
        6.67,
        4.44,
        'Tokopedia',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'sample_ad_004',
        'Lebaran Fashion Promo',
        'video',
        'instagram_ads',
        'Lebaran Collection',
        'baju lebaran 2024',
        'Lebaran Fashion Video Ad',
        '2024-04-01 00:00:00',
        '2024-05-15 23:59:59',
        20000,
        520,
        35,
        800000,
        3500000,
        1538.46,
        40000,
        22857.14,
        2.6,
        6.73,
        4.38,
        'Lazada',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'sample_ad_005',
        'New Year Fashion Sale',
        'shopping',
        'shopee_ads',
        'Year End Sale',
        'fashion sale murah',
        'New Year Sale Banner',
        '2024-12-15 00:00:00',
        '2024-12-31 23:59:59',
        18000,
        720,
        50,
        1000000,
        5000000,
        1388.89,
        55555.56,
        20000,
        4.0,
        6.94,
        5.0,
        'TikTok Shop',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );

-- Verification queries
SELECT 'Advertising table created successfully' as status;
SELECT COUNT(*) as sample_records_count FROM "advertising_data";
SELECT DISTINCT platform, campaign_type FROM "advertising_data" ORDER BY platform, campaign_type;