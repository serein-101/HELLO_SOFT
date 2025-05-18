/**
 * 留言模块
 * 此模块规定了留言的格式
 * 主要包括谁留下的留言
 * 留给的默认只能是当前用户
 * 当前用户可以选择回复指定的留言
 */

// 首先是用户查看留言模块
// 获取数据库中messages表中所有leaveFor=当前登录用户（session中看username）的msgs
const parentWindow = window.parent;
const content = document.querySelector("section main");
const nav = document.querySelector("nav");

const replayForm = document.querySelector(".commentForm");
const commentsFormBox = document.querySelector("aside");
const msgInput = document.getElementById("inputContent");
const username = window.sessionStorage.getItem("username");

const EMOJI_DATA = {
  smileys: ["😀", "😂", "😊", "😍", "🤔", "😎", "🥳", "🤩", "🥺", "😇"],
  nature: ["🌿", "🌸", "🌼", "🌞", "🌧️", "❄️", "🌈", "🌌", "🌍", "🐾"],
  activities: ["⚽", "🏀", "🎨", "📚", "🎮", "🎵", "🍴", "🚴", "🏊", "🧘"],
  objects: ["💻", "📱", "✂️", "💡", "🖋️", "📌", "🌐", "🛎️", "📭", "🎁"],
  symbols: ["❤️", "💛", "💚", "💙", "💜", "🖤", "🤍", "✨", "🌟", "⚡"],
};

// 全局变量存储表情面板引用
let emojiPanel = null;
let emotionBtn = null;

let messages;
// 渲染留言数据
bindHtml();

// 初始化表情包组件
function initEmojiPanel() {
  emojiPanel = document.getElementById("emojiPanel");
  emotionBtn = document.getElementById("emotion");
  const emojiContainer = document.getElementById("emojiContainer");
  const closeBtn = document.getElementById("closeEmoji");
  const categories = document.querySelectorAll(".category");

  if (!emojiPanel || !emotionBtn || !emojiContainer) {
    console.error("Emoji panel elements not found");
    return;
  }

  // 点击表情按钮显示面板
  emotionBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // 阻止事件冒泡
    if (emojiPanel.classList.contains("show")) {
      emojiPanel.classList.remove("show");
    } else {
      emojiPanel.classList.add("show");
      renderEmojis("smileys"); // 初始显示笑脸分类
    }
  });

  // 关闭面板
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    emojiPanel.classList.remove("show");
  });

  // 分类切换
  categories.forEach((category) => {
    category.addEventListener("click", (e) => {
      e.stopPropagation();
      categories.forEach((c) => c.classList.remove("active"));
      e.target.classList.add("active");
      renderEmojis(e.target.dataset.category);
    });
  });

  // 点击表情插入到文本框
  emojiContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("emoji-item")) {
      const emoji = e.target.textContent;
      insertEmoji(emoji);
      emojiPanel.classList.remove("show");
    }
  });

  // 渲染表情
  function renderEmojis(category) {
    emojiContainer.innerHTML = "";
    EMOJI_DATA[category].forEach((emoji) => {
      const div = document.createElement("div");
      div.className = "emoji-item";
      div.textContent = emoji;
      emojiContainer.appendChild(div);
    });
  }

  // 插入表情到光标位置
  function insertEmoji(emoji) {
    const textarea = document.getElementById("inputContent");
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    textarea.value =
      textarea.value.substring(0, start) +
      emoji +
      textarea.value.substring(end);
    textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
    textarea.focus();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initEmojiPanel();
  document.addEventListener("click", (e) => {
    if (
      emojiPanel &&
      !emojiPanel.contains(e.target) &&
      e.target !== emotionBtn
    ) {
      emojiPanel.classList.remove("show");
    }
    const isInsideCommentsForm =
      commentsFormBox.contains(e.target) || e.target === commentsFormBox;
    if (!isInsideCommentsForm && !e.target.className.includes("comment")) {
      commentsFormBox.style.display = "none";
    }
  });
});

async function getMsgs() {
  const username = window.sessionStorage.getItem("username");
  const msgs =
    (await parentWindow.electronAPI.selectUserMsgAll(username)) || [];
  return msgs;
}

