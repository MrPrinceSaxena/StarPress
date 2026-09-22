# Star Press Admin Panel: Comprehensive Product Management System
## Production-Ready Specification & Implementation Blueprint

---

## Executive Overview

This specification defines a **production-grade admin panel** enabling non-technical administrators to manage all product data (products, pricing, images, metadata, descriptions, variants, inventory) **without code intervention**. The system is built for **high volume, fast operations, and minimal friction**.

**Core Capabilities**:
- ✅ Product CRUD with drag-and-drop ordering
- ✅ Bulk image upload & intelligent optimization
- ✅ Rich text product descriptions with preview
- ✅ Dynamic pricing with tier/variant support
- ✅ SEO metadata management (OpenGraph, structured data)
- ✅ Product variants (color, size, material, custom attributes)
- ✅ Inventory tracking with low-stock alerts
- ✅ Category & collection management with hierarchies
- ✅ Search, filter, and advanced analytics
- ✅ Audit logs (who changed what, when)
- ✅ Bulk operations (CSV import/export, batch price updates)
- ✅ Real-time preview (how products appear on storefront)
- ✅ Scheduled publish/unpublish with calendar
- ✅ Role-based permissions (SUPER_ADMIN, EDITOR, VIEWER)

---

## 1. Database Schema & Data Models

### 1.1 Core Tables (Supabase PostgreSQL)

```sql
-- Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT, -- Rich HTML content from editor
  short_description VARCHAR(500), -- For product cards
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'draft', -- draft, published, archived
  featured BOOLEAN DEFAULT false,
  featured_position INT, -- For drag-and-drop ordering
  
  -- Pricing
  base_price DECIMAL(10, 2) NOT NULL,
  compare_at_price DECIMAL(10, 2), -- Strike-through price
  cost_per_unit DECIMAL(10, 2), -- For margin calculations
  discount_percentage INT,
  
  -- Inventory
  track_inventory BOOLEAN DEFAULT true,
  stock_quantity INT DEFAULT 0,
  low_stock_threshold INT DEFAULT 10,
  sku_variant_required BOOLEAN DEFAULT false,
  
  -- Metadata
  meta_title VARCHAR(255),
  meta_description VARCHAR(160),
  meta_keywords VARCHAR(500),
  og_image_id UUID REFERENCES product_images(id),
  
  -- Status & Timestamps
  published_at TIMESTAMP,
  unpublish_at TIMESTAMP,
  is_published BOOLEAN GENERATED ALWAYS AS (
    status = 'published' AND 
    (published_at IS NULL OR published_at <= NOW()) AND 
    (unpublish_at IS NULL OR unpublish_at > NOW())
  ) STORED,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT valid_status CHECK (status IN ('draft', 'published', 'archived')),
  CONSTRAINT valid_pricing CHECK (base_price > 0)
);

-- Product Images Table
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL, -- Cloudinary/S3 URL
  alt_text VARCHAR(255),
  title VARCHAR(255),
  position INT DEFAULT 0, -- For ordering
  is_primary BOOLEAN DEFAULT false,
  file_size INT, -- In bytes
  dimensions_width INT,
  dimensions_height INT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(product_id, position)
);

-- Product Variants Table
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_sku VARCHAR(50) UNIQUE NOT NULL,
  variant_name VARCHAR(255) NOT NULL, -- e.g., "Red / Large"
  
  -- Variant-specific attributes (JSON for flexibility)
  attributes JSONB, -- { "color": "red", "size": "L", "material": "cotton" }
  
  -- Variant-specific pricing & inventory
  price DECIMAL(10, 2),
  compare_at_price DECIMAL(10, 2),
  stock_quantity INT DEFAULT 0,
  weight DECIMAL(10, 2),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT variant_sku_format CHECK (variant_sku ~ '^[A-Z0-9\-]+$')
);

-- Categories Table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL, -- For nested categories
  position INT DEFAULT 0, -- For drag-and-drop ordering
  meta_title VARCHAR(255),
  meta_description VARCHAR(160),
  icon_url VARCHAR(500), -- Optional category icon
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Collections (Product groupings like "Summer 2024", "Best Sellers")
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  rules JSONB, -- Automated rules: { "tag": "summer", "min_price": 50 }
  sort_by VARCHAR(20) DEFAULT 'manual', -- manual, newest, best_selling
  position INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Product Collections (Many-to-many)
CREATE TABLE product_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  position INT DEFAULT 0, -- For ordering within collection
  UNIQUE(product_id, collection_id)
);

-- Audit Log
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  entity_type VARCHAR(50), -- 'product', 'category', 'price', 'image'
  entity_id UUID,
  action VARCHAR(20), -- 'create', 'update', 'delete', 'publish', 'bulk_import'
  changes JSONB, -- { "field": "price", "old_value": "29.99", "new_value": "34.99" }
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX (admin_id, created_at DESC),
  INDEX (entity_type, entity_id),
  INDEX (created_at DESC)
);

-- Inventory History (for low-stock alerts & tracking)
CREATE TABLE inventory_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  quantity_change INT,
  reason VARCHAR(50), -- 'sale', 'restock', 'adjustment', 'correction'
  reference_id VARCHAR(100), -- Order ID, etc.
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX (product_id, created_at DESC),
  INDEX (created_at DESC)
);
```

