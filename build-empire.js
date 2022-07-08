/** @param {NS} ns */
export async function main(ns) {
	ns.run('spread.js');
	await ns.sleep(1000);
	ns.run('buy-servers.js');
	await ns.sleep(1000);
	ns.run('boost-hacknet.js');
}