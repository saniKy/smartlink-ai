/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { redirectController } from '../controllers/redirect.controller.ts';

export const redirectRouter = Router();

// Public short URL redirect route
redirectRouter.get('/:code', (req, res) => redirectController.handleRedirect(req, res));
