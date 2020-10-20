const Discord = require('discord.js');
const bot = new Discord.Client();
const Request = require('request');

const SERVERS = [
    'players-under-1m', 
    'players-above-1m', 
    'players-above-2m', 
    'players-above-3m', 
    'players-above-4m', 
    'players-above-5m',
    'players-above-6m',
    'players-above-7m',
    'players-above-8m',
    'looking-for-alliance'];

bot.login(process.env.BOT_TOKEN);

function attachIsImage(msgAttach) {
    var url = msgAttach.url;
    //True if this url is a png image.
    return url.indexOf("png", url.length - "png".length /*or 3*/) !== -1 || url.indexOf("jpg", url.length - "jpg".length /*or 3*/) || url.indexOf("jpeg", url.length - "jpeg".length /*or 3*/) !== -1;
}

function messageHasHyperlinkedImage(text) {
    return text.indexOf('.jpg') > -1 || text.indexOf('.png') > -1 || text.indexOf('.jpeg') > -1;
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

async function getPower(message) {
    let userGuid;
    let power = 0;
    const userGuidPromise = new Promise((resolve) => {
        Request(`https://api.tyejae.com/services/msfggbot/getUserGuid?memberId=${message.author.id}`, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                userGuid = body;
            }
            resolve();
        })
    });
    await Promise.all([userGuidPromise]);
    const rosterPromise = new Promise(resolve => {
        Request(`https://api.tyejae.com/services/getRoster?userGuid=${userGuid}&nocache=${Date.now()}`, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                try {
                    const obj = JSON.parse(body);
                    if (typeof obj === "object") {
                        Object.keys(obj).forEach(key => {power += parseInt(obj[key].power)});
                    }
                } catch (e) {}
            }
            resolve();
        });
    });
    await Promise.all([rosterPromise]);
    return power;
}

bot.on("ready", function() {
    console.log(`Ready as: ${bot.user.tag}`);
})

bot.on('messageUpdate', (oldMessage, newMessage) => {
    if (SERVERS.indexOf(newMessage.channel.name) > -1) {
        var postBody = {
            url: 'https://api.tyejae.com/services/msfggbot/updateLookingForAlliance',
            body: JSON.stringify({
                memberId: newMessage.author.id,
                description: encodeURIComponent(newMessage.content)
                    .replace(/!/g, '%21')
                    .replace(/'/g, '%27')
                    .replace(/\(/g, '%28')
                    .replace(/\)/g, '%29')
                    .replace(/\*/g, '%2A')
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };
        Request.post(postBody, (error, res, body) => {
            console.log(body)
        });
    }
})

bot.on('messageDelete', async function (msg) {
    if (SERVERS.indexOf(msg.channel.name) > -1) {
        Request.get(`https://api.tyejae.com/services/msfggbot/cancelLookingForAlliance?memberId=${msg.author.id}`);
    }
})

bot.on('message', async function (msg) {
    if (msg.content.indexOf('tyejae') > -1) {
        console.log(`[INFO] ${msg.author.username} said, "${msg.content}"`)
    }
    if (SERVERS.indexOf(msg.channel.name) > -1) {
        console.log(`[INFO - ${msg.channel.name}] ${msg.author.username} said, "${msg.content}"`)
        if (msg.mentions.members.first() && !msg.author.bot && !isAdminOrMod(msg.member)) {
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
                let power = await getPower(msg);
                if (power === 0) {
                    switch(msg.channel.name) {
                        case 'players-under-1m': power = 999999; break;
                        case 'players-above-1m': power = 1000001; break;
                        case 'players-above-2m': power = 2000001; break;
                        case 'players-above-3m': power = 3000001; break;
                        case 'players-above-4m': power = 4000001; break;
                        case 'players-above-5m': power = 5000001; break;
                        case 'players-above-6m': power = 6000001; break;
                        case 'players-above-7m': power = 7000001; break;
                        case 'players-above-8m': power = 8000001; break;
                    }
                }
                let content = msg.content;
                if (content === '') {
                    content = '*No message provided*';
                } else if (content.length > 155) {
                    content = content.substr(0, 153) + '...';
                }
                var postBody = {
                    url: 'https://api.tyejae.com/services/msfggbot/joinLookingForAlliance',
                    body: JSON.stringify({
                        memberId: msg.author.id,
                        tag: msg.author.tag,
                        power: power,
                        description: encodeURIComponent(content)
                            .replace(/!/g, '%21')
                            .replace(/'/g, '%27')
                            .replace(/\(/g, '%28')
                            .replace(/\)/g, '%29')
                            .replace(/\*/g, '%2A'),
                        rosterUrl: msg.attachments.first().proxyURL,
                        notify: '1'
                    }),
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                };
                Request.post(postBody, () => {});
                msg.author
                    .send('Thank you for posting. Please be aware that you can only post every 24 hours. Happy Alliance hunting!')
                    .catch(() => msg.channel
                                    .send(`${msg.author}, make sure you have Direct Messages turned on so that Alliance Leaders can contact you directly.`)
                                    .then(reply => reply.delete(300000)));
            }
        } else if (messageHasHyperlinkedImage(msg.content)) {
            let power = await getPower(msg);
            if (power === 0) {
                switch(msg.channel.name) {
                    case 'players-under-1m': power = 999999; break;
                    case 'players-above-1m': power = 1000001; break;
                    case 'players-above-2m': power = 2000001; break;
                    case 'players-above-3m': power = 3000001; break;
                    case 'players-above-4m': power = 4000001; break;
                    case 'players-above-5m': power = 5000001; break;
                    case 'players-above-6m': power = 6000001; break;
                    case 'players-above-7m': power = 7000001; break;
                    case 'players-above-8m': power = 8000001; break;
                }
            }
            let content = msg.content;
            if (content === '') {
                content = '*No message provided*';
            } else if (content.length > 155) {
                content = content.substr(0, 153) + '...';
            }
            var postBody = {
                url: 'https://api.tyejae.com/services/msfggbot/joinLookingForAlliance',
                body: JSON.stringify({
                    memberId: msg.author.id,
                    tag: msg.author.tag,
                    power: power,
                    description: encodeURI(content),
                    notify: '1'
                }),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            };
            Request.post(postBody, () => {});
            msg.author
                    .send('Thank you for posting. Please be aware that you can only post every 24 hours. Happy Alliance hunting!')
                    .catch(() => msg.channel
                                    .send(`${msg.author}, make sure you have Direct Messages turned on so that Alliance Leaders can contact you directly.`)
                                    .then(reply => reply.delete(300000)));
        } else if (!msg.author.bot && !isAdminOrMod(msg.member)) {
            msg.channel
                .send(`${msg.author}, you have to post a screenshot of your PROFILE, which shows your highest team power, your collection score, as well as your contact information in-game.`)
                .then(reply => reply.delete(60000))
            msg.delete(1000);
            console.log(`   [MESSAGE DELETED]`)
        }
    }
});

