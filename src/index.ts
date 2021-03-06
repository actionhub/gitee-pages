import * as core from "@actions/core"
import * as github from "@actions/github"
import * as io from "@actions/io"
import * as artifact from "@actions/artifact"
import {downloadBrowser} from "puppeteer/lib/cjs/puppeteer/node/install";
import puppeteer, {Page, Browser} from "puppeteer"
import * as params from "./parse-params";
import path from "path";
import fs from "fs";
import compressing from "compressing";


const username = params.get("username", '');
const password = params.get("password", '');
let repository = params.get("repository");
const branch = params.get("branch", "master");
const directory = params.get("directory", '');
const https = params.getBoolean("https", true);

async function open(page: Page, url: string) {
    let response = await page.goto(url)
    if (response?.status() == 404) {
        await debugScreenshot(page, "error1.png")
        throw new Error(`${url} 返回 404`)
    }
    await ensureCurrentPage(page, url)
}

async function ensureCurrentPage(page: Page, url: string) {
    let retry = 100;
    while (page.url() != url) {
        if (retry < 0) {
            await debugScreenshot(page, "error2.png")
            throw new Error(`找开的页面一直不对，重试了100 次${page.url()}`)
        }
        await page.waitForTimeout(100);
        retry--;
    }
}
const screenShotPath = path.join(process.cwd(), "screen-shot")
let client: artifact.ArtifactClient;
async function debugScreenshot(page: Page, p: string) {
    if (core.isDebug()) {
        let finalPath = path.join(screenShotPath, p)
        await page.screenshot({path: finalPath, fullPage: true})
        if (client == null) {
            client = artifact.create();
        }
        await client.uploadArtifact(p, [finalPath], process.cwd())
    }
}

function random(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min;
}

