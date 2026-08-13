# WORKFLOW SAMPLE

Reference copy of the GitHub Actions workflow pattern used in this repository, kept here so the v1 pipeline is not lost when `.github/workflows` is rewritten for v2.

This is a record, not a live workflow. GitHub does not read anything in `.docs`. To use it, copy the YAML into `.github/workflows/<name>.yml` and change the marked values.

**Status as of 13-08-2026.** `docker-backend.testing.yml` no longer matches the sample below. It was rewritten into two jobs, a `test` job running lint, typecheck and Vitest against Mongo and Redis service containers, and a `build` job that declares `needs: test`, so a tag cannot publish an image whose tests fail. The sample here is kept as the v1 record and as the starting shape for the mobile and desktop pipelines. Copy the live backend workflow instead when a service needs a gated build.

## THE PATTERN

Every service pipeline follows the same six steps.

1. Trigger on a version tag, `<service>-v*`. Tags come from `code.sh`, which bumps the version in the module `package.json` and prints the tag command.
2. Derive the image tag from the git tag, falling back to a short commit SHA.
3. Set up Docker Buildx.
4. Log in to Docker Hub with `DOCKER_USERNAME` and `DOCKER_PASSWORD`.
5. Build the module directory as the build context and push `latest` plus the version tag.
6. Optionally trigger a Render deploy hook.

Nothing in the pipeline runs tests, lints, or typechecks today. The Bun install step in the notification pipeline is the only build side validation, and its test step is commented out. This is a gap to close in v2, not a pattern to copy forward.

## REQUIRED SECRETS

| SECRET | USED FOR |
| ------ | -------- |
| `DOCKER_USERNAME` | Docker Hub login and the image namespace |
| `DOCKER_PASSWORD` | Docker Hub login |
| `RENDER_DEPLOY_HOOK_URL_<SERVICE>` | Optional deploy trigger, currently commented out |

## SAMPLE, NODE SERVICE

Taken from `docker-backend.testing.yml`. Replace `backend` and `BACKEND` with the target service to reuse it.

```yaml
# GitHub Actions Workflow for Docker Backend Deployment
name: Build, Tag, and Deploy Docker Image - Backend

on:
  push:
    tags:
      - "backend-v*"
    # Uncomment the following lines when we want to trigger on branch pushes as well
    # branches:
    #   - 'production'

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Extract version or commit hash
        id: version
        run: |
          if [[ $GITHUB_REF == refs/tags/backend-v* ]]; then
            echo "VERSION=${GITHUB_REF#refs/tags/backend-v}" >> $GITHUB_OUTPUT
          else
            echo "VERSION=${GITHUB_SHA::7}" >> $GITHUB_OUTPUT
          fi

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./BACKEND
          push: true
          tags: |
            ${{ secrets.DOCKER_USERNAME }}/studzee-backend:latest
            ${{ secrets.DOCKER_USERNAME }}/studzee-backend:${{ steps.version.outputs.VERSION }}

      - name: Print Docker image information
        run: |
          echo "Docker image successfully built and pushed:"
          echo "  - ${{ secrets.DOCKER_USERNAME }}/studzee-backend:latest"
          echo "  - ${{ secrets.DOCKER_USERNAME }}/studzee-backend:${{ steps.version.outputs.VERSION }}"

      # # # Trigger Render deploy hook ( uncomment when using Render.com )
      # - name: Trigger Render deploy hook
      #   run: curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK_URL_BACKEND }}
```

## SAMPLE, BUN SERVICE

Taken from `docker-notification.testing.yml`. Same shape as above with a Bun toolchain step before the version extraction. This is the variant to copy for any Bun based service.

```yaml
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install
        working-directory: ./NOTIFICATION

      # - name: Run Unit Tests [ Pre-Deployment ]
      #   run: bun test
      #   working-directory: ./NOTIFICATION
```

## NOTES FOR V2

- The `.testing` suffix in the filenames was misleading, because these workflows deployed without testing. It is accurate for the backend as of 13-08-2026 and still misleading for every other module.
- The website workflow builds `./WEBSITE`, which was removed on 10-08-2026. It will fail on any `website-v*` tag and should be deleted.
- **The notification workflow is now dead too.** That service was merged into BACKEND on 10-08-2026 and its folder is gone, so `docker-notification.testing.yml` builds a directory that no longer exists.
- `code.sh` still accepts `website` and `notification` as service names. Only `backend`, `mobile` and `desktop` remain.
- **The backend image build needs a Prisma step.** Done on 13-08-2026. The `test` job runs `npx prisma generate` before the typecheck, because the client is generated into `node_modules` and is not committed, so `@prisma/client` does not resolve without it. The container still runs `prisma migrate deploy` on start, so the deploy target needs `DATABASE_URL` reachable at boot or it exits 1 with `P1001`.
- **New required environment variables** since this sample was captured: `DATABASE_URL`, the `SMTP_*` block, `EMAIL_FROM`, and the `S3_*` block replacing the old `AWS_*` names. The config schema throws at startup if any is missing, so the deploy fails fast rather than misbehaving.
- The BACKEND pipeline runs Vitest, ESLint and `tsc --noEmit` as of 13-08-2026. No other module has a lint or typecheck gate yet. Two details are worth carrying to the others: the typecheck uses the base `tsconfig.json` rather than `tsconfig.build.json`, because Vitest transpiles without typechecking and a test file can pass while failing to compile, and the Mongo service container needs `MONGO_INITDB_ROOT_USERNAME` and `MONGO_INITDB_ROOT_PASSWORD` matching the defaults in `globalSetup.ts`, since Mongoose connects lazily and a mismatch fails on the first query rather than at connection.
- Image tags are mutable on `latest`. Pinning deploys to the version tag is safer.
- `bug-reproduction-instructions.yml` is unrelated to deployment. It runs an AI inference step on newly opened issues labelled `bug` and comments when the report lacks reproduction detail. It is independent of the module layout and needs no change for v2.
