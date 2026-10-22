export default defineAppConfig({
  ui: {
    colors: {
      primary: 'brand',
      secondary: 'amber',
      success: 'green',
      neutral: 'zinc',
    },
    button: {
      slots: {
        base: 'rounded-xl font-bold',
      },
      defaultVariants: {
        color: 'primary',
      },
    },
    badge: {
      slots: {
        base: 'rounded-lg px-2.5 py-0.5 text-xs font-bold',
      },
    },
  },
})
