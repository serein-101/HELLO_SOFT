var btns = [...document.querySelectorAll("aside button")];
const page = document.querySelector(".page iframe");
//获取当前登录的用户名
const username = window.sessionStorage.getItem("username");

for (var i = 0; i < btns.length; i++) {
  btns[i].dataset.locate = i;
}

const pageUrls = [
  "public/html/home.html",
  "public/html/transform.html",
  "public/html/community.html",
  "public/html/album.html?username=" + username,
  "public/html/book.html",
  "public/html/message.html",
  "public/html/setting.html",
  "public/html/user.html",
  "public/html/skin.html",
  "public/html/userInfo.html",
  "public/html/edit.html",
];

btns.forEach(function (item) {
  item.onclick = function () {
    btns.forEach(function (item2) {
      item2.classList.remove("clicked");
    });
    this.classList.add("clicked");
    goBack.style.color = "grey";
    page.src = pageUrls[this.dataset.locate];
  };
});

//获取回退按钮
const goBack = document.getElementById("goBack");
goBack.onclick = function () {
  window.history.back();
};
const loginIcon = document.getElementById("userIcon");
const loginPage = document.querySelector("#loginPage");
const userPage = document.querySelector(".userPage");
const promiseUser = window.electronAPI.getUserInfo(username);
promiseUser.then((user) => {
  //用户滑进时显示用户的昵称
  loginIcon.dataset.title = user.nickname;
});
loginIcon.onclick = function () {
  page.src =
    pageUrls[7] + "?username=" + window.sessionStorage.getItem("username");
};

//点击皮肤图标
const skinIcon = document.querySelector("#skinIcon");
const skinPage = document.querySelector(".skinPage");
skinIcon.onclick = function () {
  page.src = pageUrls[8];
};

/***
 * 处理用户上传文件
 * input为input标签
 * folder为存储路径
 */
const saveFileByself = async function (inputFile, folder) {
  const file = inputFile.files[0];
  if (!file || !file.name) {
    alert("请选择要上传的文件");
    return;
  }
  try {
    const fileData = new Uint8Array(await file.arrayBuffer());
    // 检查 window.electronAPI 是否存在
    if (!window.electronAPI || !window.electronAPI.saveFile) {
      throw new Error("electronAPI.saveFile 未定义");
    }
    const success = await window.electronAPI.saveFile(
      { name: file.name, data: fileData },
      folder
    );
    if (success) {
      // 保存成功后的操作
      console.log("文件保存成功");
    } else {
      throw new Error("文件保存失败");
    }
  } catch (error) {
    console.error("图片上传失败:", error);
    alert("图片上传失败，请稍后再试。");
  }
};

// 最小化按钮点击事件
const minimizeButton = document.getElementById("minimize");
minimizeButton.addEventListener("click", () => {
  window.electronAPI.send("minimize-window");
});

// 最大化按钮点击事件
const maximizeButton = document.getElementById("maximize");
maximizeButton.addEventListener("click", () => {
  window.electronAPI.send("maximize-window");
});

// 关闭按钮点击事件
const closeButton = document.getElementById("close");
closeButton.addEventListener("click", () => {
  window.electronAPI.send("close-window");
});

//一心留言
fetch("https://v1.hitokoto.cn")
  .then((response) => response.json())
  .then((data) => {
    // console.log(data)
    const hitokoto = document.querySelector("#hitokoto_text");
    hitokoto.href = `https://hitokoto.cn/?uuid=${data.uuid}`;
    hitokoto.innerText = `${data.hitokoto}    ——${data.from}
      `;
  })
  .catch(console.error);

// index.js 中添加以下代码
const pageIframe = document.querySelector(".page iframe");

const themeController = window.initThemeManage();
window.themeController = themeController;
pageIframe.addEventListener("load", () => {
  themeController.applyTheme(); // 应用当前主题到新加载的iframe
});
