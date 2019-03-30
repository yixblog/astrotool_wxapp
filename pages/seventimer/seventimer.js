const app = getApp();
const rhInfo = {
  '-4': { content: '0%-5%', level: 0 },
  '-3': { content: '5%-10%', level: 0 },
  '-2': { content: '10%-15%', level: 0 },
  '-1': { content: '15%-20%', level: 0 },
  '0': { content: '20%-25%', level: 0 },
  '1': { content: '25%-30%', level: 0 },
  '2': { content: '30%-35%', level: 0 },
  '3': { content: '35%-40%', level: 0 },
  '4': { content: '40%-45%', level: 0 },
  '5': { content: '45%-50%', level: 0 },
  '6': { content: '50%-55%', level: 0 },
  '7': { content: '55%-60%', level: 0 },
  '8': { content: '60%-65%', level: 0 },
  '9': { content: '65%-70%', level: 0 },
  '10': { content: '70%-75%', level: 0 },
  '11': { content: '75%-80%', level: 0 },
  '12': { content: '80%-85%', level: 1 },
  '13': { content: '85%-90%', level: 1 },
  '14': { content: '90%-95%', level: 2 },
  '15': { content: '95%-99%', level: 3 },
  '16': { content: '100%', level: 3 }
};
const weeks = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
// pages/seventimer/seventimer.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    tabs: [
      { title: '天文' },
      { title: '民用' },
      { title: '两周预报' }
    ],
    activeTab: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let url = decodeURIComponent(options.lnk);
    this.setData({
      title: '晴天钟:' + options.name,
      loading: true
    });
    app.requestWithAuth({
      url: url,
      method: 'GET',
      success: (res) => {
        console.log('received response', res);
        let twoData = this.timepointSplit(res.data.two);
        twoData.dates.forEach(dateitem => {
          dateitem.temp2m = {
            min: dateitem.series.filter(serie => !serie.nodata).map(serie => serie.rh2m.min).reduce((a, b) => Math.min(a, b)),
            max: dateitem.series.filter(serie => !serie.nodata).map(serie => serie.rh2m.max).reduce((a, b) => Math.max(a, b))
          };
          let rhContents = dateitem.series.map(serie => serie.rhContent).filter(ctx => ctx != null);
          if (rhContents.length == 1) {
            dateitem.rhContent = rhContents[0];
          } else {
            let flatMap = (a, mapFun) => [].concat(...a.map(mapFun));
            let rhValues = flatMap(rhContents, t => t.split('-')).map(rh => parseInt(rh.replace('%', '')));
            let minRh = rhValues.reduce((a, b) => Math.min(a, b));
            let maxRh = rhValues.reduce((a, b) => Math.max(a, b));
            dateitem.rhContent = minRh + '%-' + maxRh + '%'
          }
        })
        this.setData({
          astro: this.timepointSplit(res.data.astro),
          civil: this.timepointSplit(res.data.civil),
          two: twoData,
          loading: false
        });
        console.log('page data', this.data);
      }
    })
  },
  switchTab(evt) {
    this.setData({
      activeTab: evt.target.dataset.index
    })
  },

  timepointSplit(data) {
    let pageThis = this;
    try {
      let initTime = new Date(data.init_time);
      function addZero(num) {
        return ('00' + num).substr(-2);
      }

      data.dataseries.forEach(serie => {
        let serieDate = new Date(new Date(initTime).setHours(initTime.getHours() + serie.timepoint));
        serie.dailyHour = serieDate.getHours();
        serie.dateString = serieDate.toLocaleDateString();
        let rhContent = rhInfo[serie.rh2m + ''];
        serie.tempColor = pageThis.tempColor(serie.temp2m)
        serie.rhLevel = rhContent == null ? 0 : rhContent.level;
        serie.rhContent = rhContent == null ? '' : rhContent.content;
        serie.wind10m.level = serie.wind10m.speed < 4 ? 0 :
          serie.wind10m.speed == 4 ? 1 :
            serie.wind10m.speed == 5 ? 2 : 3;
        serie.liftLevel = 0;
        if (serie.lifted_index <= -1) {
          serie.liftLevel = 1;
        }
        if (serie.lifted_index <= -4) {
          serie.liftLevel = 2;
        }
        if (serie.lifted_index <= -6) {
          serie.liftLevel = 3;
        }
        if (serie.weather) {
          serie.weatherType = serie.weather.replace(/(day)|(night)$/, '');
          serie.weatherTime = serie.weather.endsWith('day') ? 'day' : 'night';
        }
      });
      let hours = data.dataseries.map(serie => serie.dailyHour).filter((val, index, self) => self.indexOf(val) === index).sort((a, b) => a - b);
      let dates = data.dataseries.map(serie => serie.dateString).filter((val, index, self) => self.indexOf(val) === index).sort((a, b) => new Date(a) - new Date(b));

      let info = { init_time: initTime.toLocaleString(), dates: [], hourColumns: hours };
      for (let datestr of dates) {
        let dt = new Date(datestr);
        let dateStringShort = addZero(dt.getMonth() + 1) + '-' + addZero(dt.getDate());
        let dateRow = { series: [], date: datestr, shortdate: dateStringShort, weekday: weeks[dt.getDay()] };
        for (let hour of hours) {
          let result = data.dataseries.filter(serie => serie.dailyHour === hour && serie.dateString === datestr);
          if (result.length) {
            dateRow.series.push(result[0])
          } else {
            dateRow.series.push({ nodata: true })
          }
        }
        info.dates.push(dateRow)
      }

      return info;
    } catch (e) {
      console.log('error happened:', e)
    }
  },
  tempColor(temp) {
    temp = parseInt(temp);
    const redpoint = 30;
    const greenpoint = 15;
    const bluepoint = 0;
    if (temp >= redpoint) {
      return '#f00';
    } else if (temp >= greenpoint && temp < redpoint) {
      let red = Math.floor(255 * (temp - greenpoint) / 15);
      let green = 255 - red;
      return 'rgb(' + red + ',' + green + ',0)';
    } else if (temp >= bluepoint && temp < greenpoint) {
      let blue = 255 - Math.floor(255 * (temp - bluepoint) / 15);
      return 'rgb(0,255,' + blue + ')';
    } else {
      return '#0ff';
    }
  },
  swiperChanged(evt) {
    this.setData({
      activeTab: evt.detail.current
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})