export default defineAppConfig({
  ui: {
    colors: {
      primary: 'emerald',
      secondary: 'amber',
      neutral: 'stone',
    },
    button: {
      slots: {
        base: 'rounded-full font-semibold tracking-[0.02em] transition-all duration-300',
      },
      defaultVariants: {
        color: 'primary',
      },
    },
    badge: {
      slots: {
        base: 'rounded-full px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.08em]',
      },
    },
  },
})
