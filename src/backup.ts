import { z } from 'zod'
import { readFile, writeFile } from 'node:fs/promises'

// The backup only records channels whose name actually changed during a swap,
// so a restore is minimal and never touches untouched channels.
export const channelBackupSchema = z
	.object({
		id: z.string(),
		name: z.string(),
	})
	.array()

export type ChannelBackup = z.infer<
	typeof channelBackupSchema
>

export const loadBackup = async (
	path: string,
): Promise<ChannelBackup> =>
	channelBackupSchema.parse(
		JSON.parse(await readFile(path, 'utf-8')),
	)

export const saveBackup = async (
	path: string,
	data: ChannelBackup,
): Promise<void> =>
	await writeFile(
		path,
		JSON.stringify(data, null, 2) + '\n',
	)