let brower: Browser
(async () => {
    if (!username || !password) {
        if (github.context.payload.repository?.fork) {
            core.warning("fork的仓库没有配置username和password，因此跳过执行")
            return;
        } else {
            throw new Error("username和password必须配置")
        }
    }
    core.startGroup("[" + new Date().toISOString() + "]检测配置")
    if (!repository.startsWith("https://gitee.com")) {
        core.setFailed("[" + new Date().toISOString() + "]仓库网址不正确，需要填写完整的仓库地址")
        return
    }
    if (repository.endsWith(".git")) {
        repository = repository.substr(0, repository.length - 4)
        core.info(`[${new Date().toISOString()}]仓库以.git结尾，去掉后的仓库地址是:${repository}`)
    }

    if (repository.endsWith("/")) {
        repository = repository.substr(0, repository.length - 1)
        core.info(`[${new Date().toISOString()}]仓库以/结尾，去掉后的仓库地址是:${repository}`)
    }
    if (!fs.existsSync(screenShotPath)) {
        await io.mkdirP(screenShotPath)
        core.info("[" + new Date().toISOString() + "]创建截图目录")
    }
    core.info("[" + new Date().toISOString() + "]检测完成")
    core.endGroup()

    core.startGroup("[" + new Date().toISOString() + "]配置浏览器环境")
    core.info("[" + new Date().toISOString() + "]开始下载浏览器")
    await downloadBrowser()
    core.info("[" + new Date().toISOString() + "]浏览器下载完成")

    core.info("[" + new Date().toISOString() + "]开始自动刷新gitee pages")
    brower = await puppeteer.launch({
        args: ['--lang=zh-CN']
    })
    let page = await brower.newPage()
    core.startGroup("[" + new Date().toISOString() + "]开始登陆")
    await page.goto("https://gitee.com/login")
    await page.waitForSelector("#user_login")
    await page.waitForSelector("#user_password")
    await page.waitForSelector("input[name=commit]")
    await debugScreenshot(page, "step1.png")

    core.info("[" + new Date().toISOString() + "]输入账号")
    await page.type("#user_login", username, {delay: random(100, 200)})
    await debugScreenshot(page, "step2.png")

    core.info("[" + new Date().toISOString() + "]输入密码")
    await page.type("#user_password", password, {delay: random(100, 200)})
    await debugScreenshot(page, "step3.png")

    core.info("[" + new Date().toISOString() + "]点击登陆按钮")
    await page.click("input[name=commit]")

    await ensureCurrentPage(page, "https://gitee.com/")

    core.info("[" + new Date().toISOString() + "]登陆完成")
    await debugScreenshot(page, "step4.png")
    core.endGroup()

    core.startGroup("[" + new Date().toISOString() + "]模拟用户打开仓库页")
    core.info("[" + new Date().toISOString() + "]打开仓库页面")
    await open(page, repository)
    await debugScreenshot(page, "step5.png")
    core.info("[" + new Date().toISOString() + "]打开pages设置页面")
    await open(page, `${repository}/pages`)
    await debugScreenshot(page, "step6.png")
    core.endGroup()

    core.startGroup("[" + new Date().toISOString() + "]配置pages")
    await page.waitForSelector(".branch-choose-wrap");
    await page.waitForSelector(".branch-choose-wrap .search.input input");
    await page.waitForSelector("#build_directory");
    await page.waitForSelector(".force-https-checkbox");

    await page.click(".branch-choose-wrap")
    core.info("[" + new Date().toISOString() + "]点击分支下拉框")
    await debugScreenshot(page, "step7.png")
    await page.type(".branch-choose-wrap .search.input input", branch, {delay: random(100, 200)})
    core.info("[" + new Date().toISOString() + "]输入分支名:" + branch)
    await debugScreenshot(page, "step8.png")

    const els = await page.$$(".branch-choose-wrap .menu .scrolling.menu div:not(.filtered)");
    if (els.length < 1) {
        await debugScreenshot(page, "error3.png")
        throw new Error("要部署的分支不存在！");
    }
    await els[0].click()
    core.info("[" + new Date().toISOString() + "]点击需要部署的分支:" + branch)
    await debugScreenshot(page, "step9.png")

    await page.type("#build_directory", directory, {delay: random(100, 200)})
    core.info("[" + new Date().toISOString() + "]输入部署的目录:" + directory)
    await debugScreenshot(page, "step10.png")

    const selector = ".force-https-checkbox" + (https ? ":not(.checked)" : ".checked")
    const checkbox = await page.$(selector);
    if (checkbox != null) {
        await checkbox.click()
        core.info(`[${new Date().toISOString()}]设置的是${https ? "开启" : "关闭"}https，但当前状态是${!https ? "开启" : "关闭"}状态，点击切换`)
        await debugScreenshot(page, "step11.png")
    } else {
        core.info(`[${new Date().toISOString()}]设置的是${https ? "开启" : "关闭"}https，但当前状态也是${https ? "开启" : "关闭"}状态，不需要操作`)
    }
    core.info("[" + new Date().toISOString() + "]配置完成")
    core.endGroup()


    core.startGroup("[" + new Date().toISOString() + "]部署")
    const deploy = await page.$("#pages-branch .update_deploy")
    const dialog = new Promise<void>((resolve, reject) => {
        core.info("[" + new Date().toISOString() + "]监听弹框")
        page.on("dialog", async e => {
            try {
                // const msg = "确定重新部署 Gitee Pages 吗?"
                core.info("[" + new Date().toISOString() + "]监听到弹框：" + e.message());
                // if (e.message() == msg || e.message() == "Are you sure to redeploy Gitee Pages?") {
                    core.info("[" + new Date().toISOString() + "]点击确认");
                    await e.accept(e.message());
                    core.info("[" + new Date().toISOString() + "]点击完成，等待部署完成！");
                await debugScreenshot(page, "step12.png")
                // }
                resolve()
            } catch (e) {
                reject(e);
            }
        })
    })

    if (deploy) {
        await deploy.click();
        await dialog
    } else {
        await debugScreenshot(page, "error4.png")
        throw new Error("没有找到部署按钮，部署失败")
    }
    core.endGroup()
    core.info("[" + new Date().toISOString() + "]操作完成")
    await brower.close()

    // if (core.isDebug()) {
    //     await compressing.zip.compressDir(screenShotPath, screenShotPath + '.zip')
    //     const client = artifact.create()
    //     await client.uploadArtifact("screen-shot.zip", ["screen-shot.zip"], process.cwd())
    // }
})().catch(e => {
    core.setFailed("[" + new Date().toISOString() + "]" + e)
    if (brower) {
        brower.close().catch(e => {
            console.error(e);
        })
    }
})
