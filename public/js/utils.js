/**
 * 公共的工具模块
 * 主要实现一些页面都能用到的方法
 *
 */
//判断字符串是否为空

export const strIsNull = function (str) {
  if (str == null || str.length == 0 || str.trim() == "") {
    return true;
  } else {
    return false;
  }
};

//渲染当前用户主页信息
export const renderUserInfo = (user) => {
  if (!user) {
    //用户数据不存在，给出提示信息，直接返回
    alert("个人信息获取失败，程序已退出！");
    return;
  }
  //开始渲染个人主页
  const str = `
        <nav>
        <img src="${user.avatar}" alt="图片飞走啦">
        <div>
            <h1>${user.nickname}
                <a href="userInfo.html" class="iconfont icon-bianji2"></a>
            </h1>
            <p>
                <span><a href="book.html">关注${user.cares}</a><b></b><a href="">粉丝${user.fans}</a></span>
                <!-- <span>${user.birthday}创建</span> -->
            </p>
            <h2>个性签名：${user.signature}</h2>
            <h2>简介：${user.introduce}</h2>
            <h2>地区：${user.region}</h2>
            <h2><a href="www.baidu.com">社交帐号：<b class="iconfont icon-weibo"></b></a></h2>
        </div>
    </nav>
    <section>
        <header>
            <span>
                <a href="album.html">我的相册<sup>${user.albums}</sup></a>
                <a href="community.html">动态<sup>${user.dynamics}</sup></a>
                <a href="message.html">回复我的<sup>${user.replays}</sup></a>
            </span>
        </header>
        <main>
            <img src="../src/img/qianfantian.jpg" alt="">
            <p>空空如也</p>
        </main>
        <div></div>
    </section>
    `;
  document.body.innerHTML = str;
};

//渲染他人主页
export const renderOtherUser = (user, isConcern) => {
  if (!user) {
    //用户数据不存在，给出提示信息，直接返回
    alert("个人信息获取失败，程序已退出！");
    return;
  }
  const str = `
        <nav>
        <img src="${user.avatar}" alt="图片飞走啦">
        <div>
            <h1>${user.nickname}</h1>
            <p>
                <span><a class="addConcern">${
                  isConcern == 1 ? "取消关注" : "关注"
                }</a><b></b><a>粉丝${user.fans}</a></span>
                <!-- <span>${user.birthday}创建</span> -->
            </p>
            <h2>个性签名：${user.signature}</h2>
            <h2>简介：${user.introduce}</h2>
            <h2>地区：${user.region}</h2>
            <h2><a href="">社交帐号：<b class="iconfont icon-weibo"></b></a></h2>
        </div>
    </nav>
    <section>
        <header>
            <span>
                <a href="album.html?username=${user.username}">相册</a>
                <a href="">动态<sup>${user.dynamics}</sup></a>
                <a href="comment.html?username=${user.username}">留言<sup>${
    user.messages
  }</sup></a>
            </span>
        </header>
        <main>
            <img src="../src/img/qianfantian.jpg" alt="">
            <p>空空如也</p>
        </main>
        <div></div>
    </section>
    `;
  document.body.innerHTML = str;
};
//自定义user对象构造函数
//用户首次注册时显示的基本信息
export const CreateUser = function (username, password, nickName) {
  const time = new Date();
  this.avatar = "../src/img/misak1.png";
  this.username = username;
  this.password = password;
  this.nickname = nickName;
  this.birthday = `${time.getFullYear()}-${(time.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${time.getDay().toString().padStart(2, "0")}`;
  this.introduce = "这个人很懒，什么都没有留下哦！";
  this.signature = "世界上最遥远的距离是你没有留下签名";
  this.region = "在世界的最边界处";
};
