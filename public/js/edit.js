/**
 * 该模块主要处理用户发表动态的功能
 *
 */
import { strIsNull } from "./utils.js";
const form = document.querySelector("form");
const parentWindow = window.parent;
// 清空文本区域内容
document.getElementById("content").value = "";

form.addEventListener("submit", async (e) => {
  //阻止表单默认提交行为
  e.preventDefault();
  //获取用户输入的信息
  const content = document.getElementById("content").value;

  if (strIsNull(content)) {
    alert("总得说点什么吧！！！");
    return;
  } else {
    //获取当前登录的用户名
    const username = window.sessionStorage.getItem("username");
    const res = await parentWindow.electronAPI.publicDynamic(username, content);
    // console.log(res)
    if (res.code == 1) {
      alert("发布成功！");
      form.reset();
      window.location.href = "community.html";
    } else {
      alert("发布失败！");
      console.log(res);
      return;
    }
  }
});
