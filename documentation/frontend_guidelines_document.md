# Frontend Guideline Document for cafe-app-ai

This document outlines the frontend architecture, design principles, styling, component structure, state management, routing, performance optimizations, and testing strategies for the **cafe-app-ai** Next.js starter template. It’s written in everyday language so that anyone—technical or not—can understand how the frontend is set up and why.

## 1. Frontend Architecture

### 1.1 Core Frameworks and Libraries
- **Next.js (App Router)**: Provides file-based routing, server-side rendering (SSR), static site generation (SSG), and API routes in one package. It powers both pages and server logic.  
- **React**: The view library underneath Next.js, allowing us to build reusable UI components.  
- **TypeScript**: Adds type safety to JavaScript, catching errors at build time and improving code clarity.  
- **shadcn/ui**: A collection of accessible, pre-built React components (buttons, cards, modals, etc.) that we copy into the project for full customization.  
- **Tailwind CSS**: A utility-first CSS framework for rapid styling without writing custom CSS classes.  
- **Lucide React**: A set of crisp, SVG-based icons.%n
### 1.2 How the Architecture Supports Key Goals
- **Scalability**:  
  • File-based routing and modular folders keep code organized.  
  • Component-based design means new features can be built, tested, and deployed in isolation.  
- **Maintainability**:  
  • TypeScript types and clear naming reduce guesswork.  
  • Utilities (like our `cn` function for Tailwind class merging) and shared contexts live in `/lib` for easy updates.  
- **Performance**:  
  • SSR and automatic code splitting by Next.js speed up first paint.  
  • Tailwind’s built-in PurgeCSS removes unused styles.  
  • Dynamic imports let heavy components (charts, tables) load only when needed.

## 2. Design Principles

### 2.1 Usability
- **Clear Layouts**: Card-based dashboards and consistent spacing guide the user’s eye.  
- **Intuitive Controls**: Buttons, inputs, and forms follow familiar patterns (sign-in, toggles, tabs).  

### 2.2 Accessibility
- **Semantic HTML**: All components use the right tags (`<button>`, `<nav>`, `<form>`).  
- **ARIA Attributes**: Interactive elements include labels and roles as needed.  
- **Contrast and Focus**: Color choices and focus rings meet WCAG AA standards.

### 2.3 Responsiveness
- **Mobile-First**: Breakpoints are defined in Tailwind for small to large screens.  
- **Fluid Layouts**: Grid and flex utilities ensure content adapts to any width.  

### 2.4 Consistency
- **Design Tokens**: Colors, spacing, and typography are driven by CSS variables.  
- **Component Library**: All common UI pieces come from `shadcn/ui` or shared local components.

## 3. Styling and Theming

### 3.1 Styling Approach
- **Utility-First (Tailwind CSS)**: We avoid custom CSS classes where possible, favoring Tailwind’s built-in utilities (`px-4`, `bg-gray-50`, `text-primary`).  
- **CSS Variables**: Defined in `:root` and toggled via a data attribute (`data-theme="light"`/`dark"`) for theming.

### 3.2 Theming
- **Light & Dark Modes**: Automatic detection of user’s system preference, with a manual toggle persisted in local storage.  
- **Theme Tokens**: Primary, secondary, accent colors and semantic tokens (success, error, surface) all come from CSS variables.

### 3.3 Visual Style
- **Style**: Modern flat design with subtle glassmorphism on cards (slightly frosted backgrounds and soft shadows) for depth.  
- **Typography**: **Inter**, a clean sans-serif font loaded via Google Fonts, used for headings and body text.  

### 3.4 Color Palette
```css
:root {
  --color-primary:   #4F46E5;   /* Indigo */
  --color-secondary: #10B981;   /* Emerald */
  --color-accent:    #F59E0B;   /* Amber */
  --color-bg-light:  #FFFFFF;
  --color-bg-dark:   #1F2937;
  --color-surface:   #F3F4F6;
  --color-text:      #111827;
  --color-muted:     #6B7280;
}
```

## 4. Component Structure

### 4.1 Folder Organization
- `/app` – Next.js routes, layouts, error/UI boundaries.  
- `/components` – Reusable UI pieces:  
  • `/components/ui` – Copied `shadcn/ui` library components (button.tsx, input.tsx, card.tsx).  
  • Other shared bits: `SiteHeader`, `AppSidebar`, `ThemeToggle`, `AuthButtons`.

