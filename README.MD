# 自动刷新 gitee pages服务

## 开发

在本地开发时，需要在根目录下创建一个 set-env.js 文件，内容如下：

```javascript
const actionInput = {
    username: "你的gitee账号",
    password: "你的gitee密码",
    repository: "需要发布的仓库地址",
    branch: "需要发布的分支",
    directory: "需要发布的目录",
    https: false//是否开启https
}

const tmp = {}
for(let name of Object.keys(actionInput)) {
    const key = `INPUT_${name.replace(/ /g, '_').toUpperCase()}`
    tmp[key] = actionInput[name]
}

module.exports = {
    ...tmp,
}

```

其实 `actionInput` 的配置与 github pages的 workflows文件一致。

执行 `npm run dev` 即可在本地运行

## 使用

需要在你的github actions中使用，你可以按如下配置

```yaml
- uses: okou19900722/gitee-pages@v1
  with:
    username: "你的gitee账号"
    password: ${{ secrets.你的gitee密码 }}
    repository: "需要发布的仓库地址"
    branch: "需要发布的分支"
    directory: "需要发布的目录"
    #是否开启https
    https: false
```


