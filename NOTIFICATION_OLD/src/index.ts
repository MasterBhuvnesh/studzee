import app from '@/app';
import { startHeartbeatJob } from '@/jobs/heartbeat';

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  startHeartbeatJob();
});