### 1.2 Database Indexes (Performance)

```sql
-- Product search indexes
CREATE INDEX idx_products_name_search ON products USING GIN(to_tsvector('english', name));
CREATE INDEX idx_products_description_search ON products USING GIN(to_tsvector('english', description));
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_status_published ON products(status, is_published) WHERE is_published = true;
CREATE INDEX idx_products_category ON products(category_id) WHERE status = 'published';

-- Variant quick lookup
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(variant_sku);

-- Image lookup
CREATE INDEX idx_images_product ON product_images(product_id);
```

---

## 2. Admin Panel Architecture

### 2.1 UI Structure (React Components)

```
src/app/admin/
├── products/
│   ├── page.tsx                 # Products list/table view
│   ├── [id]/
│   │   ├── page.tsx             # Product detail/edit page
│   │   ├── layout.tsx           # Product edit sidebar nav
│   │   └── sections/
│   │       ├── basic-info.tsx   # Name, SKU, slug, category
│   │       ├── description.tsx  # Rich editor (TipTap)
│   │       ├── images.tsx       # Image upload & management
│   │       ├── pricing.tsx      # Base price, discounts, compare-at
│   │       ├── inventory.tsx    # Stock, low-stock alerts, SKU variants
│   │       ├── variants.tsx     # Dynamic variant builder
│   │       ├── seo.tsx          # Meta tags, preview, OpenGraph
│   │       ├── publish.tsx      # Draft/publish status, scheduling
│   │       └── collections.tsx  # Assign to categories/collections
│   ├── new/
│   │   └── page.tsx             # New product wizard
│   └── bulk-import/
│       └── page.tsx             # CSV import
│
├── categories/
│   ├── page.tsx                 # Category management
│   └── [id]/page.tsx            # Edit category
│
├── collections/
│   ├── page.tsx                 # Collections list
│   └── [id]/page.tsx            # Edit collection
│
├── inventory/
│   └── page.tsx                 # Inventory view & adjustments
│
├── analytics/
│   └── page.tsx                 # Product performance, sales data
│
└── audit-logs/
    └── page.tsx                 # Admin activity log
```

### 2.2 Key Features by Section

#### **A. Products List View** (`src/app/admin/products/page.tsx`)

```typescript
// Features:
- DataTable with sorting, filtering, pagination
- Columns: SKU, Name, Category, Price, Stock, Status, Published, Actions
- Bulk actions: Select, Delete, Change Status, Export
- Advanced filters:
  * Category (multi-select dropdown)
  * Status (Draft, Published, Archived)
  * Stock (In Stock, Low Stock, Out of Stock)
  * Price range slider
  * Publication date range
  * Created by (admin user)
- Search: Full-text search across Name, SKU, Description
- Quick actions per row: Edit, Duplicate, View on Store, Archive
- Drag-and-drop to reorder featured products
- Bulk export to CSV
- Create new product button
```

