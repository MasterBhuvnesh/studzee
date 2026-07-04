import type { SeedBlog } from './index';

// Empty = use the generated mesh-gradient banner. Set a URL to override per blog.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const banner = (_slug: string) => '';

export const systemDesignBlogs: SeedBlog[] = [
  {
    path: 'system-design',
    slug: 'system-design-basics',
    title: 'System Design Fundamentals',
    authorSlug: 'aarav-mehta',
    order: 1,
    tags: ['fundamentals', 'architecture', 'interview'],
    bannerImg: banner('system-design-basics'),
    shortDescription:
      'The mental model for designing any system: requirements, estimates, and trade-offs before a single box is drawn.',
    facts: [
      'There is no "correct" design — only trade-offs that fit constraints.',
      'Back-of-the-envelope estimates catch bad designs in minutes, not weeks.',
      'Most interview systems fail on the requirements step, not the diagram.',
    ],
    summary:
      'Good system design starts by clarifying functional and non-functional requirements, doing rough capacity estimates, then choosing components whose trade-offs match those constraints.',
    description:
      'Every system design begins the same way: figure out what the system must do (functional requirements) and how well it must do it (non-functional requirements like latency, availability, and durability). Skipping this step is the number-one reason designs go sideways.\n\nOnce requirements are clear, do a back-of-the-envelope estimate: expected users, requests per second, storage per year, and bandwidth. These numbers tell you whether a single database is fine or whether you need sharding, caching, and queues. Only then do you sketch components — clients, load balancers, services, data stores — and justify each with the trade-off it buys you.',
    linkedSlugs: ['scalability', 'databases-sql-nosql'],
    quiz: [
      { question: 'What should you clarify first in a system design?', options: ['The database schema', 'Functional and non-functional requirements', 'The programming language', 'The cloud provider'], answerIndex: 1 },
      { question: 'A "non-functional requirement" is best described as:', options: ['A feature users click', 'A quality attribute like latency or availability', 'A bug', 'A UI element'], answerIndex: 1 },
      { question: 'Back-of-the-envelope estimation is used to:', options: ['Write final code', 'Decide rough capacity and scale needs early', 'Design the logo', 'Pick a team name'], answerIndex: 1 },
      { question: 'Which is a functional requirement for a URL shortener?', options: ['99.9% uptime', 'Redirect a short link to the original URL', 'Sub-100ms latency', 'Store data for 5 years'], answerIndex: 1 },
      { question: 'In system design there is usually:', options: ['One correct answer', 'No trade-offs', 'A set of trade-offs to justify', 'Only one valid database'], answerIndex: 2 },
      { question: 'Latency refers to:', options: ['Total requests per second', 'Time to serve a single request', 'Disk size', 'Number of servers'], answerIndex: 1 },
      { question: 'Throughput refers to:', options: ['Time per request', 'Requests handled per unit time', 'Memory usage', 'Error rate'], answerIndex: 1 },
      { question: 'Availability is commonly expressed as:', options: ['Requests/sec', 'A number of "nines" (e.g. 99.9%)', 'Gigabytes', 'Milliseconds'], answerIndex: 1 },
      { question: 'When should you introduce caching or sharding?', options: ['Always, immediately', 'When estimates show a single node cannot cope', 'Never', 'Only in interviews'], answerIndex: 1 },
      { question: 'The most common failure in design interviews is:', options: ['Drawing too few boxes', 'Not clarifying requirements first', 'Using too much cache', 'Naming servers'], answerIndex: 1 },
    ],
  },
  {
    path: 'system-design',
    slug: 'scalability',
    title: 'Scalability & Load Balancing',
    authorSlug: 'aarav-mehta',
    order: 2,
    tags: ['scalability', 'load-balancing', 'availability'],
    bannerImg: banner('scalability'),
    shortDescription:
      'Scale up vs scale out, stateless services, and how load balancers spread traffic without single points of failure.',
    facts: [
      'Horizontal scaling is usually cheaper and more resilient than buying a bigger box.',
      'Stateless services are the secret that makes horizontal scaling easy.',
      'A load balancer you cannot fail over is just a fancier single point of failure.',
    ],
    summary:
      'Scaling out (more machines) beats scaling up (bigger machines) for resilience. It works best with stateless services behind load balancers that health-check and distribute traffic.',
    description:
      'There are two ways to handle more load: vertical scaling (a bigger machine) and horizontal scaling (more machines). Vertical scaling is simple but hits a ceiling and creates a single point of failure. Horizontal scaling adds commodity nodes and, done right, has no hard ceiling.\n\nThe enabler for horizontal scaling is statelessness: if any server can handle any request, a load balancer can spread traffic freely and remove unhealthy nodes. Load balancers use algorithms like round-robin or least-connections, run health checks, and should themselves be redundant so they are not a new single point of failure. Session state is pushed to a shared store (like Redis) instead of living on one server.',
    linkedSlugs: ['caching', 'message-queues', 'kubernetes'],
    quiz: [
      { question: 'Horizontal scaling means:', options: ['A bigger single server', 'Adding more servers', 'Deleting servers', 'Faster disks only'], answerIndex: 1 },
      { question: 'Vertical scaling means:', options: ['Adding more servers', 'Upgrading a single server', 'Load balancing', 'Sharding'], answerIndex: 1 },
      { question: 'What makes horizontal scaling easy?', options: ['Stateful servers', 'Stateless services', 'Bigger CPUs', 'More RAM per node'], answerIndex: 1 },
      { question: 'A load balancer primarily:', options: ['Stores data', 'Distributes traffic across servers', 'Compiles code', 'Renders HTML'], answerIndex: 1 },
      { question: 'Round-robin is a:', options: ['Database index', 'Load-balancing algorithm', 'Cache policy', 'Queue type'], answerIndex: 1 },
      { question: 'Health checks let a load balancer:', options: ['Encrypt traffic', 'Route around unhealthy servers', 'Store sessions', 'Shard data'], answerIndex: 1 },
      { question: 'Where should session state live for easy scaling?', options: ['On each app server', 'In a shared store like Redis', 'In the load balancer', 'In the client only'], answerIndex: 1 },
      { question: 'A single load balancer with no failover is:', options: ['Perfectly safe', 'A single point of failure', 'A cache', 'A shard'], answerIndex: 1 },
      { question: 'Least-connections routing sends a request to:', options: ['A random server', 'The server with fewest active connections', 'The newest server', 'The load balancer'], answerIndex: 1 },
      { question: 'The main downside of vertical scaling is:', options: ['Too cheap', 'A hard ceiling and single point of failure', 'Too many servers', 'It needs Kubernetes'], answerIndex: 1 },
    ],
  },
  {
    path: 'system-design',
    slug: 'caching',
    title: 'Caching Strategies',
    authorSlug: 'aarav-mehta',
    order: 3,
    tags: ['caching', 'performance', 'redis'],
    bannerImg: banner('caching'),
    shortDescription:
      'Cache-aside vs write-through, TTLs, eviction, and the two hard problems: invalidation and stampedes.',
    facts: [
      'There are only two hard things: cache invalidation and naming things.',
      'A cache hit can be 100x faster than the database it protects.',
      'A cache without a TTL or eviction policy is a memory leak with extra steps.',
    ],
    summary:
      'Caches trade freshness for speed. Cache-aside is the common default; the real work is choosing TTLs, an eviction policy (like LRU), and defending against stampedes when hot keys expire.',
    description:
      'A cache stores expensive results close to where they are needed so most reads never hit the slow origin. The most common pattern is cache-aside: the app checks the cache, and on a miss it loads from the database and populates the cache. Write-through and write-back patterns keep the cache updated on writes with different durability trade-offs.\n\nThe hard parts are invalidation and eviction. TTLs bound staleness; eviction policies like LRU decide what to drop when memory is full. Watch out for cache stampedes — when a popular key expires and thousands of requests hit the database at once — which you mitigate with request coalescing, jittered TTLs, or serving stale-while-revalidate.',
    linkedSlugs: ['scalability', 'databases-sql-nosql'],
    quiz: [
      { question: 'The primary reason to cache is:', options: ['Save disk space', 'Serve frequent reads faster', 'Improve security', 'Reduce code size'], answerIndex: 1 },
      { question: 'In cache-aside, on a cache miss the app:', options: ['Returns an error', 'Loads from DB and populates the cache', 'Ignores the request', 'Restarts the server'], answerIndex: 1 },
      { question: 'A TTL controls:', options: ['Cache size', 'How long an entry stays before expiring', 'Network speed', 'CPU usage'], answerIndex: 1 },
      { question: 'LRU eviction removes:', options: ['The largest entry', 'The least recently used entry', 'A random entry always', 'The newest entry'], answerIndex: 1 },
      { question: 'A cache stampede happens when:', options: ['The cache is empty at boot', 'A hot key expires and many requests hit the DB', 'TTL is too long', 'You use LRU'], answerIndex: 1 },
      { question: 'Write-through caching means writes go:', options: ['Only to the DB', 'To the cache and DB together', 'Nowhere', 'Only to the cache'], answerIndex: 1 },
      { question: 'Caching trades away:', options: ['Speed', 'Freshness/consistency', 'Availability', 'Security'], answerIndex: 1 },
      { question: 'Jittered TTLs help by:', options: ['Making keys never expire', 'Spreading out expirations to avoid stampedes', 'Encrypting keys', 'Sharding the cache'], answerIndex: 1 },
      { question: 'A common in-memory cache store is:', options: ['PostgreSQL', 'Redis', 'S3', 'Kafka'], answerIndex: 1 },
      { question: 'A cache with no eviction policy risks:', options: ['Being too fast', 'Running out of memory', 'Too many hits', 'Better consistency'], answerIndex: 1 },
    ],
  },
  {
    path: 'system-design',
    slug: 'databases-sql-nosql',
    title: 'SQL vs NoSQL Databases',
    authorSlug: 'aarav-mehta',
    order: 4,
    tags: ['databases', 'sql', 'nosql', 'data-modeling'],
    bannerImg: banner('databases-sql-nosql'),
    shortDescription:
      'When ACID relational tables win, when denormalized NoSQL wins, and what the CAP theorem actually forces you to choose.',
    facts: [
      'NoSQL does not mean "no schema" — it means the schema lives in your code.',
      'CAP forces a choice between consistency and availability only during a partition.',
      'Most apps are fine on a single relational database far longer than teams assume.',
    ],
    summary:
      'SQL databases give you ACID transactions and flexible queries on structured data; NoSQL trades those for horizontal scale and flexible shapes. CAP means during a network partition you pick consistency or availability.',
    description:
      'Relational (SQL) databases store structured rows with strong schemas and ACID transactions, and excel at complex queries and joins. They scale vertically easily and horizontally with more effort (sharding, read replicas). NoSQL databases — key-value, document, column, graph — relax some guarantees to scale horizontally and store flexible or huge datasets.\n\nThe CAP theorem says that when a network partition occurs, a distributed store must choose between consistency (every read sees the latest write) and availability (every request gets a response). This is not a permanent label but a behavior under failure. Pick SQL for transactional integrity and rich queries; pick NoSQL for massive scale, high write throughput, or flexible document shapes.',
    linkedSlugs: ['caching'],
    quiz: [
      { question: 'ACID transactions are a hallmark of:', options: ['NoSQL key-value stores', 'Relational (SQL) databases', 'Object storage', 'Message queues'], answerIndex: 1 },
      { question: 'NoSQL databases generally optimize for:', options: ['Complex joins', 'Horizontal scale and flexible shapes', 'ACID by default', 'Fixed schemas'], answerIndex: 1 },
      { question: 'The CAP theorem is about choices during:', options: ['Normal operation', 'A network partition', 'Backups', 'Schema changes'], answerIndex: 1 },
      { question: 'The "C" in CAP stands for:', options: ['Caching', 'Consistency', 'Concurrency', 'Capacity'], answerIndex: 1 },
      { question: 'A document database stores data as:', options: ['Rows and columns only', 'JSON-like documents', 'Fixed binary blobs', 'Graph edges only'], answerIndex: 1 },
      { question: 'Read replicas primarily help with:', options: ['Write throughput', 'Scaling reads', 'Schema design', 'Encryption'], answerIndex: 1 },
      { question: 'Sharding means:', options: ['Copying the whole DB', 'Splitting data across nodes by a key', 'Caching queries', 'Deleting old rows'], answerIndex: 1 },
      { question: '"NoSQL" most accurately implies:', options: ['No schema at all', 'Schema enforced by the application', 'No data', 'No queries'], answerIndex: 1 },
      { question: 'Choose SQL when you need:', options: ['Massive flexible scale above all', 'Transactional integrity and rich queries', 'No structure', 'Only key lookups'], answerIndex: 1 },
      { question: 'A key-value store is best for:', options: ['Complex multi-table joins', 'Fast lookups by a single key', 'Ad-hoc reporting', 'Foreign-key constraints'], answerIndex: 1 },
    ],
  },
];
