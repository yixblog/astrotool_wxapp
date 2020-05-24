App({
  onLaunch: function () {
    let thisApp = this;
    this.checkAuth(function () {
      thisApp.loadRoots();
    });
  },
  checkAuth(completeCallback) {
    let thisApp = this;
    if (!this.authToken) {
      wx.login({
        success: (res) => {
          let code = res.code;
          console.log('[v2]auth code:' + code);
          wx.request({
            url: thisApp.globalData.host + '/auth/wxapp/login', // 目标服务器url
            method: 'POST',
            header: {
              'Content-Type': 'application/json',
              'X-App-Version': 'v2'
            },
            data: {
              code: code
            },
            success: (res) => {
              thisApp.globalData.authToken = res.data.token;
              if (typeof completeCallback == 'function') {
                completeCallback();
              }

            },
            fail: (res) => {
              wx.showModal({
                content: '服务暂不可用，请联系开发者'
              })
            }
          });
        },
      });
    }
  },
  applyRelWithAuth(representation, requestObj) {
    let thisApp = this;
    if (!requestObj.rel) {
      wx.showModal({
        title: 'Error',
        content: 'rel not provided',
      });
      wx.hideLoading();
      return;
    }
    if (!representation._links[requestObj.rel]) {
      wx.showModal({
        title: 'Error',
        content: 'rel ' + requestObj.rel + ' not found',
      });
      wx.hideLoading();
      return;
    }
    let url = representation._links[requestObj.rel].href;
    if (requestObj.query) {
      for (let k in requestObj.query) {
        if (requestObj.query[k] != null) {
          url = url + (url.indexOf('?') > 0 ? '&' : '?') + k + '=' + requestObj.query[k]
        }
      }
    }
    requestObj.url = url;
    requestObj.header = requestObj.header || {};
    requestObj.header['x-auth-token'] = thisApp.globalData.authToken;
    requestObj.header['x-app-version'] = 'v2';
    requestObj.fail = (res) => {
      if (res.status == 401) {
        thisApp.checkAuth(() => {
          thisApp.requestWithAuth(requestObj);
        })
      } else {
        if (res.data) {
          wx.showModal({
            title: res.data.error_code,
            content: res.data.message
          });
        } else {
          wx.showModal({
            title: 'HTTP ERROR',
            content: '网络错误:' + res.status
          })
        }

      }
    };
    wx.request(requestObj);
  },
  requestWithAuth(requestObj, ignoreRoots) {
    let thisApp = this;

    function process() {
      if (requestObj.rootRel) {
        requestObj.url = thisApp.globalData.rootLinks[requestObj.rootRel].href;
      }
      let originFail = requestObj.fail;
      requestObj.header = requestObj.header || {};
      requestObj.header['x-auth-token'] = thisApp.globalData.authToken;
      requestObj.header['x-app-version'] = 'v2';
      requestObj.fail = (res) => {
        if (res.status == 401) {
          thisApp.checkAuth(() => {
            thisApp.requestWithAuth(requestObj);
          })
        } else {
          if (originFail) {
            originFail(res);
            return;
          }
          if (res.data) {
            wx.showModal({
              title: res.data.error_code,
              content: res.data.message
            });
          } else {
            wx.showModal({
              title: 'HTTP ERROR',
              content: '网络错误:' + res.status
            })
          }

        }
      };
      wx.request(requestObj);
    }
    if (this.globalData.authToken && (ignoreRoots || Object.keys(this.globalData.rootLinks).length)) {
      process()
    } else {
      this.globalData.authPromise.push(process);
    }
  },
  loadRoots() {
    let thisApp = this;
    this.requestWithAuth({
      url: thisApp.globalData.host,
      method: 'GET',
      success: (res) => {
        thisApp.globalData.rootLinks = res.data._links;
        for (let prom of thisApp.globalData.authPromise) {
          prom()
        }
        thisApp.globalData.authPromise = [];
      }
    }, true)
  },
  loadMyLocations(shareFlag, locationId, locationsCallback) {
    let thisApp = this;
    this.requestWithAuth({
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
        thisApp.globalData.locations = locations;
        if (typeof locationsCallback === 'function') {
          locationsCallback(res);
        }
      }
    })
  },
  globalData: {
    host: "https://miniapp.yixastro.com",
    authPromise: [],
    rootLinks: {}
  }
})