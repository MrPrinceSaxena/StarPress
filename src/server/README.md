# src/server

Business logic lives here (pricing engine, order processing, etc.), kept separate
from `src/app/api/**` route handlers. Route handlers should stay thin: parse the
request, call a function in here, return the response.

Why: if this project ever needs to be split into a separate backend service, the
logic in this folder moves with minimal changes — only the route-handler "glue" gets
rewritten. See `docs/01-ARCHITECTURE.md` → "Decoupling path".

Empty for now — first real code lands here in Phase 1 (auth logic) and Phase 2
(pricing engine).
