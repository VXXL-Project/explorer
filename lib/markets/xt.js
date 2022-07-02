var request = require("request");
var base_url = "https://api.xt.com/data/api/v1/";

function get_summary(coin, exchange, cb) {
  var req_url =
    base_url +
    "getTicker?market=" +
    coin.toLowerCase() +
    "_" +
    exchange.toLowerCase();
  var summary = {};
  request({ uri: req_url, json: true }, function (error, response, body) {
    if (error) {
      return cb(error, null);
    } else {
      if (body.error) {
        return cb(body.error, null);
      } else {
        summary["bid"] = parseFloat(body["buy"]).toFixed(8);
        summary["ask"] = parseFloat(body["sell"]).toFixed(8);
        summary["volume"] = parseFloat(body["coinVol"]).toFixed(8);
        summary["volume_btc"] = parseFloat(body["moneyVol"]).toFixed(8);
        summary["high"] = parseFloat(body["high"]).toFixed(8);
        summary["low"] = parseFloat(body["low"]).toFixed(8);
        summary["last"] = parseFloat(body["price"]).toFixed(8);
        summary["change"] = 0;
        return cb(null, summary);
      }
    }
  });
}

function get_trades(coin, exchange, cb) {
  var req_url =
    base_url +
    "getTrades?market=" +
    coin.toLowerCase() +
    "_" +
    exchange.toLowerCase();
  request({ uri: req_url, json: true }, function (error, response, body) {
    if (body.error) {
      return cb(body.error, null);
    } else {
      let trades = [];
      for (var i = 0; i < body.length; i++) {
        var Trade = {
          ordertype: body[i][3],
          amount: parseFloat(body[i][2]).toFixed(8),
          price: parseFloat(body[i][1]).toFixed(8),
          total: (
            parseFloat(body[i][2]).toFixed(8) * parseFloat(body[i][1])
          ).toFixed(8),
          timestamp: body[i][0],
        };
        trades.push(Trade);
      }
      return cb(null, trades);
    }
  });
}

function get_orders(coin, exchange, cb) {
  var req_url =
    base_url +
    "getDepth?market=" +
    coin.toLowerCase() +
    "_" +
    exchange.toLowerCase();
  request({ uri: req_url, json: true }, function (error, response, body) {
    if (body.error) {
      return cb(body.error, [], []);
    } else {
      var orders = body;
      var buys = [];
      var sells = [];
      if (orders["bids"].length > 0) {
        for (var i = 0; i < orders["bids"].length; i++) {
          var order = {
            amount: parseFloat(orders.bids[i][1]).toFixed(8),
            price: parseFloat(orders.bids[i][0]).toFixed(8),
            total: (
              parseFloat(orders.bids[i][1]).toFixed(8) *
              parseFloat(orders.bids[i][0])
            ).toFixed(8),
          };
          buys.push(order);
        }
      } else {
      }
      if (orders["asks"].length > 0) {
        for (var x = 0; x < orders["asks"].length; x++) {
          var order = {
            amount: parseFloat(orders.asks[x][1]).toFixed(8),
            price: parseFloat(orders.asks[x][0]).toFixed(8),
            total: (
              parseFloat(orders.asks[x][1]).toFixed(8) *
              parseFloat(orders.asks[x][0])
            ).toFixed(8),
          };
          sells.push(order);
        }
      } else {
      }
      var sells = sells.reverse();
      return cb(null, buys, sells);
    }
  });
}

module.exports = {
  get_data: function (settings, cb) {
    var error = null;
    get_orders(settings.coin, settings.exchange, function (err, buys, sells) {
      if (err) {
        error = err;
      }
      get_trades(settings.coin, settings.exchange, function (err, trades) {
        if (err) {
          error = err;
        }
        get_summary(settings.coin, settings.exchange, function (err, stats) {
          if (err) {
            error = err;
          }
          return cb(error, {
            buys: buys,
            sells: sells,
            chartdata: [],
            trades: trades,
            stats: stats,
          });
        });
      });
    });
  },
};
