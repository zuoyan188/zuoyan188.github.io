/*封装*/
function TreeNode(obj) {
    this.parent = obj.parent;
    this.childs = obj.childs || [];
    this.data = obj.data || "";
    this.selfElement = obj.selfElement; // 访问对应的DOM结点
    this.selfElement.TreeNode = this;  // 对应的DOM结点访问回来
}

// 原型模式封装公共操作
TreeNode.prototype = {
    constructor: TreeNode,
    // 解耦样式操作，四个参数表示是否改变箭头、可见性、改为高亮、改为普通，后两个参数可省略
    render: function (arrow, visibility, toHighlight, deHighlight) {
        if (arguments.length < 3) {
            toHighlight = false;
            deHighlight = false;
        }
        if (arrow) {
            if (this.isLeaf()) { // 是个叶节点，设为空箭头
                this.selfElement.getElementsByClassName("arrow")[0].className = "arrow empty-arrow";
            }
            else if (this.isFolded()) { // 折叠状态，设为右箭头
                this.selfElement.getElementsByClassName("arrow")[0].className = "arrow right-arrow";
            }
            else { // 展开状态，设为下箭头
                this.selfElement.getElementsByClassName("arrow")[0].className = "arrow down-arrow";
            }
        }
        if (visibility) { // 改变可见性
            if (this.selfElement.className.indexOf("nodebody-visible") == -1) { // 本不可见，改为可见
                this.selfElement.className = this.selfElement.className.replace("hidden", "visible");
            }
            else { //改为不可见
                this.selfElement.className = this.selfElement.className.replace("visible", "hidden");
            }
        }
        if (toHighlight) { // 设为高亮
            this.selfElement.getElementsByClassName("node-title")[0].className = "node-title node-title-highlight";
        }
        if (deHighlight) { // 取消高亮
            this.selfElement.getElementsByClassName("node-title")[0].className = "node-title";
        }
    },
    // 删除结点，DOM会自动递归删除子节点，TreeNode递归手动删除子节点
    deleteNode: function () {
        var i;
        // 递归删除子节点
        if(!this.isLeaf()){
            for(i=0;i<this.childs.length;i++){
                this.childs[i].deleteNode();
            }
        }
        this.parent.selfElement.removeChild(this.selfElement);// 移除对应的DOM结点
        for (i = 0; i < this.parent.childs.length; i++) { // 从父节点删除该孩子
            if (this.parent.childs[i] == this) {
                this.parent.childs.splice(i, 1);
                break;
            }
        }
        // 调整父结点箭头样式
        this.parent.render(true, false);
    },
    // 增加子节点
    addChild: function (text) {
        if (text == null) return this;
        if (text.trim() == "") {
            alert("节点内容不能为空！");
            return this;
        }
        // 先增加子节点，再渲染自身样式
        // 若当前节点关闭，则将其展开
        if(!this.isLeaf() && this.isFolded()){
            this.toggleFold();
        }
        // 创建新的DOM结点并附加
        var newNode = document.createElement("div");
        newNode.className = "nodebody-visible";
        var newHeader = document.createElement("label");
        newHeader.className = "node-header";
        var newSymbol = document.createElement("div");
        newSymbol.className = "arrow empty-arrow";
        var newTitle = document.createElement("span");
        newTitle.className = "node-title";
        newTitle.innerHTML = text;
        var space = document.createElement("span");
        space.innerHTML = "&nbsp;&nbsp;";
        var newDelete = document.createElement("img");
        newDelete.className = "deleteIcon";
        newDelete.src = "imgs/delete.png";
        var newAdd = document.createElement("img");
        newAdd.className = "addIcon";
        newAdd.src = "imgs/add.png";
        newHeader.appendChild(newSymbol);
        newHeader.appendChild(newTitle);
        newHeader.appendChild(space);
        newHeader.appendChild(newAdd);
        newHeader.appendChild(newDelete);
        newNode.appendChild(newHeader);
        this.selfElement.appendChild(newNode);
        // 创建对应的TreeNode对象并添加到子节点队列
        this.childs.push(new TreeNode({parent: this, childs: [], data: text, selfElement: newNode}));
        // 渲染自身样式
        this.render(true, false);
        return this; // 返回自身，以便链式操作
    },
    // 展开、收拢结点
    toggleFold: function () {
        if (this.isLeaf()) return this; // 叶节点，无需操作
        // 改变所有子节点的可见状态
        for (var i=0;i<this.childs.length;i++)
            this.childs[i].render(false, true);
        // 渲染本节点的箭头
        this.render(true, false);
        return this; // 返回自身，以便链式操作
    },
    // 判断是否为叶结点
    isLeaf: function(){
        return this.childs.length == 0;
    },
    // 判断结点是否处于折叠状态
    isFolded: function(){
        if(this.isLeaf()) return false; // 叶结点返回false
        if(this.childs[0].selfElement.className == "nodebody-visible") return false;
        return true;
    }
};