async function bindHtml() {
  // 渲染头部用户信息
  const currentUser = await parentWindow.electronAPI.getUserInfo(
    window.sessionStorage.getItem("username")
  );
  nav.innerHTML = `
        <img src="${currentUser.avatar}" alt="">
        <div>
            <h1>留言</h1>
            <p>
                <img src="${currentUser.avatar}" alt="">
                <span>${currentUser.nickname}</span>
                <span>${currentUser.birthday}</span>
            </p>
        </div>
    `;

  content.innerHTML = "";
  try {
    const msgsList = await getMsgs();
    if (msgsList.length > 0) {
      // 先获取所有留言者信息
      const userPromises = msgsList.map((item) =>
        parentWindow.electronAPI.getUserInfo(item.username)
      );
      const users = await Promise.all(userPromises);

      const promises = msgsList.map(async (item, index) => {
        const isLiked = await parentWindow.electronAPI.isLiked(
          username,
          item.msgId
        );
        const user = users[index];
        const div = document.createElement("div");
        div.className = "pinglun";
        div.innerHTML = `
                    <aside>
                        <img src="${user.avatar}" alt="">
                    </aside>
                    <span>
                        <a href="user.html?username=${item.username}">${
          user.nickname
        }</a>
                        <article>
                            ${item.msgCon}
                        </article>
                    </span>
                    <footer>
                        <figure>${item.leaveTime}</figure>
                        <figure>
                            <a href="">举报</a>
                            <button data-id="${item.msgId}" class="iconfont ${
          isLiked ? "liked" : ""
        } icon-dianzan "><sup>${item.likes > 0 ? item.likes : ""}</sup></button>
                            <button class="iconfont icon-pinglun1 comment" data-id="${
                              item.msgId
                            }_${item.username}_${item.leaveFor}"></button>
                            <button class="iconfont icon-zhuanfa "></button>
                        </figure>
                    </footer>
                    <div class="replies" data-msg-id="${item.msgId}"></div>
                `;
        content.appendChild(div);
        // 加载该留言的回复
        loadReplies(item.msgId, div.querySelector(".replies"));
      });

      // 所有留言项添加到 DOM 后再进行事件绑定
      await Promise.all(promises);
      const replayBtns = document.querySelectorAll(".comment");
      messages = document.querySelectorAll(".pinglun");
      const dianzanBtns = document.querySelectorAll(".icon-dianzan");
      dianzanBtns.forEach((item) => {
        item.addEventListener("click", async (e) => {
          const username = window.sessionStorage.getItem("username");
          const isLiked = await parentWindow.electronAPI.isLiked(
            username,
            e.target.dataset.id
          );
          if (isLiked) {
            await parentWindow.electronAPI.disLikes(
              username,
              e.target.dataset.id
            );
          } else {
            await parentWindow.electronAPI.likes(username, e.target.dataset.id);
          }
          bindHtml();
        });
      });

      replayBtns.forEach((item) => {
        item.addEventListener("click", async function () {
          msgInput.innerHTML = "";
          replayForm.style.display = "block";
          const userid = this.dataset.id.split("_")[1];
          //获取数据库中的留言中信息
          const newUser = await parentWindow.electronAPI.getUserInfo(userid);
          const a = document.createElement("a");
          a.href = `user.html?username=${userid}`;
          a.dataset.id = userid;
          a.textContent = `@${newUser.nickname}`;
          msgInput.appendChild(a);
          // 让用户可以继续输入内容
          msgInput.contentEditable = true;
          // 记录当前回复的留言 ID
          replayForm.dataset.msgId = this.dataset.id.split("_")[0];
        });
      });
    } else {
      // 当没有留言时，给用户一些提示
      const p = document.createElement("p");
      p.innerHTML = "当前没有人给你留言哦！";
      content.appendChild(p);
    }
  } catch (error) {
    console.error("获取留言数据出错:", error);
    content.innerHTML = "<p>获取留言数据出错，请稍后再试。</p>";
  }
}

// 加载留言的回复
async function loadReplies(msgId, repliesContainer) {
  const username = window.sessionStorage.getItem("username");
  const replies = await parentWindow.electronAPI.getReplies(msgId, username);
  if (replies.length > 0) {
    replies.forEach(async (replay) => {
      const replyDiv = document.createElement("div");
      replyDiv.className = "reply";
      replyDiv.style.fontSize = 16 + "px";
      const user = await parentWindow.electronAPI.getUserInfo(replay.username);
      replyDiv.innerHTML = `
                <span>
                    <img src="${user.avatar}">
                    <a style="font-size: 16px;" href="user.html?username=${replay.username}">${user.nickname}</a>
                    <article style="font-size: 14px; text-indent: 30px;">
                        ${replay.replayCon}
                    </article>
                </span>
                <footer>
                    <figure>${replay.replayTime}</figure>
                </footer>
            `;
      repliesContainer.appendChild(replyDiv);
    });
  }
}

//回复留言功能
replayForm.addEventListener("submit", publicMsg);
async function publicMsg(e) {
  //阻止表单的默认提交行为
  e.preventDefault();
  const replayFor = e.target.querySelector("a").dataset.id;
  // 获取表单输入的内容
  const msgInputDom = document.createElement("div");
  msgInputDom.innerHTML = msgInput.value;
  // 移除所有 a 标签
  const aTags = msgInputDom.querySelectorAll("a");
  aTags.forEach((aTag) => aTag.remove());
  const replayCon = msgInputDom.textContent.trim();
  if (replayCon.length == 0) {
    alert("总得说点什么吧！");
    return;
  }
  const username = window.sessionStorage.getItem("username");
  const msgId = replayForm.dataset.msgId;
  const res = await parentWindow.electronAPI.replay(
    username,
    replayFor,
    replayCon,
    msgId
  );
  //插入成功后，在页面对应的留言位置显示对应的回复；回复数量默认显示2条，超过则收起来，当用户点击时可以再展开三条
  if (!res) {
    alert("回复失败！");
    return;
  }
  // 在页面上显示回复
  const repliesContainer = document.querySelector(
    `.replies[data-msg-id="${msgId}"]`
  );
  const user = await parentWindow.electronAPI.getUserInfo(username);
  const replyDiv = document.createElement("div");
  replyDiv.className = "reply";
  replyDiv.innerHTML = `
        <span>
            <a href="user.html?username=${username}">${user.nickname}</a>
            <article>
                ${replayCon}
            </article>
        </span>
        <footer>
            <figure>${
              new Date().getMonth() + 1
            }-${new Date().getDate()}</figure>
        </footer>
    `;
  repliesContainer.appendChild(replyDiv);
  // 清空输入框
  msgInput.innerHTML = "";
  replayForm.style.display = "none";
}
