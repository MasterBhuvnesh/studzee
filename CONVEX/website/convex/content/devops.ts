import type { SeedBlog } from './index';

// Empty = use the generated mesh-gradient banner. Set a URL to override per blog.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const banner = (_slug: string) => '';

export const devopsBlogs: SeedBlog[] = [
  {
    path: 'devops',
    slug: 'devops-basics',
    title: 'DevOps Fundamentals & Culture',
    authorSlug: 'lena-fischer',
    order: 1,
    tags: ['devops', 'culture', 'cicd'],
    bannerImg: banner('devops-basics'),
    shortDescription:
      'DevOps is a culture before it is a toolchain: shared ownership, fast feedback, and automating the path from commit to production.',
    facts: [
      'DevOps is 80% culture and 20% tooling — tools cannot fix a blame culture.',
      'The core metric is lead time: commit to running in production.',
      'You build it, you run it — ownership shrinks the wall between dev and ops.',
    ],
    summary:
      'DevOps merges development and operations around shared ownership and automation. The goal is short, safe feedback loops from code to production, measured by lead time, deploy frequency, and change-failure rate.',
    description:
      'DevOps is a set of practices and a culture that shortens the distance between writing code and running it in production. It replaces the old wall between "dev" (who ship features) and "ops" (who keep things up) with shared ownership: the team that builds a service also runs it.\n\nIn practice this means automating everything repeatable — builds, tests, deployments, infrastructure — so feedback is fast and releases are boring. The DORA metrics capture whether it is working: deployment frequency, lead time for changes, change-failure rate, and time to restore service. Culture comes first; a pipeline on top of a blame culture just automates finger-pointing.',
    linkedSlugs: ['ci-cd', 'observability'],
    quiz: [
      { question: 'DevOps is primarily about:', options: ['Buying tools', 'Culture and automation across dev and ops', 'Writing more code', 'Hiring more ops staff'], answerIndex: 1 },
      { question: '"You build it, you run it" describes:', options: ['Outsourcing ops', 'Shared ownership of services', 'Manual deploys', 'A cache policy'], answerIndex: 1 },
      { question: 'Lead time for changes measures:', options: ['Server uptime', 'Time from commit to production', 'Number of bugs', 'Cache hit rate'], answerIndex: 1 },
      { question: 'The DORA metrics do NOT include:', options: ['Deployment frequency', 'Change-failure rate', 'Lines of code written', 'Time to restore service'], answerIndex: 2 },
      { question: 'Automation in DevOps aims to make releases:', options: ['Rare and risky', 'Frequent and boring', 'Manual', 'Slower'], answerIndex: 1 },
      { question: 'A blame culture with a pipeline results in:', options: ['Perfect DevOps', 'Automated finger-pointing', 'Faster culture change', 'No deploys'], answerIndex: 1 },
      { question: 'DevOps reduces the traditional wall between:', options: ['Frontend and backend', 'Development and operations', 'QA and design', 'Sales and support'], answerIndex: 1 },
      { question: 'Fast feedback loops help teams:', options: ['Ship slower', 'Catch problems earlier and cheaper', 'Avoid testing', 'Write less'], answerIndex: 1 },
      { question: 'Change-failure rate measures:', options: ['How often deploys cause a failure', 'CPU usage', 'Cache misses', 'Team size'], answerIndex: 0 },
      { question: 'The biggest lever in adopting DevOps is usually:', options: ['A new CI tool', 'Culture and ownership', 'More servers', 'A bigger database'], answerIndex: 1 },
    ],
  },
  {
    path: 'devops',
    slug: 'ci-cd',
    title: 'CI/CD Pipelines',
    authorSlug: 'lena-fischer',
    order: 2,
    tags: ['ci', 'cd', 'automation', 'pipelines'],
    bannerImg: banner('ci-cd'),
    shortDescription:
      'Continuous integration, delivery, and deployment: what each term actually means and why fast, trustworthy pipelines matter.',
    facts: [
      'Continuous delivery keeps you always releasable; continuous deployment actually releases automatically.',
      'A flaky test suite quietly destroys trust in the whole pipeline.',
      'Small, frequent merges cause fewer conflicts than big long-lived branches.',
    ],
    summary:
      'CI merges and tests every change automatically; CD keeps the app in a releasable state (delivery) or ships it automatically (deployment). The payoff is fast, low-risk releases — if the tests are trustworthy.',
    description:
      'Continuous integration (CI) means every commit is automatically built and tested, so integration problems surface within minutes instead of at a painful merge weeks later. It relies on a fast, reliable test suite and small, frequent merges to a shared branch.\n\nContinuous delivery (CD) extends this so the software is always in a deployable state, with releases a push-button away. Continuous deployment goes further and ships every passing change to production automatically. Pipelines typically run stages — build, test, security scan, deploy to staging, then production — often with progressive strategies like blue-green or canary to limit blast radius. The whole thing only works if teams trust the tests; flaky tests erode that trust fast.',
    linkedSlugs: ['containers-docker', 'devops-basics'],
    quiz: [
      { question: 'Continuous integration means:', options: ['Deploying once a quarter', 'Automatically building and testing every commit', 'Manual merges', 'Writing docs'], answerIndex: 1 },
      { question: 'Continuous delivery keeps the app:', options: ['Always in a releasable state', 'Offline', 'Untested', 'On one server'], answerIndex: 0 },
      { question: 'Continuous deployment differs from delivery by:', options: ['Never testing', 'Releasing every passing change automatically', 'Using no pipeline', 'Requiring manual QA'], answerIndex: 1 },
      { question: 'CI depends most on:', options: ['A slow test suite', 'A fast, reliable test suite', 'Large branches', 'Manual builds'], answerIndex: 1 },
      { question: 'A canary release:', options: ['Ships to all users at once', 'Rolls out to a small subset first', 'Skips testing', 'Deletes old versions'], answerIndex: 1 },
      { question: 'Blue-green deployment uses:', options: ['One environment', 'Two environments to switch traffic safely', 'No environments', 'Only staging'], answerIndex: 1 },
      { question: 'Flaky tests are harmful because they:', options: ['Speed up builds', 'Erode trust in the pipeline', 'Improve coverage', 'Reduce merges'], answerIndex: 1 },
      { question: 'Small, frequent merges help by:', options: ['Causing more conflicts', 'Reducing merge conflicts', 'Avoiding CI', 'Slowing releases'], answerIndex: 1 },
      { question: 'A typical pipeline stage order is:', options: ['Deploy, build, test', 'Build, test, deploy', 'Test, deploy, build', 'Deploy only'], answerIndex: 1 },
      { question: 'The goal of CI/CD is releases that are:', options: ['Rare and risky', 'Fast and low-risk', 'Manual', 'Untested'], answerIndex: 1 },
    ],
  },
  {
    path: 'devops',
    slug: 'containers-docker',
    title: 'Containers & Docker',
    authorSlug: 'lena-fischer',
    order: 3,
    tags: ['docker', 'containers', 'images'],
    bannerImg: banner('containers-docker'),
    shortDescription:
      'Why containers beat "works on my machine": images, layers, and the difference between a container and a VM.',
    facts: [
      'Containers share the host kernel; VMs each run a full guest OS.',
      'A Docker image is built from cached, immutable layers.',
      'Smaller base images mean faster pulls and a smaller attack surface.',
    ],
    summary:
      'Containers package an app with its dependencies into a portable image that runs the same everywhere. Unlike VMs, they share the host kernel, making them lightweight and fast to start.',
    description:
      'A container bundles an application with everything it needs to run — libraries, binaries, config — into a single portable unit. Because the container includes its dependencies, it runs identically on a laptop, a CI runner, and production, killing the "works on my machine" problem.\n\nContainers differ from virtual machines: a VM virtualizes hardware and runs a full guest OS, while a container shares the host kernel and isolates only the process. That makes containers far lighter and quicker to start. Docker images are built in layers from a Dockerfile; layers are cached and reused, so rebuilds are fast. Choosing a small base image and ordering Dockerfile steps for cache efficiency are the two highest-leverage habits.',
    linkedSlugs: ['kubernetes', 'ci-cd'],
    quiz: [
      { question: 'A container packages an app together with its:', options: ['Own kernel', 'Dependencies and config', 'Hardware', 'Load balancer'], answerIndex: 1 },
      { question: 'Compared to a VM, a container:', options: ['Runs a full guest OS', 'Shares the host kernel', 'Is always slower', 'Needs more memory'], answerIndex: 1 },
      { question: 'A Docker image is built from:', options: ['A single binary blob', 'Cached, immutable layers', 'Random files', 'The host OS'], answerIndex: 1 },
      { question: 'Containers solve which classic problem?', options: ['"Works on my machine"', 'Slow databases', 'Network latency', 'Cache invalidation'], answerIndex: 0 },
      { question: 'A Dockerfile is:', options: ['A running container', 'A recipe to build an image', 'A load balancer config', 'A database schema'], answerIndex: 1 },
      { question: 'Smaller base images give you:', options: ['Slower pulls', 'Faster pulls and smaller attack surface', 'More vulnerabilities', 'Bigger layers'], answerIndex: 1 },
      { question: 'An image is to a container as:', options: ['A class is to an instance', 'A server is to a client', 'A cache is to a DB', 'A branch is to a commit'], answerIndex: 0 },
      { question: 'Layer caching makes rebuilds:', options: ['Slower', 'Faster when earlier layers are unchanged', 'Impossible', 'Random'], answerIndex: 1 },
      { question: 'Containers isolate primarily at the level of:', options: ['Hardware', 'The process (via the kernel)', 'The datacenter', 'The browser'], answerIndex: 1 },
      { question: 'Ordering Dockerfile steps matters for:', options: ['Colors', 'Cache efficiency', 'Network speed', 'Disk encryption'], answerIndex: 1 },
    ],
  },
  {
    path: 'devops',
    slug: 'kubernetes',
    title: 'Kubernetes Orchestration',
    authorSlug: 'lena-fischer',
    order: 4,
    tags: ['kubernetes', 'orchestration', 'scaling'],
    bannerImg: banner('kubernetes'),
    shortDescription:
      'Kubernetes runs containers at scale: pods, deployments, services, and the declarative reconcile loop that keeps desired state.',
    facts: [
      'Kubernetes is declarative: you describe desired state and it reconciles toward it.',
      'The smallest deployable unit is a Pod, not a container.',
      'A Service gives a stable address to a set of ever-changing pods.',
    ],
    summary:
      'Kubernetes orchestrates containers across a cluster. You declare desired state (replicas, images) and controllers continuously reconcile reality to match, handling scheduling, self-healing, and scaling.',
    description:
      'Kubernetes is a container orchestrator: it schedules containers onto a cluster of machines and keeps them running. Its defining idea is declarative reconciliation — you submit the desired state (for example, "run 5 replicas of this image"), and controllers continuously compare actual state to desired state and act to close the gap. Kill a pod and it comes back; a node dies and its pods reschedule elsewhere.\n\nThe key objects: a Pod is the smallest deployable unit wrapping one or more containers; a Deployment manages a replicated, self-healing set of pods and handles rolling updates; a Service provides a stable virtual IP and DNS name in front of pods whose IPs change constantly. Horizontal Pod Autoscalers add or remove replicas based on load, connecting orchestration back to the scalability fundamentals.',
    linkedSlugs: ['containers-docker', 'scalability'],
    quiz: [
      { question: 'Kubernetes is best described as:', options: ['A database', 'A container orchestrator', 'A CI server', 'A cache'], answerIndex: 1 },
      { question: 'Kubernetes works by:', options: ['Running scripts once', 'Reconciling actual state toward desired state', 'Manual restarts', 'Compiling code'], answerIndex: 1 },
      { question: 'The smallest deployable unit in Kubernetes is a:', options: ['Container', 'Pod', 'Node', 'Service'], answerIndex: 1 },
      { question: 'A Deployment is responsible for:', options: ['Storing secrets', 'Managing a replicated, self-healing set of pods', 'DNS only', 'Building images'], answerIndex: 1 },
      { question: 'A Service provides:', options: ['A stable address for changing pods', 'Persistent disk', 'A container image', 'A Dockerfile'], answerIndex: 0 },
      { question: 'If a pod crashes, Kubernetes will:', options: ['Ignore it', 'Recreate it to match desired state', 'Delete the deployment', 'Page you manually'], answerIndex: 1 },
      { question: 'A Horizontal Pod Autoscaler adjusts:', options: ['Disk size', 'The number of pod replicas based on load', 'Image layers', 'DNS records'], answerIndex: 1 },
      { question: 'Declarative configuration means you specify:', options: ['Step-by-step commands', 'The desired end state', 'Nothing', 'Only imperative scripts'], answerIndex: 1 },
      { question: 'Rolling updates let a Deployment:', options: ['Replace pods gradually with no downtime', 'Delete everything first', 'Skip health checks', 'Run one pod only'], answerIndex: 0 },
      { question: 'Kubernetes connects to scalability via:', options: ['Manual scaling only', 'Autoscaling replicas across nodes', 'Vertical scaling only', 'Caching'], answerIndex: 1 },
    ],
  },
];
