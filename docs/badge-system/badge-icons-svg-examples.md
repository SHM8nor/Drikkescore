# Christmas Badge SVG Icons

This document contains SVG code examples for each Christmas badge. These are simple, clean designs that match the Norwegian Christmas theme.

## Icon Specifications

- **Size:** 128x128px viewBox
- **Format:** SVG (scalable)
- **Colors:**
  - Christmas Green: `#165B33`
  - Christmas Red: `#C41E3A`
  - Gold: `#FFD700`
  - White: `#FFFFFF`
  - Dark: `#002333`

## How to Use These Icons

1. Save each SVG code block as a separate `.svg` file
2. Upload to Supabase Storage bucket `badge-icons/christmas/`
3. Update badge records with the public URLs

---

## 1. Juleglede (Christmas Tree) - Bronze

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <!-- Tree trunk -->
  <rect x="54" y="90" width="20" height="24" fill="#8B4513"/>

  <!-- Tree layers (bottom to top) -->
  <polygon points="64,95 30,95 40,75" fill="#165B33"/>
  <polygon points="64,75 35,75 45,55" fill="#1e7d47"/>
  <polygon points="64,55 40,55 50,35" fill="#2a9960"/>
  <polygon points="64,35 45,35 64,15" fill="#36b577"/>

  <!-- Star on top -->
  <polygon points="64,12 66,18 72,18 67,22 69,28 64,24 59,28 61,22 56,18 62,18" fill="#FFD700"/>

  <!-- Ornaments -->
  <circle cx="50" cy="65" r="3" fill="#C41E3A"/>
  <circle cx="75" cy="70" r="3" fill="#FFD700"/>
  <circle cx="55" cy="85" r="3" fill="#FFD700"/>
  <circle cx="70" cy="82" r="3" fill="#C41E3A"/>

  <!-- Circular bronze border -->
  <circle cx="64" cy="64" r="62" fill="none" stroke="#CD7F32" stroke-width="4"/>
</svg>
```

**File name:** `juleglede.svg`

---

## 2. Nissehue (Santa Hat) - Silver

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <!-- Hat body -->
  <path d="M 30 80 Q 30 40, 64 20 Q 98 40, 98 80 L 64 85 Z" fill="#C41E3A"/>

  <!-- Hat brim (white fur) -->
  <ellipse cx="64" cy="82" rx="38" ry="8" fill="#FFFFFF"/>

  <!-- Hat tip fold -->
  <ellipse cx="85" cy="35" rx="12" ry="10" fill="#C41E3A"/>

  <!-- Pom-pom -->
  <circle cx="90" cy="30" r="8" fill="#FFFFFF"/>

  <!-- Inner shadow details -->
  <path d="M 40 75 Q 50 45, 64 30" fill="none" stroke="#8B0000" stroke-width="2" opacity="0.3"/>

  <!-- Circular silver border -->
  <circle cx="64" cy="64" r="62" fill="none" stroke="#C0C0C0" stroke-width="4"/>
</svg>
```

**File name:** `nissehue.svg`

---

## 3. Gløggmester (Mulled Wine) - Gold

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <!-- Mug body -->
  <rect x="35" y="50" width="50" height="45" rx="5" fill="#8B4513"/>
  <rect x="38" y="53" width="44" height="39" rx="3" fill="#6B3410"/>

  <!-- Wine/Gløgg -->
  <rect x="40" y="60" width="40" height="28" rx="2" fill="#7D1935"/>

  <!-- Steam wisps -->
  <path d="M 45 45 Q 47 38, 45 32" fill="none" stroke="#FFFFFF" stroke-width="2" opacity="0.7"/>
  <path d="M 55 43 Q 57 36, 55 30" fill="none" stroke="#FFFFFF" stroke-width="2" opacity="0.7"/>
  <path d="M 65 44 Q 67 37, 65 31" fill="none" stroke="#FFFFFF" stroke-width="2" opacity="0.7"/>
  <path d="M 75 46 Q 77 39, 75 33" fill="none" stroke="#FFFFFF" stroke-width="2" opacity="0.7"/>

  <!-- Handle -->
  <path d="M 85 65 Q 95 65, 95 75 Q 95 85, 85 85" fill="none" stroke="#8B4513" stroke-width="5"/>
  <path d="M 85 67 Q 92 67, 92 75 Q 92 83, 85 83" fill="none" stroke="#6B3410" stroke-width="3"/>

  <!-- Cinnamon stick -->
  <rect x="48" y="55" width="3" height="25" fill="#8B4513" transform="rotate(-15 50 67)"/>

  <!-- Circular gold border -->
  <circle cx="64" cy="64" r="62" fill="none" stroke="#FFD700" stroke-width="4"/>
