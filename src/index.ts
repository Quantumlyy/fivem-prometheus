import prometheus from 'prom-client';

const prometheusTimeout = GetConvarInt('prometheus_timeout', 5000);

const playerCount = new prometheus.Gauge({ name: 'fxs_player_count', help: 'Number of connected players.' });
const playerConnections = new prometheus.Counter({ name: 'fxs_player_connections', help: 'Number of player connections.' });
const playerDisconnections = new prometheus.Counter({ name: 'fxs_player_disconnections', help: 'Number of player disconnections.' });
const averageLatency = new prometheus.Gauge({ name: 'fxs_average_player_latency', help: 'Average player latency.' });
const latencyHistogram = new prometheus.Histogram({
	name: 'fxs_players_latency',
	help: 'Players latency.',
	buckets: [10, 20, 50, 70, 100, 120, 150, 160, 200]
});
const minPlayerPing = new prometheus.Gauge({ name: 'fxs_min_player_ping', help: 'Minimum player ping.' });
const maxPlayerPing = new prometheus.Gauge({ name: 'fxs_max_player_ping', help: 'Maximum player ping.' });

setInterval(() => {
	const numIndices = GetNumPlayerIndices();

	let cumulativeLatency = 0;
	let minPing: number | undefined;
	let maxPing: number | undefined;

	for (let playerIndex = 0; playerIndex < numIndices; ++playerIndex) {
		const playerPing = GetPlayerPing(GetPlayerFromIndex(playerIndex));
		cumulativeLatency += playerPing;
		if (!minPing || minPing > playerPing) {
			minPing = playerPing;
		}
		if (!maxPing || maxPing < playerPing) {
			maxPing = playerPing;
		}
		latencyHistogram.observe(playerPing);
	}

	playerCount.set(numIndices);
	if (numIndices > 0) {
		averageLatency.set(cumulativeLatency / numIndices);
		minPlayerPing.set(minPing ?? 0);
		maxPlayerPing.set(maxPing ?? 0);
	} else {
		averageLatency.set(0);
		minPlayerPing.set(0);
		maxPlayerPing.set(0);
	}
}, prometheusTimeout);

on('playerConnecting', () => {
	playerConnections.inc();
});

on('playerDropped', () => {
	playerDisconnections.inc();
});
