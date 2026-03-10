# ruoyi-eggjs-cli

> Egg.js MyBatis 风格的 Service 代码生成器，附带内网穿透功能

基于 MyBatis XML 映射文件自动生成 Egg.js Service 层代码，减少重复劳动，提高开发效率。

| 公众号                                       | 微信交流群                                                      |
| -------------------------------------------- | --------------------------------------------------------------- |
| ![公众号](https://cdn.undsky.com/img/gh.jpg) | ![微信交流群](https://cdn.undsky.com/img/doudouqun.jpg?v=2.0.1) |

## 目录

- [特性](#特性)
- [安装](#安装)
- [使用方法](#使用方法)
- [工作原理](#工作原理)
- [示例](#示例)
- [自动监听模式](#自动监听模式)
- [目录结构对照](#目录结构对照)
- [SQL 类型映射](#sql-类型映射)
- [命名规范](#命名规范)
- [配置要求](#配置要求)
- [开发工作流](#开发工作流)
- [FRP 内网穿透](#frp-内网穿透)
- [常见问题](#常见问题)
- [完整项目](#完整项目)
- [请我喝杯咖啡](#请我喝杯咖啡)
- [联系方式](#联系方式)
- [贡献指南](#贡献指南)
- [License](#license)


## 特性

- ✅ 自动扫描 XML Mapper 文件并生成对应的 Service 代码
- ✅ 支持多数据库类型（MySQL、SQLite、PostgreSQL 等）
- ✅ 支持多数据源配置
- ✅ 实时监听模式，XML 文件变化时自动重新生成
- ✅ 自动生成符合命名规范的方法（驼峰命名）
- ✅ 智能识别 SQL 类型（select、selects、insert、update、delete）
- ✅ 生成进度可视化显示
- ✅ 附带内网穿透功能（FRP）

## 安装

```bash
$ npm install ruoyi-eggjs-cli --save-dev
```

## 使用方法

### 基础用法

在项目根目录执行：

```bash
# 使用当前目录作为项目路径
$ psy mapper

# 指定项目路径
$ psy mapper /path/to/your/project
```

### 完整参数

```bash
$ psy mapper [projectPath] [options]
```

**参数说明：**

| 参数                   | 说明                                | 默认值       |
| ---------------------- | ----------------------------------- | ------------ |
| `projectPath`          | 项目路径                            | 当前工作目录 |
| `-m, --mapperDir`      | Mapper XML 文件所在目录（相对路径） | `mapper`     |
| `-d, --defaultDatabse` | 默认数据库类型                      | `mysql`      |
| `-w, --watch`          | 是否启用自动监听模式                | `true`       |

### 使用示例

```bash
# 基础用法，使用默认配置
$ psy mapper

# 指定 Mapper 目录
$ psy mapper -m custom-mapper

# 指定默认数据库为 SQLite
$ psy mapper -d sqlite

# 禁用自动监听
$ psy mapper -w false

# 组合使用
$ psy mapper /my/project -m mapper -d mysql -w true
```

## 工作原理

### 1. 扫描 XML 文件

CLI 会扫描指定目录下的所有 `.xml` 文件：

```
./mapper/
  ├── mysql/
  │   └── ruoyi/
  │       ├── SysUserMapper.xml
  │       └── SysRoleMapper.xml
  └── sqlite/
      └── cache/
          └── CacheMapper.xml
```

### 2. 生成 Service 代码

根据 XML 文件的目录结构和内容，自动生成对应的 Service 文件：

```
./app/service/db/
  ├── mysql/
  │   └── ruoyi/
  │       ├── SysUserMapper.js
  │       └── SysRoleMapper.js
  └── sqlite/
      └── cache/
          └── CacheMapper.js
```

### 3. Service 代码结构

生成的 Service 类包含以下内容：

- **基础方法**：
  - `mapper(sqlid, values, params)` - 获取 SQL 语句
  - `db()` - 获取数据库实例

- **自动生成的方法**（根据 XML 中的 SQL 语句）：
  - `xxxMapper(values, params)` - 生成 SQL
  - `xxx(values, params)` - 执行 SQL 并返回结果

## 示例

### 输入：XML Mapper 文件

```xml
<!-- mapper/mysql/ruoyi/SysUserMapper.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="mapper/mysql/ruoyi/SysUserMapper.xml">

    <select id="selectUserList">
        SELECT * FROM sys_user
        <where>
            <if test="userName">
                AND user_name LIKE '%${userName}%'
            </if>
        </where>
        ORDER BY create_time DESC
        LIMIT ?, ?
    </select>

    <select id="selectUserById">
        SELECT * FROM sys_user WHERE user_id = ?
    </select>

    <insert id="insertUser">
        INSERT INTO sys_user (user_name, nick_name, email)
        VALUES (#{userName}, #{nickName}, #{email})
    </insert>

    <update id="updateUser">
        UPDATE sys_user
        <set>
            <if test="userName">user_name = #{userName},</if>
            <if test="email">email = #{email},</if>
            update_time = NOW()
        </set>
        WHERE user_id = ?
    </update>

    <delete id="deleteUser">
        DELETE FROM sys_user WHERE user_id = ?
    </delete>

</mapper>
```

### 输出：生成的 Service 代码

```javascript
// app/service/db/mysql/ruoyi/SysUserMapper.js
const Service = require("egg").Service;

class SysUserMapperService extends Service {
  mapper(sqlid, values, params) {
    return this.app.mapper(
      "mapper/mysql/ruoyi/SysUserMapper.xml",
      sqlid,
      values,
      params,
    );
  }

  db() {
    return this.app.mysql.get("ruoyi");
  }

  selectUserListMapper(values, params) {
    return this.mapper("selectUserList", values, params);
  }

  async selectUserList(values, params) {
    return await this.db().select(this.selectUserListMapper(values, params));
  }

  selectUserByIdMapper(values, params) {
    return this.mapper("selectUserById", values, params);
  }

  async selectUserById(values, params) {
    return await this.db().select(this.selectUserByIdMapper(values, params));
  }

  insertUserMapper(values, params) {
    return this.mapper("insertUser", values, params);
  }

  async insertUser(values, params) {
    return await this.db().insert(this.insertUserMapper(values, params));
  }

  updateUserMapper(values, params) {
    return this.mapper("updateUser", values, params);
  }

  async updateUser(values, params) {
    return await this.db().update(this.updateUserMapper(values, params));
  }

  deleteUserMapper(values, params) {
    return this.mapper("deleteUser", values, params);
  }

  async deleteUser(values, params) {
    return await this.db().del(this.deleteUserMapper(values, params));
  }
}

module.exports = SysUserMapperService;
```

### 使用生成的 Service

```javascript
// app/controller/user.js
class UserController extends Controller {
  async list() {
    const { ctx } = this;
    const params = ctx.request.body;

    // 调用生成的 Service
    const users = await ctx.service.db.mysql.ruoyi.sysUserMapper.selectUserList(
      ctx.helper.page(params),
      params,
    );

    ctx.body = { code: 200, data: users };
  }

  async info() {
    const { ctx } = this;
    const { userId } = ctx.params;

    const user = await ctx.service.db.mysql.ruoyi.sysUserMapper.selectUserById([
      userId,
    ]);

    ctx.body = { code: 200, data: user };
  }

  async add() {
    const { ctx } = this;
    const user = ctx.request.body;

    const insertId = await ctx.service.db.mysql.ruoyi.sysUserMapper.insertUser(
      [],
      user,
    );

    ctx.body = { code: 200, data: insertId };
  }

  async update() {
    const { ctx } = this;
    const user = ctx.request.body;

    await ctx.service.db.mysql.ruoyi.sysUserMapper.updateUser(
      [user.userId],
      user,
    );

    ctx.body = { code: 200, message: "更新成功" };
  }

  async remove() {
    const { ctx } = this;
    const { userId } = ctx.params;

    await ctx.service.db.mysql.ruoyi.sysUserMapper.deleteUser([userId]);

    ctx.body = { code: 200, message: "删除成功" };
  }
}
```

## 自动监听模式

启用监听模式（默认开启）后，CLI 会自动监听 XML 文件的变化：

```bash
$ psy mapper
✔ 生成成功
✔ 自动监听模式已启动
```

**监听功能：**

1. **文件变更**：修改 XML 文件后自动重新生成对应的 Service
2. **文件删除**：删除 XML 文件后自动删除对应的 Service 文件
3. **智能更新**：只在 SQL ID 发生变化时才重新生成，避免不必要的文件写入

```bash
# 修改 XML 文件后
./mapper/mysql/ruoyi/SysUserMapper.xml has been changed

# 删除 XML 文件后
./mapper/mysql/ruoyi/SysRoleMapper.xml has been removed
```

## 目录结构对照

### 单数据库

```bash
# 输入
./mapper/
  └── dbname/
      └── TableMapper.xml

# 输出
./app/service/db/
  └── dbname/
      └── TableMapper.js

# Service 中的 db() 方法
db() {
    return this.app.mysql.get('dbname');
}
```

### 多数据库

```bash
# 输入
./mapper/
  └── mysql/
      └── dbname/
          └── TableMapper.xml

# 输出
./app/service/db/
  └── mysql/
      └── dbname/
          └── TableMapper.js

# Service 中的 db() 方法
db() {
    return this.app.mysql.get('dbname');
}
```

## SQL 类型映射

CLI 会根据 XML 中的标签类型，自动调用对应的数据库方法：

| XML 标签    | 数据库方法   | 返回值                                  |
| ----------- | ------------ | --------------------------------------- |
| `<select>`  | `.select()`  | 单条记录或 null，多条记录时返回记录数组 |
| `<selects>` | `.selects()` | 记录数组                                |
| `<insert>`  | `.insert()`  | 插入的 ID                               |
| `<update>`  | `.update()`  | 影响的行数                              |
| `<delete>`  | `.del()`     | 删除的行数                              |
| `<sql>`     | `.run()`     | 执行结果                                |

## 命名规范

### Service 类名

基于 XML 文件名生成，使用大驼峰命名（PascalCase）：

- `SysUserMapper.xml` → `SysUserMapperService`
- `sys-role-mapper.xml` → `SysRoleMapperService`
- `sys_menu_mapper.xml` → `SysMenuMapperService`

### 方法名

基于 SQL ID 生成，使用小驼峰命名（camelCase）：

- `selectUserList` → `selectUserList()` / `selectUserListMapper()`
- `select_user_by_id` → `selectUserById()` / `selectUserByIdMapper()`
- `insert-user` → `insertUser()` / `insertUserMapper()`

## 配置要求

使用本 CLI 需要项目中已配置以下插件：

### 1. ruoyi-eggjs-mybatis

用于 MyBatis XML 映射：

```js
// config/plugin.js
exports.mybatis = {
  enable: true,
  package: "ruoyi-eggjs-mybatis",
};
```

### 2. 数据库插件

如 ruoyi-eggjs-mysql、ruoyi-eggjs-sqlite、ruoyi-eggjs-pgsql 等：

```js
// config/plugin.js
exports.mysql = {
  enable: true,
  package: "ruoyi-eggjs-mysql",
};

exports.sqlite = {
  enable: true,
  package: "ruoyi-eggjs-sqlite",
};

exports.pgsql = {
  enable: true,
  package: "ruoyi-eggjs-pgsql",
};
```

## 开发工作流

### 推荐流程

1. **启动监听模式**

   ```bash
   $ psy mapper
   ```

2. **编写/修改 XML Mapper**

   ```xml
   <!-- 新增或修改 SQL -->
   <select id="selectNewData">...</select>
   ```

3. **自动生成 Service**
   - CLI 自动检测变化并重新生成 Service 代码

4. **在 Controller 中使用**
   ```js
   await ctx.service.db.xxx.selectNewData([params]);
   ```

### 集成到开发命令

```json
// package.json
{
  "scripts": {
    "dev": "npm-run-all -p mapper debug",
    "mapper": "psy mapper",
    "debug": "egg-bin debug"
  }
}
```

运行 `npm run dev` 即可同时启动 Mapper 生成器和应用调试。

## FRP 内网穿透

使用 FRP（内置版本 v0.45.0） 功能可以将本地服务暴露到公网，方便开发和测试：

```bash
# 完整示例（所有参数必填）
$ rec frp 127.0.0.1:7001 -saddr frp.example.com -sport 39998 -auth your_token

# 指定本地端口（IP 默认为 127.0.0.1）
$ rec frp 7001 -saddr frp.example.com -sport 39998 -auth your_token
```

**参数说明：**

| 参数                        | 说明                                    | 是否必填 |
| --------------------------- | --------------------------------------- | -------- |
| `localURL`                  | 本地服务地址，格式：`IP:PORT` 或 `PORT` | 必填     |
| `-saddr, --serverAddr`      | FRP 服务端地址                          | 必填     |
| `-sport, --serverPort`      | FRP 服务端端口                          | 必填     |
| `-auth, --authToken`        | 身份验证令牌                            | 必填     |
| `-cdomain, --customDomains` | 自定义域名                              | 可选     |

**使用场景：**

- 本地开发时，需要让远程客户端访问本地服务
- 微信小程序开发，需要 HTTPS 域名进行调试
- 临时分享本地服务给团队成员测试
- 内网穿透，访问内网服务

#### 服务端配置

1. 下载 FRP 服务端对应系统版本：[FRP 下载地址](https://github.com/fatedier/frp/releases)

使用命令 uname -m 查看处理器架构。 如果是x86_64 即可选择amd64，若是aarch64 则选择arm64

```
wget https://github.com/fatedier/frp/releases/download/v0.45.0/frp_0.45.0_linux_arm64.tar.gz
```

2. 解压并配置 `frps.ini` 文件

```
tar -zxvf frp_0.45.0_linux_arm64.tar.gz
cd frp_0.45.0_linux_arm64
```

配置文件 frps.ini

```
[common]
bind_port = 39998
vhost_http_port = 39427

[web]
type = http
custom_domains = frp.example.com
auth_token = your_token
```

3. 后台运行,开机启动

```
vim /etc/systemd/system/frps.service
```

```
[Unit]
# 服务名称，可自定义
Description = frp server
After = network.target syslog.target
Wants = network.target
[Service]
Type = simple
# 启动frps的命令，需修改为您的frps的安装路径
ExecStart = /path/to/frps -c /path/to/frps.ini
[Install]
WantedBy = multi-user.target
```

```
# 启动frp
systemctl start frps
# 停止frp
systemctl stop frps
# 重启frp
systemctl restart frps
# 查看frp状态
systemctl status frps
# 开机自启
systemctl enable frps
```

4. nginx 反向代理使用80端口（可配置 https）

```
server {
    listen 80;
    server_name test.undsky.com;

    location / {
        proxy_pass http://127.0.0.1:39427;
        proxy_set_header    Host            $host:80;
        proxy_set_header    X-Real-IP       $remote_addr;
        proxy_set_header    X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_hide_header   X-Powered-By;
        proxy_set_header Upgrade $http_upgrade;  # WebSocket
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 常见问题

### 1. 为什么要生成 Service 代码？

- **减少重复代码**：避免每个 Mapper 都手写相同的 Service 方法
- **保持一致性**：所有 Service 遵循统一的命名和调用规范
- **提高效率**：XML 改动后自动同步到 Service 层
- **便于维护**：代码自动生成，降低维护成本

### 2. 可以自定义生成的代码吗？

目前不支持自定义模板。如需特殊逻辑，建议：

- 在生成的 Service 基础上扩展
- 或创建新的 Service 类继承生成的类

### 3. 监听模式会影响性能吗？

不会。监听模式只在开发环境使用，且只监听 XML 文件变化，不会影响应用性能。

### 4. 如何禁用监听模式？

```bash
$ psy mapper -w false
```

### 5. 生成的文件可以手动修改吗？

不建议。因为 XML 变化后会重新生成，手动修改会丢失。如需自定义逻辑，建议创建新的 Service 类。

### 6. 支持哪些数据库？

理论上支持所有通过插件形式集成到 Egg.js 的数据库，如：

- MySQL（ruoyi-eggjs-mysql）
- SQLite（ruoyi-eggjs-sqlite）
- PostgreSQL（ruoyi-eggjs-pgsql）

## 完整项目

参考 [ruoyi-eggjs](https://github.com/undsky/ruoyi-eggjs) 项目查看完整使用示例。

## 请我喝杯咖啡

如果项目对你有帮助，可以请我喝杯咖啡 ☕️

<img src="https://cdn.undsky.com/img/weixin10.jpg" max-width="300" height="500" /> <img src="https://cdn.undsky.com/img/zhifubao10.jpg" max-width="300" height="500" />

## 联系方式

- 🌐 **网站**: [https://www.undsky.com](https://www.undsky.com)
- 📮 **Issues**: [提交问题或建议](https://github.com/undsky/ruoyi-eggjs-cli/issues)

## 贡献指南

欢迎提交 Issue 和 Pull Request！

如果这个项目对你有帮助，请给我们一个 ⭐️ Star 支持一下！

---

## License

[MIT](LICENSE)
