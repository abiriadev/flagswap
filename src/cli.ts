import { type ILogObj, Logger } from 'tslog'
import { FlagSwapperBot } from './bot.js'
import { loadConfig } from './config.js'

const config = await loadConfig()

const logger = new Logger<ILogObj>({
	minLevel: config.LOG_LEVEL,
})

// subcommand
// One-shot entrypoint: run a single operation and exit. Used by GitHub Actions.
const action = process.argv[2]

// cli parse
if (action !== 'swap' && action !== 'restore') {
	// note that the cli usage message will be printed to the stdout directly
	console.log(
		`Usage: cli.ts <swap|restore> (got: ${action ?? 'nothing'})`,
	)
	process.exit(1)
}

const bot = new FlagSwapperBot(config, logger)

try {
	await bot.start()

	// exec by subcommand
	if (action === 'swap') await bot.swap()
	else await bot.restore()
} catch (err) {
	logger.fatal(`${action} failed`, err)

	await bot.stop()

	process.exit(1)
}

await bot.stop()
// process.exit(0)
