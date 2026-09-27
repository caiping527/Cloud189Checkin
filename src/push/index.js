const { log4js } = require("../logger");
const superagent = require("superagent");
const serverChan = require("./serverChan");
const telegramBot = require("./telegramBot");
const wecomBot = require("./wecomBot");
const wecomApp = require("./wecomApp");
const wxpush = require("./wxPusher");
const pushPlus = require("./pushPlus");
const wpush = require("./wpush");
const bark = require("./bark");
const showDoc = require("./showDoc");

const logger = log4js.getLogger("push");
logger.addContext("user", "push");

const pushServerChan = (title, desp) => {
  if (!serverChan.sendKey) {
    return;
  }
  const data = {
    title,
    desp: desp.replaceAll("\n","\n\n"),
  };
  superagent
    .post(`https://sctapi.ftqq.com/${serverChan.sendKey}.send`)
    .type("form")
    .send(data)
    .then((res) => {
      logger.info("ServerChan推送成功");
    })
    .catch((err) => {
      if (err.response?.text) {
        const { info } = JSON.parse(err.response.text);
        logger.error(`ServerChan推送失败:${info}`);
      } else {
        logger.error(`ServerChan推送失败:${JSON.stringify(err)}`);
      }
    });
};

const pushTelegramBot = (title, desp) => {
  if (!(telegramBot.botToken && telegramBot.chatId)) {
    return;
  }
  const data = {
    chat_id: telegramBot.chatId,
    text: `${title}\n\n${desp}`,
  };
  superagent
    .post(`https://api.telegram.org/bot${telegramBot.botToken}/sendMessage`)
    .type("form")
    .send(data)
    .then((res) => {
      if (res.body?.ok) {
        logger.info("TelegramBot推送成功");
      } else {
        logger.error(`TelegramBot推送失败:${JSON.stringify(res.body)}`);
      }
    })
    .catch((err) => {
      logger.error(`TelegramBot推送失败:${JSON.stringify(err)}`);
    });
};

const pushWecomBot = (title, desp) => {
  if (!(wecomBot.key && wecomBot.telphone)) {
    return;
  }
  const data = {
    msgtype: "text",
    text: {
      content: `${title}\n\n${desp}`,
      mentioned_mobile_list: [wecomBot.telphone],
    },
  };
  superagent
    .post(
      `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${wecomBot.key}`
    )
    .send(data)
    .then((res) => {
      if (res.body?.errcode) {
        logger.error(`wecomBot推送失败:${JSON.stringify(res.body)}`);
      } else {
        logger.info("wecomBot推送成功");
      }
    })
    .catch((err) => {
      logger.error(`wecomBot推送失败:${JSON.stringify(err)}`);
    });
};

const pushWxPusher = (title, desp) => {
  if (!(wxpush.appToken && wxpush.uid)) {
    return;
  }
  const data = {
    appToken: wxpush.appToken,
    contentType: 1,
    summary: title,
    content: desp,
    uids: [wxpush.uid],
  };
  superagent
    .post("https://wxpusher.zjiecode.com/api/send/message")
    .send(data)
    .then((res) => {
      if (res.body?.code === 1000) {
        logger.info("wxPusher推送成功");
      } else {
        logger.error(`wxPusher推送失败:${JSON.stringify(res.body)}`);
      }
    })
    .catch((err) => {
      logger.error(`wxPusher推送失败:${JSON.stringify(err)}`);
    });
};

const pushPlusPusher = (title, desp) => {
  // 如果没有配置 pushPlus 的 token，则不执行推送
  if (!pushPlus.token) {
    return;
  }
  // 请求体
  const data = {
    token: pushPlus.token,
    title: title,
    content: desp,
  };
  // 发送请求
  superagent
    .post("http://www.pushplus.plus/send/")
    .send(data)
    .then((res) => {
      if (res.body?.code === 200) {
        logger.info("pushPlus 推送成功");
      } else {
        logger.error(`pushPlus 推送失败:${JSON.stringify(res.body)}`);
      }
    })
    .catch((err) => {
      logger.error(`pushPlus 推送失败:${JSON.stringify(err)}`);
    });
};

