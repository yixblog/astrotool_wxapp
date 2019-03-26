// pages/locations/locations.js
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    showLocationMenu: false
  },
  links: {},

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    let pageThis = this;
    app.requestWithAuth({
      url: app.globalData.rootLinks.locations.href,
      method: 'GET',
      success: (res) => {
        let locations = res.data.locations;
        for (let location of locations) {
          let longitudeSymbol = location.longitude > 0 ? 'E' : 'W';
          let latitudeSymbol = location.latitude > 0 ? 'N' : 'S';
          location.position = location.longitude.toFixed(4) + longitudeSymbol + ',' + location.latitude.toFixed(4) + latitudeSymbol;
          location.arrow = true;
        }
        pageThis.setData({
          locations: locations,
          showLocationMenu: false
        });
        for (let link of res.data.links) {
          pageThis.links[link.rel] = link;
        }
      }
    })
  },
  displayNavOperations(env) {
    console.debug('list item clicked', env);
    let clickedLocation = this.data.locations[env.index];
    let map = {
      longitude: clickedLocation.longitude,
      latitude: clickedLocation.latitude,
      scale: 14,
      markers: [{
        id: clickedLocation.location_id,
        longitude: clickedLocation.longitude,
        latitude: clickedLocation.latitude,
        iconPath: '/images/icon-location.png'
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
    clickedLocation.editname = false;
    this.setData({
      map: map,
      showLocationMenu: true,
      activeLocation: clickedLocation
    });

  },
  editNameClick() {
    this.setData({
      'activeLocation.editname': true
    })
  },
  quitEditName() {
    this.setData({
      'activeLocation.editname': false
    })
  },
  addLocation() {
    let thisPage = this;
    wx.chooseLocation({
      success: (res) => {
        app.requestWithAuth({
          url: thisPage.links.add_location.href,
          method: 'POST',
          contentType: 'application/json',
          data: res,
          success: () => thisPage.onLoad()
        })
      }
    })
  },
  closeLocationMenu() {
    this.setData({
      showLocationMenu: false
    });
  },
  openSevenTimer() {
    let lnks = this.data.activeLocation.links.filter(lnkItem => lnkItem.rel === '7timer');
    if (!lnks.length) {
      return;
    }
    let thisPage = this;
    let lnk = lnks[0];
    wx.navigateTo({
      url: '/pages/seventimer/seventimer?lnk=' + encodeURIComponent(lnk.href) + '&name=' + this.data.activeLocation.name,
      complete: () => {
        thisPage.closeLocationMenu();
      }
    })
  },
  deleteLocation() {
    let lnks = this.data.activeLocation.links.filter(lnkItem => lnkItem.rel === 'del');
    if (!lnks.length) {
      return;
    }
    let lnk = lnks[0];
    let pageThis = this;
    wx.showModal({
      title: '警告',
      content: '删除地点后无法找回，只能重新添加，确认继续？',
      success: res => {
        if (res.confirm) {
          app.requestWithAuth({
            url: lnk.href,
            method: 'POST',
            success: res => pageThis.onLoad()
          })
        }
      }
    })

  },
  submitNewName(evt) {
    let lnks = this.data.activeLocation.links.filter(lnkItem => lnkItem.rel === 'editname');
    if (!lnks.length) {
      return;
    }
    let newName = evt.detail.value;
    if (!newName.length) {
      wx.showModal({
        content: '新名称不能为空'
      });
      return;
    }
    let lnk = lnks[0];
    let pageThis = this;
    app.requestWithAuth({
      url: lnk.href,
      method: 'POST',
      contentType: 'application/json',
      data: {
        name: newName
      },
      success: (res) => {
        pageThis.setData({
          'activeLocation.name': newName
        })
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
    this.onLoad()
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