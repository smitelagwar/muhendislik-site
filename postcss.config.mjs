const config = {
  plugins: {
    // Next.js performs the final production optimization. Keeping Tailwind's
    // intermediate Lightning CSS pass disabled avoids a Linux-only parse
    // failure on the generated utility sheet during Vercel builds.
    "@tailwindcss/postcss": { optimize: false },
  },
};

export default config;
