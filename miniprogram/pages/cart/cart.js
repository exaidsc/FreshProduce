Page({
  data:{
    cartList:[],
    allSelected:false,
    totalPrice:0
  },
  onShow(){
    //页面打开读取本地存储购物车
    const cart = wx.getStorageSync("cart")||[]
    this.setData({cartList:cart})
    this.calcTotal()
  },
  //单选
  toggleSelect(e){
    const idx = e.currentTarget.dataset.index
    let arr = this.data.cartList
    arr[idx].selected = !arr[idx].selected
    this.setData({cartList:arr})
    this.saveCart()
    this.calcTotal()
  },
  //全选
  toggleAll(){
    let all = !this.data.allSelected
    let arr = this.data.cartList.map(i=>{i.selected=all;return i})
    this.setData({cartList:arr,allSelected:all})
    this.saveCart()
    this.calcTotal()
  },
  add(e){
    const idx = e.currentTarget.dataset.index
    let arr = this.data.cartList
    arr[idx].count+=1
    this.setData({cartList:arr})
    this.saveCart()
    this.calcTotal()
  },
  minus(e){
    const idx = e.currentTarget.dataset.index
    let arr = this.data.cartList
    if(arr[idx].count>1){
      arr[idx].count-=1
      this.setData({cartList:arr})
      this.saveCart()
      this.calcTotal()
    }
  },
  delItem(e){
    const idx = e.currentTarget.dataset.index
    let arr = this.data.cartList
    arr.splice(idx,1)
    this.setData({cartList:arr})
    this.saveCart()
    this.calcTotal()
  },
  calcTotal(){
    let sum=0
    let allSel=true
    this.data.cartList.forEach(item=>{
      if(item.selected){
        sum += item.price * item.count
      }else{
        allSel=false
      }
    })
    if(this.data.cartList.length===0) allSel=false
    this.setData({totalPrice:sum,allSelected:allSel})
  },
  saveCart(){
    wx.setStorageSync("cart",this.data.cartList)
  },
  //跳转到订单确认页，把选中商品带过去
  goConfirm(){
    const selected = this.data.cartList.filter(i=>i.selected)
    if(selected.length===0){
      return wx.showToast({title:"请选择商品",icon:"none"})
    }
    wx.setStorageSync("orderTemp",selected)
    wx.navigateTo({url:"/pages/orderConfirm/orderConfirm"})
  }
})
