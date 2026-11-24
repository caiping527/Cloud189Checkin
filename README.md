# 天翼云盘签到（Cloud189Checkin）

> 天翼网盘 每日自动签到，随机容量奖励。云端 GitHub Actions 跑，本机不用开机。

**仓库名说明**：GitHub 不支持中文仓库名（会被静默丢弃），所以仓库名是英文
`Cloud189Checkin`。中文别名记在仓库描述里：**【天翼云盘签到】**。

---

## 这个仓库是干什么的

每天自动登录天翼云盘完成签到，领取随机容量奖励。

| 项目 | 说明 |
|---|---|
| 平台 | 天翼云盘（189.cn） |
| 每日收益 | 随机容量 |
| 运行方式 | GitHub Actions 每天自动，约北京 01:00 |
| 本机要求 | 无。不用开机、不用开客户端 |
| 上游来源 | 本项目基于开源项目 [wes-lin/Cloud189Checkin](https://github.com/wes-lin/Cloud189Checkin) 改造 |

---

## 重要说明（本项目已与上游不同）

> ⚠️ **上游 README 那句「源码仓库是公开的，别人可以直接看到你的账号密码」，在本仓库不成立：凭据全部在 Secrets，代码与提交历史里没有账号密码。**
> **本仓库 2026-11-24 ~ 11-30 临时公开**（Actions 免费额度按私有仓库计分钟，本月已耗尽；公开仓库不计费）。12-01 改回 Private。

但下面这条提醒依然有效，而且更重要：

- **不要把真实账号密码提交进 `.env`**。仓库里那个 `.env` 是上游带来的**模板**，
  里面 `TY_USERNAME_1` / `TY_PASSWORD_1` 都是占位符（`userName` / `password`），
  不是真实账号。**不要去填它。**
- 真实账号一律写在 `Settings → Secrets and variables → Actions`，
  代码通过 `${{ secrets.XXX }}` 读取。
- 仓库历史是永久的：一旦把密码提交上去，即使后来删了文件，commit 里还在。

---

## 运行时间

| 北京时刻 | 动作 |
|---|---|
| 约 01:00 | 云端自动签到全部账号 |

GitHub 定时任务会随机延迟（实测 5~6 小时），实际执行常落在
01:00 ~ 07:00，属正常。

---

## 需要的 Secrets

本仓库用 `secrets-to-env-action` 把 GitHub Secrets **一次性全部**注入成环境变量，
所以 **Secret 的名字要和 `.env` 里的键名一致**：

| 名称 | 用途 |
|---|---|
| `TY_USERNAME_1` | 第 1 个账号的手机号 / 用户名 |
| `TY_PASSWORD_1` | 第 1 个账号的密码 |
| `TY_USERNAME_2` / `TY_PASSWORD_2` | 第 2 个账号（多账号依次递增） |
| `WECOM_BOT_KEY` | 企业微信机器人 Key（可选，用于推送） |
| `PUSH_PLUS_TOKEN` | pushplus 推送（可选） |
| `BARK_KEY` | Bark 推送（可选） |

其余 `.env` 里出现的键（Telegram / WxPusher / ShowDoc 等）按需添加，
不加就是不启用那个通道。

**注意**：名字必须完全一样。写成 `TY_USERNAME`（少了 `_1`）不会被读到。

---

## 心跳监测

已纳入「自动心跳监测」，Healthchecks 里的名字是 `签到-天翼云盘`。

| 状态 | 含义 |
|---|---|
| `up` | 正常 |
| `grace` | 等今天这一跑，宽限期内，**不是故障** |
| `down` | 真没跑，去 Actions 补签 |

---

## 目录

```
.github/workflows/run.yml    云端定时任务（含心跳上报）
src/                         签到逻辑
accounts.js                  账号装配
.env                         上游模板，不要填真实账号
doc/                         上游文档
image/                       上游截图
package.json                 依赖清单
```

---

## 排错

| 现象 | 原因 | 怎么办 |
|---|---|---|
| 提示「设备ID不存在」 | 天翼云盘设备锁 | 关闭设备锁后重试（见上游 issue #165） |
| Actions 红叉 | 账号密码错 | 更新对应 Secret |
| 随机容量为 0 | 当天已签到过 | 正常 |
| 心跳 down | 当天没跑 | Actions → Run workflow 补签 |

---

## 安全

- 账号密码只存 GitHub Secrets（加密），不进代码
- 仓库 2026-11-24 ~ 11-30 临时公开，12-01 恢复私有；凭据只在 Secrets
- `.env` 保持模板原样，不填真实值
- 停用：删对应 Secret，或 Disable workflow

---

## 相关仓库

| 仓库 | 中文名 |
|---|---|
| `workbuddy-checkin-public` | WorkBuddy 签到 |
| `raccoon-checkin` | 小浣熊签到 |
| `qoder-checkin` | Qoder 签到 |
| `chinafix-sign` | 迅维网签到 |
| `hyperdown-checkin` | Hyperdown 签到 |
| `checkin-watchdog` | 心跳告警中转 |

---

## 许可

沿用上游 LICENSE。个人自用，不对外分发。
