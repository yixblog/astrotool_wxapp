const app = getApp();
// pages/shared_locations/shared_locations.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    showLocationMenu: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.loadSharingLocations(options.lat, options.lon)
  },
  loadSharingLocations(lat, lon) {
    let thisPage = this;
    app.requestWithAuth({
      url: app.globalData.rootLinks.shared_locations.href,
      data: {
        lat: lat,
        lon: lon
      },
      method: 'GET',
      success: data => {
        let sharedLocations = data.data.locations;
        for(let locate of sharedLocations){
          locate.distance_str = (locate.distance>0?(locate.distance/1000).toFixed(3):'')
        }
        thisPage.setData({
          shared_locations: sharedLocations
        })
      }
    })
  },
  closeLocationMenu() {
    this.setData({
      showLocationMenu: false
    });
  },
  displayNavOperations(env) {
    console.debug('list item clicked', env);
    let clickedLocationId = env.detail.itemid;
    let clickedLocation = this.data.shared_locations.filter(locate => locate.locationId === clickedLocationId)[0];
    let map = {
      longitude: clickedLocation.longitude,
      latitude: clickedLocation.latitude,
      scale: 14,
      markers: [{
        id: clickedLocation.location_id,
        longitude: clickedLocation.longitude,
        latitude: clickedLocation.latitude,
        iconPath: 'https://images-1258557364.cos-website.ap-beijing.myqcloud.com/miniapp/images/icon-location.png'
      }],
      setting: {
        gestureEnable: 1,
        showScale: 1,
        showCompass: 1,
        tiltGesturesEnabled: 0,
        trafficEnabled: 0,
        showMapText: 1
      }
    }
    this.setData({
      map: map,
      showLocationMenu: true,
      activeLocation: clickedLocation
    });

  },
  addMyLocation() {
    let lnks = this.data.activeLocation.links.filter(lnkItem => lnkItem.rel === 'add_from');
    if (!lnks.length) {
      return;
    }
    let lnk = lnks[0];
    app.requestWithAuth({
      url: lnk.href,
      method: 'POST',
      success: res => {
        wx.showModal({
          title: '添加成功',
          content: '添加共享地理位置成功，返回后请点击刷新加载'
        });
        wx.navigateBack({

        });
      }
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})