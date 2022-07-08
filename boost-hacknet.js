let baseWaitTime = 60000;
let quickWaitTime = 200;

/** @param {NS} ns */
export async function main(ns) {
	var maxServers = 30;
	var waitTime = baseWaitTime;

	while (true) {
		var numNodes = ns.hacknet.numNodes();
		if (numNodes === maxServers && isServerMaxxed(ns, maxServers - 1)) {
			break;
		}

		waitTime = buyCheapestUpgrade(ns, numNodes) ? quickWaitTime : baseWaitTime;
		await ns.sleep(waitTime);
	}

	var serverCost = ns.getPurchasedServerCost(ram);
	ns.tprint(`Purchasing servers with ${ram}GB RAM.`);
	ns.tprint(`Server cost: ${serverCost.toLocaleString()}`);

	ns.tprint(`Purchased ${numPurchased} new ${ram}GB RAM servers.`);
}

function buyCheapestUpgrade(ns, numNodes) {
	var ndx = -1;
	var cat = 0;
	var cost = ns.hacknet.getPurchaseNodeCost();
	var cash = ns.getServerMoneyAvailable('home');
	for (var i = 0; i < numNodes; ++i) {
		var level = ns.hacknet.getLevelUpgradeCost(i, 10);
		var ram = ns.hacknet.getRamUpgradeCost(i, 1);
		var core = ns.hacknet.getCoreUpgradeCost(i, 1);

		if (level >= cost && ram >= cost && core >= cost) {
			continue;
		}

		ndx = i;

		if (level < ram && level < core) {
			cat = 0;
			cost = level;
		}
		else if (ram < level && ram < core) {
			cat = 1;
			cost = ram;
		}
		else {
			cat = 2;
			cost = core;
		}
	}

	if (cost > cash) {
		ns.print(`You're too poor! Cheapest upgrade was ${cost.toLocaleString()}`);
		return false;
	}

	if (ndx < 0) {
		ns.hacknet.purchaseNode();
		ns.tprint(`Purchased new hacknet node at: ${cost.toLocaleString()}`);
	}
	else {
		if (cat === 0) {
			ns.hacknet.upgradeLevel(ndx, 10);
			ns.tprint(`Upgraded hacknet-${ndx} level for ${cost.toLocaleString()}`);
		}
		else if (cat === 1) {
			ns.hacknet.upgradeRam(ndx, 1);
			ns.tprint(`Upgraded hacknet-${ndx} RAM for ${cost.toLocaleString()}`);
		}
		else {
			ns.hacknet.upgradeCore(ndx, 1);
			ns.tprint(`Upgraded hacknet-${ndx} cores for ${cost.toLocaleString()}`);
		}
	}

	return true;
}

function isServerMaxxed(ns, ndx) {
	if (ns.hacknet.getLevelUpgradeCost(ndx, 1) !== Infinity) {
		return false;
	}
	if (ns.hacknet.getRamUpgradeCost(ndx, 1) !== Infinity) {
		return false;
	}
	if (ns.hacknet.getCoreUpgradeCost(ndx, 1) !== Infinity) {
		return false;
	}

	return true;
}