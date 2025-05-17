const loginForm = document.getElementById("loginForm");
const show = document.getElementById("show");
const pwdInp = document.getElementById("password");
const usernameInp = document.getElementById("username");
let isShow = false;

// 增强版焦点修复函数
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

// 登录表单提交处理
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = usernameInp.value.trim();
  const pwd = pwdInp.value.trim();

  if (!username || !pwd) {
    alert("帐号密码不能为空！");
    await repairInputFocus(pwdInp);
    return;
  }

  try {
    const res = await window.electronAPI.login(username, pwd);
    if (res.code === 1) {
      window.sessionStorage.setItem("username", username);
      window.electronAPI.send("login-success");
    } else {
      alert(res.status === 401 ? "用户不存在" : "密码错误！");
      pwdInp.value = "";
      await repairInputFocus(pwdInp);
    }
  } catch (error) {
    console.error("登录失败:", error);
    pwdInp.value = "";
    await repairInputFocus(pwdInp);
  }
});

// 密码显示/隐藏切换
show.addEventListener("click", (e) => {
  isShow = !isShow;
  pwdInp.type = isShow ? "text" : "password";
  show.classList.toggle("icon-yanjing_xianshi_o", isShow);
  show.classList.toggle("icon-yanjing_yincang_o", !isShow);

  // 切换后保持焦点
  if (document.activeElement === pwdInp) {
    setTimeout(() => pwdInp.focus(), 10);
  }
});

// 全局焦点恢复监听
document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState === "visible") {
    await repairInputFocus(document.activeElement);
  }
});
