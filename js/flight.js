var flight = new Object();
flight.sheet = new Object();
flight.now_page = 1;
flight.total_page = 0;
flight.options = {
	sort: {
		col: "ignore",
		ord1: "ASC",
		ord2: "ASC"
	}, 
	search: {
		col: "ignore",
		txt: ""
	}
};
flight.page_data;
flight.sheet_id = 'all';

flight.div_id = "flight_manage";
flight.title = "航班管理";
flight.prepare = function() {
	this.sheet.prepare();

	$("#flight_manage tfoot .date_input").datetimepicker({
		dateFormat: 'yy-mm-dd',
		clockType: 24
	});
	$("#flight_manage tfoot .money_input").slidemoney();
	$("#flight_manage input:checkbox").onoff();

	this.options_dialog = $("#flight_manage #flight_options_dialog").dialog({
		autoOpen: false,
		width: 600,
		modal: true,
		buttons: {
			"確定": function() {
				if($(this).find("#flight_search_col").val() == 'ignore') {
					$(this).find("#flight_search_txt").val("");
				}

				flight.options.sort.col = $(this).find("#flight_sort1_col").val();
				flight.options.sort.ord1 = $(this).find("#flight_sort1_order").prop("checked") ? "ASC" : "DESC";
				flight.options.sort.ord2 = $(this).find("#flight_sort2_order").prop("checked") ? "ASC" : "DESC";

				flight.options.search.col = $(this).find("#flight_search_col").val();
				flight.options.search.txt = $(this).find("#flight_search_txt").val();

				flight.goto_page("first");
				$(this).dialog("close");
			}, 
			"取消": function() {
				$(this).dialog("close");
			}
		}
	});
	this.options_dialog.find("#flight_search_col").change(function() {
		if($(this).val() == "ignore") {
			flight.options_dialog.find("#flight_search_txt").fadeOut();
		} else {
			flight.options_dialog.find("#flight_search_txt").fadeIn();
		}
	});

	$("#flight_manage #flight_page_control #flight_p_select").bind('input', function() {
		if($(this).val() != "" && $(this).val() != flight.now_page) {
			flight.goto_page($(this).val());
		}
	});

	$("#flight_manage #flight_add_form").submit(function() {
		event.preventDefault();
		if(airport.list.indexOf($('#flight_manage tfoot input[name="departure"]').val()) == -1 ||
			airport.list.indexOf($('#flight_manage tfoot input[name="destination"]').val()) == -1) {

			alert("起飛或到達的機場不存在");
			return;
		}
		
		$("#flight_manage #flight_add_cancal, #flight_manage #flight_add_save").hide();
		post('php/add_flight.php', $("#flight_manage tfoot input").serialize(), function(data, status) {
			flight.goto_page("last");
		});
	});
	
	$("#flight_manage #flight_update_form").submit(function() {
		event.preventDefault();
		if(airport.list.indexOf($('#flight_manage tbody input[name="departure"]').val()) == -1 ||
			airport.list.indexOf($('#flight_manage tbody input[name="destination"]').val()) == -1) {

			alert("起飛或到達的機場不存在");
			return;
		}
		
		post('php/edit_flight.php', $("#flight_manage tbody input").serialize(), function(data, status) {
			flight.goto_page("now");
		});
	});
}

