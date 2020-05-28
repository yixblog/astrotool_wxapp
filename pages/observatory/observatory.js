// pages/observatory/observatory.js
const app = getApp()
import uCharts from '../../utils/u-charts.min.js';
let historyChart;
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.cWidth = wx.getSystemInfoSync().windowWidth;
    this.cHeight = 240;
    this.updateStatus()
  },
  updateStatus() {
    let thisPage = this;
    app.applyRelWithAuth(app.globalData.currentLocation, {
      rel: 'observatory_status',
      method: 'GET',
      success: res => {
        let dt = res.data;
        dt.location_id = app.globalData.currentLocation.location_id;
        if (dt.current) {
          let tzoffset = (new Date()).getTimezoneOffset() * 60000;
          dt.current.record_time_str = new Date(dt.current.record_time - tzoffset).toISOString().replace(/[TZ]/g,' ').trim();
        }
        thisPage.setData({
          observatory: dt
        });
        if (res.data.lives && res.data.lives.length) {
          thisPage.setData({
            currentLive: res.data.lives[0]
          })
        }
        if (res.data.logs && res.data.logs.length) {
          thisPage.initHistoryChart(res.data.logs)
        }
      }
    })
  },
  switchLiveView(e) {
    console.log(e);
    let id = e.target.dataset.itemId;
    if (id !== this.data.currentLive.live_id) {
      let live = this.data.observatory.lives.filter(live => live.live_id === id)[0];
      if (live) {
        this.setData({
          currentLive: live
        })
      }
    }
  },
  initHistoryChart(hourlyArr) {
    let thisPage = this;
    let tzoffset = (new Date()).getTimezoneOffset() * 60000;
    let chartObj = {
      $this: thisPage,
      canvasId: 'historyWeather',
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
      categories: hourlyArr.map(dt => new Date(dt.record_time - tzoffset).toISOString().substring(11, 19)),
      series: [{
          name: '温度',
          type: 'line',
          style: 'curve',
          color: '#f00',
          textColor: '#f00',
          index: 0,
          data: hourlyArr.map(dt => dt.temperature),
          format: val => val + '℃'
        },
        {
          name: '湿度',
          type: 'line',
          style: 'curve',
          color: '#0Ff',
          textColor: '#0FF',
          index: 1,
          data: hourlyArr.map(dt => dt.humidity),
          format: val => val + '%'
        },
        {
          name: '风速',
          type: 'line',
          style: 'curve',
          color: '#fff',
          index: 2,
          data: hourlyArr.map(dt => dt.wind_spd),
          format: val => val + 'm/s'
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
            min: Math.min(...hourlyArr.map(dt => dt.temperature)) * 0.8,
            max: Math.max(...hourlyArr.map(dt => dt.temperature)) * 1.2 + 1
          },
          {
            position: 'right',
            axisLine: true,
            title: '%',
            min: 0,
            max: 100
          },
          {
            disabled: true,
            min: Math.min(...hourlyArr.map(dt => dt.wind_spd)) * 0.8,
            max: Math.max(...hourlyArr.map(dt => dt.wind_spd)) * 1.2 + 1
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
    historyChart = new uCharts(chartObj)
  },
  copyApiKey() {
    wx.setClipboardData({
      data: 'locationId: ' + app.globalData.currentLocation.location_id + '\r\napikey: ' + this.data.observatory.api_key,
      success(res) {
        wx.getClipboardData({
          success(res) {
            wx.showToast({
              title: '已复制到剪切板',
            })
          }
        })
      }
    })
  },
  refreshApiKey() {
    let pageThis = this;
    wx.showModal({
      title: '确认操作',
      content: '当前操作会导致旧api key立刻失效',
      success(res) {
        if (res.confirm) {
          app.applyRelWithAuth(app.globalData.currentLocation, {
            rel: 'refresh_apikey',
            method: 'PUT',
            success: res => pageThis.updateStatus()
          })
        }
      }
    })
  },

  /**
   * 用户点击右上角分享
   */
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
  touchMoveChart(e) {
    if (historyChart) {
      historyChart.scroll(e)
    }
  },
  touchChart(e) {
    if (historyChart) {
      historyChart.scrollStart(e)
    }
  },
  touchChartEnd(e) {
    if (historyChart) {
      historyChart.scrollEnd(e);
      historyChart.showToolTip(e, {
        format: function (item, cat) {
          return cat + ' ' + item.name + ':' + item.data;
        }
      });
    }
  }
})