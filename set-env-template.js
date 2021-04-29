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
    RUNNER_DEBUG: 1
}