flight.goto_page = function(page, callback) {
	switch(page) {
	case "first":
		page = 1;
		break;
	case "last":
		page = flight.total_page;
		break;
	case "previous":
		if(flight.now_page > 1) {
			page = flight.now_page - 1;
		}
		break;
	case "next":
		if(flight.now_page < flight.total_page) {
			page = flight.now_page + 1;
		}
		break;
	case "now":
		page = flight.now_page;
		break;
	}
	
	post('php/list_flight.php', {
		page: page,
		sheet: this.sheet_id,
		sort_col: this.options.sort.col,
		sort_ord1: this.options.sort.ord1,
		sort_ord2: this.options.sort.ord2,
		search_col: this.options.search.col,
		search_txt: this.options.search.txt
	}, function(data, status) {
		flight.now_page = page;
		flight.total_page = data.page_count;
		flight.page_data = data.data;

		$("#flight_manage tbody").empty();
		for(var plain in data.data) {
			$("#flight_manage tbody").append((plain % 2 == 1 ? '<tr class="alt"' : "<tr") + ' id="plain_row' + plain + '">' +
					(user.is_admin == 1 ? '<td class="plain_control"><a href="#" onClick="flight.editing(' + plain + ')"><span class="icon-pen"></span></a><a href="#" onClick="flight.remove(' + plain + ')"><span class="icon-trash"></span></a></td>' : "") +
					'<td class="plain_comp">' + (flight.sheet_id == 'all' ?
						('<a href="#" onClick="flight.sheet.add(' + plain + ')">比價</a>') :
						('<a href="#" onClick="flight.sheet.delete_flight(' + plain + ')">取消比價</a>')) + '</td>' +
					'<td class="plain_id">' + data.data[plain].id + "</td>" +
					'<td class="plain_no">' + data.data[plain].flight_number + "</td>" +
					'<td class="plain_dept">' + data.data[plain].departure + "</td>" +
					'<td class="plain_dept_date">' + data.data[plain].departure_date + "</td>" +
					'<td class="plain_dest">' + data.data[plain].destination + "</td>" +
					'<td class="plain_dest_date">' + data.data[plain].arrival_date + "</td>" +
					'<td class="plain_price">' + data.data[plain].ticket_price + "</td>" +
					"</tr>");
		}
		
		$("#flight_manage #flight_page_control #flight_p_select").attr("placeholder", page + ' / ' + flight.total_page);
		$("#flight_manage #flight_page_control #flight_p_select").val("");
		$("#flight_manage #flight_page_control #flight_p_list").empty();
		for(var i = 1; i <= flight.total_page; i++) {
			$("#flight_manage #flight_page_control #flight_p_list").append('<option val="' + i + '">' + i + '</option>');
		}
		
		if(flight.now_page <= 1) {
			$("#flight_manage #flight_page_control #flight_p_first").hide();
			$("#flight_manage #flight_page_control #flight_p_previous").hide();
		} else {
			$("#flight_manage #flight_page_control #flight_p_first").show();
			$("#flight_manage #flight_page_control #flight_p_previous").show();
		}
		if(flight.now_page >= flight.total_page) {
			$("#flight_manage #flight_page_control #flight_p_last").hide();
			$("#flight_manage #flight_page_control #flight_p_next").hide();
		} else {
			$("#flight_manage #flight_page_control #flight_p_last").show();
			$("#flight_manage #flight_page_control #flight_p_next").show();
		}
		
		flight.adding_reset();
		if(callback) {
			callback();
		}
	});
}

flight.set_options = function() {
	this.options_dialog.dialog("open");
}

flight.init = function() {
	this.sheet.init();
	this.adding_reset();
	this.now_page = 1;
	this.goto_page(1);
}

