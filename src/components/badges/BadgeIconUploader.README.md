# BadgeIconUploader Component

Complete image upload component for badge icons with drag & drop support, validation, and progress tracking.

## Features

- **Drag & Drop**: Native HTML5 drag and drop for intuitive file uploads
- **Click to Browse**: Traditional file picker as fallback
- **Image Preview**: Shows preview before and after upload
- **Upload Progress**: Visual feedback during upload with progress indicator
- **Validation**:
  - File size limit (2MB max)
  - File type validation (PNG, JPG, JPEG, SVG, WebP)
  - Dimension validation (1024x1024px max for raster images)
- **Delete/Replace**: Easy deletion and replacement of existing icons
- **Error Handling**: Clear Norwegian error messages for all validation failures
- **Accessibility**: Full keyboard navigation and ARIA labels
- **Responsive**: Works on all screen sizes

## Props

```typescript
interface BadgeIconUploaderProps {
  /** Current icon URL (if badge already has an icon) */
  currentIconUrl?: string | null;

  /** Badge code for naming uploaded file (optional) */
  badgeCode?: string;

  /** Callback when upload completes successfully */
  onUploadComplete: (url: string, path: string) => void;

  /** Optional callback when icon is deleted */
  onDelete?: () => void;

  /** Disable upload interactions */
  disabled?: boolean;
}
```

## Basic Usage

```tsx
import { BadgeIconUploader } from '../../components/badges';

function BadgeForm() {
  const [iconUrl, setIconUrl] = useState<string>('');

  return (
    <BadgeIconUploader
      currentIconUrl={iconUrl || null}
      badgeCode="my_badge"
      onUploadComplete={(url, path) => {
        console.log('Upload complete:', { url, path });
        setIconUrl(url);
      }}
      onDelete={() => {
        console.log('Icon deleted');
        setIconUrl('');
      }}
    />
  );
}
```

## Integration in Badge Admin Form

```tsx
import { useState } from 'react';
import { BadgeIconUploader } from '../../components/badges';
import type { CreateBadgeFormData } from '../../types/badges';

function CreateBadgeForm() {
  const [formData, setFormData] = useState<CreateBadgeFormData>({
    code: '',
    title: '',
    description: '',
    category: 'session',
    tier: 'bronze',
    tier_order: 1,
    icon_url: '',
    criteria: { type: 'threshold', conditions: [] },
    is_active: true,
    is_automatic: true,
    points: 10,
  });

  const handleUploadComplete = (url: string, path: string) => {
    // Update form data with the new icon URL
    setFormData(prev => ({
      ...prev,
      icon_url: url,
    }));
  };

  const handleDeleteIcon = () => {
    // Clear icon from form data
    setFormData(prev => ({
      ...prev,
      icon_url: undefined,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Submit formData to Supabase
    const { data, error } = await supabase
      .from('badges')
      .insert([formData])
      .select()
      .single();

    if (error) throw error;
    console.log('Badge created:', data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <BadgeIconUploader
        currentIconUrl={formData.icon_url || null}
        badgeCode={formData.code || undefined}
        onUploadComplete={handleUploadComplete}
        onDelete={handleDeleteIcon}
        disabled={!formData.code} // Disable until code is entered
      />

      {/* Rest of form fields */}
    </form>
  );
}
```

## Upload Flow

1. **File Selection**
   - User drags file over drop zone → visual feedback (blue border)
   - User drops file OR clicks to browse and selects file

2. **Validation**
   - File size checked (max 2MB)
   - File type validated (PNG, JPG, JPEG, SVG, WebP)
   - For non-SVG: dimensions checked (max 1024x1024px)
   - If validation fails → error alert shown with specific message

3. **Preview**
   - Valid file creates local object URL
   - Preview shown in Avatar component

4. **Upload**
   - File uploaded to Supabase Storage via `uploadBadgeIcon()`
   - Progress indicator shown (simulated 0-100%)
   - Uploaded to `badge-icons` bucket with filename based on `badgeCode`

5. **Completion**
   - `onUploadComplete` callback fired with public URL and storage path
   - Success message shown for 3 seconds
   - Preview URL cleaned up

## Error Handling

The component displays Norwegian error messages for:

