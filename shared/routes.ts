import { z } from 'zod';
import { posts } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  posts: {
    list: {
      method: 'GET' as const,
      path: '/api/posts' as const,
      responses: {
        200: z.array(z.custom<typeof posts.$inferSelect>()),
      },
    },
    generate: {
      method: 'POST' as const,
      path: '/api/posts/generate' as const,
      input: z.object({
        topic: z.string(),
        tone: z.string(),
      }),
      responses: {
        201: z.custom<typeof posts.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    refine: {
      method: 'POST' as const,
      path: '/api/posts/refine' as const,
      input: z.object({
        draft: z.string(),
      }),
      responses: {
        201: z.custom<typeof posts.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type PostResponse = z.infer<typeof api.posts.list.responses[200]>[0];
export type GenerateInput = z.infer<typeof api.posts.generate.input>;
export type RefineInput = z.infer<typeof api.posts.refine.input>;
