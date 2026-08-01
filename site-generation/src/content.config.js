import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    category: z.enum(['hardware', 'software']),
    description: z.string(),
    image: z.string().optional(),
    links: z
      .array(
        z.object({
          label: z.string(),
          url: z.string(),
        })
      )
      .optional(),
  }),
});

export const collections = { projects };