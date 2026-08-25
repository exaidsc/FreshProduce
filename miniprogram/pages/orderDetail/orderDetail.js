Page({
  data:{info:null},
  onLoad(options){
    const oid = options.orderId
    const orders = wx.getStorageSync("orderList")||[]
    const res = orders.find(o=>o.orderId===oid)
    this.setData({info:res})
  }
})
