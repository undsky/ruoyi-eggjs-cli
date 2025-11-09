/*
 * @Author: 姜彦汐
 * @Date: 2020-12-29 21:50:39
 * @LastEditors: 姜彦汐
 * @LastEditTime: 2023-04-07 08:40:32
 * @Description:
 * @Site: https://www.undsky.com
 */
const program = require("commander");
const chalk = require("chalk");
const os = require("os");
const fs = require("fs-extra");
const path = require("path");

const { nanoid } = require("nanoid");

const { exec } = require("shelljs");

program
  .command("frp <localURL>")
  .description(chalk.magenta("内网穿透"))
  .option("-saddr, --serverAddr <serverAddr>", chalk.blue("服务地址"))
  .option("-sport, --serverPort <serverPort>", chalk.blue("服务端口"))
  .option("-auth, --authToken <authToken>", chalk.blue("身份验证令牌"))
  .option("-cdomain, --customDomains <customDomains>", chalk.blue("自定义域名"))
  .action(async (localURL, option) => {
    // 验证必填参数
    if (!option.serverAddr) {
      console.error(chalk.red("错误: 必须指定服务地址 (-saddr, --serverAddr)"));
      process.exit(1);
    }
    if (!option.serverPort) {
      console.error(chalk.red("错误: 必须指定服务端口 (-sport, --serverPort)"));
      process.exit(1);
    }
    if (!option.authToken) {
      console.error(chalk.red("错误: 必须指定身份验证令牌 (-auth, --authToken)"));
      process.exit(1);
    }

    const [ip, port] = localURL.split(":");
    const frpcIni = `
[common]
server_addr = ${option.serverAddr}
server_port = ${option.serverPort}
auth_token = ${option.authToken}

[web]
type = http
local_ip = ${port ? ip : "127.0.0.1"}
local_port = ${port ? port : ip}
custom_domains = ${option.customDomains || option.serverAddr}
        `;

    const frpcIniPath = path.join(os.tmpdir(), "frp");
    await fs.mkdirs(frpcIniPath);

    const frpcIniFile = path.join(frpcIniPath, nanoid() + ".ini");
    fs.writeFileSync(frpcIniFile, frpcIni, "utf8");

    exec(
      `${__dirname}/${
        "win32" == os.platform() ? "frpc.exe" : "frpc"
      } -c ${frpcIniFile}`
    );
  })
  .on("--help", () => {
    console.log("\n示例:");
    console.log(chalk.blue("rec frp <localURL>"));
  });

