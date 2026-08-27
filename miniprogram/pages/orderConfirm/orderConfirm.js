Page({
  data:{
    orderTemp:[],
    payTotal:0
  },
  onLoad(){
    const temp = wx.getStorageSync("orderTemp")||[]
    let total = 0
    temp.forEach(i=>total+=i.price*i.count)
    this.setData({orderTemp:temp,payTotal:total})
  },
  submitOrder(){
    //生成订单
    const temp = this.data.orderTemp
    const orderList = wx.getStorageSync("orderList")||[]
    const newOrder = {
      orderId:"ORD"+Date.now(),
      createTime:new Date().toLocaleString(),
      goods:temp,
      totalMoney:this.data.payTotal,
      status:0 //0待付款，1已完成
    }
    orderList.unshift(newOrder)
    wx.setStorageSync("orderList",orderList)

    //把已经下单的商品从购物车删掉
    let cart = wx.getStorageSync("cart")||[]
    const selectIds = temp.map(i=>i.id)
    cart = cart.filter(i=>!selectIds.includes(i.id))
    wx.setStorageSync("cart",cart)

    wx.showToast({title:"下单成功"})
    setTimeout(()=>{
      wx.redirectTo({url:"/pages/orderList/orderList"})
    },1000)
  }
})