**Example Code Structure**:
```typescript
// src/app/admin/products/page.tsx
'use client';

import { useCallback, useState } from 'react';
import { DataTable } from '@/components/admin/DataTable';
import { ProductFilters } from '@/components/admin/ProductFilters';
import { useProducts } from '@/hooks/admin/useProducts';

export default function ProductsAdminPage() {
  const [filters, setFilters] = useState({
    category: null,
    status: 'published',
    search: '',
    priceRange: [0, 10000],
    stockStatus: null,
  });

  const { products, loading, total, pageSize, currentPage } = useProducts(filters);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Products</h1>
        <button className="px-4 py-2 bg-brand-yellow text-black rounded-lg">
          + New Product
        </button>
      </div>

      <ProductFilters filters={filters} onChange={setFilters} />

      <DataTable
        columns={[
          { key: 'sku', label: 'SKU', sortable: true },
          { key: 'name', label: 'Name', searchable: true },
          { key: 'category', label: 'Category' },
          { key: 'basePrice', label: 'Price', numeric: true },
          { key: 'stock', label: 'Stock', numeric: true },
          { key: 'status', label: 'Status', badge: true },
          { key: 'isPublished', label: 'Published', boolean: true },
          { key: 'actions', label: 'Actions', width: 150 },
        ]}
        data={products}
        onRowClick={(product) => router.push(`/admin/products/${product.id}`)}
        bulkActions={['delete', 'changeStatus', 'export']}
      />
    </div>
  );
}
```

---

#### **B. Product Detail/Edit Page** (`src/app/admin/products/[id]/page.tsx`)

```typescript
// Layout: Left sidebar (section nav) + Main content area
// Sections (tabs):
// 1. Basic Info (Name, SKU, Slug, Category)
// 2. Description (Rich HTML editor with live preview)
// 3. Images (Upload, reorder, crop, alt text)
// 4. Pricing (Base, compare-at, discount %, margin calc)
// 5. Inventory (Stock, low-stock threshold, tracking toggle)
// 6. Variants (Dynamic builder: add/edit color, size, etc.)
// 7. SEO (Meta title, description, keywords, OpenGraph)
// 8. Publish (Draft/Publish toggle, scheduled publish/unpublish)
// 9. Collections (Assign to categories/collections)

// Features:
- Auto-save draft as you type (debounced)
- Unsaved changes warning
- Keyboard shortcuts (Cmd+S to save)
- Real-time preview (see how product looks on storefront)
- Related products suggestions
- Undo/Redo stack
- Comments (optional: allow team to leave notes)
- Revision history (view previous versions)
```

**Example: Basic Info Section**
```typescript
// src/app/admin/products/[id]/sections/basic-info.tsx
'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useCategories } from '@/hooks/admin/useCategories';

export function BasicInfoSection() {
  const { control, watch } = useFormContext();
  const { categories } = useCategories();
  const name = watch('name');

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Product Name *
        </label>
        <Input
          placeholder="e.g., Premium Coffee Mug"
          {...control.register('name')}
          maxLength={255}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          SKU (Stock Keeping Unit) *
        </label>
        <Input
          placeholder="e.g., COFFEE-MUG-01"
          {...control.register('sku')}
          pattern="^[A-Z0-9\-]+$"
          help="Letters, numbers, and hyphens only"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          URL Slug
        </label>
        <Input
          placeholder={name ? slugify(name) : 'auto-generated'}
          {...control.register('slug')}
          help="Auto-generated from name, edit if needed"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Category *
        </label>
        <Select
          options={categories.map(c => ({ value: c.id, label: c.name }))}
          {...control.register('categoryId')}
        />
      </div>
    </div>
  );
}
```

---

#### **C. Image Management** (`src/app/admin/products/[id]/sections/images.tsx`)

