var request = require("request");
var base_url = "https://sapi.xt.com/v4/public/";

function get_summary(coin, exchange, cb) {
  var req_url =
    base_url +
    "ticker?symbol=" +
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
        summary["bid"] = parseFloat(body.result[0]["bp"]).toFixed(8);
        summary["ask"] = parseFloat(body.result[0]["ap"]).toFixed(8);
        summary["volume"] = parseFloat(body.result[0]["v"]).toFixed(8);
        summary["volume_btc"] = 0;
        summary["high"] = parseFloat(body.result[0]["h"]).toFixed(8);
        summary["low"] = parseFloat(body.result[0]["l"]).toFixed(8);
        summary["last"] = parseFloat(body.result[0]["c"]).toFixed(8);
        summary["change"] = parseFloat(body.result[0]["cr"]).toFixed(8);;
        return cb(null, summary);
      }
    }
  });
}

function get_trades(coin, exchange, cb) {
  var req_url =
    base_url +
    "trade/recent?symbol=" +
    coin.toLowerCase() +
    "_" +
    exchange.toLowerCase();
  request({ uri: req_url, json: true }, function (error, response, body) {
    if (body.error) {
      return cb(body.error, null);
    } else {
      let trades = [];
      for (var i = 0; i < body.result.length; i++) {
        var Trade = {
          ordertype: body.result[i]["b"],
          amount: parseFloat(body.result[i]["v"]).toFixed(8),
          price: parseFloat(body.result[i]["p"]).toFixed(8),
          total: (
            parseFloat(body.result[i]["v"]).toFixed(8) * parseFloat(body.result[i]["p"])
          ).toFixed(8),
          timestamp: body.result[i]["t"]
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
    "depth?symbol=" +
    coin.toLowerCase() +
    "_" +
    exchange.toLowerCase();
  request({ uri: req_url, json: true }, function (error, response, body) {
    if (body.error) {
      return cb(body.error, [], []);
    } else {
      var orders = body.result;
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
