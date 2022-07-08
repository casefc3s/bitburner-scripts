/** @param {NS} ns */
export async function main(ns) {
	var text = ns.args.join(' ');
	for (var i = 1; i <= 20; ++i) {
		var res = await ns.writePort(parseInt(i), text);
		ns.tprint(res);
		await ns.sleep(100);
	}
}