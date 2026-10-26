/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { app } from './app.ts';
import { env } from './config/env.ts';

const port = process.env.API_PORT ? Number(process.env.API_PORT) : (env.PORT || 4000);

app.listen(port, () => {
  console.log(`[SmartLink AI API] Standalone server running at http://localhost:${port}${env.API_PREFIX}`);
  console.log(`[SmartLink AI API] Health check endpoint: http://localhost:${port}${env.API_PREFIX}/health`);
});