flight.editing = function(row) {
	this.goto_page("now", function() {
		var id_field = $("#flight_manage tbody #plain_row" + row + " .plain_id");
		var no_field = $("#flight_manage tbody #plain_row" + row + " .plain_no");
		var dept_field = $("#flight_manage tbody #plain_row" + row + " .plain_dept");
		var dept_date_field = $("#flight_manage tbody #plain_row" + row + " .plain_dept_date");
		var dest_field = $("#flight_manage tbody #plain_row" + row + " .plain_dest");
		var dest_date_field = $("#flight_manage tbody #plain_row" + row + " .plain_dest_date");
		var price_field = $("#flight_manage tbody #plain_row" + row + " .plain_price");
		
		id_field.html('<input type="hidden" name="id" value="' + flight.page_data[row].id + '" />' + id_field.text());
		no_field.html('<input type="text" name="number" value="' + flight.page_data[row].flight_number + '" required pattern="^\\S+$" title="班機號碼不得包含空白" />');
		dept_field.html('<input type="text" name="departure" value="' + flight.page_data[row].departure + '" required list="airport_list" />');
		dept_date_field.html('<input type="text" name="departure_date" value="' + flight.page_data[row].departure_date + '" class="date_input" pattern="^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}(:[0-9]{2})?$" title="yyyy-mm-dd hh:mm:ss" placeholder="起飛時間 Departure Time" required />');
		dest_field.html('<input type="text" name="destination" value="' + flight.page_data[row].destination + '" required list="airport_list" />');
		dest_date_field.html('<input type="text" name="arrival_date" value="' + flight.page_data[row].arrival_date + '" required class="date_input" pattern="^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}(:[0-9]{2})?$" title="yyyy-mm-dd hh:mm:ss" placeholder="到達時間 Arrival Time" />');
		price_field.html('<input type="number" name="price" class="money_input" form="flight_add_form" placeholder="機票價格 Ticket Price" min="0" max="99999999.99" step="0.01" value="' + flight.page_data[row].ticket_price + '" required />');
		
		$("#flight_manage tbody #plain_row" + row + " .plain_control").html(
			'<button type="submit"></button>' +
			'<a href="#" onClick="$(\'#flight_manage tbody #plain_row' + row + ' .plain_control button\').click()">' +
				'<span class="icon-checkmark-circle"></span>' +
			'</a>' +
			'<a href="#" onClick="flight.goto_page(\'now\')">' +
				'<span class="icon-cancel-circle"></span>' +
			'</a>'
		);

		$("#flight_manage tbody #plain_row" + row + " .date_input").datetimepicker({
			dateFormat: 'yy-mm-dd',
			clockType: 24
		});
		$("#flight_manage tbody #plain_row" + row + " .money_input").slidemoney();
		$("#flight_manage tbody #plain_row" + row + " .plain_control button").hide();
	});
	airport.refresh_list();
}

flight.remove = function(row) {
	if(confirm("真的要刪除此航班嗎？\n班機編號：" + flight.page_data[row].flight_number + "\n起飛：" + flight.page_data[row].departure_date + "於" + flight.page_data[row].departure + "\n降落：" + flight.page_data[row].arrival_date + "於" + flight.page_data[row].destination + "\n價格：" + flight.page_data[row].ticket_price)) {
		post('php/delete_flight.php', {id: flight.page_data[row].id}, function(data, status) {
			flight.goto_page("now");
		});
	}
}

flight.adding = function() {
	flight.goto_page("now", function() {
		$("#flight_manage #flight_add").hide();
		$("#flight_manage #flight_add_cancel").show();
		$("#flight_manage #flight_add_save").show();
		$("#flight_manage tfoot").show();
	});
	airport.refresh_list();
}

flight.adding_reset = function() {
	$("#flight_manage #flight_add_cancel").hide();
	$("#flight_manage #flight_add_save").hide();
	$("#flight_manage #flight_add").show()
	$("#flight_manage tfoot").hide();
	$("#flight_manage tfoot input").val("");
}

flight.sheet.prepare = function() {
	this.sheet_tabs = $("#flight_manage #flight_tab").tabs({
		beforeActivate: function(event, ui) {
			var sheet_id = ui.newTab.find("a").attr("sheet-id");

			if(sheet_id == 'add') {
				event.preventDefault();
				var new_sheet = new Object();
				new_sheet.name = prompt("請輸入新比價表的名稱");

				if(new_sheet.name == null || new_sheet.name == "") {
					return;
				}

				new_sheet.funct = "add";
				post('php/sheet_manage.php', new_sheet, function(data, status) {
					flight.sheet.refresh();
				});
			} else if(sheet_id == 'all') {
				$("#flight_manage #flight_add").show();
				flight.sheet_id = 'all';
				flight.goto_page("first");
			} else {
				$("#flight_manage #flight_add").hide();
				flight.sheet_id = sheet_id;
				flight.goto_page("first");
			}
		}
	}).removeClass("ui-widget");

	this.add_dialog = $("#flight_manage #flight_add_comp").dialog({
		autoOpen: false,
		width: 300,
		modal: true,
		buttons: {
			"加入": function() {
				post('php/sheet_manage.php', $(this).find('form').serialize(), function(data, status) {
					flight.sheet.add_dialog.dialog("close");
				});
			}, 
			"取消": function() {
				$(this).dialog("close");
			}
		}
	});
}

