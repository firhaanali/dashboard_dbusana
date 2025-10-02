-- Migration 005: Add Supplier and Purchase Order tables
-- Date: 2024-12-20
-- Description: Adds supplier management and purchase order functionality

-- Create Supplier Status enum
CREATE TYPE "SupplierStatus" AS ENUM ('active', 'inactive', 'pending');

-- Create Purchase Order Status enum
CREATE TYPE "POStatus" AS ENUM ('draft', 'sent', 'confirmed', 'partial', 'delivered', 'cancelled');

-- Create Suppliers table
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_person" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "SupplierStatus" NOT NULL DEFAULT 'active',
    "payment_terms" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- Create Purchase Orders table
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "po_number" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "po_date" TIMESTAMP(3) NOT NULL,
    "expected_date" TIMESTAMP(3) NOT NULL,
    "delivery_date" TIMESTAMP(3),
    "status" "POStatus" NOT NULL DEFAULT 'draft',
    "total_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "items_count" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- Create Purchase Order Items table
CREATE TABLE "purchase_order_items" (
    "id" TEXT NOT NULL,
    "purchase_order_id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "total_price" DOUBLE PRECISION NOT NULL,
    "received_quantity" DOUBLE PRECISION DEFAULT 0,
    "unit" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints
CREATE UNIQUE INDEX "suppliers_code_key" ON "suppliers"("code");
CREATE UNIQUE INDEX "purchase_orders_po_number_key" ON "purchase_orders"("po_number");
CREATE UNIQUE INDEX "purchase_order_items_purchase_order_id_material_id_key" ON "purchase_order_items"("purchase_order_id", "material_id");

-- Create indexes for performance
CREATE INDEX "suppliers_category_idx" ON "suppliers"("category");
CREATE INDEX "suppliers_status_idx" ON "suppliers"("status");
CREATE INDEX "suppliers_name_idx" ON "suppliers"("name");

CREATE INDEX "purchase_orders_supplier_id_idx" ON "purchase_orders"("supplier_id");
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders"("status");
CREATE INDEX "purchase_orders_po_date_idx" ON "purchase_orders"("po_date");
CREATE INDEX "purchase_orders_expected_date_idx" ON "purchase_orders"("expected_date");

CREATE INDEX "purchase_order_items_purchase_order_id_idx" ON "purchase_order_items"("purchase_order_id");
CREATE INDEX "purchase_order_items_material_id_idx" ON "purchase_order_items"("material_id");

-- Add foreign key constraints
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Tables are ready for data input
-- No sample data inserted - ready for user input

COMMIT;