</svg>
```

**File name:** `gloggmester.svg`

---

## 4. Julestjerne (Christmas Star) - Gold

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <!-- Main star (5-pointed) -->
  <polygon points="64,20 74,50 106,50 80,68 90,98 64,80 38,98 48,68 22,50 54,50" fill="#FFD700"/>

  <!-- Inner star detail -->
  <polygon points="64,35 70,55 85,55 73,65 78,85 64,75 50,85 55,65 43,55 58,55" fill="#FFF4CC"/>

  <!-- Sparkle points -->
  <circle cx="30" cy="30" r="3" fill="#FFD700"/>
  <circle cx="98" cy="30" r="3" fill="#FFD700"/>
  <circle cx="98" cy="98" r="3" fill="#FFD700"/>
  <circle cx="30" cy="98" r="3" fill="#FFD700"/>

  <!-- Sparkle lines -->
  <line x1="30" y1="30" x2="35" y2="35" stroke="#FFD700" stroke-width="2"/>
  <line x1="98" y1="30" x2="93" y2="35" stroke="#FFD700" stroke-width="2"/>
  <line x1="98" y1="98" x2="93" y2="93" stroke="#FFD700" stroke-width="2"/>
  <line x1="30" y1="98" x2="35" y2="93" stroke="#FFD700" stroke-width="2"/>

  <!-- Circular gold border -->
  <circle cx="64" cy="64" r="62" fill="none" stroke="#FFD700" stroke-width="4"/>
</svg>
```

**File name:** `julestjerne.svg`

---

## 5. Snømann (Snowman) - Silver

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <!-- Bottom snowball -->
  <circle cx="64" cy="90" r="20" fill="#FFFFFF" stroke="#002333" stroke-width="2"/>

  <!-- Middle snowball -->
  <circle cx="64" cy="60" r="16" fill="#FFFFFF" stroke="#002333" stroke-width="2"/>

  <!-- Top snowball (head) -->
  <circle cx="64" cy="35" r="12" fill="#FFFFFF" stroke="#002333" stroke-width="2"/>

  <!-- Eyes -->
  <circle cx="60" cy="33" r="2" fill="#002333"/>
  <circle cx="68" cy="33" r="2" fill="#002333"/>

  <!-- Carrot nose -->
  <polygon points="64,36 70,38 64,40" fill="#FF6347"/>

  <!-- Smile (coal) -->
  <circle cx="59" cy="40" r="1" fill="#002333"/>
  <circle cx="62" cy="41" r="1" fill="#002333"/>
  <circle cx="66" cy="41" r="1" fill="#002333"/>
  <circle cx="69" cy="40" r="1" fill="#002333"/>

  <!-- Buttons -->
  <circle cx="64" cy="56" r="2" fill="#002333"/>
  <circle cx="64" cy="63" r="2" fill="#002333"/>
  <circle cx="64" cy="85" r="2" fill="#002333"/>

  <!-- Scarf -->
  <rect x="58" y="45" width="12" height="4" fill="#C41E3A"/>
  <rect x="68" y="45" width="4" height="10" fill="#C41E3A"/>

  <!-- Arms (sticks) -->
  <line x1="48" y1="60" x2="35" y2="55" stroke="#8B4513" stroke-width="3"/>
  <line x1="80" y1="60" x2="93" y2="55" stroke="#8B4513" stroke-width="3"/>

  <!-- Circular silver border -->
  <circle cx="64" cy="64" r="62" fill="none" stroke="#C0C0C0" stroke-width="4"/>
</svg>
```

**File name:** `snowmann.svg`

---

## 6. Julenisse (Gift Box) - Bronze

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <!-- Gift box base -->
  <rect x="35" y="60" width="58" height="45" rx="3" fill="#C41E3A"/>

  <!-- Gift box lid -->
  <rect x="32" y="52" width="64" height="12" rx="2" fill="#8B0000"/>

  <!-- Vertical ribbon -->
  <rect x="60" y="52" width="8" height="53" fill="#FFD700"/>

  <!-- Horizontal ribbon -->
  <rect x="32" y="75" width="64" height="8" fill="#FFD700"/>

  <!-- Bow loops -->
  <ellipse cx="55" cy="50" rx="10" ry="6" fill="#FFD700"/>
  <ellipse cx="73" cy="50" rx="10" ry="6" fill="#FFD700"/>

  <!-- Bow center -->
  <circle cx="64" cy="50" r="5" fill="#FFA500"/>

  <!-- Bow ribbons -->
  <polygon points="64,50 50,40 52,48" fill="#FFD700"/>
  <polygon points="64,50 78,40 76,48" fill="#FFD700"/>

  <!-- Shine effect -->
  <rect x="75" y="65" width="3" height="12" fill="#FF6B6B" opacity="0.5"/>

  <!-- Circular bronze border -->
  <circle cx="64" cy="64" r="62" fill="none" stroke="#CD7F32" stroke-width="4"/>
</svg>
```

**File name:** `julenisse.svg`

---

