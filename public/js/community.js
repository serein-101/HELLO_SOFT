/**
 * 社区模块
 * 用户功能包括
 * 1.发布动态
 * 2.评论
 * 3.转发
 * 4.点赞
 * 5.举报
 */

const parentWindow = parent.window
const section = document.querySelector('section')
const commentsFormBox = document.querySelector('aside')
const commentsForm = commentsFormBox.querySelector('form')
const username = window.sessionStorage.getItem('username')
bindHtml()

async function bindHtml() {
    section.innerHTML = '';
    // 获取当前的社区动态表
    const res = await parentWindow.electronAPI.getDynamics();
    if (res.code === 0) {
        section.innerHTML = '当前社区还什么都没有哦！！！';
        return;
    }

    const promises = res.data.map(async item => {
        const user = await parentWindow.electronAPI.getUserInfo(item.username);
        //获取当前这条动态内容的评论数据
        const comments = await parentWindow.electronAPI.getComments(item.dynamicId)
        let str = ''
        if(comments.code === 1){
            const commentsWithUsers = await Promise.all(
                comments.data.map(async comment => {
                    const user = await parentWindow.electronAPI.getUserInfo(comment.username)
                    return {
                        ...comment,
                        nickname: user.nickname,
                        avatar: user.avatar,
                        username: user.username
                    }
                })
            )
            commentsWithUsers.forEach(item => {
                str +=`
                    <div class="comment">
                        <p class="comment-user">
                            <img src="${item.avatar || ''}" alt="">
                            <span><a href="user.html?username=${item.username}">${item.nickname || '未知用户'}</a></span>
                        </p>
                        <p class="comment-content">${item.commentCon}</p>
                        <p class="comment-time">${item.commentTime}</p>
                    </div>
                `
            })
        }
        const isLiked = await parentWindow.electronAPI.isLiked(username, item.dynamicId);
        if (!user) {
            section.innerHTML = '当前社区还什么都没动态哦！！！';
        } else {
            section.innerHTML += `
                <div class="card">
                    <p class="user" id="user">
                        <img src="${user.avatar}" alt="">
                        <a href="user.html?username=${item.username}">${user.nickname}</a>
                        <a data-index="${item.id}">...</a>
                    </p>
                    <main>
                        <article>${item.dynamicCon}</article>
                    </main>
                    <footer>
                        <figure>${item.pubTime}</figure>
                        <figure data-id="${item.dynamicId}">
                            <a href="">举报</a>
                            <button data-id="${item.dynamicId}" class="iconfont likes ${isLiked ? 'isLiked' : ''} icon-dianzan"><sup>${item.likes > 0 ? item.likes : ''}</sup></button>
                            <button data-id="${item.dynamicId}" class="iconfont comments icon-pinglun1"></button>
                            <button class="iconfont icon-zhuanfa"></button>
                        </figure>
                    </footer>
                    ${str}
                </div>
            `;
        }
    });

    await Promise.all(promises);
    const likesBtn = document.querySelectorAll('.likes');
    const commentsBtn = document.querySelectorAll('.comments')
    if (likesBtn.length > 0) {
        likesBtn.forEach(item => {
            item.addEventListener('click', likesBtnHandler);
        });
    }
    if (commentsBtn.length > 0) {
        commentsBtn.forEach(item => {
            item.addEventListener('click', commentsBtnHandler);
        });
    }
}
async function likesBtnHandler(e) {
    const username = window.sessionStorage.getItem('username')
    const isLiked = await parentWindow.electronAPI.isLiked(username, e.target.dataset.id)
    if (isLiked) {
        await parentWindow.electronAPI.disLikes(username, e.target.dataset.id)
    } else {
        await parentWindow.electronAPI.likes(username, e.target.dataset.id)
    }
    bindHtml()
}

async function commentsBtnHandler(e) {
    commentsFormBox.style.display = 'block'
    //把当前的动态Id给form表单
    commentsForm.dataset.id = e.target.dataset.id
}
commentsForm.addEventListener('submit', async e => {
    e.preventDefault()
    const commntCon = commentsForm.querySelector('textarea').value
    if (!commntCon) {
        alert('总得说点什么吧！')
    } else {
        const username = window.sessionStorage.getItem('username')
        const commentId = e.target.dataset.id
        const res = await parentWindow.electronAPI.insertComments(username, commentId, commntCon)
        if (res.code === 1) {
        } else {
            alert('评论失败！')
        }
    }
    commentsFormBox.style.display = 'none'
    bindHtml()
})