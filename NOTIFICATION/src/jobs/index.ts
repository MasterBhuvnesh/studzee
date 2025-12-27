import { startTokenCleanupJob } from './cleanupTokens';
import { startHeartbeatJob } from './heartbeat';

export const startAllJobs = () => {
  startHeartbeatJob();
  startTokenCleanupJob();
};
