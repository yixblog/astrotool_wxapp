const app = getApp()

Page({
  data: {
    modifyDialog: {
      show: false
    },
    locationChoose: {
      show: false
    },
    deleteDialog: {
      show: false
    }
  },
  onShareAppMessage() {
    if (this.data.currentLocation == null) {

      return {
        title: '佚仙天文',
        path: '/index'
      };
    }
    return {
      title: this.data.currentLocation.name + ' 天气情况',
      path: '/index?location_id=' + this.data.currentLocation.location_id
    }
  },
  onLoad: function(query) {
    if (query.location_id) {
      this.loadMyLocations(query.location_id, true);
    } else {
      this.loadMyLocations();
    }

  },
  loadMyLocations(locationId, shareFlag) {
    let pageThis = this;
    app.requestWithAuth({
      rootRel: 'locations',
      method: 'GET',
      query: {
        addition_location_id: shareFlag ? locationId : null
      },
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
          'locationChoose.actions': locations.map(l => {
            return {
              text: l.name + '[' + l.position + ']',
              value: l.location_id
            }
          })
        });
        pageThis.links = res.data._links;
        if (locations.length) {
          let chosenLocation = null;
          if (locationId != null) {
            let chosenLocations = locations.filter(l => l.location_id === locationId);
            if (chosenLocations.length > 0) {
              chosenLocation = chosenLocations[0];
            }
          }
          if (chosenLocation === null) {
            let defaultLocations = locations.filter(l => l.default_flag);
            chosenLocation = defaultLocations.length > 0 ? defaultLocations[0] : locations[0];
          }
          pageThis.chooseLocation(chosenLocation);
        } else {
          pageThis.addLocation();
        }
      }
    })
  },
  viewChooseLocation(e) {
    if (e.detail.value) {
      this.setData({
        'locationChoose.show': false
      })
      let locs = this.data.locations.filter(l => l.location_id === e.detail.value);
      if (locs.length) {
        this.chooseLocation(locs[0]);
      } else {
        wx.showModal({
          title: 'Error',
          content: '不存在的地点',
        })
      }
    }
  },
  showChooseLocation() {
    this.setData({
      'locationChoose.show': true
    })
  },
  chooseLocation(location) {
    let pageThis = this;
    wx.showLoading({
      title: 'Loading Weather',
    });
    wx.setNavigationBarTitle({
      title: location.name,
    });
    pageThis.setData({
      currentLocation: location,
      map: {
        longitude: location.longitude,
        latitude: location.latitude,
        scale: 14,
        markers: [{
          id: location.location_id,
          longitude: location.longitude,
          latitude: location.latitude,
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
    });
    app.applyRelWithAuth(location, {
      rel: 'heweather_now',
      method: 'GET',
      success: (res) => {
        console.info('now', res);
        pageThis.setData({
          now: res.data.now
        });
        wx.hideLoading();
      }
    });
    app.applyRelWithAuth(location, {
      rel: 'heweather_daily',
      method: 'GET',
      success: (res) => {
        console.info('daily', res);
        pageThis.setData({
          daily: res.data.normal_daily
        });
        wx.hideLoading();
      }
    });
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
          success: (resp) => {
            thisPage.loadMyLocations(resp.data.location_id);
          }
        })
      }
    })
  },
  saveToMyLocation() {
    let pageThis = this;
    ap.applyRelWithAuth(this.data.currentLocation, {
      rel: 'save',
      method: 'POST',
      success: res => pageThis.loadMyLocations(this.data.currentLocation.location_id)
    })
  },
  openSevenTimer() {
    let lnk = this.data.currentLocation._links['7timer'];
    if (lnk === null) {
      return;
    }
    let thisPage = this;
    wx.navigateTo({
      url: '/pages/seventimer/seventimer?lnk=' + encodeURIComponent(lnk.href) + '&name=' + this.data.currentLocation.name
    })
  },
  showConfirmDelete() {
    this.setData({
      'deleteDialog.show': true
    })
  },

  confirmDelete(e) {
    this.setData({
      'deleteDialog.show': false
    });
    if (e.detail.index === 1) {

      let pageThis = this;
      app.applyRelWithAuth(this.data.currentLocation, {
        rel: 'del',
        method: 'DELETE',
        success: res => pageThis.loadMyLocations()
      })
    }
  },
  markDefault() {
    let pageThis = this;
    app.applyRelWithAuth(this.data.currentLocation, {
      rel: 'set_default',
      method: 'PUT',
      success: res => pageThis.loadMyLocations(pageThis.data.currentLocation.location_id)
    })
  },
  showModifyNameDialog() {
    this.setData({
      modifyDialog: {
        show: true
      }
    })
  },
  modifyCacheInputName(e) {
    this.setData({
      'modifyDialog.name': e.detail.value
    })
  },
  commitModifyName(e) {
    if (e.detail.index == 1) {
      let newName = this.data.modifyDialog.name;
      if (!newName) {
        this.setData({
          'modifyDialog.error': '新名称不能为空'
        });
        return;
      }
      let pageThis = this;
      app.applyRelWithAuth(pageThis.data.currentLocation, {
        rel: 'editname',
        method: 'PUT',
        data: {
          name: newName
        },
        success: res => {
          pageThis.setData({
            modifyDialog: {
              show: false
            }
          })
          pageThis.loadMyLocations(pageThis.data.currentLocation.location_id);
        },
        fail: res => {
          this.setData({
            'modifyDialog.error': res.data.message
          });
        }
      });

    } else {
      pageThis.setData({
        modifyDialog: {
          show: false
        }
      })
    }
  },
})