# WORKFLOW SAMPLE

Reference copy of the GitHub Actions workflow pattern used in this repository, kept here so the v1 pipeline is not lost when `.github/workflows` is rewritten for v2.

This is a record, not a live workflow. GitHub does not read anything in `.docs`. To use it, copy the YAML into `.github/workflows/<name>.yml` and change the marked values.

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

- The `.testing` suffix in the filenames is misleading. These workflows deploy, they do not test.
- The website workflow builds `./WEBSITE`, which was removed on 10-08-2026. It will fail on any `website-v*` tag and should be deleted.
- `code.sh` still accepts `website` as a service name and should be narrowed to the four remaining modules.
- No workflow runs the BACKEND Vitest suite, and no lint or typecheck gate exists for any module. A v2 pipeline should gate the image build on those.
- Image tags are mutable on `latest`. Pinning deploys to the version tag is safer.
- `bug-reproduction-instructions.yml` is unrelated to deployment. It runs an AI inference step on newly opened issues labelled `bug` and comments when the report lacks reproduction detail. It is independent of the module layout and needs no change for v2.
