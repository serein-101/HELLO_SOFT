/*********************
 *  全局样式控制核心逻辑（与global.js集成）
 *********************/
// 获取主题控制器实例
const themeController = window.parent.themeController || {
  updateThemeProperty: () => console.warn("ThemeController未初始化"),
};

/*********************
 *  选项卡切换功能（优化滚动逻辑）
 *********************/
const headers = document.querySelectorAll("header li");
const contents = document.querySelectorAll("section li");
const header = document.querySelector("header");
const ret_top = document.querySelector("strong");
const Ul = document.querySelector("section ul");
const nav = document.querySelector("nav");
let isScrollingByClick = false;

function removeActiveClass() {
  headers.forEach((item) => item.classList.remove("active"));
}

// 初始化内容索引
window.addEventListener("DOMContentLoaded", () => {
  contents.forEach((content, index) => (content.dataset.index = index));
  headers.forEach((header, index) => (header.dataset.index = index));

  headers.forEach((item) => {
    item.addEventListener("click", function () {
      isScrollingByClick = true;
      removeActiveClass();
      this.classList.add("active");

      // 使用现代滚动API
      Ul.scroll({
        top: contents[this.dataset.index].offsetTop,
        behavior: "smooth",
      });

      // 优化滚动结束检测
      const checkScrollEnd = () => {
        if (
          Math.abs(Ul.scrollTop - contents[this.dataset.index].offsetTop) < 5
        ) {
          isScrollingByClick = false;
          Ul.removeEventListener("scroll", checkScrollEnd);
        }
      };
      Ul.addEventListener("scroll", checkScrollEnd);
    });
  });
});

/*********************
 *  智能滚动同步（优化性能）
 *********************/
Ul.addEventListener("scroll", () => {
  if (isScrollingByClick) return;

  let activeIndex = Array.from(contents).findIndex(
    (content) =>
      Ul.scrollTop <= content.offsetTop + content.offsetHeight &&
      Ul.scrollTop >= content.offsetTop
  );

  if (activeIndex !== -1) {
    removeActiveClass();
    headers[activeIndex].classList.add("active");
  }
});

/*********************
 *  一言功能控制（集成到主题系统）
 *********************/
const hitokotoBtn = document.querySelector("#sentence");
hitokotoBtn.addEventListener("change", function () {
  // 通过主题控制器更新全局状态
  themeController.updateThemeProperty("sentenceEnabled", this.checked);

  // 实时更新父页面显示
  const hitokoto = window.parent.document.getElementById("hitokoto");
  hitokoto.style.display = this.checked ? "block" : "none";

  // 调整布局
  adjustLayout();
});

/*********************
 *  隐私设置组件（优化为事件委托）
 *********************/
document.querySelectorAll(".private p").forEach((p) => {
  p.addEventListener("click", (e) => {
    const label = e.target.closest("label");
    if (!label) return;

    // 清除同组其他选项
    p.querySelectorAll("label").forEach((other) => {
      other.firstElementChild.checked = false;
    });

    // 设置当前选中
    label.firstElementChild.checked = true;

    // 更新全局隐私设置（需要扩展ThemeController）
    const settingType = p.querySelector("b").textContent.trim();
    const value = label.textContent.trim();
    themeController.updatePrivacySetting(settingType, value);
  });
});

/*********************
 *  字体设置（集成主题系统）
 *********************/
document.getElementById("fontSize").addEventListener("change", function () {
  const sizeValue = this.value;
  themeController.updateThemeProperty("fontSize", sizeValue);

  // 实时预览效果（可选）
  document.body.style.fontSize = themeController.getFontSizeValue(sizeValue);
});

document.getElementById("FontSet").addEventListener("change", function () {
  themeController.updateThemeProperty("fontFamily", this.value);
});

/*********************
 *  用户信息编辑（增强导航逻辑）
 *********************/
document.querySelector("#editUserInfo").addEventListener("click", () => {
  const username = window.parent.sessionStorage.getItem("username");
  window.parent.document.querySelector(
    "iframe"
  ).src = `public/html/userInfo.html?username=${encodeURIComponent(username)}`;
});

/*********************
 *  返回顶部优化
 *********************/
ret_top.addEventListener("click", () => {
  Ul.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});

/*********************
 *  暗黑模式切换（集成主题系统）
 *********************/
const darkModeToggle = document.createElement("button");
darkModeToggle.textContent = "🌓 切换主题";
darkModeToggle.className = "dark-mode-toggle";
nav.appendChild(darkModeToggle);

darkModeToggle.addEventListener("click", () => {
  themeController.toggleDarkMode();
});

/*********************
 *  初始化函数
 *********************/
function initializeSettings() {
  // 从主题控制器获取初始状态
  document.getElementById("FontSet").value =
    themeController.currentTheme.fontFamily;
  document.getElementById("fontSize").value =
    themeController.currentTheme.fontSize;
  document.getElementById("sentence").checked =
    themeController.currentTheme.sentenceEnabled;

  // 初始化字体预览
  document.body.style.fontSize = themeController.getFontSizeValue(
    themeController.currentTheme.fontSize
  );

  // 初始化布局
  adjustLayout();
}

// 调整布局函数
function adjustLayout() {
  const content = window.parent.document.querySelector(".content");
  const hitokoto = window.parent.document.getElementById("hitokoto");
  const hitokotoDisplay = window.getComputedStyle(hitokoto).display;

  if (hitokotoDisplay === "none") {
    // 一言隐藏时，调整内容高度
    content.style.minHeight = "100vh";
  } else {
    // 一言显示时，恢复默认高度
    content.style.minHeight = "";
  }
}

// 确保在全局JS加载后初始化
if (themeController) {
  initializeSettings();
} else {
  window.addEventListener("themeControllerReady", initializeSettings);
}
