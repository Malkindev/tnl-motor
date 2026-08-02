// ---------------------------------------------------------------------
// EXPORT + LOCAL LISTEN (ESM) - place at the BOTTOM of server/index.js
// Keep everything above this line (imports, middleware, routes, sequelize, supabase, uploads, admin middleware, etc.)
// ---------------------------------------------------------------------

// Export the Express app for Vercel serverless functions
export default app;

// Only start a listening HTTP server for local development (when NOT running on Vercel).
// Vercel sets the VERCEL env var in its environment, so we skip listen there.
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5201;
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}
