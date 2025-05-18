/**
 * 关注模块
 * 显示当前登录用户关注的人的动态信息
 */

//从user表中获取关注的用户动态信息

const parentWindow = parent.window;
const section = document.querySelector("section");
const commentsFormBox = document.querySelector("aside");
const commentsForm = commentsFormBox.querySelector("form");

const EMOJI_DATA = {
  smileys: ["😀", "😂", "😊", "😍", "🤔", "😎", "🥳", "🤩", "🥺", "😇"],
  nature: ["🌿", "🌸", "🌼", "🌞", "🌧️", "❄️", "🌈", "🌌", "🌍", "🐾"],
  activities: ["⚽", "🏀", "🎨", "📚", "🎮", "🎵", "🍴", "🚴", "🏊", "🧘"],
  objects: ["💻", "📱", "✂️", "💡", "🖋️", "📌", "🌐", "🛎️", "📭", "🎁"],
  symbols: ["❤️", "💛", "💚", "💙", "💜", "🖤", "🤍", "✨", "🌟", "⚡"],
};

bindHtml();

// 全局变量存储表情面板引用
let emojiPanel = null;
let emotionBtn = null;

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
    if (!isInsideCommentsForm && !e.target.className.includes("comments")) {
      commentsFormBox.style.display = "none";
    }
  });
});
async function commentsBtnHandler(e) {
  commentsFormBox.style.display = "block";
  commentsForm.dataset.id = e.target.dataset.id;

  // 确保文本框获得焦点
  const textarea = document.getElementById("inputContent");
  if (textarea) textarea.focus();
}

function bindHtml() {
  section.innerHTML = "";
  const username = window.sessionStorage.getItem("username");
  parentWindow.electronAPI.getConcernAll(username).then((concerns) => {
    const concernsList = concerns.data.data;
    //开始渲染页面
    concernsList.forEach(async (item) => {
      const res = await parentWindow.electronAPI.getDynamicByUserName(
        item.careId
      );
      const user = await parentWindow.electronAPI.getUserInfo(item.careId);
      if (res.code == 1) {
        let str = "";
        //当前查询到的用户可能有多条动态信息
        const promises = res.data.map(async (dynamic) => {
          const user = await parentWindow.electronAPI.getUserInfo(
            dynamic.username
          );
          //获取当前这条动态内容的评论数据
          const comments = await parentWindow.electronAPI.getComments(
            dynamic.dynamicId
          );
          if (comments.code === 1) {
            const commentsWithUsers = await Promise.all(
              comments.data.map(async (comment) => {
                const user = await parentWindow.electronAPI.getUserInfo(
                  comment.username
                );
                return {
                  ...comment,
                  nickname: user.nickname,
                  avatar: user.avatar,
                  username: user.username,
                };
              })
            );
            commentsWithUsers.forEach((item) => {
              str += `
                                <div class="comment">
                                    <p class="comment-user">
                                        <img src="${item.avatar || ""}" alt="">
                                        <span><a href="user.html?username=${
                                          item.username
                                        }">${
                item.nickname || "未知用户"
              }</a></span>
                                    </p>
                                    <p class="comment-content">${
                                      item.commentCon
                                    }</p>
                                    <p class="comment-time">${
                                      item.commentTime
                                    }</p>
                                </div>
                            `;
            });
          }
          const isLiked = await parentWindow.electronAPI.isLiked(
            username,
            dynamic.dynamicId
          );
          const div = document.createElement("div");
          div.className = "card";
          div.dataset.id = dynamic.dynamicId;
          div.innerHTML = `
                        <p class="user" id="user">
                            <img src="${user.avatar}" alt="">
                            <a href="user.html?username=${user.username}">${
            user.nickname
          }</a>
                            <a>${dynamic.pubTime}</a>
                        </p>
                        <main>
                            ${dynamic.dynamicCon}
                        </main>
                        <footer>
                            <figure>${dynamic.pubTime}</figure>
                            <figure>
                                <a href="">举报</a>
                                <button data-id="${
                                  dynamic.dynamicId
                                }" class="iconfont likes ${
            isLiked ? "isLiked" : ""
          } icon-dianzan"><sup>${
            dynamic.likes > 0 ? dynamic.likes : ""
          }</sup></button>
                                <button data-id="${
                                  dynamic.dynamicId
                                }" class="iconfont comments icon-pinglun"></button>
                                <button class="iconfont icon-zhuanfa"></button>
                            </figure>
                        </footer>
                        ${str}
                    `;
          section.appendChild(div);
        });

        await Promise.all(promises);

        const likesBtn = document.querySelectorAll(".likes");
        const commentsBtn = document.querySelectorAll(".comments");
        if (likesBtn.length > 0) {
          likesBtn.forEach((item) => {
            item.addEventListener("click", likesBtnHandler);
          });
        }
        if (commentsBtn.length > 0) {
          commentsBtn.forEach((item) => {
            item.addEventListener("click", commentsBtnHandler);
          });
        }
      }
    });
  });
}

async function likesBtnHandler(e) {
  const username = window.sessionStorage.getItem("username");
  const isLiked = await parentWindow.electronAPI.isLiked(
    username,
    e.target.dataset.id
  );
  if (isLiked) {
    await parentWindow.electronAPI.disLikes(username, e.target.dataset.id);
  } else {
    await parentWindow.electronAPI.likes(username, e.target.dataset.id);
  }
  bindHtml();
}
commentsForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const commntCon = commentsForm.querySelector("textarea").value;
  if (!commntCon) {
    alert("总得说点什么吧！");
  } else {
    const username = window.sessionStorage.getItem("username");
    const commentId = e.target.dataset.id;
    const res = await parentWindow.electronAPI.insertComments(
      username,
      commentId,
      commntCon
    );
    if (res.code === 1) {
    } else {
      alert("评论失败！");
    }
  }
  commentsFormBox.style.display = "none";
  bindHtml();
});