```typescript
// Features:
- Drag-and-drop upload (multiple files)
- Progress bar during upload
- Auto-resize & optimize (next-image, Cloudinary, or ImageKit)
- Crop tool (built-in or modal)
- Alt text editor (important for SEO & accessibility)
- Reorder via drag-and-drop
- Set primary image (featured)
- Delete with confirmation
- Image preview thumbnail
- File size indicator
- Bulk replace (upload multiple, replace in order)

// Upload flow:
// 1. Client selects image files
// 2. Client-side validation (format, size < 10MB)
// 3. Upload to server route (/api/admin/products/[id]/images/upload)
// 4. Server converts to optimized format, uploads to Cloudinary/S3
// 5. Server creates record in product_images table
// 6. Client receives image URL + ID
// 7. Admin can edit alt text, reorder
// 8. On save, image records are persisted

export function ImagesSection({ productId }) {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (files: File[]) => {
    setUploading(true);
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      const response = await fetch(
        `/api/admin/products/${productId}/images/upload`,
        { method: 'POST', body: formData }
      );
      const newImages = await response.json();
      setImages([...images, ...newImages]);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <DropZone onDrop={handleImageUpload} loading={uploading} />
      
      <div className="grid grid-cols-4 gap-4">
        {images.map((img, idx) => (
          <ImageCard
            key={img.id}
            image={img}
            isPrimary={idx === 0}
            onDelete={() => setImages(images.filter(i => i.id !== img.id))}
            onEditAlt={(alt) => setImages(
              images.map(i => i.id === img.id ? { ...i, altText: alt } : i)
            )}
          />
        ))}
      </div>
    </div>
  );
}
```

---

#### **D. Rich Text Editor (Description)** (`src/app/admin/products/[id]/sections/description.tsx`)

```typescript
// Tool: TipTap editor (or Slate, QuillJS)
// Features:
- Formatting: Bold, Italic, Underline, Strikethrough
- Headings: H1-H3
- Lists: Bullet, Numbered
- Links with preview
- Blockquotes
- Code blocks
- Embedded images
- Tables
- Character count
- Word count
- Undo/Redo
- Export as HTML or Markdown
- Preview pane (live side-by-side)
- AI suggestions (optional: "Auto-generate description" button)

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';

export function DescriptionSection() {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link,
    ],
    content: '<p>Start typing...</p>',
  });

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium">Product Description</label>
      <div className="grid grid-cols-2 gap-6">
        {/* Editor */}
        <div className="border border-slate-700 rounded-lg p-4 bg-slate-900">
          <EditorContent editor={editor} />
        </div>

        {/* Live Preview */}
        <div className="border border-slate-700 rounded-lg p-4 bg-slate-900">
          <h3 className="text-sm font-medium mb-4">Preview</h3>
          <div dangerouslySetInnerHTML={{ __html: editor?.getHTML() }} />
        </div>
      </div>
    </div>
  );
}
```

---

#### **E. Pricing Section** (`src/app/admin/products/[id]/sections/pricing.tsx`)

```typescript
// Features:
- Base Price (required)
- Compare-at Price (strike-through display)
- Cost per Unit (for margin calculation)
- Discount % (auto-calculates new price)
- Live margin calculator (Cost → Base → Compare)
- Price history (show previous prices)
- Bulk price update tool
- Automatic profit margin display
- Currency selector (if multi-currency)

export function PricingSection() {
  const { control, watch, formState } = useFormContext();
  const basePrice = watch('basePrice');
  const costPerUnit = watch('costPerUnit');
  const compareAtPrice = watch('compareAtPrice');

  const margin = costPerUnit && basePrice 
    ? (((basePrice - costPerUnit) / basePrice) * 100).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Base Price *</label>
          <InputGroup>
            <span className="text-slate-400">$</span>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              {...control.register('basePrice', { required: true })}
            />
          </InputGroup>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Cost per Unit</label>
          <InputGroup>
            <span className="text-slate-400">$</span>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              {...control.register('costPerUnit')}
              help="Used for margin calculation"
            />
          </InputGroup>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Compare-at Price</label>
          <InputGroup>
            <span className="text-slate-400">$</span>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              {...control.register('compareAtPrice')}
              help="Shows as strike-through on storefront"
            />
          </InputGroup>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Discount %</label>
          <InputGroup>
            <Input
              type="number"
              min="0"
              max="100"
              placeholder="0"
              onChange={(e) => {
                const discount = parseFloat(e.target.value) || 0;
                const newPrice = basePrice * (1 - discount / 100);
                // Update compareAtPrice
              }}
            />
            <span className="text-slate-400">%</span>
          </InputGroup>
        </div>
      </div>

      {/* Margin Calculator */}
      {margin && (
        <div className="p-4 bg-slate-800 rounded-lg">
          <p className="text-sm text-slate-300">Profit Margin</p>
          <p className="text-2xl font-bold text-green-400">{margin}%</p>
        </div>
      )}
    </div>
  );
}
```

---

#### **F. Variants Builder** (`src/app/admin/products/[id]/sections/variants.tsx`)

