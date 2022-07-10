import * as utils from "utils.js";

let data = {};
//let orders = {};
let allSymbols = [];
let yargs = {};
let minBuyForecast = 0.6;	// if above this, okay to buy
let maxSellForecast = 0.5;	// if below this, okay to sell if losing forecast/above profit
let minSellForecast = 0.4;	// if below this, just sell
let minProfitSell = 1.03;	// if above % profit, okay to sell if losing forecast
let maxProfitSell = 1.1;	// if above % profit, just sell
let minBuyRatio = 1000.0;
let maxVolatility = 0.01;
let transactionCost = 100000;	// cost per transaction (buy/sell)
let records = [];

/** @param {NS} ns */
export async function main(ns) {
	var vf = ['o','p','s'];
	yargs = utils.getFlags(ns.args);

	allSymbols = ns.stock.getSymbols();

	var printOnly = false;
	for (const v of vf) {
		if (yargs && yargs.hasOwnProperty(v)) {
			printOnly = true;
		}
	}

	if (!printOnly) {
		while (true) {
			// update thresholds from file
			await updateThresholds(ns);
			// TODO: monitor ports for manual buy/sell inputs

			// update values
			updateStocks(ns);
			monitorGrowth(ns);

			logRecords(ns);
			await ns.sleep(5000);
		}
	}
	else {
		updateStocks(ns);
		printAllData(ns);
	}
}

function logRecords(ns) {
	var totalSell = 0.0;
	var totalBuy = 0.0;
	for (const r of records) {
		if (r.isBuy) {
			totalBuy = totalBuy + r.value;
		}
		else {
			totalSell = totalSell + r.value;
		}
		// await ns.sleep(1);
	}

	var profit = totalSell - totalBuy;
	//ns.print(`Total buy: \$${totalBuy.toLocaleString()}, sell: \$${totalSell.toLocaleString()}, profit: \$${profit.toLocaleString()}`);
}

async function updateThresholds(ns) {
	var fileName = 'stock-thresholds.txt';
	if (ns.fileExists(fileName)) {
		var thresholds = await ns.read(fileName).split('\n');
		minBuyForecast = Number(thresholds[0].trim());
		maxSellForecast = Number(thresholds[1].trim());
		minSellForecast = Number(thresholds[2].trim());
		minProfitSell = Number(thresholds[3].trim());
		maxProfitSell = Number(thresholds[4].trim());
		minBuyRatio = Number(thresholds[5].trim());
		maxVolatility = Number(thresholds[6].trim());
		ns.print(`Updated thresholds: ${thresholds.join(', ')}`);
	}
}

function monitorGrowth(ns) {
	var top5 = getTop5Growth(ns);
	for (const sym of top5) {
		if (sym['forecast'] < minBuyForecast) {
			continue;
		}

		//ns.tprint(sym);
		var myMoney = ns.getServerMoneyAvailable('home') - transactionCost;
		var sharePrice = ns.stock.getAskPrice(sym['symbol']);
		var maxShares = ns.stock.getMaxShares(sym['symbol']);
		var myShares = getShares(sym);
		if (myShares < maxShares &&	myMoney > sharePrice && ns.stock.getVolatility(sym['symbol']) < maxVolatility) {
			// purchase max
			var shares = Math.min(Math.floor(myMoney / sharePrice), maxShares - myShares);
			if (((shares * sharePrice + transactionCost) / transactionCost) < minBuyRatio) {
				continue;
			}

			sharePrice = ns.stock.buy(sym['symbol'], shares);
			if (sharePrice > 0) {
				var totalCost = sharePrice * shares + transactionCost;
				ns.print(`Purchased ${shares.toLocaleString()} shares of '${sym['symbol']}' @ \$${sharePrice.toLocaleString()} (total: \$${totalCost.toLocaleString()})`);
				records.push({"isBuy": true, "value": totalCost});
			}
		}
	}

	var myStocks = getMyStocks(ns);
	for (const sym of myStocks) {
		//ns.tprint(sym);
		var profitRatio = (getSellPrice(ns, sym) / getPurchasePrice(sym));
		ns.print(`Profit ratio: ${profitRatio}`);
		// below acceptable forecast
		if (sym['forecast'] < minSellForecast) {
			var shares = sym['position']['shares'];
			var purchaseCost = sym['position']['avgPrice'] * shares + transactionCost;
			var soldAt = ns.stock.sell(sym['symbol'], shares);
			var totalSale = shares * soldAt + transactionCost;
			var totalProfit = totalSale - purchaseCost;
			ns.tprint(`${Date.now()} Sold (FORECAST) ${shares.toLocaleString()} shares of '${sym['symbol']}' @ \$${soldAt.toLocaleString()} (profit: \$${totalProfit.toLocaleString()}`);
			records.push({"isBuy": false, "value": totalSale});
		}
		// below acceptable forecast w/ profit
		else if (sym['forecast'] < maxSellForecast && profitRatio > minProfitSell) {
			var shares = sym['position']['shares'];
			var purchaseCost = sym['position']['avgPrice'] * shares + transactionCost;
			var soldAt = ns.stock.sell(sym['symbol'], shares);
			var totalSale = shares * soldAt + transactionCost;
			var totalProfit = totalSale - purchaseCost;
			ns.tprint(`${Date.now()} Sold (F/P) ${shares.toLocaleString()} shares of '${sym['symbol']}' @ \$${soldAt.toLocaleString()} (profit: \$${totalProfit.toLocaleString()}`);
			records.push({"isBuy": false, "value": totalSale});
		}
		// above acceptable sale profit
		else if (profitRatio > maxProfitSell) {
			var shares = sym['position']['shares'];
			var purchaseCost = sym['position']['avgPrice'] * shares + transactionCost;
			var soldAt = ns.stock.sell(sym['symbol'], shares);
			var totalSale = shares * soldAt + transactionCost;
			var totalProfit = totalSale - purchaseCost;
			ns.tprint(`${Date.now()} Sold (PROFIT) ${shares.toLocaleString()} shares of '${sym['symbol']}' @ \$${soldAt.toLocaleString()} (profit: \$${totalProfit.toLocaleString()}`);
			records.push({"isBuy": false, "value": totalSale});
		}
	}
}

