import type { Request } from 'express';
import { badRequest } from './errors.js';

export function paramId(req: Request, name = 'id'): string {
  const raw = req.params[name];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || typeof value !== 'string') {
    throw badRequest(`Missing route param: ${name}`);
  }
  return value;
}
