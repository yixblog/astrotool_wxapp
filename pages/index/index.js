//index.js
//获取应用实例
const app = getApp()

Page({
  onLoad: function() {
    app.requestWithAuth({
      url: app.globalData.host,
      method: 'GET',
      success: (res) => {
        for (let link of res.data.links) {
          app.globalData.rootLinks[link.rel] = link;
        }
        if (app.globalData.rootLinks.locations) {
          wx.redirectTo({
            url: '/pages/locations/locations'
          });
        }
      }
    })
  }
})