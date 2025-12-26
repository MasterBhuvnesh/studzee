# ===========================
#   Base Image with Bun
# ===========================
FROM oven/bun:1.1.13 AS base

WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile
RUN bun run validate:fix

# ===========================
#   Production Image
# ===========================
FROM oven/bun:1.1.13 AS prod

WORKDIR /app
COPY --from=base /app /app
# COPY .env .env

EXPOSE 3000
CMD ["bun", "run", "start"]

# ===========================
#   Useful Docker Commands
# ===========================
# Build the Docker image:
#   docker build -t yup .

# Run the Docker container:
#   docker run -p 3000:3000 --env-file .env yup

# List all Docker images:
#   docker images

# List all running containers:
#   docker ps

# List all containers (including stopped ones):
#   docker ps -a

# Remove all unused images, networks, and dangling build cache:
#   docker system prune -a

# For more aggressive cleanup (including volumes and all unused images):
#   docker system prune -a --volumes

# To stop a running container:
#   docker stop <container_id>

# Remove a specific Docker container:
#   docker rm <container_id>

# Remove all stopped containers:
#   docker container prune

# Remove a specific Docker image:
#   docker rmi <image_id>

# Remove all unused Docker images:
#   docker image prune -a

# Remove all stopped containers:
#   docker container prune

# Remove all unused volumes:
#   docker volume prune

# Stop all running containers:
#   docker stop $(docker ps -q)

# Remove all stopped containers:
#   docker rm $(docker ps -a -q)

# To upload the image to Docker Hub:
#   docker login
#   docker tag yup <your_dockerhub_username>/yup:latest
#   docker push <your_dockerhub_username>/yup:latest
