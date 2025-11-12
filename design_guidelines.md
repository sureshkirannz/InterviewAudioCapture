# Design Guidelines: Interview Assistant Web App

## Design Approach
**System-Based Approach**: Linear-inspired minimalist productivity tool
- Rationale: Utility-focused monitoring tool requiring clarity and non-distraction during live interviews
- Key principle: Maximum information density with minimal visual noise
- Reference: Linear's clean dashboards + Notion's data presentation

## Typography System
**Font Stack**: Inter (Google Fonts) for entire application
- Primary headings: text-xl to text-2xl, font-semibold
- Status indicators: text-sm, font-medium, uppercase tracking-wide
- Transcription text: text-base, font-normal, leading-relaxed
- Detected questions: text-lg, font-semibold
- Statistics/metadata: text-xs to text-sm, font-medium
- Monospace for timestamps: font-mono, text-xs

## Layout System
**Spacing Primitives**: Tailwind units of 2, 3, 4, 6, 8, 12
- Component padding: p-4, p-6, p-8
- Section spacing: space-y-4, space-y-6, space-y-8
- Grid gaps: gap-3, gap-4, gap-6
- Consistent rhythm using py-6 for major sections

**Container Strategy**:
- Max-width: max-w-5xl mx-auto (focused, not full-screen)
- Padding: px-4 md:px-6 lg:px-8
- Single-column layout (no distracting multi-column)

## Core Layout Structure

### Header Section (Compact, Always Visible)
- Application title + status badge (Live/Idle/Recording)
- Connection indicator (webhook status)
- Session timer (elapsed time since start)
- Fixed at top: sticky top-0 with subtle border-b

### Control Panel (Prominent, Centered)
- Large primary action button: "Start Listening" / "Stop"
- Visual state: distinct appearance for idle/active/recording
- Secondary controls underneath: Audio source selector, Settings icon
- Spacing: py-8 for breathing room

### Audio Visualization (Real-time Feedback)
- Horizontal waveform/volume bar (full-width)
- Recording indicator: Pulsing dot when active
- Volume meter: Animated bars showing audio levels
- Current status text: "Listening..." / "Recording..." / "Processing..."
- Height: h-24 to h-32 for visibility

### Transcription Feed (Primary Content)
**Layout**: Vertical scrollable feed with reverse chronological order
- Each entry as a card: p-4, rounded-lg, border
- Timestamp (top-left, muted)
- Transcription text (prominent)
- Question badge (when detected): Inline pill with icon
- Word count + metadata (bottom-right, small)
- Auto-scroll to latest entry
- Max height: max-h-96 overflow-y-auto

**Question Highlighting**:
- Distinct visual treatment: Thicker border, accent badge
- Question number indicator: "Q #3"
- Webhook status icon: ✓ (sent) or warning icon (failed)

### Statistics Dashboard (Bottom Section)
**Grid Layout**: 3-column on desktop (grid-cols-3), stacked on mobile
- Card-based metrics: p-6, rounded-lg, border
- Large number: text-3xl, font-bold
- Label underneath: text-sm, uppercase
- Metrics:
  1. Questions Detected
  2. Total Transcriptions
  3. Webhook Success Rate

### Footer (Minimal)
- Webhook URL display (truncated)
- Edit webhook button
- Privacy note: "Audio not stored"

## Component Library

### Primary Button
- Large touch target: px-8 py-4
- Bold text: font-semibold text-base
- Rounded: rounded-lg
- Focus ring: ring-2 ring-offset-2

### Status Badge
- Inline-flex with icon + text
- Small padding: px-3 py-1
- Rounded-full
- Font: text-xs font-medium uppercase

### Card Component
- Border: border rounded-lg
- Padding: p-4 to p-6
- Subtle shadow on hover: hover:shadow-md transition-shadow

### Audio Visualizer
- Animated bars using CSS transforms
- Smooth transitions: transition-all duration-300
- Height variations based on volume data
- Horizontal flex layout: flex gap-1

### Webhook Connection Indicator
- Dot indicator: w-2 h-2 rounded-full
- Pulse animation when active
- Text label: text-xs font-medium

## Interaction States
- Loading states: Subtle pulse animation on cards
- Error states: Border accent + warning icon
- Success feedback: Brief checkmark animation
- Disabled states: Reduced opacity (opacity-50)

## Animations (Minimal, Purposeful)
- Recording pulse: Subtle breathing effect on recording indicator
- New question appearance: Gentle slide-in from right
- Volume bars: Smooth height transitions
- All animations: duration-300 ease-in-out

## Accessibility Notes
- Focus visible on all interactive elements
- Screen reader labels for status indicators
- Keyboard shortcuts: Space to start/stop, Esc to stop
- Color-independent status communication (icons + text)
- High contrast text ratios throughout

## Responsive Behavior
- Mobile: Single column, stacked statistics
- Tablet/Desktop: Grid statistics, wider transcription cards
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Font scaling: Slightly smaller on mobile (text-sm → text-base)