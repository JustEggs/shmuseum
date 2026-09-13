// main.js
// 根据 data.js 渲染页面，不硬编码内容

// 容器
var headerEl = document.getElementById("site-header");
var searchBarEl = document.getElementById("search-bar");
var mainEl = document.getElementById("site-main");
var footerEl = document.getElementById("site-footer");

// ========== 工具函数 ==========
function getQueryParam(name) {
  var search = window.location.search.substring(1);
  if (search === "") return null;
  var pairs = search.split("&");
  for (var i = 0; i < pairs.length; i++) {
    var kv = pairs[i].split("=");
    if (decodeURIComponent(kv[0]) === name) {
      return decodeURIComponent(kv[1] || "");
    }
  }
  return null;
}

function getPageName() {
  var path = window.location.pathname;
  var fileName = path.substring(path.lastIndexOf("/") + 1);
  if (fileName === "" || fileName === "index.html") return "index";
  if (fileName === "search.html") return "search";
  if (fileName === "notice.html") return "notice";
  if (fileName === "exhibition.html") return "exhibition";
  return "index";
}

function formatDate(ts) {
  var d = new Date(ts);
  var y = d.getFullYear();
  var m = d.getMonth() + 1;
  var day = d.getDate();
  if (m < 10) m = "0" + m;
  if (day < 10) day = "0" + day;
  return y + "-" + m + "-" + day;
}

// ========== localStorage 初始化（按天计数） ==========
function initLocalStorage() {
  if (localStorage.getItem("firstVisitTime") === null) {
    localStorage.setItem("firstVisitTime", String(new Date().getTime()));
  }

  var today = formatDate(new Date().getTime());
  var lastDate = localStorage.getItem("lastVisitDate");
  if (lastDate === null) {
    localStorage.setItem("visitExtraCount", "1");
    localStorage.setItem("lastVisitDate", today);
  } else if (lastDate !== today) {
    var extra = parseInt(localStorage.getItem("visitExtraCount") || "0", 10);
    localStorage.setItem("visitExtraCount", String(extra + 1));
    localStorage.setItem("lastVisitDate", today);
  }
}

function getVisitorCount() {
  var base = siteData.visitorCountBase || 100000;
  var extra = parseInt(localStorage.getItem("visitExtraCount") || "0", 10);
  return base + extra;
}

function getFirstVisitDate() {
  var ts = localStorage.getItem("firstVisitTime");
  if (ts === null) return "";
  return formatDate(parseInt(ts, 10));
}

// ========== 历史记录 ==========
function addToHistory(key, id) {
  var list = [];
  var stored = localStorage.getItem(key);
  if (stored !== null) {
    try {
      var parsed = JSON.parse(stored);
      if (parsed instanceof Array) list = parsed;
    } catch (e) {
      list = [];
    }
  }
  var idx = list.indexOf(id);
  if (idx !== -1) list.splice(idx, 1);
  list.unshift(id);
  if (list.length > 10) list.length = 10;
  localStorage.setItem(key, JSON.stringify(list));
}

function getHistoryFirst(key) {
  var stored = localStorage.getItem(key);
  if (stored === null) return null;
  try {
    var parsed = JSON.parse(stored);
    if (parsed instanceof Array && parsed.length > 0) return parsed[0];
  } catch (e) {}
  return null;
}

// ========== 渲染顶部导航 ==========
function renderHeader() {
  var html = '';
  html += '<div class="header-top">';
  html += '<div class="logo-area">';
  html += '<img src="' + siteData.logoImg + '" alt="logo" class="logo-img">';
  html += '<div class="site-name">';
  html += '<span class="cn-name">' + siteData.siteName + '</span>';
  html += '<span class="en-name">' + siteData.siteNameEn + '</span>';
  html += '</div>';
  html += '</div>';
  html += '<div class="nav-area">';
  html += '<ul class="nav-list">';

  var pageName = getPageName();
  var currentUrl = "";
  if (pageName === "index") currentUrl = "index.html";
  else if (pageName === "exhibition") currentUrl = "exhibition.html";
  else if (pageName === "notice") currentUrl = "notice.html";

  for (var i = 0; i < siteData.menu.length; i++) {
    var item = siteData.menu[i];
    var currentClass = '';
    if (currentUrl !== "" && item.url === currentUrl) {
      currentClass = ' class="current"';
    }
    html += '<li><a href="' + item.url + '"' + currentClass + '>' + item.name + '</a></li>';
  }
  html += '</ul>';
  html += '</div>';
  html += '</div>';
  headerEl.innerHTML = html;
}

