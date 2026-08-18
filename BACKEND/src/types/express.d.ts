// @clerk/express declares Request.auth in its own module scope, which does not
// reach the global Express namespace, so this augmentation is still required.
// The type comes from @clerk/backend, the package @clerk/express is built on,
// rather than the end of life @clerk/clerk-sdk-node.
//
// SessionAuthObject, not AuthObject. In @clerk/backend v2 the latter widened to
// include machine tokens, which carry no userId, so every `req.auth().userId`
// in the codebase fails to compile against it. SessionAuthObject is the
// SignedInAuthObject | SignedOutAuthObject union this API actually receives,
// and it matches what @clerk/express declares internally.
import { SessionAuthObject } from '@clerk/backend'

declare global {
  namespace Express {
    export interface Request {
      auth: () => SessionAuthObject
    }
  }
}
