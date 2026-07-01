import { Cron } from 'croner'
import { FlagSwapperBot } from './bot.js'
import { loadConfig } from './config.js'
import { type ILogObj, Logger } from 'tslog'
import { env } from 'node:process'

const config = await loadConfig()

const logger = new Logger<ILogObj>({
	minLevel: config.LOG_LEVEL,
})

// Container entrypoint: stay resident and let cron fire the two operations.
const bot = new FlagSwapperBot(config, logger)
await bot.start()

const opts = { timezone: config.TZ }

// July 1st 00:00 (Eastern) -> swap normal emojis to the maple flag.
const swapJob = new Cron('0 0 1 7 *', opts, async () => {
	try {
		await bot.swap()
	} catch (e) {
		logger.error('swap failed', e)
	}
})
// July 2nd 00:00 (Eastern) -> restore original names.
const restoreJob = new Cron('0 0 2 7 *', opts, async () => {
	try {
		await bot.restore()
	} catch (e) {
		logger.error('restore failed', e)
	}
})

logger.info(`Scheduled in ${config.TZ}:`)
logger.info(
	`  swap    -> next: ${swapJob.nextRun()?.toISOString()}`,
)
logger.info(
	`  restore -> next: ${restoreJob.nextRun()?.toISOString()}`,
)

const shutdown = async (signal: string) => {
	logger.info(`${signal} received, shutting down`)
	swapJob.stop()
	restoreJob.stop()
	await bot.stop()
	process.exit(0)
}
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
