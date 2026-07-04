# EKS OVERLAY (STUB)

This overlay is intentionally empty today. The local `minikube` overlay carries
Postgres, Redis and RabbitMQ as in-cluster pods. On EKS those become managed
services and only the wiring changes, not `base/`.

## WHAT THIS OVERLAY WILL DO

- Reference `../../base` and drop the `postgres.yaml`, `redis.yaml` and
  `rabbitmq.yaml` infra pods (managed services replace them).
- Patch `studzee-config` so `REDIS_URL`, `RABBITMQ_URL` and the database hosts
  point at ElastiCache, AmazonMQ and RDS endpoints.
- Set the ingress `ingressClassName` to `alb` with ACM certificate annotations.
- Pin `image:` to versioned tags (`verma2904/studzee-<service>:<version>`) with
  `imagePullPolicy: IfNotPresent`, never `:dev` and never `:latest`.
- Source `studzee-secrets` from AWS Secrets Manager or SSM rather than a local
  `--from-env-file`.
- Move migrate-on-start into a pre-deploy `Job` before scaling any service past
  one replica.

## CUTOVER NOTE

Do not push `:latest` for `studzee-notification` until the VPS and its Watchtower
poller are retired, or the live Play Store app's notification container gets
hot-swapped with incompatible code.