## 7. Pepperkake (Gingerbread Person) - Legendary

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <!-- Head -->
  <circle cx="64" cy="35" r="12" fill="#B8734D"/>

  <!-- Body -->
  <rect x="52" y="45" width="24" height="30" rx="12" fill="#B8734D"/>

  <!-- Arms -->
  <rect x="35" y="52" width="20" height="8" rx="4" fill="#B8734D"/>
  <rect x="73" y="52" width="20" height="8" rx="4" fill="#B8734D"/>

  <!-- Legs -->
  <rect x="52" y="70" width="10" height="20" rx="5" fill="#B8734D"/>
  <rect x="66" y="70" width="10" height="20" rx="5" fill="#B8734D"/>

  <!-- Icing decoration - eyes -->
  <circle cx="60" cy="33" r="2" fill="#FFFFFF"/>
  <circle cx="68" cy="33" r="2" fill="#FFFFFF"/>

  <!-- Icing decoration - smile -->
  <path d="M 59 38 Q 64 40, 69 38" fill="none" stroke="#FFFFFF" stroke-width="2"/>

  <!-- Icing decoration - buttons -->
  <circle cx="64" cy="52" r="2" fill="#FFFFFF"/>
  <circle cx="64" cy="60" r="2" fill="#FFFFFF"/>
  <circle cx="64" cy="68" r="2" fill="#FFFFFF"/>

  <!-- Icing decoration - bow tie -->
  <polygon points="58,45 60,48 62,45" fill="#C41E3A"/>
  <polygon points="66,45 68,48 70,45" fill="#C41E3A"/>
  <circle cx="64" cy="46" r="2" fill="#C41E3A"/>

  <!-- Sparkle effect (legendary) -->
  <circle cx="25" cy="25" r="3" fill="#9C27B0" opacity="0.8"/>
  <circle cx="103" cy="25" r="3" fill="#9C27B0" opacity="0.8"/>
  <circle cx="25" cy="103" r="3" fill="#9C27B0" opacity="0.8"/>
  <circle cx="103" cy="103" r="3" fill="#9C27B0" opacity="0.8"/>

  <!-- Circular legendary border (purple) -->
  <circle cx="64" cy="64" r="62" fill="none" stroke="#9C27B0" stroke-width="4"/>

  <!-- Extra sparkle for legendary -->
  <polygon points="64,10 66,15 71,15 67,19 69,24 64,20 59,24 61,19 57,15 62,15" fill="#9C27B0" opacity="0.8"/>
</svg>
```

**File name:** `pepperkake.svg`

---

## Upload Instructions

### Option 1: Via Supabase Dashboard

1. Go to Supabase Dashboard → Storage
2. Create bucket `badge-icons` (if not exists, set to public)
3. Create folder `christmas` inside `badge-icons`
4. Upload all 7 SVG files
5. Get public URLs for each file
6. Update badge records:

```sql
UPDATE badges
SET icon_url = 'https://[your-project-ref].supabase.co/storage/v1/object/public/badge-icons/christmas/juleglede.svg'
WHERE code = 'juleglede';

UPDATE badges
SET icon_url = 'https://[your-project-ref].supabase.co/storage/v1/object/public/badge-icons/christmas/nissehue.svg'
WHERE code = 'nissehue';

UPDATE badges
SET icon_url = 'https://[your-project-ref].supabase.co/storage/v1/object/public/badge-icons/christmas/gloggmester.svg'
WHERE code = 'gloggmester';

UPDATE badges
SET icon_url = 'https://[your-project-ref].supabase.co/storage/v1/object/public/badge-icons/christmas/julestjerne.svg'
WHERE code = 'julestjerne';

UPDATE badges
SET icon_url = 'https://[your-project-ref].supabase.co/storage/v1/object/public/badge-icons/christmas/snowmann.svg'
WHERE code = 'snowmann';

UPDATE badges
SET icon_url = 'https://[your-project-ref].supabase.co/storage/v1/object/public/badge-icons/christmas/julenisse.svg'
WHERE code = 'julenisse';

UPDATE badges
SET icon_url = 'https://[your-project-ref].supabase.co/storage/v1/object/public/badge-icons/christmas/pepperkake.svg'
WHERE code = 'pepperkake';
```

### Option 2: Use Emojis as Temporary Icons

If you want to use emojis instead of SVG initially:

```sql
-- Using emoji Unicode in data URLs (browser-rendered)
UPDATE badges SET icon_url = NULL WHERE code IN ('juleglede', 'nissehue', 'gloggmester', 'julestjerne', 'snowmann', 'julenisse', 'pepperkake');
```

The BadgeCard component will fall back to the tier icon (EmojiEventsIcon) if icon_url is NULL.

---

## Icon Design Notes

1. **Consistent Style:** All icons use similar stroke widths (2-4px) and rounded corners
2. **Color Harmony:** Christmas color palette (red, green, gold) with tier-specific borders
3. **Scalability:** SVG format ensures crisp rendering at any size
4. **Accessibility:** Simple, recognizable shapes work well at small sizes
5. **Norwegian Theme:** Designs reflect traditional Norwegian Christmas elements

## Alternative: Use Icon Library

If you prefer using an existing icon library instead of custom SVGs:

- **Material Icons:** Has Christmas-themed icons
- **Font Awesome:** Christmas icon pack
- **Flaticon:** Norwegian Christmas SVG collection

Simply update the `icon_url` field to point to the chosen icon source.
