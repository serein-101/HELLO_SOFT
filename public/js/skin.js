const mains = document.querySelectorAll('main')
const btns = document.querySelectorAll('button')

for(var i = 0; i < btns.length; i++){
    //为每个按钮添加自定义属性
    btns[i].dataset.index = i
    btns[i].addEventListener('click',function(){
        //为每个btn添加点击行为
        mains.forEach(function(item2){
            item2.classList.remove('location')
        })
        btns.forEach(function(item2){
            item2.classList.remove('clicked')
        })
        mains[this.dataset.index].classList.add('location')
        btns[this.dataset.index].classList.add('clicked')
    })
}
