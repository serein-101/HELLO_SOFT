const headers = document.querySelectorAll('header li'); // 获取标题栏
const contents = document.querySelectorAll('section li'); // 获取内容栏
const header = document.querySelector('header');
const ret_top = document.querySelector('strong');
const Ul = document.querySelector('section ul');

let isScrollingByClick = false; // 新增标志位，用于标记是否是点击标题栏触发的滚动

function removeActiveClass() {
    headers.forEach(function (item) {
        item.classList.remove('active');
    });
}

window.addEventListener('load', function () {
    // 为每个内容栏设置一个自定义属性 data-index，值为其在 contents 数组中的索引
    contents.forEach((content, index) => {
        content.dataset.index = index;
    });

    // 为每个标题栏设置一个自定义属性 data-index，值为其在 headers 数组中的索引
    headers.forEach((header, index) => {
        header.dataset.index = index;
    });

    // 为每个标题栏添加点击事件监听器
    headers.forEach(function (item) {
        item.addEventListener('click', function () {
            isScrollingByClick = true; // 点击标题栏时，设置标志位为 true
            removeActiveClass();
            this.classList.add('active');
            Ul.scrollTo({
                top: contents[this.dataset.index].offsetTop,
                behavior: 'smooth'
            });

            // 滚动动画完成后，将标志位重置为 false
            const scrollEnd = () => {
                isScrollingByClick = false;
                Ul.removeEventListener('scroll', scrollEnd);
            };
            Ul.addEventListener('scroll', scrollEnd);
        });
    });
});

Ul.onscroll = function () {
    if (isScrollingByClick) return; // 如果是点击标题栏触发的滚动，直接返回，不执行后续逻辑

    let activeIndex = -1;
    for (let i = 0; i < contents.length; i++) {
        if (Ul.scrollTop > contents[i].offsetTop) {
            activeIndex = i;
        }
    }
    if (activeIndex !== -1) {
        removeActiveClass();
        headers[contents[activeIndex].dataset.index].classList.add('active');
    }
};



//获取父级页面的元素
var hitokoto = window.parent.document.getElementById('hitokoto')
var hitokotoBtn = document.querySelector('#sentence')
//关闭or开启一言功能
hitokotoBtn.onclick = function(){
    if(hitokotoBtn.checked){
        // hitokoto.style.display = 'block'
        hitokoto.style.setProperty('display', 'block', 'important');
    }else{
        // hitokoto.style.display = 'none'
        hitokoto.style.setProperty('display', 'none', 'important');
    }
}

//复选框变单选框

//获取所有的main标签下的P标签
var  checkBoxs = document.querySelectorAll('.private p')
checkBoxs.forEach(function(item){
   
     //获取当前p标签下的所有label标签
     var labels = item.querySelectorAll('label')
     labels.forEach(function(label){
         //为每个label添加点击事件
         label.onclick = function(){
             //清除所有label下面的input的选中状态
             labels.forEach(function(labelStatus){
                 labelStatus.firstElementChild.checked = false
             })
             //为点击的label下面的input添加选中状态
             this.firstElementChild.checked = true
         }
     })
})


//设置全局字体大小
//首先得统一全局字体，这里默认字体为中等（3号字体大小）大小20px，两种字体大小之间相差4px

const setFont = document.getElementById('fontSize')
setFont.onchange = () => setFontSize(setFont.options[setFont.selectedIndex].value)

function setFontSize(fontSize){
    //传入的参数为数值，是从FontSize中获取的选项值
    switch(fontSize-0){
        case 1: document.body.style.fontSize = 12 + 'px'; break
        case 2: document.body.style.fontSize = 16 + 'px'; break
        case 3: document.body.style.fontSize = 20 + 'px'; break
        case 4: document.body.style.fontSize = 24 + 'px'; break
        case 5: document.body.style.fontSize = 28 + 'px'; break
        case 6: document.body.style.fontSize = 32 + 'px'; break
    }
}


//编辑个人信息
const editUserInfo = document.querySelector('#editUserInfo')
//获取父级所有的iframe标签
// const iframes = window.parent.document.querySelectorAll('iframe')
const page = window.parent.document.querySelector('iframe')

editUserInfo.addEventListener('click', function(){
    page.src = 'public/html/userInfo.html'
})