- **File too large**: "Filstørrelsen må være mindre enn 2MB. Nåværende størrelse: X.XXMBˮ
- **Invalid type**: "Ugyldig filtype. Tillatte typer: PNG, JPG, JPEG, SVG, WebP. Mottok: [type]"
- **Dimensions too large**: "Bildedimensjoner må være 1024x1024px eller mindre. Mottok: WxH px"
- **Upload failure**: Error message from Supabase Storage
- **Delete failure**: Error message from Supabase Storage

## Accessibility

- **Keyboard Navigation**: Drop zone is focusable with `tabIndex={0}`
- **Enter/Space**: Triggers file picker when drop zone is focused
- **ARIA Labels**:
  - Drop zone: `aria-label="Last opp badge-ikon"`
  - Delete button: `aria-label="Slett ikon"`
- **Screen Reader**: All status messages in alerts are announced

## Validation Rules

### File Size
- Maximum: 2MB (2,097,152 bytes)
- Validation happens before upload
- Large files rejected with clear message

### File Types
Allowed MIME types:
- `image/png` - PNG images
- `image/jpeg` - JPEG images
- `image/jpg` - JPG images (alternative MIME)
- `image/svg+xml` - SVG vector graphics
- `image/webp` - WebP images

### Dimensions
- Maximum: 1024 x 1024 pixels
- **SVG files exempt** from dimension check
- Raster images validated by loading into Image element

## Storage Integration

Uses `storageHelpers.ts` utilities:

```typescript
// Validate before upload
const validation = await validateBadgeIcon(file);
if (!validation.valid) {
  // Show error
}

// Upload file
const result = await uploadBadgeIcon(file, badgeCode);
// result = { url: string, path: string }

// Delete existing icon
await deleteBadgeIcon(urlOrPath);
```

## File Naming

Files are named based on `badgeCode` prop:
- With `badgeCode`: `{badgeCode}.{extension}` (e.g., `first_drink.png`)
- Without `badgeCode`: `{timestamp}-{sanitized_filename}` (e.g., `1699449600000-my_icon.png`)

Files are uploaded to Supabase Storage bucket `badge-icons` with `upsert: true`, allowing overwrites.

## Styling

Component uses MUI components with inline sx props:

- **Drop Zone**: Dashed border, hover effects, drag state styling
- **Preview**: 120x120px Avatar with border
- **Delete Button**: Positioned absolute, red theme
- **Alerts**: MUI Alert components for errors/success
- **Progress**: MUI CircularProgress with determinate mode

All colors follow project color scheme:
- Primary blue: `#3b82f6`
- Error red: `#dc2626`
- Neutral grays: `#f3f4f6`, `#e5e7eb`, `#9ca3af`

## Testing

Manual testing checklist:

- [ ] Drag and drop PNG file under 2MB
- [ ] Drag and drop file over 2MB (should reject)
- [ ] Drag and drop non-image file (should reject)
- [ ] Click to browse and select valid file
- [ ] Upload very large image (should check dimensions)
- [ ] Upload SVG (should skip dimension check)
- [ ] Replace existing icon
- [ ] Delete existing icon
- [ ] Keyboard navigation (Tab to focus, Enter to open picker)
- [ ] Disabled state (all interactions blocked)
- [ ] Error messages display correctly
- [ ] Success messages auto-dismiss after 3 seconds

## Performance

- **Preview URLs**: Cleaned up with `URL.revokeObjectURL()` to prevent memory leaks
- **Progress Simulation**: Uses interval cleared on completion
- **Optimistic UI**: Preview shown immediately while upload happens
- **Debouncing**: Not needed (single file upload)

## Known Limitations

1. **Upload Progress**: Supabase Storage doesn't provide real upload progress, so progress bar is simulated (0-90% during upload, 100% on complete)
2. **File Size Check**: Client-side only; Supabase Storage also enforces limits
3. **Image Validation**: Dimensions checked by loading into Image element; SVG files skip this check

## Future Enhancements

Potential improvements:

- [ ] Image cropper for resizing large images
- [ ] Multiple file upload support
- [ ] Drag to reorder multiple icons
- [ ] Image optimization (compression) before upload
- [ ] Cloud image processing (resize, optimize)
- [ ] Preview of different badge sizes (16px, 32px, 64px)