```typescript
// Features:
- Dynamic variant attribute builder (Color, Size, Material, etc.)
- Add/remove variant attributes
- Variant matrix: shows all combinations
- Per-variant SKU
- Per-variant pricing override
- Per-variant stock quantity
- Per-variant weight
- CSV import variants
- Duplicate variants
- Bulk variant operations

export function VariantsSection({ productId }) {
  const [variants, setVariants] = useState([]);
  const [attributes, setAttributes] = useState([]); // [{ name: 'Color', values: ['Red', 'Blue'] }]

  const generateMatrix = () => {
    // Generate all combinations of attributes
    const combinations = cartesian(...attributes.map(a => a.values));
    return combinations.map(combo => ({
      id: generateId(),
      name: combo.join(' / '),
      attributes: attributes.reduce((acc, attr, idx) => ({
        ...acc,
        [attr.name.toLowerCase()]: combo[idx]
      }), {}),
      sku: `${productSku}-${combo.join('-')}`,
      price: null,
      stock: 0,
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium">Variant Attributes</label>
        <div className="space-y-3 mt-3">
          {attributes.map((attr, idx) => (
            <div key={idx} className="flex gap-3">
              <Input placeholder="e.g., Color" value={attr.name} />
              <Input 
                placeholder="e.g., Red, Blue, Green (comma-separated)"
                value={attr.values.join(', ')}
              />
              <button onClick={() => setAttributes(attributes.filter((_, i) => i !== idx))}>
                Remove
              </button>
            </div>
          ))}
        </div>
        <button 
          onClick={() => setAttributes([...attributes, { name: '', values: [] }])}
          className="mt-3 text-brand-yellow text-sm font-medium"
        >
          + Add Attribute
        </button>
      </div>

      {attributes.length > 0 && (
        <>
          <button 
            onClick={() => setVariants(generateMatrix())}
            className="px-4 py-2 bg-brand-yellow text-black rounded-lg"
          >
            Generate {cartesian(...attributes.map(a => a.values)).length} Variants
          </button>

          <div className="overflow-x-auto">
            <VariantsTable 
              variants={variants}
              onVariantChange={(id, field, value) => {
                setVariants(variants.map(v => 
                  v.id === id ? { ...v, [field]: value } : v
                ));
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
```

---

#### **G. SEO Section** (`src/app/admin/products/[id]/sections/seo.tsx`)

```typescript
// Features:
- Meta Title (60 chars recommended)
- Meta Description (160 chars recommended)
- Meta Keywords
- OpenGraph image (for social sharing)
- OpenGraph title & description
- Twitter card settings
- Canonical URL
- URL preview (how it appears in Google)
- Real-time character count & warnings
- JSON-LD structured data preview
- Mobile preview

export function SEOSection({ productId }) {
  const { control, watch } = useFormContext();
  const metaTitle = watch('metaTitle');
  const metaDescription = watch('metaDescription');

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium">Meta Title</label>
        <Input
          placeholder={watch('name')}
          maxLength={60}
          {...control.register('metaTitle')}
        />
        <p className="text-xs text-slate-400 mt-1">
          {metaTitle?.length || 0} / 60 characters
          {metaTitle?.length > 60 && <span className="text-red-400"> (too long)</span>}
        </p>
      </div>

      <div>
        <label className="text-sm font-medium">Meta Description</label>
        <textarea
          placeholder="Brief description for search results..."
          maxLength={160}
          className="w-full h-20 p-2 bg-slate-800 border border-slate-700 rounded"
          {...control.register('metaDescription')}
        />
        <p className="text-xs text-slate-400 mt-1">
          {metaDescription?.length || 0} / 160 characters
        </p>
      </div>

      <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
        <p className="text-xs text-slate-400 mb-2">Google Search Preview</p>
        <div className="text-sm">
          <p className="text-blue-400 font-medium">{metaTitle || watch('name')}</p>
          <p className="text-green-600 text-xs">starpress.com/products/{watch('slug')}</p>
          <p className="text-slate-300 text-xs">
            {metaDescription || watch('shortDescription')}
          </p>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">OpenGraph Image</label>
        <ImagePicker
          onImageSelect={(image) => {
            // Set og_image_id
          }}
        />
      </div>
    </div>
  );
}
```

