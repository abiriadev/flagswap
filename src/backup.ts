import {
	ChannelType,
	Client,
	Events,
	GatewayIntentBits,
	NonThreadGuildBasedChannel,
} from 'discord.js'
import { readFile, writeFile } from 'fs/promises'
import { env } from 'node:process'

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessages,
	],
})

const backup = JSON.parse(
	await readFile('./backup-codinglab.json', 'utf-8'),
)

client.on('ready', async a => {
	console.log(`Logged in as ${a.user.tag}!`)

	// const g = client.guilds.resolve('1389070601733275850')
	const g = client.guilds.resolve('687271752224735233')

	const channels = await g?.channels.fetch()

	if (!channels) throw 1

	for (const { id, name } of backup) {
		const ch = channels.get(id)

		if (!ch)
			throw new Error(
				`Channel with ID ${id} not found`,
			)

		await ch.setName(name)

		console.log(`Renamed <#${id}> to ${name}`)
	}

	// const channelLogs: any[] = []

	// const chs: NonThreadGuildBasedChannel[] = []

	// channels?.forEach(async channel => {
	// 	if (!channel) return

	// 	// if (channel.type === ChannelType.GuildCategory) return

	// 	chs.push(channel)

	// 	// }

	// 	// channelLogs.push({
	// 	// 	id: channel.id,
	// 	// 	name: channel.name,
	// 	// })
	// })

	// for (const ch of chs) {
	// 	const name = ch.name.replaceAll(
	// 		/\p{Extended_Pictographic}/gu,
	// 		'🍁',
	// 	)

	// 	console.log(`<#${ch.id}> ${name}`)

	// 	// if (channel.type === ChannelType.GuildText) {
	// 	await ch.setName(name)
	// }

	// await writeFile(
	// 	'./backup.json',
	// 	JSON.stringify(channelLogs, null, 2),
	// )

	client.destroy()
})

client.login(env['DISCORD_TOKEN'])
