/**
 * 关注模块
 * 显示当前登录用户关注的人的动态信息
 */

//从user表中获取关注的用户动态信息

const parentWindow = parent.window
const section = document.querySelector('section')
const commentsFormBox = document.querySelector('aside')
const commentsForm = commentsFormBox.querySelector('form')

bindHtml()

function bindHtml() {
    section.innerHTML = ''
    const username = window.sessionStorage.getItem('username')
    parentWindow.electronAPI.getConcernAll(username).then(concerns => {
        const concernsList = concerns.data.data
        //开始渲染页面
        concernsList.forEach(async item => {
            const res = await parentWindow.electronAPI.getDynamicByUserName(item.careId)
            const user = await parentWindow.electronAPI.getUserInfo(item.careId)
            if (res.code == 1) {
                let str = ''
                //当前查询到的用户可能有多条动态信息
                const promises = res.data.map(async dynamic => {
                    const user = await parentWindow.electronAPI.getUserInfo(dynamic.username);
                    //获取当前这条动态内容的评论数据
                    const comments = await parentWindow.electronAPI.getComments(dynamic.dynamicId)
                    if (comments.code === 1) {
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
                            str += `
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
                    const isLiked = await parentWindow.electronAPI.isLiked(username, dynamic.dynamicId);
                    const div = document.createElement('div')
                    div.className = 'card'
                    div.dataset.id = dynamic.dynamicId
                    div.innerHTML = `
                        <p class="user" id="user">
                            <img src="${user.avatar}" alt="">
                            <a href="user.html?username=${user.username}">${user.nickname}</a>
                            <a>${dynamic.pubTime}</a>
                        </p>
                        <main>
                            ${dynamic.dynamicCon}
                        </main>
                        <footer>
                            <figure>${dynamic.pubTime}</figure>
                            <figure>
                                <a href="">举报</a>
                                <button data-id="${dynamic.dynamicId}" class="iconfont likes ${isLiked ? 'isLiked' : ''} icon-dianzan"><sup>${dynamic.likes > 0 ? dynamic.likes : ''}</sup></button>
                                <button data-id="${dynamic.dynamicId}" class="iconfont comments icon-pinglun"></button>
                                <button class="iconfont icon-zhuanfa"></button>
                            </figure>
                        </footer>
                        ${str}
                    `
                    section.appendChild(div)
                })

                await Promise.all(promises)

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

        })
    })
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
