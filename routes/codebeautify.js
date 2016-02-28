var express = require('express');
var router = express.Router();
var TelegramBot = require('node-telegram-bot-api');
var beautify = require('js-beautify');

var token = 'token';
// Setup polling way
var opts = {
    reply_markup: JSON.stringify(
        {
            force_reply: true
        }
    )
};
var nonFunc = function () {
    console.log("this is nothing function and it should not be called if it's called so there is a problem");
};
//init the telegram bot
var bot = new TelegramBot(token, {polling: true});

var beatifyFunctions = {'js': beautify.js_beautify, 'html': beautify.html_beautify, 'css': beautify.css_beautify};

var help ="Hi, this a BOT to beautify your JS ,CSS and HTML code.\n"
+
"how to use it(three methods):\n"+
"1) use it in the format below:\n"+
"           /beautify {language} {code}"+
"example:\n"+
'          /beautify js  if(a===b){console.log(" Hello World ^___^ ")};\n'+

"2) use commands of bot that we made for you:\n"+
"    beautify_js , beautify_css and beautify_html\n"+
"\n"+
"3) use inline query:\n"+
"      @codeBeautify_bot {language} {code}"+
"       !!!Don't use this method for more than 256 character(limitation of telegram)";
bot.on('message',function(msg){
    console.log(msg);
});
bot.onText(/\/start|help/i,function(msg,match){
    bot.sendMessage(msg.chat.id, help);
});
//handle inline_queries
bot.on('inline_query', function (msg) {
    //beautify the text
    console.log(msg);
    var result = beautfiyCode(msg.query);
    if (result) {
        bot.answerInlineQuery(msg.id,
            [{
                'type': 'article',
                'title': 'beautified code',
                'parse_mode': 'Markdown',
                'id': '0',
                'message_text': result
            }])
    }

});


//handle queries that user write it completely
bot.onText(/\/beautify\s*([^]+)?/, function (msg, match) {
    //beautify the code
    var result = beautfiyCode(match[1]) || "please send it in this format\n " + "/beautify {lang name} {code}";
    bot.sendMessage(msg.chat.id, result, {'parse_mode': 'Markdown'});
});

//handle queries that done with commands
bot.onText(/\/beautify_(js|html|css)/, function (msg, match) {
    var formId = msg.chat.id;
    //send a message to user and beautify the response
    bot.sendMessage(formId, 'send your code now', opts)
        .then(function (sended) {
            var chatId = sended.chat.id;
            var messageId = sended.message_id;
            //beautify the response
            bot.onReplyToMessage(chatId, messageId, function (message) {
                var beautfunc = beatifyFunctions[match[1]] || nonFunc;
                var result = "```\n" + beautfunc(message.text, {indent_size: 2}) + "```";
                bot.sendMessage(formId, result, {'parse_mode': "Markdown"});
            });
        });
});
//handle regex  and beautify it
var beautfiyCode = function (msgText) {
    var m;
    var re = /(js|html|css)\s+([^]+)/i;
    var beautfunc;
    var result = undefined;
    if ((m = re.exec(msgText)) !== null) {
        if (m.index === re.lastIndex) {
            re.lastIndex++;
        }
        beautfunc = beatifyFunctions[m[1].toLowerCase()] || nonFunc;
        result = "```\n" + beautfunc(m[2], {indent_size: 2}) + "```";
    }
    return result;
};

module.exports = router;
