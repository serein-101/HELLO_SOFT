/**
 * 留言模块
 * 主要功能是当前用户点击其他用户主页的留言时，会展开此页面进行留言
 */
const comment = document.getElementById('comment')
const username = window.sessionStorage.getItem('username')

//获取当前URL中的username参数
const url = new URL(window.location.href)
const params = new URLSearchParams(url.search)
const leaveFor = params.get('username')

bindHtml()
async function bindHtml() {
    comment.innerHTML = ''
    //获取当前登录的用户信息
    const user = await parent.window.electronAPI.getUserInfo(username)
    //获取传递过来的用户信息
    const leaveForUser = await parent.window.electronAPI.getUserInfo(leaveFor)
    if(!user){
        //
        return alert('用户信息获取失败！')
    }

    const str = `
    <form action="" data-id="${leaveForUser.username}">
            <h1>叨叨几句...NOTHING</h1>
            <span>以
                <a href="user.html">@${user.nickname}</a>
                的身份登录。
                <a href="userInfo.html">编辑你的个人信息。</a>
                <a href="">注销？</a>
            </span>
            <textarea placeholder="嘛，东西可以乱吃，话不要乱说嗷！"></textarea>
            <label for="private"><input type="checkbox" id="private">私密</label>
            <button>发布留言</button>
        </form>
`
    comment.innerHTML = str

    const form = document.querySelector('form')
    form.addEventListener('submit', submitHandler)
}

/**
 * 添加提交事件
 * 即发布评论事件
 */
async function submitHandler(e){
    //阻止默认button提交事件
    e.preventDefault()

    //获取用户填写的内容信息
    const content = document.querySelector('textarea').value
    if(content.length == 0){
        alert('总得说点什么吧！')
        return
    }
    //获取当前登录的用户信息
    const leaveFor = e.target.dataset.id
    const res = await parent.window.electronAPI.leaveMsg(username, leaveFor, content)
    if(res.code == 1){
        alert('留言成功！')
        return 
    }else{
        return alert('留言失败！')
    }
}