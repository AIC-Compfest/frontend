# Panduan Integrasi BatchHitlReviewModal v2

## 📋 Ringkas

Revamp BatchHitlReviewModal dari layout tabel tradisional menjadi **side-by-side comparison** dengan:
- PDF/Gambar asli di panel kiri (tanpa button "Lihat PDF")
- Field review cards di panel kanan (expandable)
- Cuplikan sumber terintegrasi untuk easy comparison

## 🔧 Langkah Implementasi

### 1. File Baru
```
frontend/src/app/dashboard/components/BatchHitlReviewModal_v2.tsx
```

### 2. Update Import di Dashboard Page
File: `frontend/src/app/dashboard/page.tsx`

```typescript
// Cari import BatchHitlReviewModal
import { BatchHitlReviewModal } from "./components/BatchHitlReviewModal";

// Ganti dengan
import { BatchHitlReviewModal_v2 } from "./components/BatchHitlReviewModal_v2";
```

### 3. Update Component Usage
Cari tempat penggunaan `<BatchHitlReviewModal>` dan ganti nama:

```typescript
// Sebelumnya
{showBatchAudit && (
  <BatchHitlReviewModal
    documentIds={selectedDocuments}
    onClose={() => setShowBatchAudit(false)}
    onFinalized={handleBatchFinalized}
  />
)}

// Sekarang
{showBatchAudit && (
  <BatchHitlReviewModal_v2
    documentIds={selectedDocuments}
    onClose={() => setShowBatchAudit(false)}
    onFinalized={handleBatchFinalized}
  />
)}
```

### 4. Build & Test
```bash
cd frontend
npm run build
```

Jika ada error, likely karena:
- Import path salah → check file path
- TypeScript types → semua props sama dengan v1
- Missing dependencies → tidak ada dependency baru

## 🎨 Visual Perubahan

### Layout Lama (Tabel)
```
┌─────────────────────────────────┐
│ Header + "Lihat PDF" button      │
├─────────────────────────────────┤
│ Tabel                           │
│ Field 1 | Nilai | Confidence 85%│
│ Field 2 | Nilai | Confidence 90%│
│ Field 3 | Nilai | Confidence 75%│
│                                 │
│ User harus click button untuk   │
│ melihat PDF di modal baru       │
└─────────────────────────────────┘
```

### Layout Baru (Side-by-Side)
```
┌──────────────┬──────────────────┐
│ PDF Preview  │ Field Review     │
│ (Embed)      │ (Expand/Collapse)│
│              │                  │
│ ✓ Langsung   │ ✓ Click field    │
│   visible    │   untuk expand   │
│ ✓ Scroll/    │ ✓ Lihat detail   │
│   Zoom works │ ✓ Source snippet │
│ ✓ No modal   │ ✓ Approve/Reject │
│              │                  │
│              │ Field 1 (85%)    │
│              │ Field 2 (90%)    │
│              │ Field 3 (75%)    │
└──────────────┴──────────────────┘
```

## 💡 User Experience Improvements

### ⏰ Sebelumnya (v1 - Modal)
1. Baca field di tabel
2. Click "Lihat PDF/Gambar"
3. Modal PDF membuka
4. Review di PDF
5. Close modal
6. Kembali ke tabel
7. Repeat untuk field berikutnya

**Total: 6-7 interaksi per field** ❌

### ⚡ Sekarang (v2 - Side-by-Side)
1. PDF sudah terlihat di kiri
2. Click field card untuk expand
3. Baca prediksi + source snippet
4. Compare dengan PDF (sebelah kiri)
5. Approve/Reject
6. Next field
7. Repeat

**Total: 3-4 interaksi per field** ✅

## 🔍 Key Changes di Component

### State Baru
```typescript
// Untuk track expanded field
const [viewState, setViewState] = useState<PredictionViewState>({
  expandedPredicationId: null,
});

// Untuk manage PDF loading
const [pdfUrl, setPdfUrl] = useState<string | null>(null);
const [pdfLoading, setPdfLoading] = useState(false);
```

### Layout Structure
```
<div className="flex h-full overflow-hidden">
  {/* Left: PDF Panel (40%) */}
  <div className="w-2/5 border-r border-slate-200">
    <iframe src={pdfUrl} />
  </div>

  {/* Right: Fields Panel (60%) */}
  <div className="w-3/5 overflow-y-auto p-5 space-y-3">
    {visiblePredictions(active).map(prediction => (
      <div className="rounded-lg border px-4 py-3">
        {/* Header - always visible */}
        {/* Details - expand on click */}
      </div>
    ))}
  </div>
</div>
```

### Field Card Detail Sections
Setiap field card memiliki sections:

1. **Header** (always visible)
   - Field name
   - Confidence score
   - Status badge
   - Expand/collapse button

2. **Hasil Mapping** (expand)
   - Predicted value
   - Formatted (table/text)

3. **Cuplikan Sumber** (expand)
   - Raw text dari PDF
   - Monospace font untuk readability
   - Whitespace preserved

4. **Warnings** (expand)
   - Low confidence indicator
   - Manual check needed
   - Pattern not clear

5. **Actions** (expand)
   - Approve button
   - Correct button + input field
   - Validation errors

## 📊 Responsive Behavior

### Desktop (1280px+)
- PDF: 40% (fixed width)
- Fields: 60%
- Full interface visible

### Tablet (768px - 1279px)
- PDF: 35%
- Fields: 65%
- Slightly compressed

### Mobile (< 768px)
- PDF: Stacked on top (100%)
- Fields: Below (100%)
- Full height scroll

## 🚀 Performance Considerations

1. **PDF Loading**
   - Lazy loaded - hanya saat tab aktif
   - Cached di browser
   - No re-render saat expand/collapse field

2. **Field Cards**
   - Only expanded card renders details
   - Other cards collapsed untuk reduce DOM nodes
   - Smooth transition dengan CSS

3. **Memory**
   - Profiles state minimal
   - Corrections stored di memory (not localStorage)
   - PDF iframe reused (not recreated)

## ✅ Testing Checklist

- [ ] Component imports without error
- [ ] PDF loads when tab changes
- [ ] Field cards expand/collapse
- [ ] Approval buttons work
- [ ] Correction input appears
- [ ] Batch finalization works
- [ ] Mobile layout responsive
- [ ] No console errors
- [ ] Performance acceptable

## 🔗 Related Files

- `frontend/src/app/dashboard/page.tsx` - Main dashboard
- `frontend/src/app/dashboard/components/TablePayloadView.tsx` - Table display
- `frontend/src/lib/review.ts` - Review utilities
- `frontend/src/lib/api.ts` - API calls

## 📞 Support

Jika ada issue:

1. Check console untuk errors
2. Verify file path: `BatchHitlReviewModal_v2.tsx`
3. Check import path di dashboard
4. Verify TypeScript build passes
5. Check PDF iframe source URL valid

## 🎯 Next Steps

1. ✅ Create new component file
2. ✅ Update imports in dashboard
3. ⏳ Build & test
4. ⏳ Deploy
5. ⏳ Monitor UX metrics

