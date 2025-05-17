/**
 * 注册功能模块
 */
import { CreateUser } from "./utils.js";

// 获取元素
const registForm = document.querySelector("#registForm");
const nicknameInput = document.getElementById("nickname");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

// 增强版焦点修复函数（与登录页面保持一致）
async function repairInputFocus(inputElement) {
  if (!inputElement) return;

  // 方法1: 基础焦点设置
  inputElement.focus();

  // 方法2: 强制重绘
  inputElement.style.display = "none";
  void inputElement.offsetHeight; // 触发重排
  inputElement.style.display = "";
  inputElement.focus();

  // 方法3: 通过主进程同步焦点
  if (window.electronAPI) {
    await window.electronAPI.repairFocus();
  }

  // 方法4: 模拟人工交互
  setTimeout(() => {
    inputElement.click();
    inputElement.focus();

    // 最终检查
    if (document.activeElement !== inputElement && window.electronAPI) {
      window.electronAPI.forceFocusInput();
    }
  }, 100);
}

registForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const nickName = nicknameInput.value.trim();
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    alert("用户名和密码不能为空！");
    await repairInputFocus(username ? passwordInput : usernameInput);
    return;
  }

  try {
    // 将用户添加到数据库中
    let user = new CreateUser(username, password, nickName);
    const res = await window.electronAPI.insertUser(user);

    if (res.code == 1) {
      alert("注册成功！点击确定前往登录！");
      window.location.href = "login.html";
    } else {
      alert("用户已存在！");
      usernameInput.value = "";
      passwordInput.value = "";
      await repairInputFocus(usernameInput);
    }
  } catch (error) {
    console.error("插入用户时出错:", error);
    await repairInputFocus(usernameInput);
  }
});

// 添加全局焦点恢复监听（与登录页面保持一致）
document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState === "visible") {
    await repairInputFocus(document.activeElement);
  }
});
