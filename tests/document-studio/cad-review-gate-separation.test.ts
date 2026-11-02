import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CAD_REAL_USER_RELEASE_ACK_ENV,
  getCadRealUserReleaseBlockReason,
} from "../../scripts/check-cad-real-user-authorization";

test("real-user release gate blocks without explicit dataset authorization", () => {
  assert.match(getCadRealUserReleaseBlockReason({}), /acknowledgment is required/);
  assert.match(
    getCadRealUserReleaseBlockReason({ [CAD_REAL_USER_RELEASE_ACK_ENV]: "true" }),
    /acknowledgment is required/
  );
  assert.equal(getCadRealUserReleaseBlockReason({ [CAD_REAL_USER_RELEASE_ACK_ENV]: "1" }), null);
});
