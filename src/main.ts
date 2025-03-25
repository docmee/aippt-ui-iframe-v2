import { DocmeeUI, CreatorType } from "@docmee/sdk-ui";

// 文多多AiPPT
// 官网 https://docmee.cn
// 开放平台 https://docmee.cn/open-platform/api#接口鉴权
const apiKey = ""; // TODO 填写你的API-KEY
// 用户ID，不同uid创建的token数据会相互隔离，主要用于数据隔离
const uid = "test";
// 限制 token 最大生成PPT次数
const limit = 10;

(async function main() {
  if (!apiKey) {
    alert("请填写API-KEY");
    return;
  }
  // 创建token（请在调用服务端接口实现）
  const res = await fetch("https:/docmee.cn/api/user/createApiToken", {
    method: "POST",
    body: JSON.stringify({
      uid: uid,
      limit: limit,
    }),
    headers: {
      "Api-Key": apiKey,
      "Content-Type": "application/json",
    },
  });

  const json = await res.json();

  const docmeeUI = new DocmeeUI({
    container: "container", // 挂载 iframe 容器元素ID
    page: "creator", // 'dashboard' ppt列表; 'creator' 创建页面; 'customTemplate' 自定义模版; 'editor' 编辑页（需要传pptId字段）
    creatorVersion: "v2",
    token: json.data.token, // token
    creatorData: {
      text: "",
      creatorNow: true,
      type: CreatorType.AI_GEN,
    },
    isMobile: false, // 移动端模式
    padding: "40px 20px 0px",
    background: "linear-gradient(-157deg,#f57bb0, #867dea)", // 自定义背景
    mode: "light", // light 亮色模式, dark 暗色模式
    lang: "zh", // 国际化
    onMessage: (message) => {
      console.log(message);
      if (message.type === "invalid-token") {
        // 在token失效时触发
        console.log("token 认证错误");
        // 更换新的 token
        // docmeeUI.updateToken(newToken)
      } else if (message.type === "beforeGenerate") {
        const { subtype, fields } = message.data;
        if (subtype === "outline") {
          // 生成大纲前触发
          console.log("即将生成ppt大纲", fields);
          return true;
        } else if (subtype === "ppt") {
          // 生成PPT前触发
          console.log("即将生成ppt", fields);
          docmeeUI.sendMessage({
            type: "success",
            content: "继续生成PPT",
          });
          return true;
        }
      } else if (message.type === "beforeCreateCustomTemplate") {
        const { file, totalPptCount } = message.data;
        // 是否允许用户继续制作PPT
        console.log("用户自定义完整模版，PPT文件：", file.name);
        if (totalPptCount < 2) {
          console.log("用户生成积分不足，不允许制作自定义完整模版");
          return false;
        }
        return true;
      } else if (message.type == "pageChange") {
        pageChange(message.data.page);
      } else if (message.type === "beforeDownload") {
        // 自定义下载PPT的文件名称
        const { id, subject } = message.data;
        return `PPT_${subject}.pptx`;
      } else if (message.type == "error") {
        if (message.data.code == 88) {
          // 创建token传了limit参数可以限制使用次数
          alert("您的次数已用完");
        } else {
          alert("发生错误：" + message.data.message);
        }
      }
    },
  });

  document.getElementById("page_creator").addEventListener("click", () => {
    docmeeUI.navigate({ page: "creator" });
  });
  document.getElementById("page_dashboard").addEventListener("click", () => {
    docmeeUI.navigate({ page: "dashboard" });
  });
  document
    .getElementById("page_customTemplate")
    .addEventListener("click", () => {
      docmeeUI.navigate({ page: "customTemplate" });
    });

  function pageChange(page: string) {
    if (page == "creatorV2") {
      page = "creator";
    }
    let element = document.getElementById("page_" + page);
    if (element) {
      element.parentNode.childNodes.forEach(
        (c: any) => c.classList && c.classList.remove("selected")
      );
      element.classList.add("selected");
    }
  }
})();
