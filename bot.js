const Discord = require('discord.js');
const bot = new Discord.Client();

bot.login(process.env.BOT_TOKEN);

function attachIsImage(msgAttach) {
    var url = msgAttach.url;
    //True if this url is a png image.
    return url.indexOf("png", url.length - "png".length /*or 3*/) !== -1 || url.indexOf("jpg", url.length - "jpg".length /*or 3*/) !== -1;
}

function messageHasHyperlinkedImage(text) {
    return text.indexOf('.jpg') > -1 || text.indexOf('.png') > -1;
}

function isAdminOrMod(member) {
    if (!member || !member.roles) {
        return false;
    }
    if(member.roles.some(r=>["Administrator", "Moderators", 'J.A.R.V.I.S.'].includes(r.name)) ) {
        // has one of the roles
        return true;
      } else {
        // has none of the roles
        return false;
      }
}

bot.on("ready", function() {
    console.log(`Ready as: ${bot.user.tag}`);
})

bot.on('message', function (msg) {
    if (msg.content.indexOf('tyejae') > -1) {
        console.log(`[INFO] ${msg.author.username} said, "${msg.content}"`)
    }
    if (msg.channel.name === 'looking-for-alliance' && !msg.author.bot && !isAdminOrMod(msg.member)) {
        console.log(`[INFO] ${msg.author.username} said, "${msg.content}"`)
        if (msg.mentions.members.first()) {
            msg.channel
                .send(`${msg.author}, it's directly against the rules of this channel to @ people in regards to a listing. Use PMs, @ them in #general-chat.`)
                .then(reply => reply.delete(60000))
            msg.delete(1000);
            console.log(`   [MESSAGE DELETED][PUNISH NEEDED]`)
        } else if (msg.attachments.size > 0) {
            if (!msg.attachments.every(attachIsImage)) {
                msg.channel
                    .send(`${msg.author}, you have to post a screenshot of your PROFILE, which shows your highest team power, your collection score, as well as your contact information in-game.`)
                    .then(reply => reply.delete(60000))
                msg.delete(1000);
                console.log(`   [MESSAGE DELETED]`)
            } else {
                msg.author
                    .send('Thank you for posting. Please be aware that you can only post every 24 hours. Happy Alliance hunting!')
                    .catch(() => msg.channel
                                    .send(`${msg.author}, make sure you have Direct Messages turned on so that Alliance Leaders can contact you directly.`)
                                    .then(reply => reply.delete(300000)));
            }
        } else if (messageHasHyperlinkedImage(msg.content)) {
            msg.author
                    .send('Thank you for posting. Please be aware that you can only post every 24 hours. Happy Alliance hunting!')
                    .catch(() => msg.channel
                                    .send(`${msg.author}, make sure you have Direct Messages turned on so that Alliance Leaders can contact you directly.`)
                                    .then(reply => reply.delete(300000)));
        } else {
            msg.channel
                .send(`${msg.author}, you have to post a screenshot of your PROFILE, which shows your highest team power, your collection score, as well as your contact information in-game.`)
                .then(reply => reply.delete(60000))
            msg.delete(1000);
            console.log(`   [MESSAGE DELETED]`)
        }
    }
});

