require("dotenv").config();
const {
  CloudClient,
  FileTokenStore,
  logger: sdkLogger,
} = require("cloud189-sdk");
const recording = require("log4js/lib/appenders/recording");
const accounts = require("../accounts");
const { mask, delay } = require("./utils");
const push = require("./push");
const { log4js, cleanLogs, catLogs } = require("./logger");
const tokenDir = ".token";
sdkLogger.configure({
  isDebugEnabled: process.env.CLOUD189_VERBOSE === "1",
});
// 记录本次运行中签到失败的账号（用于"仅失败时推送微信提醒"）
const failedAccounts = [];
// 个人任务签到
const doUserTask = async (cloudClient, logger) => {
  const result = await cloudClient.userSign()
  const netdiskBonus = result.isSign? 0: result.netdiskBonus
  logger.info(`个人签到任务: 获得 ${netdiskBonus}M 空间`);
};
const run = async (userName, password, userSizeInfoMap, logger) => {
  if (userName && password) {
    const before = Date.now();
    try {
      logger.log("开始执行");
      const cloudClient = new CloudClient({
        username: userName,
        password,
        token: new FileTokenStore(`${tokenDir}/${userName}.json`),
      });
      const beforeUserSizeInfo = await cloudClient.getUserSizeInfo();
      userSizeInfoMap.set(userName, {
        cloudClient,
        userSizeInfo: beforeUserSizeInfo,
        logger,
      });
      await Promise.all([doUserTask(cloudClient, logger)]);
    } catch (e) {
      if (e.response) {
        logger.log(`请求失败: ${e.response.statusCode}, ${e.response.body}`);
      } else {
        logger.error(e);
      }
      if (e.code === "ECONNRESET" || e.code === "ETIMEDOUT") {
        logger.error("请求超时");
        throw e;
      }
      // 区分失败原因：网络不通 vs 登录/账号问题
      const msg = e.response
        ? `HTTP ${e.response.statusCode}: ${e.response.body}`
        : e.message || "未知错误";
      const isNetwork = /ETIMEDOUT|ECONNREFUSED|ENOTFOUND|ECONNRESET|socket hang up|connect /i.test(msg);
      failedAccounts.push({
        userName,
        reason: msg,
        isNetwork,
      });
    } finally {
      logger.log(
        `执行完毕, 耗时 ${((Date.now() - before) / 1000).toFixed(2)} 秒`
      );
    }
  }
};
// 开始执行程序
async function main() {
  //  用于统计实际容量变化
  const userSizeInfoMap = new Map();
  for (let index = 0; index < accounts.length; index++) {
    const account = accounts[index];
    const { userName, password } = account;
    const userNameInfo = mask(userName, 3, 7);
    const logger = log4js.getLogger(userName);
    logger.addContext("user", userNameInfo);
    await run(userName, password, userSizeInfoMap, logger);
  }
  //数据汇总
  for (const [
    userName,
    { cloudClient, userSizeInfo, logger },
  ] of userSizeInfoMap) {
    const afterUserSizeInfo = await cloudClient.getUserSizeInfo();
    logger.log(
      `个人容量：⬆️  ${(
        (afterUserSizeInfo.cloudCapacityInfo.totalSize -
          userSizeInfo.cloudCapacityInfo.totalSize) /
        1024 /
        1024
      ).toFixed(2)}M/${(
        afterUserSizeInfo.cloudCapacityInfo.totalSize /
        1024 /
        1024 /
        1024
      ).toFixed(2)}G`,
      `家庭容量：⬆️  ${(
        (afterUserSizeInfo.familyCapacityInfo.totalSize -
          userSizeInfo.familyCapacityInfo.totalSize) /
        1024 /
        1024
      ).toFixed(2)}M/${(
        afterUserSizeInfo.familyCapacityInfo.totalSize /
        1024 /
        1024 /
        1024
      ).toFixed(2)}G`
    );
  }
}
(async () => {
  try {
    await main();
    //等待日志文件写入
    await delay(1000);
  } finally {
    const logs = catLogs();
    const events = recording.replay();
    const content = events.map((e) => `${e.data.join("")}`).join("  \n");
    push("天翼云盘自动签到任务", logs + content);
    // 签到失败时，通过企业微信应用消息单独推送提醒（签到成功时不打扰）
    if (failedAccounts.length > 0) {
      const allNetwork = failedAccounts.every((a) => a.isNetwork);
      const desp = failedAccounts
        .map((a) => `账号：${mask(a.userName, 3, 7)}\n原因：${a.reason}`)
        .join("\n\n");
      const title = allNetwork
        ? "⚠️ 天翼云盘签到失败（网络不通）"
        : "⚠️ 天翼云盘签到失败（登录失效）";
      const advice = allNetwork
        ? "\n\n【原因说明】GitHub 的机器连不上天翼云服务器（网络超时），不是账号问题。\n1. 请先打开“天翼云盘 App”手动签到，避免漏签\n2. 网络可能是暂时的，明天自动运行可能恢复\n3. 若连续多天失败，说明 GitHub 被天翼云拦截，需考虑换运行环境"
        : "\n\n【解决方法】打开“天翼云盘 App”手动登录一次（完成验证码/设备校验），登录后自动签到恢复。\n若仍失败，检查 Secrets 里 TY_ACCOUNTS 的账号密码是否为最新。";
      await push.pushWecomApp(title, `${desp}${advice}`);
    }
    recording.erase();
    cleanLogs();
  }
})();
