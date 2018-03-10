const Command = require("../Command");

class TestCommand extends Command {
  constructor(bot) {
    super(bot);

    this.props.help = {
      name: "test",
      description: "what do you think this does?",
      usage: "test [...args]",
      examples: [
        "test one two three",
        "test one \"two and two\" three",
      ],
    };
  }

  run(msg, args) {
    let message = [
      `Content: \`${msg.content}\``,
      `Arguments: \`${args.join(", ")}\``,
    ];
    return msg.channel.send(message);
  }
}


module.exports = TestCommand;
