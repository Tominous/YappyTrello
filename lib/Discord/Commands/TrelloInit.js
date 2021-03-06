const snekfetch = require("snekfetch");
const Command = require("../Command");
const Log = require("../../Util/Log");
const ChannelConfig = require("../../Models/ChannelConfig");
const { trelloKey: key, trelloToken: token, trelloCallbackUrl } = require("../../config");

class TrelloInitCommand extends Command {
  constructor(bot) {
    super(bot);

    this.props.help = {
      name: "init",
      summary: "Initialize trello board events on the channel.",
      description: "Initialize trello board events on the channel.",
      usage: "init <boardId> [webhookUrl/webhookId] [webhookToken]",
      examples: [
        "init ttDOjGp5",
        "init 5803ba32d0514d27823abf3b",
        "init https://trello.com/b/ttDOjGp5",
        "init https://trello.com/b/ttDOjGp5/yappy-trello",
      ],
    };

    this.setConf({
      permLevel: 1,
      aliases: ["initialize"],
    });
  }

  run(msg, args) {
    let board = args[0];
    let boardInfo = {};
    let conf = ChannelConfig.FindByChannel(msg.channel.id);
    msg.channel.send("⚙ Working...");
    if (conf) return msg.channel.send(`❌ This channel already has events for a Trello board`);
    return this._searchForBoard(board).then(data => {
      boardInfo = data;
      return ChannelConfig.FindByBoard(data.id);
    })
    .then(data => {
      if (data) throw new Error(`This board already has events in another channel`, "custom");
      return this._createWebhookForBoard(boardInfo.id, msg.guild);
    })
    .then(webhook => {
      Log.debug(`Created webhook for`, boardInfo.id);
      return ChannelConfig.Add({
        channelId: msg.channel.id,
        guildId: msg.guild.id,
        board: boardInfo.id,
        disabledEvents: [],
        webhookId: webhook.id,
      });
    })
    .then(() => {
      msg.channel.send(`✅ Successfully initialized Trello board events for **${boardInfo.name}**.`);
    })
    .catch(err => {
      if (err.response && err.response.text && err.response.text === "invalid id") {
        err.response.text = "An invalid board ID was provided. Please make sure you enter a valid board ID and that the bot is a member of your board.";
        return msg.channel.send(`❌ ${err.response.text}`);
      }
      console.log(err);
      msg.channel.send(`❌ An error occurred! ${(err.response && err.response.text) || err.message || err.body || err}`);
    });
  }
  _searchForBoard(board) {
    return snekfetch
    .get(`https://api.trello.com/1/boards/${board}`)
    .query("key", key)
    .query("token", token)
    .query("fields", "name, desc")
    .then(res => res.body);
  }

  _createWebhookForBoard(board, guild) {
    return snekfetch
    .post(`https://api.trello.com/1/webhooks`)
    .set("Content-Type", "application/json")
    .send({
      key, token,
      description: `A webhook for board events in a Discord Server (${guild ? guild.name : "Unknown"} guild)`,
      callbackURL: trelloCallbackUrl,
      idModel: board,
    })
    .then(res => res.body);
  }
}


module.exports = TrelloInitCommand;