flight.sheet.init = function() {
	this.refresh();
}

flight.sheet.refresh = function() {
	post('php/sheet_manage.php', {
		funct: 'list'
	}, function(data, status) {
		var tabs_ul = $("#flight_manage #flight_tab > ul").empty();
		flight.sheet.tab_data = data.data;

		tabs_ul.append('<li><a href="#flight_tab_table" sheet-id="all">所有航班</a></li>');
		for(var tab in data.data) {
			tabs_ul.append(
				'<li><a href="#flight_tab_table" sheet-id="' + data.data[tab].id + '">' + data.data[tab].name + 
				'<a href="#" onClick="flight.sheet.edit_name(' + data.data[tab].id + ', \'' + data.data[tab].name + '\')">' + 
					'<span class="icon-pen"></span>' + 
				'</a>' + 
				'<a href="#" onClick="flight.sheet.remove(' + data.data[tab].id + ')">' + 
					'<span class="icon-trash"></span>' + 
				'</a></a></li>'
			);
		}
		tabs_ul.append('<li><a href="#flight_tab_table" sheet-id="add">新增比價表</a></li>');

		flight.sheet.sheet_tabs.tabs("refresh");
	});
}

flight.sheet.edit_name = function(sheet_id, old_name) {
	var new_name = prompt("請輸入比價表的新名稱");
	if(new_name != null && new_name != "" && new_name != old_name) {
		post('php/sheet_manage.php', {
			funct: "edit_name",
			id: sheet_id,
			name: new_name
		}, function(data, status) {
			flight.sheet.refresh();
		});
	}
}

flight.sheet.remove = function(sheet_id) {
	if(confirm("確定要刪除此比價表嗎？\n該比價表的紀錄將會消失（不會影響原始航班）")) {
		post("php/sheet_manage.php", {
			funct: "delete_sheet",
			id: sheet_id
		}, function(data, status) {
			flight.sheet.refresh();
		});
	}
}

flight.sheet.add = function(row) {
	post('php/sheet_manage.php', {
		funct: 'insert_able',
		id: flight.page_data[row].id
	}, function(data, status) {
		var sheet_avail = false;
		flight.sheet.add_dialog.empty();
		var form = $('<form action="#" method="POST">')
				.appendTo(flight.sheet.add_dialog)
				.html("請選擇欲加入的比價表<br>");

		for(var sheet in flight.sheet.tab_data) {
			var tab = flight.sheet.tab_data[sheet];
			if(!data.data.hasOwnProperty(tab.id)) {
				sheet_avail = true;
				form.append('<input type="checkbox" name="sheet_id[]" value="' + tab.id + '">' + tab.name + '<br>');
			}
		}
		form.append(
			'<input type="hidden" name="flight_id" value="' + flight.page_data[row].id + '">' + 
			'<input type="hidden" name="funct" value="insert">' + 
			'</form>'
		);

		if(!sheet_avail) {
			flight.sheet.add_dialog.empty();
			alert("沒有能加入的比價表");
		} else {
			flight.sheet.add_dialog.dialog("open");
		}
	});
}

flight.sheet.delete_flight = function(row) {
	if(confirm("確定要將此航班移出此比價表嗎？")) {
		post('php/sheet_manage.php', {
			funct: 'delete_flight',
			sheet_id: flight.sheet_id,
			flight_id: flight.page_data[row].id
		}, function(data, status) {
			flight.goto_page("now");
		});
	}
}
