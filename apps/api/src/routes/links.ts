/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.ts';
import { rateLimitUserLinkCreation } from '../middleware/rateLimit.ts';
import { linkController } from '../controllers/link.controller.ts';

export const linksRouter = Router();

// Enforce authentication on all link management endpoints
linksRouter.use(requireAuth);

// List links owned by authenticated user
linksRouter.get('/', (req, res) => linkController.listLinks(req, res));

// Create link with per-user rate limiting
linksRouter.post('/', rateLimitUserLinkCreation(), (req, res) => linkController.createLink(req, res));

// Retrieve single link (ownership verified)
linksRouter.get('/:id', (req, res) => linkController.getLink(req, res));

// Update link destination, enabled status, title, or expiry (ownership verified)
linksRouter.patch('/:id', (req, res) => linkController.updateLink(req, res));

// Delete link (ownership verified)
linksRouter.delete('/:id', (req, res) => linkController.deleteLink(req, res));
