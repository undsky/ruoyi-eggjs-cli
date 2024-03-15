/*
 * @Author: 姜彦汐
 * @Date: 2020-12-02 08:34:02
 * @LastEditors: 姜彦汐
 * @LastEditTime: 2023-12-23 21:02:11
 * @Description:
 * @Site: https://www.undsky.com
 */
const program = require("commander");
const cheerio = require("cheerio");
const chalk = require("chalk");
const chokidar = require("chokidar");
const path = require("path");
const fs = require("fs-extra");
const _ = require("lodash");
const ora = require("ora");

const progress = require("../utils/progress");

program
  .command("mapper [projectPath]")
  .description(chalk.magenta("生成数据映射代码"))
  .option(
    "-m, --mapperDir [mapperDir]",
    chalk.blue("映射文件所在目录（相对于 projectPath）"),
    "mapper"
  )
  .option(
    "-d, --defaultDatabse [defaultDatabse]",
    chalk.blue("默认数据库"),
    "mysql"
  )
  .option("-w, --watch [watch]", chalk.blue("自动监听模式"), true)
  .action(async (projectPath, option) => {
    mapperDir = option.mapperDir;
    defaultDatabse = option.defaultDatabse;
    rootPath = projectPath || process.cwd();
    initPath();

    let mappers = [];
    getMappers(mappersPath, mappers);

    await Promise.allSettled(
      _.map(mappers, (mapper) => {
        let targetFile = genTargetFile(mapper);
        return progress(
          genMapper(mapper, targetFile),
          path.relative(rootPath, targetFile)
        );
      })
    );

    ora(chalk.green("生成成功")).succeed();

    if (option.watch) {
      let mapperMap = new Map();
      genMapperMap(mappersPath, mapperMap);
      const watcher = chokidar.watch(mappersPath, {
        awaitWriteFinish: true,
      });
      watcher
        .on("change", async (filePath) => {
          const id = mapperMap.get(filePath);
          const curId = mapperId(filePath);
          if (curId != id) {
            console.log(chalk.blue(`${filePath} has been changed`));
            mapperMap.set(filePath, curId);
            mkdir(filePath);
            await genMapper(filePath, genTargetFile(filePath));
          }
        })
        .on("unlink", (filePath) => {
          console.log(chalk.red(`${filePath} has been removed`));
          mapperMap.delete(filePath);
          const unlinkFile = genTargetFile(filePath);
          if (fs.existsSync(unlinkFile)) fs.unlinkSync(unlinkFile);
        });

      ora(chalk.green("自动监听模式已启动")).succeed();
    }
  })
  .on("--help", () => {
    console.log("\n示例:");
    console.log(chalk.blue("psy mapper <projectPath>"));
  });

let rootPath, servicesPath, mapperDir, mappersPath, defaultDatabse;

function initPath() {
  servicesPath = path.join(rootPath, "app", "service", "db");
  fs.emptyDirSync(servicesPath);
  mappersPath = path.join(rootPath, mapperDir);
}

function mapperId(mapperPath) {
  const $ = loadMapper(mapperPath);
  let ids = "";
  $("mapper")
    .children()
    .each((idx, el) => {
      ids += el.attribs.id;
    });
  return Array.from(ids).sort().join("");
}

function genMapperMap(dir, mapperMap) {
  if (fs.statSync(dir).isFile()) {
    if (".xml" == path.extname(dir)) {
      mapperMap.set(dir, mapperId(dir));
    }
  } else {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      let filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        genMapperMap(filePath, mapperMap);
      } else if (".xml" == path.extname(filePath)) {
        mapperMap.set(filePath, mapperId(filePath));
      }
    }
  }
}

function mkdir(mapperPath) {
  let folder = path.relative(
    mappersPath,
    fs.statSync(mapperPath).isFile() ? path.parse(mapperPath).dir : mapperPath
  );
  if (folder) {
    fs.mkdirsSync(path.join(servicesPath, folder));
  }
}

function getMappers(dir, mappers) {
  if (fs.statSync(dir).isFile()) {
    if (".xml" == path.extname(dir)) {
      mappers.push(dir);
    }
  } else {
    mkdir(dir);
    const files = fs.readdirSync(dir);
    for (const file of files) {
      let filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        getMappers(filePath, mappers);
      } else if (".xml" == path.extname(filePath)) {
        mappers.push(filePath);
      }
    }
  }
}

function loadMapper(mapper) {
  const xml = fs.readFileSync(mapper, "utf8");
  return cheerio.load(xml, {
    decodeEntities: false,
    normalizeWhitespace: true,
    xmlMode: true,
  });
}

async function genMapper(mapper, targetFile) {
  const mapperPath = path.parse(
    path.relative(servicesPath, path.dirname(targetFile))
  );
  const pluginName = mapperPath.dir;
  const dbName = mapperPath.base;
  const $ = loadMapper(mapper);
  let namespace = $("mapper").attr("namespace");
  if (!namespace) return;
  let caseNamespace = _.upperFirst(_.camelCase(path.parse(namespace).name));
  let template = `const Service = require('egg').Service;

class ${caseNamespace}Service extends Service {
    mapper(sqlid, values, params) {
        return this.app.mapper('${namespace}', sqlid, values, params)
    }

    db() {
        return this.app.${pluginName || defaultDatabse}${
    dbName ? `.get('${dbName}')` : ""
  };
    }
`;

  $("mapper")
    .children()
    .each((idx, el) => {
      let name = el.name;
      if ("ref" != name) {
        let id = el.attribs.id;
        let caseId = _.camelCase(id);
        template += `
    ${caseId}Mapper(values, params) {
        return this.mapper('${id}', values, params);
    }

    async ${caseId}(values, params) {
        return await this.db().${
          "sql" == name ? "run" : "delete" == name ? "del" : name
        }(this.${caseId}Mapper(values, params));
    }
`;
      }
    });

  template += `}

module.exports = ${caseNamespace}Service;`;

  fs.writeFileSync(targetFile, template, "utf8");
}

function genTargetFile(mapper) {
  return path.join(
    servicesPath,
    _.trimEnd(path.relative(mappersPath, mapper), "xml") + "js"
  );
}