// ========== 渲染搜索框 ==========
function renderSearchBar() {
  if (!searchBarEl) return;
  if (getPageName() === "search") {
    searchBarEl.innerHTML = "";
    searchBarEl.style.display = "none";
    return;
  }
  var html = '';
  html += '<form class="search-form" action="search.html" method="get">';
  html += '<input type="text" name="q" class="search-input" placeholder="' + siteData.searchPlaceholder + '">';
  html += '<input type="submit" class="search-btn" value="搜索">';
  html += '</form>';
  searchBarEl.innerHTML = html;
}

// ========== 主体分发 ==========
function renderMain() {
  var pageName = getPageName();
  if (pageName === "search") {
    renderSearchPage();
  } else if (pageName === "notice") {
    renderNoticePage();
  } else if (pageName === "exhibition") {
    renderExhibitionPage();
  } else {
    renderHomePage();
  }
}

// ========== 通用：按 id 找元素 ==========
function findById(list, id) {
  if (!list) return null;
  for (var i = 0; i < list.length; i++) {
    if (String(list[i].id) === String(id)) return list[i];
  }
  return null;
}

// ========== 通用：展览列表 HTML ==========
function buildExhibitionItems(list, showSummary) {
  var html = '';
  if (!list || list.length === 0) {
    return '<p>暂无展览。</p>';
  }
  for (var i = 0; i < list.length; i++) {
    var ex = list[i];
    html += '<div class="exhibition-item">';
    html += '<img src="' + ex.img + '" alt="展览图片" class="exhibition-img">';
    html += '<div class="exhibition-info">';
    html += '<h4><a href="' + ex.url + '">' + ex.name + '</a></h4>';
    html += '<p>时间：' + ex.time + '</p>';
    html += '<p>地点：' + ex.place + '</p>';
    if (showSummary && ex.summary) {
      html += '<p>' + ex.summary + '</p>';
    }
    html += '</div>';
    html += '</div>';
  }
  return html;
}

// ========== 通用：公告列表 HTML（跳过 hidden 项） ==========
function buildNoticeList() {
  var html = '';
  if (!siteData.notices || siteData.notices.length === 0) {
    return '<p>暂无公告。</p>';
  }
  html += '<ul class="notice-list">';
  for (var i = 0; i < siteData.notices.length; i++) {
    var n = siteData.notices[i];
    if (n.hidden) continue;
    html += '<li>';
    html += '<span class="notice-date">' + n.date + '</span>';
    if (n.url) {
      html += '<a href="' + n.url + '" class="notice-link">' + n.title + '</a>';
    } else {
      html += '<span class="notice-link">' + n.title + '</span>';
    }
    html += '</li>';
  }
  html += '</ul>';
  return html;
}

// ========== 首页 ==========
function renderHomePage() {
  var html = '';
  var noticeLimit = siteData.homeNoticeLimit || 5;
  var exhLimit = siteData.homeExhibitionLimit || 3;

  if (siteData.banner) {
    html += '<div class="banner">';
    html += '<img src="' + siteData.imgPath + '" alt="banner" class="banner-img">';
    html += '<div class="banner-text">';
    html += '<h1>' + siteData.banner.title + '</h1>';
    html += '<h2>' + siteData.banner.subtitle + '</h2>';
    html += '<p>' + siteData.banner.desc + '</p>';
    html += '<a href="' + siteData.banner.btnUrl + '" class="banner-btn">' + siteData.banner.btnText + '</a>';
    html += '</div>';
    html += '</div>';
  }

  html += '<div class="content-wrap">';
  html += '<div class="left-col">';

  if (siteData.notices && siteData.notices.length > 0) {
    html += '<div class="section">';
    html += '<h3 class="section-title">最新公告</h3>';
    html += '<ul class="notice-list">';
    var count = 0;
    for (var i = 0; i < siteData.notices.length && count < noticeLimit; i++) {
      var n = siteData.notices[i];
      if (n.hidden) continue;
      html += '<li>';
      html += '<span class="notice-date">' + n.date + '</span>';
      if (n.url) {
        html += '<a href="' + n.url + '" class="notice-link">' + n.title + '</a>';
      } else {
        html += '<span class="notice-link">' + n.title + '</span>';
      }
      html += '</li>';
      count++;
    }
    html += '</ul>';
    html += '</div>';
  }

  if (siteData.exhibitions && siteData.exhibitions.length > 0) {
    html += '<div class="section">';
    html += '<h3 class="section-title">当前展览</h3>';
    html += '<div class="exhibition-list">';
    var exList = [];
    for (var k = 0; k < siteData.exhibitions.length && k < exhLimit; k++) {
      exList.push(siteData.exhibitions[k]);
    }
    html += buildExhibitionItems(exList, false);
    html += '</div>';
    html += '</div>';
  }

  html += '</div>';

  html += '<div class="right-col">';

  if (siteData.visitInfo) {
    html += '<div class="section">';
    html += '<h3 class="section-title">参观信息</h3>';
    html += '<table class="visit-table">';
    html += '<tr><td class="label">开放时间</td><td>' + siteData.visitInfo.time + '</td></tr>';
    html += '<tr><td class="label">闭馆日</td><td>' + siteData.visitInfo.closed + '</td></tr>';
    html += '<tr><td class="label">门票</td><td>' + siteData.visitInfo.ticket + '</td></tr>';
    html += '<tr><td class="label">地址</td><td>' + siteData.visitInfo.address + '</td></tr>';
    html += '<tr><td class="label">电话</td><td>' + siteData.visitInfo.phone + '</td></tr>';
    html += '</table>';
    html += '</div>';
  }

  html += '<div class="section old-school">';
  html += '<p>欢迎光临三河省博物馆</p>';
  html += '<p>本网站建议使用IE6.0以上浏览器</p>';
  html += '</div>';

  html += '</div>';
  html += '</div>';

  mainEl.innerHTML = html;
}

