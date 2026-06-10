import { z } from 'zod'

const emailSchema = z
	.string()
	.min(1, 'Enter your email')
	.email('Enter a valid email address')

export const signUpSchema = z.object({
	email: emailSchema,
	password: z
		.string()
		.min(8, 'Password must be at least 8 characters')
		.max(72, 'Password must be at most 72 characters'),
	confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
	message: 'Passwords do not match',
	path: ['confirmPassword'],
})

export const signInSchema = z.object({
	email: emailSchema,
	password: z.string().min(1, 'Enter your password'),
})

export type SignUpFormValues = z.infer<typeof signUpSchema>
export type SignInFormValues = z.infer<typeof signInSchema>