/*事件绑定*/
var btns = document.getElementsByTagName("button");
var result=document.getElementById("result");
var root = new TreeNode({
    parent: null,
    child: [],
    data: "前端工程师",
    selfElement: document.getElementsByClassName("nodebody-visible")[0]
})

root.search = function(text) {
    var resultList = [];
    var queue = [];
    var me = this;
    queue.push(me);
    while (queue.length > 0) {
        me = queue.shift();
        me.render(false, false, false, true);
        if (me.data == text)
            resultList.push(me);
        for (var i = 0; i < me.childs.length; i++) {  /*搜索子节点*/
            queue.push(me.childs[i]);
        }
    }
    return resultList;
}

addEventHandler(root.selfElement, "click", function(e) {
    var target = e.target || e.srcElement;
    var domNode = target;
    while (domNode.className.indexOf("nodebody") == -1)
        domNode = domNode.parentNode; // 找到类名含有nodebody前缀的DOM结点
    selectedNode = domNode.TreeNode; // 获取DOM对象对应的TreeNode对象
    // 点击节点文字或方向icon触发toggle操作
    if (target.className.indexOf("node-title") != -1 || target.className.indexOf("arrow") != -1) {
        selectedNode.toggleFold();
    } else if (target.className == "addIcon") {
        selectedNode.addChild(prompt("请输入子节点的内容："));
    } else if (target.className == "deleteIcon") {
        selectedNode.deleteNode();
    }
});

addEventHandler(btns[0], "click", function() {
    var text = document.getElementById("serchText").value.trim();
    if (text == "") {
        result.innerHTML = "请输入查询内容！";
        return;
    }
    var resultList = root.search(text);
    if (resultList.length == 0) {
       result.innerHTML = "没有查询到符合条件的结点！";
    } else {
        result.innerHTML = "查询到" + resultList.length + "个符合条件的结点";
    }
});

addEventHandler(btns[1], "click", function(){
    document.getElementById("serchText").value="";
    root.search(null);
    result.innerHTML="";
});

//动态生成Demo树
root.addChild("技术").addChild("IT公司").addChild("谈笑风生");
root.childs[0].addChild("HTML5").addChild("CSS3").addChild("JavaScript").addChild("PHP").addChild("Node.JS").toggleFold();
root.childs[0].childs[4].addChild("JavaScript").toggleFold();
root.childs[1].addChild("百度").addChild("腾讯").addChild("大众点评").toggleFold();
root.childs[2].addChild("身经百战").addChild("学习一个").addChild("吟两句诗").toggleFold();
root.childs[2].childs[2].addChild("苟利国家生死以").toggleFold();
//初始化查询Demo值
document.getElementById("serchText").value = "JavaScript";
//==================================================================================================

// 跨浏览器兼容的工具函数
function addEvent(element, type, handler) {
    if (element.addEventListener) {
        element.addEventListener(type, handler);
    }
    else if (element.attachEvent) {
        element.attachEvent("on" + type, handler);
    }
    else {
        element["on" + type] = handler;
    }
}