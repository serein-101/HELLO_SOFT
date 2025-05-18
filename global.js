/**
 * 全局主题控制器
 * 用于管理应用程序的全局样式，包括颜色、字体等
 */

class ThemeController {
  constructor() {
    // 默认主题配置
    this.defaultTheme = {
      fontFamily: "微软雅黑",
      fontSize: "3",
      primaryColor: "#3498db",
      secondaryColor: "#2980b9",
      backgroundColor: "#f1f4e1",
      textColor: "#333333",
      accentColor: "#e74c3c",
      darkMode: false,
      sentenceEnabled: true,
    };

    // 从本地存储加载主题或使用默认值
    this.currentTheme =
      JSON.parse(localStorage.getItem("appTheme")) || this.defaultTheme;

    // 初始化应用主题
    this.applyTheme();
  }

  // 应用当前主题到整个应用
  applyTheme() {
    // 主窗口样式
    this.updateMainWindowStyles();

    // iframe内容样式
    this.updateIframeStyles();

    // 侧边栏和导航栏样式
    this.updateSidebarAndNavbarStyles();

    //一言样式
    this.updateHitokotoStyles();

    // 保存到本地存储
    this.saveTheme();
  }

  // 更新主窗口样式
  updateMainWindowStyles() {
    const root = document.documentElement;

    // 设置CSS变量
    root.style.setProperty("--primary-color", this.currentTheme.primaryColor);
    root.style.setProperty(
      "--secondary-color",
      this.currentTheme.secondaryColor
    );
    root.style.setProperty(
      "--background-color",
      this.currentTheme.backgroundColor
    );
    root.style.setProperty("--text-color", this.currentTheme.textColor);
    root.style.setProperty("--accent-color", this.currentTheme.accentColor);

    // 设置字体
    document.body.style.fontFamily = this.currentTheme.fontFamily;
    document.body.style.fontSize = this.getFontSizeValue(
      this.currentTheme.fontSize
    );

    // 暗黑模式
    if (this.currentTheme.darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }

  // 更新iframe内容样式
  updateIframeStyles() {
    const iframes = document.querySelectorAll("iframe");

    iframes.forEach((iframe) => {
      try {
        const iframeDoc =
          iframe.contentDocument || iframe.contentWindow.document;

        // 设置iframe内部样式
        iframeDoc.body.style.fontFamily = this.currentTheme.fontFamily;
        iframeDoc.body.style.fontSize = this.getFontSizeValue(
          this.currentTheme.fontSize
        );
        iframeDoc.body.style.backgroundColor =
          this.currentTheme.backgroundColor;
        iframeDoc.body.style.color = this.currentTheme.textColor;

        // 设置iframe内部的CSS变量
        const iframeRoot = iframeDoc.documentElement;
        iframeRoot.style.setProperty(
          "--primary-color",
          this.currentTheme.primaryColor
        );
        iframeRoot.style.setProperty(
          "--secondary-color",
          this.currentTheme.secondaryColor
        );
        iframeRoot.style.setProperty(
          "--background-color",
          this.currentTheme.backgroundColor
        );
        iframeRoot.style.setProperty(
          "--text-color",
          this.currentTheme.textColor
        );
        iframeRoot.style.setProperty(
          "--accent-color",
          this.currentTheme.accentColor
        );

        // 暗黑模式
        if (this.currentTheme.darkMode) {
          iframeDoc.body.classList.add("dark-mode");
        } else {
          iframeDoc.body.classList.remove("dark-mode");
        }
      } catch (e) {
        console.log("无法访问iframe内容:", e);
      }
    });
  }

  // 更新侧边栏和导航栏样式
  updateSidebarAndNavbarStyles() {
    const sidebar = document.querySelector("aside");
    const navbar = document.querySelector("header");

    if (sidebar) {
      sidebar.style.backgroundColor = this.currentTheme.backgroundColor;
      sidebar.style.color = this.currentTheme.textColor;
      sidebar.style.fontFamily = this.currentTheme.fontFamily;
      sidebar.style.fontSize = this.getFontSizeValue(
        this.currentTheme.fontSize
      );
    }

    if (navbar) {
      navbar.style.backgroundColor = this.currentTheme.backgroundColor;
      navbar.style.color = this.currentTheme.textColor;
      navbar.style.fontFamily = this.currentTheme.fontFamily;
      navbar.style.fontSize = this.getFontSizeValue(this.currentTheme.fontSize);
    }
  }

  // 更新一言样式
  updateHitokotoStyles() {
    const hitokoto = document.getElementById("hitokoto");
    if (hitokoto) {
      hitokoto.style.fontFamily = this.currentTheme.fontFamily;
      hitokoto.style.fontSize = this.getFontSizeValue(
        this.currentTheme.fontSize
      );
      hitokoto.style.color = this.currentTheme.textColor;
      hitokoto.style.backgroundColor = this.currentTheme.backgroundColor;
    }
  }

  // 获取字体大小对应的实际值
  getFontSizeValue(sizeLevel) {
    const sizeMap = {
      1: "12px",
      2: "14px",
      3: "16px",
      4: "18px",
      5: "20px",
      6: "22px",
    };
    return sizeMap[sizeLevel] || "16px";
  }

  // 保存主题到本地存储
  saveTheme() {
    localStorage.setItem("appTheme", JSON.stringify(this.currentTheme));
  }

  // 更新主题属性
  updateThemeProperty(property, value) {
    this.currentTheme[property] = value;
    this.applyTheme();
  }

  // 切换暗黑模式
  toggleDarkMode() {
    this.currentTheme.darkMode = !this.currentTheme.darkMode;

    if (this.currentTheme.darkMode) {
      // 暗黑模式颜色
      this.currentTheme.backgroundColor = "#1a1a1a";
      this.currentTheme.textColor = "#f5f5f5";
      this.currentTheme.primaryColor = "#4a6fa5";
      this.currentTheme.secondaryColor = "#3a5a8a";
    } else {
      // 明亮模式颜色
      this.currentTheme.backgroundColor = "#f1f4e1";
      this.currentTheme.textColor = "#333333";
      this.currentTheme.primaryColor = "#3498db";
      this.currentTheme.secondaryColor = "#2980b9";
    }

    this.applyTheme();
  }

  updatePrivacySetting(type, value) {
    // 实现具体的隐私设置逻辑
    console.log(`更新隐私设置：${type} = ${value}`);
    this.applyTheme();
  }

  // 重置为默认主题
  resetToDefault() {
    this.currentTheme = { ...this.defaultTheme };
    this.applyTheme();
  }
}

// 导出函数供设置页面使用
window.updateThemeSettings = function () {
  // 获取设置页面中的表单元素
  const fontFamily = document.getElementById("FontSet").value;
  const fontSize = document.getElementById("fontSize").value;
  const sentenceEnabled = document.getElementById("sentence").checked;

  // 更新主题
  themeController.updateThemeProperty("fontFamily", fontFamily);
  themeController.updateThemeProperty("fontSize", fontSize);
  themeController.updateThemeProperty("sentenceEnabled", sentenceEnabled);

  // 显示保存成功的提示
  //   alert("设置已保存！");
};

// 初始化设置页面的表单值
window.initializeThemeSettings = function () {
  document.getElementById("FontSet").value =
    themeController.currentTheme.fontFamily;
  document.getElementById("fontSize").value =
    themeController.currentTheme.fontSize;
  document.getElementById("sentence").checked =
    themeController.currentTheme.sentenceEnabled;
};

// 监听设置表单的变化
document.addEventListener("DOMContentLoaded", function () {
  if (typeof initializeThemeSettings === "function") {
    initializeThemeSettings();

    // 为表单元素添加事件监听
    document
      .getElementById("FontSet")
      .addEventListener("change", updateThemeSettings);
    document
      .getElementById("fontSize")
      .addEventListener("change", updateThemeSettings);
    document
      .getElementById("sentence")
      .addEventListener("change", updateThemeSettings);
  }
});

window.initThemeManage = () => {
  return new ThemeController();
};
// window.themeController = new ThemeController();

// 派发自定义事件通知主题控制器就绪
window.dispatchEvent(new Event("themeControllerReady"));
