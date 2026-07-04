# FIXES

Ledger of problems hit and fixed during the backend v2 rewrite. Add a row when a problem is fixed so it is not repeated. Commit this file with the change.

| PROBLEM | FIX | MILESTONE | CAUSE / OCCUR |
| --- | --- | --- | --- |
| Git LFS post-checkout hook aborted branch operations (git-lfs not installed) | Removed unused LFS hooks (post-checkout, post-commit, post-merge, pre-push); only AGENTS PDFs used LFS and AGENTS was removed | P0 | Repo configured for LFS but git-lfs binary absent on this machine |
| minikube not installed in WSL (only minikube.exe on Windows), sudo unavailable | Installed the Linux minikube binary to ~/.local/bin (on PATH, no sudo needed) | P3 | Fresh WSL environment with no local k8s tooling |
| First minikube start left a broken control plane (apiserver-kubelet-client cert not signed by CA, etcd dir not empty) | minikube delete --all --purge then started fresh | P3 | Stale ~/.minikube CA state from a prior partial start |
| App pods ImagePullBackOff on first apply | Expected: dev images are built and minikube-loaded, not registry-hosted; rollout restart after image load | P3 | imagePullPolicy IfNotPresent with a local-only :dev tag before the image exists |
