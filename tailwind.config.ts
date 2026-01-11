@tailwind base;
@tailwind components;
@tailwind utilities;

/* --------------------------------------------------
   Base token-backed utilities
-------------------------------------------------- */
@layer base {
  /* Define border-border explicitly */
  .border-border {
    border-color: hsl(var(--border));
  }

  * {
    @apply border-border;
  }

  body {
    @apply font-sans antialiased bg-background text-foreground;
  }

  /* Safe area support for iOS */
  .safe-area-bottom {
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  .pb-safe {
    padding-bottom: calc(4rem + env(safe-area-inset-bottom, 0px));
  }
}

/* --------------------------------------------------
   Theme tokens (unchanged)
-------------------------------------------------- */
:root {
  --border: 214 20% 92%;
  --background: 0 0% 100%;
  --foreground: 215 25% 15%;
  --primary: 217 91% 50%;
  --primary-foreground: 0 0% 100%;
  --secondary: 214 25% 93%;
  --secondary-foreground: 215 25% 15%;
  --muted: 214 20% 95%;
  --muted-foreground: 215 15% 45%;
  --accent: 214 30% 96%;
  --accent-foreground: 217 91% 45%;
  --destructive: 0 84% 55%;
  --destructive-foreground: 0 0% 100%;
  --input: 214 20% 80%;
  --ring: 217 91% 50%;
  --radius: .5rem;
}

.dark {
  --border: 217 20% 18%;
  --background: 217 25% 8%;
  --foreground: 214 20% 95%;
}

/* --------------------------------------------------
   Utilities
-------------------------------------------------- */
@layer utilities {
  input[type="search"]::-webkit-search-cancel-button {
    @apply hidden;
  }

  [contenteditable][data-placeholder]:empty::before {
    content: attr(data-placeholder);
    color: hsl(var(--muted-foreground));
    pointer-events: none;
  }
}