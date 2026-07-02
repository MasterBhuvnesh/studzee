# FIXES

Ledger of problems hit and fixed during the backend v2 rewrite. Add a row when a problem is fixed so it is not repeated. Commit this file with the change.

| PROBLEM | FIX | MILESTONE | CAUSE / OCCUR |
| --- | --- | --- | --- |
| Git LFS post-checkout hook aborted branch operations (git-lfs not installed) | Removed unused LFS hooks (post-checkout, post-commit, post-merge, pre-push); only AGENTS PDFs used LFS and AGENTS was removed | P0 | Repo configured for LFS but git-lfs binary absent on this machine |
