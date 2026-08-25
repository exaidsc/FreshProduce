Page({
  data:{orderList:[]},
  onShow(){
    const list = wx.getStorageSync("orderList")||[]
    this.setData({orderList:list})
  },
  goDetail(e){
    const oid = e.currentTarget.dataset.id
    wx.navigateTo({url:`/pages/orderDetail/orderDetail?orderId=${oid}`})
  }
})