### 4.2 Reuse and Composition
- **Atomic Approach**: Small building blocks (atoms) compose molecules (forms, cards), which build organisms (dashboard sections).  
- **Props-Driven**: Components accept props for variants (size, color) rather than reinventing styles.

### 4.3 Benefits
- **Maintainability**: Update one `Card` component and see changes everywhere.  
- **Consistency**: Shared look and feel across pages reduces visual drift.

## 5. State Management

### 5.1 Local State
- **React Hooks**: `useState` for simple toggles and form values.  
- **useContext**: A global `AuthContext` holds user session data (token, user info) injected at the top level.

### 5.2 Sharing State Across Components
- Wrap protected areas in `<AuthProvider>` so any child can call `useAuth()` to read or update user info.  
- Keep UI state (dialogs, dropdowns) localized within components to avoid unnecessary re-renders.

### 5.3 Scaling Up
- For complex apps, consider adding a lightweight store (Zustand or Jotai) or Redux Toolkit.

## 6. Routing and Navigation

### 6.1 Next.js File-Based Routing
- **Page Routes**: `app/sign-in/page.tsx`, `app/sign-up/page.tsx`, `app/dashboard/page.tsx`.  
- **Nested Layouts**: `app/dashboard/layout.tsx` defines the sidebar and header for all dashboard routes.

### 6.2 API Routes
- `/api/auth/[...all]/route.ts` handles sign-in and sign-up calls to the Better Auth service.

### 6.3 Protected Routes
- On the client, `DashboardLayout` checks `useAuth()`; if no session, redirects to `/sign-in`.  
- Future: could use Next.js middleware for server-side protection.

### 6.4 Navigation Patterns
- **SiteHeader** has public links (Home, Sign In/Up).  
- **AppSidebar** provides dashboard navigation (Overview, Reports, Settings).

## 7. Performance Optimization

### 7.1 Code Splitting & Lazy Loading
- Next.js automatically splits code by route.  
- Heavy components (charts, tables) can be dynamically imported:  
  `const Chart = dynamic(() => import('../components/Chart'), { ssr: false })`

### 7.2 Asset Optimization
- **Images**: Use Next.js `<Image>` for automatic resizing and modern formats (WebP).  
- **Icons**: Lucide SVGs are tree-shaken to include only used icons.

### 7.3 CSS Optimization
- Tailwind’s PurgeCSS removes unused classes—small final CSS bundle.  

### 7.4 Caching & CDN
- Vercel’s global CDN caches static assets and SSR pages near the user.  
- HTTP headers (Cache-Control) configured for long-lived assets.

## 8. Testing and Quality Assurance

### 8.1 Current Status
- No frontend tests are included by default in this starter.  

### 8.2 Recommended Strategy
1. **Unit Tests**:  
   - **Vitest** + **React Testing Library** for components and hooks.  
   - Test utilities in `/lib/utils.ts` (e.g., `cn` function).
2. **Integration Tests**:  
   - Test form workflows (sign-in, sign-up) in a simulated DOM.  
3. **End-to-End (E2E) Tests**:  
   - **Playwright** or **Cypress** to automate user flows (authentication, dashboard navigation).  
4. **Continuous Integration**:  
   - Set up a GitHub Actions workflow to run tests on every PR.  

## 9. Conclusion and Overall Frontend Summary

The **cafe-app-ai** frontend is built on a modern stack (Next.js, TypeScript, Tailwind CSS, shadcn/ui) that prioritizes performance, accessibility, and maintainability.  

- **Architecture**: Modular and scalable, leveraging file-based routing and server-side features out of the box.  
- **Design**: A consistent, responsive, and accessible UI empowered by design tokens and utility classes.  
- **Theming**: Easy light/dark mode with CSS variables.  
- **Components**: Reusable, props-driven, and organized for maximum clarity.  
- **State & Routing**: Simple React hooks and Context API, with clear patterns for protected routes.  
- **Performance**: SSR, code splitting, image optimization, and global CDN delivery ensure fast load times.  
- **Testing**: While not included by default, a clear path exists to add unit, integration, and E2E tests.

Together, these guidelines ensure that anyone diving into the **cafe-app-ai** starter will find a solid foundation for building and scaling web applications with confidence and clarity.