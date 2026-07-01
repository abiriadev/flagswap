import { z } from 'zod'
import { readFile } from 'node:fs/promises'
import { env } from 'node:process'

export const configSchema = z.object({
	DISCORD_TOKEN: z.string(),
	GUILD_ID: z.string(),
	LOG_CHANNEL_ID: z.string(),
	FLAG_EMOJI: z.string().default('🍁'),
	BACKUP_PATH: z
		.string()
		.default('./backup-codinglab.json'),
	LOG_LEVEL: z.number().int().nonnegative().default(3),
	// IANA name
	TZ: z.string().default('America/Toronto'),
})

export type Config = z.infer<typeof configSchema>

export async function loadConfig(
	path = env.FLAGSWAP_CONFIG ?? './config.json',
): Promise<Config> {
	let fileConfig: unknown = {}
	try {
		fileConfig = JSON.parse(
			await readFile(path, 'utf-8'),
		)
	} catch {
		// A missing file is fine
	}

	const merged = { ...(fileConfig as object), ...env }

	return configSchema.parse(merged)
}
