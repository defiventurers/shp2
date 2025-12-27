# Sacred Heart Pharmacy PWA - Design Guidelines

## Design Approach

**Selected Framework**: Clean Medical UI System with Material Design principles
**Rationale**: Healthcare apps prioritize trust, clarity, and accessibility. Mobile-first utility focus demands efficient information architecture with familiar patterns.

## Visual Theme (User-Specified)

Medical blue and white color scheme with trust-building hierarchy:
- Primary: Medical blue for CTAs, headers, active states
- Background: Clean white for content areas
- Accents: Soft gray for borders, light blue for secondary elements
- Status indicators: Green (available/delivered), amber (low stock/pending), red (out of stock)

## Typography System

**Font Family**: Inter or Poppins (via Google Fonts CDN)
- **Hero/Headers**: 600-700 weight, 24-32px mobile, 32-48px desktop
- **Body Text**: 400 weight, 16px base (readable for medicine names/dosages)
- **Labels/Meta**: 500 weight, 14px (stock qty, prices)
- **Small Print**: 400 weight, 12px (prescription warnings, terms)

Medicine names require excellent legibility - never below 14px.

## Layout & Spacing

**Mobile-First Grid**: Single column base, 2-column for tablets (inventory grid)
**Spacing Units**: Tailwind 4, 6, 8, 12, 16 for consistency
- Screen padding: px-4 mobile, px-6 tablet, px-8 desktop
- Card spacing: p-4 to p-6
- Section gaps: space-y-6 to space-y-8
- Bottom navigation clearance: pb-20 (mobile nav height)

**Container Strategy**:
- Full-width: Navigation, hero sections
- Constrained: max-w-7xl for content, max-w-md for forms

## Component Library

### Navigation
**Bottom Tab Bar** (mobile primary):
- Fixed bottom navigation with 4 tabs: Home, Inventory, Cart, Orders
- Icon + label, 56px height, blur backdrop for iOS feel
- Active state with blue indicator
**Desktop Header**: Logo left, nav center, WhatsApp/Admin right

### Cards
**Medicine Cards**:
- White background, subtle shadow (shadow-sm), rounded-lg
- 4px border-radius, hover lift effect (mobile: tap feedback)
- Structure: Image/icon top, name (bold), dosage (gray text), price (prominent), stock badge, Add to Cart button
**Prescription Cards**: Similar but with thumbnail preview, OCR status indicator

### Buttons
**Primary CTA**: Solid blue, rounded-full, py-3 px-6, medium weight text
**Secondary**: Blue outline, white fill
**Icon Buttons**: 44px touch target minimum (mobile accessibility)
**WhatsApp Button**: Green accent with WhatsApp icon, sticky/floating position

### Forms
**Input Fields**:
- 48px height (thumb-friendly), rounded-md borders
- Focus state with blue ring
- Labels above inputs, helper text below
- Error states in red with icon
**Upload Area**: Dashed border dropzone, camera icon, "Tap to upload" text

### Status Indicators
**Availability Badges**: Rounded-full pills
- In Stock: Green background, white text
- Low Stock (<10): Amber with count
- Out of Stock: Red with "Notify Me" option
**Order Status**: Timeline component with checkmarks and connecting lines

### Data Display
**Inventory List**: 
- Search bar at top (sticky)
- Filter chips below (scrollable horizontal)
- Grid: 1 column mobile, 2 columns tablet, 3 columns desktop
- Infinite scroll or pagination

**Order History**:
- Chronological list, most recent first
- Collapsible cards showing order summary
- Tap to expand full details

## PWA-Specific Elements

**Install Prompt**: Bottom sheet modal with pharmacy branding, benefits list
**Offline Indicator**: Toast notification at top when offline
**Loading States**: Skeleton screens for inventory, shimmer effect
**App Icon**: Pharmacy cross logo with blue background

## Animations (Minimal)

- Page transitions: 200ms fade
- Card hover/tap: Scale 1.02, shadow increase (100ms)
- Add to Cart: Brief scale pulse on button
- Bottom sheet modals: Slide up from bottom (300ms ease-out)
- NO scroll animations, NO complex hero animations (medical context requires stability)

## Images

**Home Screen**: Clean medical imagery - pharmacy counter, medicine bottles (professional stock photo), 50vh height, gradient overlay for text readability
**Inventory**: Product thumbnails (100x100px), lazy loaded
**Prescription Upload**: Camera icon/illustration, not photo
**Empty States**: Simple illustrations (medicine bottle, clipboard) with helpful text

This PWA prioritizes speed, clarity, and trust - essential for healthcare. Every interaction should feel instant and reliable.