---

#### **H. Inventory Section** (`src/app/admin/products/[id]/sections/inventory.tsx`)

```typescript
// Features:
- Current stock quantity
- Low-stock threshold (alert when below)
- Track inventory toggle
- Stock adjustment interface
- Inventory history log
- SKU variant requirement toggle (for variant-specific tracking)
- Barcode scanning (optional)
- Stock by variant (if variants exist)
- Reorder point & automatic notifications

export function InventorySection({ productId }) {
  const { control, watch } = useFormContext();
  const [stockHistory, setStockHistory] = useState([]);

  const handleAdjustStock = async (quantity: number, reason: string) => {
    const response = await fetch(
      `/api/admin/products/${productId}/inventory/adjust`,
      {
        method: 'POST',
        body: JSON.stringify({ quantity, reason }),
      }
    );
    const updated = await response.json();
    setStockHistory([updated, ...stockHistory]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <input 
          type="checkbox" 
          {...control.register('trackInventory')}
          className="h-4 w-4"
        />
        <label className="text-sm font-medium">Track Inventory</label>
      </div>

      <div>
        <label className="text-sm font-medium">Current Stock</label>
        <div className="flex gap-3 items-center">
          <div className="text-3xl font-bold">{watch('stockQuantity')}</div>
          <button 
            onClick={() => handleAdjustStock(1, 'restock')}
            className="px-3 py-2 bg-green-600 rounded text-sm"
          >
            +1
          </button>
          <button 
            onClick={() => handleAdjustStock(-1, 'sale')}
            className="px-3 py-2 bg-red-600 rounded text-sm"
          >
            -1
          </button>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Low Stock Threshold</label>
        <Input
          type="number"
          min="0"
          {...control.register('lowStockThreshold')}
          help="Alerts when stock falls below this number"
        />
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3">Stock Adjustment History</h3>
        <div className="space-y-2">
          {stockHistory.map(entry => (
            <div key={entry.id} className="flex justify-between text-xs p-2 bg-slate-800 rounded">
              <span>{entry.reason}</span>
              <span>{entry.quantityChange > 0 ? '+' : ''}{entry.quantityChange}</span>
              <span className="text-slate-400">{formatDate(entry.createdAt)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

#### **I. Publish Section** (`src/app/admin/products/[id]/sections/publish.tsx`)

```typescript
// Features:
- Draft / Published toggle
- Publish date (optional: schedule for future)
- Unpublish date (optional: auto-unpublish)
- Preview link (view on storefront)
- Visibility toggle (visible in catalog vs hidden)
- Schedule publish/unpublish with calendar

