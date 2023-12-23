/*
 * @Author: 姜彦汐
 * @Date: 2021-03-17 08:27:30
 * @LastEditors: 姜彦汐
 * @LastEditTime: 2022-01-04 15:11:34
 * @Description:
 *
 * @Site: https://www.undsky.com
 */
const createLogger = require("progress-estimator");
const os = require("os");
const path = require("path");

const logger = createLogger({
  storagePath: path.join(os.tmpdir(), ".progress-estimator"),
});

module.exports = async (promise, labelString) => {
  await logger(promise, labelString || "进度：");
};