// ========== 搜索页 ==========
function renderSearchPage() {
  var keyword = getQueryParam("q") || "";
  var html = '';
  html += '<div class="page-wrap">';
  html += '<h2 class="page-title">搜索结果</h2>';

  if (keyword === "") {
    html += '<p class="no-result">请输入搜索关键词。</p>';
    html += '</div>';
    mainEl.innerHTML = html;
    return;
  }

  // 特殊关键词：意识博物馆
  // 改为给出可点击的链接，而不是自动弹窗
  if (keyword.indexOf("意识博物馆") !== -1) {
    html += '<p class="search-keyword">关键词：' + keyword + '</p>';
    html += '<ul class="search-result-list">';
    html += '<li>';
    html += '<span class="result-type">[入口]</span> ';
    html += '<a href="https://www.4399.com">意识博物馆</a>'; // 上线前改成你的真实地址
    html += '<p class="result-summary">相关内容已迁移，点击进入。</p>';
    html += '</li>';
    html += '</ul>';
    html += '</div>';
    mainEl.innerHTML = html;
    return;
  }

  html += '<p class="search-keyword">关键词：' + keyword + '</p>';

  var results = [];
  if (siteData.notices) {
    for (var i = 0; i < siteData.notices.length; i++) {
      var n = siteData.notices[i];
      var hitTitle = n.title.indexOf(keyword) !== -1;
      var hitSummary = n.summary && n.summary.indexOf(keyword) !== -1;
      var hitContent = n.content && n.content.indexOf(keyword) !== -1;
      if (hitTitle || hitSummary || hitContent) {
        results.push({ type: "公告", title: n.title, summary: n.summary, url: n.url });
      }
    }
  }
  if (siteData.exhibitions) {
    for (var j = 0; j < siteData.exhibitions.length; j++) {
      var ex = siteData.exhibitions[j];
      var hitName = ex.name.indexOf(keyword) !== -1;
      var hitSummary2 = ex.summary && ex.summary.indexOf(keyword) !== -1;
      var hitContent2 = ex.content && ex.content.indexOf(keyword) !== -1;
      if (hitName || hitSummary2 || hitContent2) {
        results.push({ type: "展览", title: ex.name, summary: ex.summary, url: ex.url });
      }
    }
  }

  if (results.length === 0) {
    html += '<p class="no-result">没有找到相关内容。</p>';
  } else {
    html += '<ul class="search-result-list">';
    for (var k = 0; k < results.length; k++) {
      var r = results[k];
      html += '<li>';
      html += '<span class="result-type">[' + r.type + ']</span> ';
      if (r.url) {
        html += '<a href="' + r.url + '">' + r.title + '</a>';
      } else {
        html += '<span>' + r.title + '</span>';
      }
      html += '<p class="result-summary">' + (r.summary || "") + '</p>';
      html += '</li>';
    }
    html += '</ul>';
  }

  html += '</div>';
  mainEl.innerHTML = html;
}

// ========== 公告页 ==========
function renderNoticePage() {
  var id = getQueryParam("id");
  var html = '<div class="page-wrap">';

  if (id) {
    var found = findById(siteData.notices, id);
    if (found) {
      addToHistory("lastNoticeId", found.id);
      html += '<h2 class="page-title">' + found.title + '</h2>';
      html += '<p class="page-meta">发布日期：' + found.date + '</p>';
      html += '<div class="page-content">';
      html += '<p>' + (found.content || found.summary || "") + '</p>';
      html += '</div>';
      html += '<p class="back-link"><a href="notice.html">返回公告列表</a></p>';
    } else {
      html += '<h2 class="page-title">公告不存在</h2>';
      html += '<p class="back-link"><a href="notice.html">返回公告列表</a></p>';
    }
  } else {
    html += '<h2 class="page-title">公告列表</h2>';
    var cachedId = getHistoryFirst("lastNoticeId");
    if (cachedId !== null) {
      html += '<p class="page-meta">最近查看过的公告：<a href="notice.html?id=' + cachedId + '">点击返回</a></p>';
    }
    html += buildNoticeList();
  }

  html += '</div>';
  mainEl.innerHTML = html;
}

