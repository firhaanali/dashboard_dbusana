-- Migration: Add ADVERTISING_SETTLEMENT to ImportType enum
-- This fixes the error: Invalid value for argument `import_type`. Expected ImportType.

-- Add the new enum value to ImportType
ALTER TYPE "ImportType" ADD VALUE IF NOT EXISTS 'ADVERTISING_SETTLEMENT';

-- The enum now supports both snake_case and UPPER_CASE values:
-- - advertising_settlement (existing)
-- - ADVERTISING_SETTLEMENT (new)

-- This ensures backward compatibility while supporting the new format
-- used by the advertising settlement import controller