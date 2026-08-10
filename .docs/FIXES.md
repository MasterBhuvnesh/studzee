# FIXES

Log of problems faced and how they were fixed, so any person or agent can avoid repeating them. Add a row whenever a problem is resolved and commit it with the change.

| PROBLEM | FIX | CAUSE / OCCUR | DATE |
| ------- | --- | ------------- | ---- |
| `git commit` failed with `Unable to create .git/index.lock: File exists` | Confirmed no git process was running, then removed the stale `.git/index.lock` file | A git process was interrupted on 03-08-2026 and left the lock behind. Occurs on any git write in this repository until the lock is removed | 10-08-2026 |