// ========== 展览页 ==========
function renderExhibitionPage() {
  var id = getQueryParam("id");
  var html = '<div class="page-wrap">';

  if (id) {
    var found = findById(siteData.exhibitions, id);
    if (found) {
      addToHistory("lastExhibitionId", found.id);
      html += '<h2 class="page-title">' + found.name + '</h2>';
      html += '<p class="page-meta">时间：' + found.time + ' | 地点：' + found.place + '</p>';
      html += '<div class="exhibition-detail-img"><img src="' + found.img + '" alt="' + found.name + '"></div>';
      html += '<div class="page-content">';
      html += '<p>' + (found.content || found.summary || "") + '</p>';
      html += '</div>';
      html += '<p class="back-link"><a href="exhibition.html">返回展览列表</a></p>';
    } else {
      html += '<h2 class="page-title">展览不存在</h2>';
      html += '<p class="back-link"><a href="exhibition.html">返回展览列表</a></p>';
    }
  } else {
    html += '<h2 class="page-title">展览列表</h2>';
    var cachedId = getHistoryFirst("lastExhibitionId");
    if (cachedId !== null) {
      html += '<p class="page-meta">最近查看过的展览：<a href="exhibition.html?id=' + cachedId + '">点击返回</a></p>';
    }
    html += '<div class="exhibition-list">';
    html += buildExhibitionItems(siteData.exhibitions, true);
    html += '</div>';
  }

  html += '</div>';
  mainEl.innerHTML = html;
}

// ========== 页脚 ==========
function renderFooter() {
  var html = '';
  html += '<div class="footer-links">';
  for (var i = 0; i < siteData.footerLinks.length; i++) {
    var link = siteData.footerLinks[i];
    html += '<a href="' + link.url + '">' + link.name + '</a>';
    if (i < siteData.footerLinks.length - 1) {
      html += ' | ';
    }
  }
  html += '</div>';
  html += '<div class="footer-info">';
  html += '<span>您是第 ' + getVisitorCount() + ' 位访问者</span>';
  html += '<span>首次访问：' + getFirstVisitDate() + '</span>';
  html += '<span>' + siteData.bestView + '</span>';
  html += '</div>';
  html += '<div class="footer-copyright">';
  html += siteData.copyright;
  html += '</div>';
  footerEl.innerHTML = html;
}

// ========== Windows 2000 风格弹窗 ==========
function renderModal() {
  if (sessionStorage.getItem("modalShown") === "1") return;
  sessionStorage.setItem("modalShown", "1");

  var overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.id = "modal-overlay";

  var win = document.createElement("div");
  win.className = "modal-window";

  var titlebar = document.createElement("div");
  titlebar.className = "modal-titlebar";
  titlebar.id = "modal-titlebar";

  var titleText = document.createElement("span");
  titleText.className = "modal-title-text";
  titleText.textContent = "公告";
  titlebar.appendChild(titleText);

  var closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "modal-close";
  closeBtn.id = "modal-close";
  closeBtn.textContent = "X";
  titlebar.appendChild(closeBtn);

  var body = document.createElement("div");
  body.className = "modal-body";
  body.innerHTML = '尊敬的三河省观众朋友们：<br><br>' +
    '对不起，该网站已经停止维护，无法在网站上继续进行预约等功能，如发现数据丢失请逐步迁移到新网站。<br><br>' +
    '感谢您一直以来对三河省博物馆的支持与关注。<br><br>' +
    '三河省博物馆 敬上';

  win.appendChild(titlebar);
  win.appendChild(body);
  overlay.appendChild(win);
  document.body.appendChild(overlay);

  document.body.style.overflow = "hidden";

  var flashTimer = null;

  overlay.onclick = function(e) {
    if (win.contains(e.target)) return;
    if (flashTimer !== null) return;
    var count = 0;
    flashTimer = setInterval(function() {
      if (count >= 4) {
        clearInterval(flashTimer);
        flashTimer = null;
        titlebar.style.backgroundColor = "";
        return;
      }
      if (count % 2 === 0) {
        titlebar.style.backgroundColor = "#ffcc00";
      } else {
        titlebar.style.backgroundColor = "";
      }
      count++;
    }, 100);
  };

  closeBtn.onclick = function() {
    if (flashTimer !== null) {
      clearInterval(flashTimer);
      flashTimer = null;
    }
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    document.body.style.overflow = "";
  };
}

// ========== 页面加载 ==========
window.onload = function() {
  initLocalStorage();
  renderHeader();
  renderSearchBar();
  renderMain();
  renderFooter();
  renderModal();
};