function getSellPrice(ns, sym) {
	var shares = sym['position']['shares'];
	return ns.stock.getBidPrice(sym['symbol']) * shares - transactionCost;
}

function getPurchasePrice(sym) {
	var shares = sym['position']['shares'];
	return sym['position']['avgPrice'] * shares + transactionCost;
}

function getShares(sym) {
	return data[sym['symbol']]['position']['shares'];
}

function getTop5Growth(ns) {
	var top5 = [];
	var symbols = [];
	for (const sym of allSymbols) {
		symbols.push(data[sym]);
	}

	var orderBy = 'forecast';
	symbols.sort((a, b) => (b[orderBy] - a[orderBy]));
	top5 = symbols.slice(0, 5);

	return top5;
}

function getMyStocks(ns) {
	var myStocks = [];
	for (const sym of allSymbols) {
		if (data[sym]['position']['shares'] > 0) {
			myStocks.push(data[sym]);
		}
	}

	return myStocks;
}

function updateStocks(ns) {
	//orders = ns.stock.getOrders();

	for (const sym of allSymbols) {			
		addData(ns, sym);
	}
}

function addData(ns, sym) {
	var position = ns.stock.getPosition(sym);
	data[sym] = {
		"symbol": sym,
		"ask": ns.stock.getAskPrice(sym),
		"bid": ns.stock.getBidPrice(sym),
		"forecast": ns.stock.getForecast(sym),
		"volatility": ns.stock.getVolatility(sym),
		"maxShares": ns.stock.getMaxShares(sym),
		"position": {
			"shares": position[0],
			"avgPrice": position[1],
			"shortShares": position[2],
			"avgShortPrice": position[3],
		},
		"price": ns.stock.getPrice(sym),
		"longCost": ns.stock.getPurchaseCost(sym, 1, "l"),
		"shortCost": ns.stock.getPurchaseCost(sym, 1, "s"),
		"longSaleGain": ns.stock.getSaleGain(sym, position[0], "l"),
		"shortSaleGain": ns.stock.getSaleGain(sym, position[2], "s"),
	};
}

function printAllData(ns) {
	var usedSymbols = allSymbols;
	if (yargs && yargs.hasOwnProperty('s') && yargs['s'].length > 0) {
		// get these symbols only (e.g. ECP)
		usedSymbols = yargs['s'];
	}
	
	// TODO: convert symbols to an array
	var symbols = [];
	for (const sym of usedSymbols) {
		symbols.push(data[sym]);
	}

	if (yargs && yargs.hasOwnProperty('o') && yargs['o'].length > 0) {
		var orderBy = yargs['o'][0];
		var ascending = true;
		if (yargs['o'].length > 1 && yargs['o'][yargs['o'].length - 1].startsWith('d')) {
			ascending = false;
		}
		symbols.sort((a, b) => (ascending ? (a[orderBy] - b[orderBy]) : ((b[orderBy] - a[orderBy]))));
		ns.tprint(`Sorting by '${orderBy}', ascending: ${ascending}`);
	}

	for (const sym of symbols) {
		if (yargs && yargs.hasOwnProperty('p') && yargs['p'].length > 0) {
			// get this param only (e.g. position)
			for (const p of yargs['p']) {
				ns.tprint(sym[p]);
			}
		}
		else {
			ns.tprint(sym);
		}
	}
}