const pushWPush = (title, desp) => {
  // 如果没有配置 WPUSH 的 apikey，则不执行推送
  if (!wpush.apikey) {
    return;
  }
  // 请求体（不在日志中输出 apikey）
  const data = {
    apikey: wpush.apikey,
    title: title,
    content: desp,
  };
  if (wpush.channel) {
    data.channel = wpush.channel;
  }
  if (wpush.topicCode) {
    data.topic_code = wpush.topicCode;
  }
  // 发送请求
  superagent
    .post("https://api.wpush.cn/api/v1/send")
    .send(data)
    .then((res) => {
      if (res.body?.code === 0) {
        logger.info("WPUSH 推送成功");
      } else {
        logger.error(`WPUSH 推送失败:${JSON.stringify(res.body)}`);
      }
    })
    .catch((err) => {
      const msg = err.response?.text || err.message || "unknown error";
      logger.error(`WPUSH 推送失败:${msg}`);
    });
};

const pushBark = (title, desp) => {
  if (!bark.apiServer || !bark.sendKey) {
    return;
  }
  const encodedUrl = `${bark.apiServer}/${bark.sendKey}/${encodeURIComponent(title)}/${encodeURIComponent(desp)}`;
  superagent
    .get(encodedUrl)
    .then((response) => {
      // 请求成功
      logger.info("Bark推送成功");
    })
    .catch((error) => {
      // 请求失败
      logger.error(`Bark推送失败: ${JSON.stringify(error)}`);
    });
};

const pushShowDoc = (title, desp) => {
  if (!showDoc.sendKey) {
    return;
  }
  const encodedUrl = encodeURI(`https://push.showdoc.com.cn/server/api/push/${showDoc.sendKey}`);
  const data = {
    title: title,
    content: desp,
  };
  superagent
    .get(encodedUrl)
    .send(data)
    .then((response) => {
      // 请求成功
      logger.info("ShowDoc推送成功");
    })
    .catch((error) => {
      // 请求失败
      logger.error(`ShowDoc推送失败: ${JSON.stringify(error)}`);
    });
};

// ===== 企业微信自建应用消息推送（签到失败提醒专用）=====
// access_token 缓存，避免每次推送都重新获取
let wecomAppToken = "";
let wecomAppTokenExpireAt = 0;

const getWecomAppToken = async () => {
  // 缓存有效期内直接复用
  if (wecomAppToken && Date.now() < wecomAppTokenExpireAt) {
    return wecomAppToken;
  }
  if (!(wecomApp.corpid && wecomApp.secret)) {
    return "";
  }
  const res = await superagent
    .get("https://qyapi.weixin.qq.com/cgi-bin/gettoken")
    .query({ corpid: wecomApp.corpid, corpsecret: wecomApp.secret })
    .timeout({ response: 15000 });
  const body = res.body || {};
  if (body.errcode !== 0 || !body.access_token) {
    logger.error(`获取企业微信access_token失败:${JSON.stringify(body)}`);
    return "";
  }
  wecomAppToken = body.access_token;
  // 提前 5 分钟过期，保证 token 一定有效
  wecomAppTokenExpireAt =
    Date.now() + (Number(body.expires_in || 7200) - 300) * 1000;
  return wecomAppToken;
};

const pushWecomApp = async (title, desp) => {
  if (!(wecomApp.corpid && wecomApp.secret && wecomApp.agentid)) {
    logger.error(
      "企业微信应用消息未配置 WECOM_APP_CORPID / WECOM_APP_SECRET / WECOM_APP_AGENTID，跳过推送"
    );
    return false;
  }
  try {
    const accessToken = await getWecomAppToken();
    if (!accessToken) {
      return false;
    }
    const data = {
      touser: wecomApp.touser || "@all",
      msgtype: "text",
      agentid: Number(wecomApp.agentid),
      text: {
        content: `${title}\n\n${desp}`,
      },
      safe: 0,
    };
    const res = await superagent
      .post(
        `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`
      )
      .send(data)
      .timeout({ response: 15000 });
    const body = res.body || {};
    if (body.errcode === 0) {
      logger.info("企业微信应用消息推送成功");
      return true;
    }
    logger.error(`企业微信应用消息推送失败:${JSON.stringify(body)}`);
    return false;
  } catch (err) {
    logger.error(
      `企业微信应用消息推送失败:${JSON.stringify(err.message || err)}`
    );
    return false;
  }
};

const push = (title, desp) => {
  pushServerChan(title, desp);
  pushTelegramBot(title, desp);
  pushWecomBot(title, desp);
  pushWxPusher(title, desp);
  pushPlusPusher(title, desp);
  pushWPush(title, desp);
  pushBark(title, desp);
  pushShowDoc(title, desp);
};

module.exports = push;
module.exports.pushWecomApp = pushWecomApp;
