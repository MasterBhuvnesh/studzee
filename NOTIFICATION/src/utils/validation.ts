import { z } from 'zod';

export const registerUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  expoToken: z.string().min(1, 'Expo token is required'),
});

export const sendNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  imageUrl: z.string().url('Invalid image URL').optional(),
  sendToAll: z.boolean(),
  emails: z.array(z.string().email()).optional(),
});

export const sendEmailSchema = z.object({
  emails: z.array(z.string().email()).min(1, 'At least one email is required'),
  subject: z.string().min(1, 'Subject is required'),
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
  footer: z.string().optional(),
  pdfUrls: z.array(z.string().url()).optional(),
});
