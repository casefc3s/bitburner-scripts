/** @param {NS} ns */
export async function main(ns) {
	var ram = 128;
	if (ns.args.length > 0) {
		ram = parseInt(ns.args[0]);
	}
	ns.tprint(`Max servers: ${ns.getPurchasedServerLimit()}, Max RAM: ${ns.getPurchasedServerMaxRam().toLocaleString()}GB`);
	ns.tprint(`${ram}GB server cost: ${ns.getPurchasedServerCost(ram).toLocaleString()}`);
	ns.tprint(`${ram*2}GB server cost: ${ns.getPurchasedServerCost(ram*2).toLocaleString()}`);
	ns.tprint(`${ram*2*2}GB server cost: ${ns.getPurchasedServerCost(ram*2*2).toLocaleString()}`);

	var servers = ns.getPurchasedServers();
	for (const server of servers) {
		ns.tprint(`Server '${server}': ${ns.getServerMaxRam(server).toLocaleString()}GB`);
	}
}