export function PublishSection({ productId, productSlug }) {
  const { control, watch } = useFormContext();
  const status = watch('status');

  return (
    <div className="space-y-6">
      <div className="p-4 bg-slate-800 rounded-lg">
        <label className="text-sm font-medium">Status</label>
        <div className="flex gap-3 mt-3">
          {['draft', 'published', 'archived'].map(s => (
            <button
              key={s}
              onClick={() => control._formValues.status = s}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                status === s 
                  ? 'bg-brand-yellow text-black' 
                  : 'bg-slate-700 text-white'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {status === 'published' && (
        <>
          <div>
            <label className="text-sm font-medium">Publish Date</label>
            <Input type="datetime-local" {...control.register('publishedAt')} />
          </div>

          <div>
            <label className="text-sm font-medium">Unpublish Date (Optional)</label>
            <Input type="datetime-local" {...control.register('unpublishAt')} />
            <p className="text-xs text-slate-400 mt-1">Leave empty to keep published indefinitely</p>
          </div>
        </>
      )}

      <a 
        href={`/products/${productSlug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium hover:bg-blue-700"
      >
        Preview on Storefront →
      </a>
    </div>
  );
}
```

---

### 2.3 Advanced Features

#### **Bulk CSV Import** (`src/app/admin/products/bulk-import/page.tsx`)

```typescript
// Features:
- Upload CSV file
- Map columns (SKU, Name, Price, Description, etc.)
- Preview data before import
- Validation errors highlighted
- Import progress bar
- Rollback if errors
- Create or update existing products
- Bulk variant import

export function BulkImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  const handleFileSelect = async (file: File) => {
    const csv = await file.text();
    const rows = csv.split('\n').map(row => row.split(','));
    setPreview(rows.slice(0, 10)); // Preview first 10 rows
  };

  const handleImport = async () => {
    setImporting(true);
    const formData = new FormData();
    formData.append('file', file!);

    const response = await fetch('/api/admin/products/bulk-import', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    // Show result: X products imported, Y errors
    setImporting(false);
  };

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Bulk Import Products</h1>

      <div className="space-y-6">
        <DropZone
          accept=".csv"
          onDrop={(files) => handleFileSelect(files[0])}
        />

        {preview.length > 0 && (
          <div>
            <h2 className="text-lg font-medium mb-4">Preview (First 10 rows)</h2>
            <table className="w-full text-sm border border-slate-700">
              <thead className="bg-slate-800">
                <tr>
                  {preview[0]?.map((header, i) => (
                    <th key={i} className="p-2 text-left">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(1).map((row, i) => (
                  <tr key={i} className="border-t border-slate-700">
                    {row.map((cell, j) => (
                      <td key={j} className="p-2">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={importing || !file}
          className="px-6 py-2 bg-brand-yellow text-black rounded-lg font-medium disabled:opacity-50"
        >
          {importing ? 'Importing...' : 'Import Products'}
        </button>
      </div>
    </div>
  );
}
```

---

#### **Analytics Dashboard** (`src/app/admin/analytics/page.tsx`)

```typescript
// Features:
- Best-selling products (by quantity & revenue)
- Revenue by category
- Low stock alerts
- Recently added products
- Top-performing products (views, conversions)
- Sales trend chart (last 30 days)
- Avg order value
- Products with no sales (dead stock)
- Price performance analysis

export function AnalyticsDashboard() {
  const { analytics, loading } = useProductAnalytics();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Product Analytics</h1>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Total Products"
          value={analytics.totalProducts}
          trend="+5 this month"
        />
        <StatCard
          title="Total Revenue"
          value={`$${analytics.totalRevenue.toFixed(2)}`}
          trend="+12% this month"
        />
        <StatCard
          title="Avg Order Value"
          value={`$${analytics.avgOrderValue.toFixed(2)}`}
        />
        <StatCard
          title="Low Stock Alerts"
          value={analytics.lowStockCount}
          highlight={analytics.lowStockCount > 0}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Chart type="line" data={analytics.salesTrendData} title="Sales Trend (30 Days)" />
        <Chart type="bar" data={analytics.topProductsData} title="Top 5 Products" />
      </div>

      <ProductTable
        data={analytics.bestSellingProducts}
        columns={['name', 'unitsSold', 'revenue', 'margin']}
      />
    </div>
  );
}
```

---

#### **Audit Logs** (`src/app/admin/audit-logs/page.tsx`)

```typescript
// Features:
- View all admin actions (create, update, delete, publish)
- Filter by: Admin, Entity Type, Action, Date Range
- See before/after values for updates
- Revert to previous version (optional)
- Export audit log

export function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState({ admin: null, type: null, action: null });

  useEffect(() => {
    const fetchLogs = async () => {
      const response = await fetch('/api/admin/audit-logs', {
        method: 'POST',
        body: JSON.stringify(filter),
      });
      const data = await response.json();
      setLogs(data);
    };
    fetchLogs();
  }, [filter]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Audit Logs</h1>

      <div className="flex gap-3">
        <Select
          label="Admin"
          options={admins}
          onChange={(val) => setFilter({ ...filter, admin: val })}
        />
        <Select
          label="Entity Type"
          options={['product', 'category', 'price', 'image']}
          onChange={(val) => setFilter({ ...filter, type: val })}
        />
        <Select
          label="Action"
          options={['create', 'update', 'delete', 'publish']}
          onChange={(val) => setFilter({ ...filter, action: val })}
        />
      </div>

      <table className="w-full text-sm border border-slate-700">
        <thead className="bg-slate-800">
          <tr>
            <th className="p-3 text-left">Admin</th>
            <th className="p-3 text-left">Entity</th>
            <th className="p-3 text-left">Action</th>
            <th className="p-3 text-left">Changes</th>
            <th className="p-3 text-left">Date</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id} className="border-t border-slate-700">
              <td className="p-3">{log.adminName}</td>
              <td className="p-3">{log.entityType}</td>
              <td className="p-3 text-yellow-400">{log.action}</td>
              <td className="p-3 text-xs">
                <details>
                  <summary>View changes</summary>
                  <pre className="text-xs mt-2">
                    {JSON.stringify(log.changes, null, 2)}
                  </pre>
                </details>
              </td>
              <td className="p-3 text-slate-400">{formatDate(log.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 3. API Endpoints (Backend)

```typescript
// GET /api/admin/products
// List products with pagination, filters, search
// Query params: ?page=1&limit=20&category=uuid&search=coffee&status=published

// POST /api/admin/products
// Create new product

// GET /api/admin/products/[id]
// Get product details

// PATCH /api/admin/products/[id]
// Update product

// DELETE /api/admin/products/[id]
// Delete product

// POST /api/admin/products/[id]/images/upload
// Upload product images (multipart/form-data)

// POST /api/admin/products/[id]/variants
// Create product variant

// PATCH /api/admin/products/[id]/variants/[variantId]
// Update variant

// DELETE /api/admin/products/[id]/variants/[variantId]
// Delete variant

// POST /api/admin/products/[id]/inventory/adjust
// Adjust stock quantity

// POST /api/admin/products/bulk-import
// Bulk import products from CSV

// POST /api/admin/products/bulk-export
// Export products to CSV

// GET /api/admin/categories
// List categories

// POST /api/admin/categories
// Create category

// GET /api/admin/collections
// List collections

// POST /api/admin/products/[id]/publish
// Publish product

// POST /api/admin/products/[id]/unpublish
// Unpublish product

// GET /api/admin/analytics
// Get analytics data

// GET /api/admin/audit-logs
// Get audit logs
```

---

## 4. Security & Permissions

### Role-Based Access Control (RBAC)

```typescript
// app_metadata.role values:
// - SUPER_ADMIN: Full access to all admin features
// - EDITOR: Can create, edit, delete products; cannot change settings
// - VIEWER: Read-only access to products, analytics
// - INVENTORY_MANAGER: Can adjust inventory, view analytics

// Middleware checks role on every admin request
// API routes verify role before executing

export async function requireAdminRole(requiredRole: string) {
  const user = await getAuthenticatedUser();
  const userRole = user?.app_metadata?.role;
  
  const roleHierarchy = {
    'VIEWER': 1,
    'INVENTORY_MANAGER': 2,
    'EDITOR': 3,
    'SUPER_ADMIN': 4,
  };

  if ((roleHierarchy[userRole] || 0) < roleHierarchy[requiredRole]) {
    throw new Error('Insufficient permissions');
  }
}
```

---

## 5. Development Roadmap

### Phase 1: Core Features 
- ✅ Database schema & migrations
- ✅ Products list & detail pages
- ✅ Basic CRUD operations
- ✅ Image upload & management

### Phase 2: Advanced Features
- ✅ Rich text editor
- ✅ Variants builder
- ✅ SEO section
- ✅ Pricing & inventory

### Phase 3: Scale & Polish
- ✅ Bulk import/export
- ✅ Analytics dashboard
- ✅ Audit logs
- ✅ Performance optimization
- ✅ UI/UX refinements

---

## 6. Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **Styling** | Tailwind CSS, Radix UI |
| **State Management** | React Hook Form, TanStack Query |
| **Rich Editor** | TipTap or Slate |
| **Image Storage** | Cloudinary or AWS S3 |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |
| **Charts** | Recharts or Chart.js |

---

## 7. Code Quality & Testing

```bash
# Unit tests for critical business logic
npm run test

# E2E tests for admin workflows
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## 8. Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] API endpoints tested
- [ ] Image upload service configured (Cloudinary/S3)
- [ ] Admin roles assigned in Supabase
- [ ] Audit logging enabled
- [ ] Performance tested (bulk operations, large product catalogs)
- [ ] Security audit completed
- [ ] Team trained on admin panel workflows

---

## 9. Future Enhancements

- AI-powered product descriptions & meta tags
- Inventory forecasting
- Price optimization (dynamic pricing)
- Multi-language product descriptions
- Product templates
- Bulk discounts & promotions
- Product recommendations
- A/B testing variants
- Integration with accounting software
- White-label admin panel for clients
