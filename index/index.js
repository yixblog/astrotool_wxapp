const app = getApp()
import uCharts from '../utils/u-charts.min.js';
let hourlyChart;
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
    },
    locationStore: {
      show: false,
      actions: [{
          text: '复制为我的地点（可修改）',
          value: 'COPY'
        },
        {
          text: '收藏为我的地点（无法修改，可同步对方修改）',
          value: 'LIKE'
        }
      ]
    }
  },
  onShareAppMessage() {
    if (app.globalData.currentLocation == null) {

      return {
        title: '佚仙天文',
        path: '/index/index'
      };
    }
    return {
      title: app.globalData.currentLocation.name + ' 天气情况',
      path: '/index/index?location_id=' + app.globalData.currentLocation.location_id
    }
  },
  onLoad(query) {
    let pageThis = this;

    this.cWidth = wx.getSystemInfoSync().windowWidth;
    this.cHeight = 240;
    if (query.scene) {
      const scene = decodeURIComponent(query.scene);
      app.requestWithAuth({
        rootRel: 'util_convert_uuid',
        method: 'GET',
        query: {
          scene: scene
        },
        success: res => pageThis.loadMyLocations(res.data.uuid, true)
      })
    } else if (query.location_id) {
      this.loadMyLocations(query.location_id, true);
    } else {
      this.loadMyLocations();
    }

  },
  loadMyLocations(locationId, shareFlag) {
    let pageThis = this;
    app.loadMyLocations(locationId, shareFlag, res => {
      let locations = app.globalData.locations;
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
    });
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
    app.globalData.currentLocation = location;
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
    app.applyRelWithAuth(location, {
      rel: 'heweather_hourly',
      method: 'GET',
      success: res => {
        console.info('hourly', res.data);
        pageThis.initHourlyChart(res.data);
      }
    })
  },
  initHourlyChart(data) {
    let hourlyArr = data.hourly;
    this.setData({
      hourly: hourlyArr
    });
    let thisPage = this;
    let minTemp = Math.round(Math.min(...hourlyArr.map(dt => parseInt(dt.tmp))) * 0.8);
    let maxTemp = Math.round(Math.max(...hourlyArr.map(dt => parseInt(dt.tmp))) * 1.2);
    if (maxTemp - minTemp < 15) {
      minTemp = maxTemp - 15;
    }
    let chartObj = {
      $this: thisPage,
      canvasId: 'hourlyChart',
      background: '#333',
      legend: {
        show: true,
        fontColor: '#fff'
      },
      title: {
        name: '小时预报'
      },
      type: 'mix',
      fontSize: 11,
      pixelRatio: 1,
      dataLabel: true,
      animation: true,
      enableScroll: true,
      categories: hourlyArr.map(dt => dt.time.substring(11)),
      series: [{
          name: '温度',
          type: 'line',
          style: 'curve',
          color: '#f00',
          textColor: '#f00',
          index: 0,
          data: hourlyArr.map(dt => parseInt(dt.tmp)),
          format: val => val + '℃'
        },
        {
          name: '湿度',
          type: 'line',
          style: 'curve',
          color: '#0Ff',
          textColor: '#0FF',
          index: 1,
          data: hourlyArr.map(dt => parseInt(dt.hum)),
          format: val => val + '%'
        },
        {
          name: '云量',
          type: 'area',
          style: 'curve',
          color: '#fff',
          index: 1,
          data: hourlyArr.map(dt => parseInt(dt.cloud)),
          format: val => val + '%'
        },
        {
          name: '降水概率',
          type: 'column',
          index: 1,
          data: hourlyArr.map(dt => parseInt(dt.pop)),
          format: val => val + '%'
        }
      ],
      xAxis: {
        disableGrid: true,
        type: 'grid',
        gridType: 'dash',
        itemCount: 4,
        scrollShow: true,
        scrollAlign: 'left',
        boundaryGap: 'justify'
      },
      yAxis: {
        showTitle: true,
        data: [{
            position: 'left',
            axisLine: true,
            title: '℃',
            min: minTemp,
            max: maxTemp
          },
          {
            position: 'right',
            axisLine: true,
            title: '%',
            min: 0,
            max: 100
          }
        ]
      },
      width: thisPage.cWidth,
      height: thisPage.cHeight,
      extra: {
        column: {
          width: 25
        },
        tooltip: {
          bgColor: '#000000',
          bgOpacity: 0.7,
          gridType: 'dash',
          dashLength: 8,
          gridColor: '#1890ff',
          fontColor: '#FFFFFF',
          horizentalLine: false,
          xAxisLabel: false,
          yAxisLabel: true,
          labelBgColor: '#DFE8FF',
          labelBgOpacity: 0.95,
          labelAlign: 'left',
          labelFontColor: '#666666'
        }
      }
    };
    console.info('chart', chartObj)
    hourlyChart = new uCharts(chartObj)
  },
  openObservatory() {
    wx.navigateTo({
      url: '/pages/observatory/observatory',
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
          success: (resp) => {
            thisPage.loadMyLocations(resp.data.location_id);
          }
        })
      }
    })
  },
  saveToMyLocation() {
    this.setData({
      'locationStore.show': true
    })
  },
  viewStoreLocation(e) {
    if (e.detail.value) {
      ap.applyRelWithAuth(this.data.currentLocation, {
        rel: 'save',
        method: 'POST',
        data: {
          mode: e.detail.value
        },
        success: res => pageThis.loadMyLocations(this.data.currentLocation.location_id)
      })
    }
  },
  openSevenTimer() {
    let lnk = this.data.currentLocation._links['7timer'];
    if (lnk === null) {
      return;
    }
    wx.navigateTo({
      url: '/pages/seventimer/seventimer'
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
  touchMoveChart(e) {
    if (hourlyChart) {
      hourlyChart.scroll(e)
    }
  },
  touchChart(e) {
    if (hourlyChart) {
      hourlyChart.scrollStart(e)
    }
  },
  touchChartEnd(e) {
    if (hourlyChart) {
      hourlyChart.scrollEnd(e);
      hourlyChart.showToolTip(e, {
        format: function (item, cat) {
          return cat + ' ' + item.name + ':' + item.data;
        }
      });
    }
  },
  showShareQQImg() {
    wx.previewImage({
      urls: [this.data.currentLocation._links.share_qq.href],
    })
  },
})