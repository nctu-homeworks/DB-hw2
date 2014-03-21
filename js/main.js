var pages = {
	login_dialog: {
		div_id: "login_dialog",
		title: "使用者登入",
		init: function() {},
		reset: reset_login_dialog
	},
	welcome: {
		div_id: "welcome_page",
		title: "歡迎",
		init: function() {},
		reset: function() {}
	},
	regist_dialog: {
		div_id: "regist_dialog",
		title: "註冊新使用者",
		init: function() {},
		reset: reset_regist_dialog
	},
	home: {
		div_id: "home_page",
		title: "首頁",
		init: function() {},
		reset: function() {}
	}, 
	flight_manage: {
		div_id: "flight_manage",
		title: "航班管理", 
		init: flight_manage_onEnter,
		reset: reset_flight_manage
	},
	uset_dialog: {
		div_id: "uset",
		title: "使用者設定",
		init: uset_onEnter,
		reset: reset_uset
	},
	connect_account: {
		div_id: "uconnect",
		title: "連結帳號",
		init: function() {},
		reset: function() {}
	}
};

var now_page = "welcome";

$(document).ready(function() {
	$("input").mouseenter(function() {
		$(this).focus();
	});

	$("h1").click(function() {
		change_page(login == 'yes' ? 'home' : 'welcome');
	});

	$("#login_state").hover(function() {
		if(login == 'yes') {
			$("#user_info").fadeIn();
		}
	}, function() {
		$("#user_info").fadeOut();
	});

	prepare_login_dialog();
	prepare_regist_dialog();
	prepare_flight();
	prepare_uset();
	listen_login();
	$("#" + pages[now_page].div_id).slideDown();
});

function change_page(new_page) {
	$("#" + pages[now_page].div_id).slideUp(function() {
		pages[now_page].reset();
		now_page = new_page;
		pages[new_page].init();
		$("#" + pages[new_page].div_id).slideDown();
	});
	
	$("h2").slideUp(function() {
		$("h2").text(pages[new_page].title);
		$("h2").slideDown();
	});
	
	$("title").text("航班管理系統 - " + pages[new_page].title);
}
