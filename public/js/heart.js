/**
 * 收藏模块
 * 主要收藏的内容分为三个部分
 * 1.收藏的相册
 * 2.收藏的图片
 * 3.收藏源
 * 
 */

//渲染头部信息

window.addEventListener('load', () => {
    //获取当前登录的用户帐号
    const username = window.sessionStorage.getItem('username')
    //查询当前登录的用户信息
    const user = window.parent.electronAPI.getUserInfo(username)
    if(user){
        const nav = document.querySelector('nav')
        const str = `
            <img src="${user.avatar}" alt="">
            <div>
                <h1>收藏</h1>
                <p>
                    <img src="${user.avatar}" alt="">
                    <span>${user.nickname}</span>
                    <span>${user.birthday}</span>
                </p>
            </div>
        `
        nav.innerHTML = str
    }else{
        alert('用户信息获取失败！')
        return
    }
})


//渲染内容信息



//添加点击事件
const btns = document.querySelectorAll('span a')
btns.forEach(function(item){
    item.addEventListener('click', e => {
        e.preventDefault()
        btns.forEach(item2 => {
            item2.classList.remove('active')
        })
        if(e.target.nodeName == 'A'){
            e.target.classList.add('active')
        }
    })
})