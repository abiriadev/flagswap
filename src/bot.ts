import {
	Client,
	Events,
	GatewayIntentBits,
	type Guild,
} from 'discord.js'
import {
	loadBackup,
	saveBackup,
	type ChannelBackup,
} from './backup.js'
import type { Config } from './config.js'
import { type ILogObj, Logger } from 'tslog'

// Matches any emoji-like pictographic character in a channel name.
const EMOJI = /\p{Extended_Pictographic}/gu

export class FlagSwapperBot {
	readonly #config: Config
	readonly #logger: Logger<ILogObj>
	readonly #client: Client

	constructor(config: Config, logger: Logger<ILogObj>) {
		this.#config = config
		this.#logger = logger.getSubLogger({
			name: 'FlagSwappperBot',
		})
		this.#client = new Client({
			intents: [GatewayIntentBits.Guilds],
		})
	}

	// wait until the gateway is ready.
	async start(): Promise<void> {
		await new Promise<void>((resolve, reject) => {
			this.#client.once(Events.ClientReady, c => {
				this.#logger.info(
					`Logged in as ${c.user.tag}`,
				)
				resolve()
			})
			this.#client
				.login(this.#config.DISCORD_TOKEN)
				.catch(reject)
		})
	}

	async stop(): Promise<void> {
		await this.#client.destroy()
		this.#logger.info('Disconnected')
	}

	/**
	 * Back up the current names, then rename every channel that contains an
	 * emoji so it shows the flag instead. Renaming happens only after the
	 * backup is safely written.
	 */
	async swap(): Promise<void> {
		this.#logger.info('swap started')

		const guild = await this.guild()
		await this.announce(
			'🍁 **Starting Canada Day flag swap...**',
		)

		const channels = await guild.channels.fetch()
		const toChange: ChannelBackup = []
		for (const ch of channels.values()) {
			if (!ch) continue
			const flagged = ch.name.replaceAll(
				EMOJI,
				this.#config.FLAG_EMOJI,
			)
			if (flagged !== ch.name)
				toChange.push({ id: ch.id, name: ch.name })
		}

		// Backup must complete before we mutate anything.
		await saveBackup(this.#config.BACKUP_PATH, toChange)
		this.#logger.info(
			`Backed up ${toChange.length} channel name(s)`,
		)

		for (const { id, name } of toChange) {
			const ch = channels.get(id)
			if (!ch) continue
			const flagged = name.replaceAll(
				EMOJI,
				this.#config.FLAG_EMOJI,
			)
			await ch.setName(flagged)
			this.#logger.info(
				`Swapped <#${id}>: ${name} -> ${flagged}`,
			)
		}

		await this.announce(
			`🍁 **Flag swap complete** — ${toChange.length} channel(s) flagged.`,
		)

		this.#logger.info('swap completed')
	}

	/** Restore the channel names recorded by the most recent swap. */
	async restore(): Promise<void> {
		this.#logger.info('restore started')

		const guild = await this.guild()
		const backup = await loadBackup(
			this.#config.BACKUP_PATH,
		)
		await this.announce(
			`↩️ **Restoring channel names** — ${backup.length} channel(s)…`,
		)

		const channels = await guild.channels.fetch()
		let restored = 0
		for (const { id, name } of backup) {
			const ch = channels.get(id)
			if (!ch) {
				this.#logger.warn(
					`Channel ${id} no longer exists; skipping`,
				)
				continue
			}
			await ch.setName(name)
			this.#logger.info(
				`Restored <#${id}> -> ${name}`,
			)
			restored++
		}

		await this.announce(
			`✅ **Restore complete** - ${restored} channel(s) restored.`,
		)

		this.#logger.info('restore completed')
	}

	private async guild(): Promise<Guild> {
		return this.#client.guilds.fetch(
			this.#config.GUILD_ID,
		)
	}

	private async announce(message: string): Promise<void> {
		try {
			const ch = await this.#client.channels.fetch(
				this.#config.LOG_CHANNEL_ID,
			)
			if (ch?.isTextBased() && ch.isSendable())
				await ch.send(message)
		} catch (err) {
			// Announcements are best-effort; never let them abort the swap.
			this.#logger.warn(
				'Failed to post admin announcement',
				err,
			)
		}
	}
}
