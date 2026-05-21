@AGENTS.md

## Prisma 7 Build Note

This project requires a Prisma 7 main entry point patch.

After installing dependencies locally, run:

```bash
node scripts/patch-prisma.js
```

This is also run automatically via `postinstall` (`prisma generate && node scripts/patch-prisma.js`).
If you see `Cannot find module '#main-entry-point'` during build, run the patch manually.
