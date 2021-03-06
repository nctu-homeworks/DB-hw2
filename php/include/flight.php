<?php
class Flight {
	private $db;

	public function __construct($db) {
		$this->db = $db;
	}

	public function add($flight_info) {
		$stat = $this->db->prepare("INSERT INTO `flight_flight` (`flight_number`, `departure`, `destination`, `departure_date`, `arrival_date`, `ticket_price`)
						VALUES ( :no , :from , :to , :fromtime , :totime , :price );");
		$stat->execute(array(
			':no' => filter_var($flight_info['number'], FILTER_SANITIZE_SPECIAL_CHARS),
			':from' => filter_var($flight_info['departure'], FILTER_SANITIZE_SPECIAL_CHARS),
			':to' => filter_var($flight_info['destination'], FILTER_SANITIZE_SPECIAL_CHARS),
			':fromtime' => $flight_info['departure_date'],
			':totime' => $flight_info['arrival_date'],
			':price' => $flight_info['price']
		));

		return $stat->rowCount() === 1;
	}

	public function add_sheet($user_id, $name) {
		$stat = $this->db->prepare("INSERT INTO `flight_compare_name` (`user_id`, `name`) VALUES ( :uid , :name );");
		$stat->execute(array(
			':uid' => $user_id,
			':name' => filter_var($name, FILTER_SANITIZE_SPECIAL_CHARS)
		));

		return $stat->rowCount() === 1;
	}

	public function list_sheet($id) {
		$stat = $this->db->prepare("SELECT `id`, `name` FROM `flight_compare_name` WHERE `user_id` = ? ;");
		$stat->execute(array($id));

		return $stat->fetchAll(PDO::FETCH_ASSOC);
	}

	public function check_sheet_able($id, $flight_id) {
		$stat = $this->db->prepare("SELECT `flight_compare_name`.`id` FROM 
						`flight_compare_name` INNER JOIN `flight_compare_content` 
						ON `flight_compare_name`.`id` = `flight_compare_content`.`sheet_id` 
						WHERE `flight_compare_name`.`user_id` = :uid AND `flight_compare_content`.`flight_id` = :fid ;");
		$stat->execute(array(
			':uid' => $id,
			':fid' => $flight_id
		));
		return $stat->fetchAll(PDO::FETCH_COLUMN | PDO::FETCH_UNIQUE, 0);
	}

	public function insert_sheet($user_id, $flight_id, $sheet_ids) {
		$stat = $this->db->prepare("SELECT COUNT(*) FROM `flight_compare_name` WHERE `user_id` = :uid AND `id` = :sid ;");
		foreach($sheet_ids as $id) {
			$stat->execute(array(
				':uid' => $user_id,
				':sid' => $id
			));
			if($stat->fetchColumn() != 1) {
				return false;
			}
		}

		$stat = $this->db->prepare("INSERT INTO `flight_compare_content` (`sheet_id`, `flight_id`)
					VALUES ( :sid , :fid );");

		$success_count = 0;
		foreach($sheet_ids as $id) {
			$stat->execute(array(
				':sid' => $id,
				':fid' => $flight_id
			));
			$success_count += $stat->rowCount();
		}

		return $success_count == count($sheet_ids);
	}

	public function sheet_edit_name($user_id, $sheet_id, $new_name) {
		$stat = $this->db->prepare("UPDATE `flight_compare_name` SET `name` = :name WHERE `id` = :sid AND `user_id` = :uid ;");
		$stat->execute(array(
			':name' => filter_var($new_name, FILTER_SANITIZE_SPECIAL_CHARS),
			':sid' => $sheet_id,
			':uid' => $user_id
		));

		return $stat->rowCount() === 1;
	}
	
	public function remove_sheet($user_id, $sheet_id) {
		$stat = $this->db->prepare("DELETE FROM `flight_compare_name` WHERE `id` = :sid AND `user_id` = :uid ;");
		$stat->execute(array(
			':sid' => $sheet_id,
			':uid' => $user_id
		));

		return $stat->rowCount() === 1;
	}

	public function remove_sheet_flight($user_id, $sheet_id, $flight_id) {
		$stat = $this->db->prepare("SELECT COUNT(*) FROM `flight_compare_name` WHERE `id` = :sid AND `user_id` = :uid ;");
		$stat->execute(array(
			':sid' => $sheet_id,
			':uid' => $user_id
		));
		if($stat->fetchColumn() != 1) {
			return false;
		}

		$stat = $this->db->prepare("DELETE FROM `flight_compare_content` WHERE `sheet_id` = :sid AND `flight_id` = :fid ;");
		$stat->execute(array(
			':sid' => $sheet_id,
			':fid' => $flight_id
		));

		return $stat->rowCount() === 1;
	}

	public function edit($flight_info) {
		$stat = $this->db->prepare("UPDATE `flight_flight` SET `flight_number` = :no , `departure` = :from , 
			`destination` = :to , `departure_date` = :fromtime , `arrival_date` = :totime , `ticket_price` = :price WHERE `id` = :id ;");
		$stat->execute(array(
			':id' => $flight_info['id'],
			':no' => filter_var($flight_info['number'], FILTER_SANITIZE_SPECIAL_CHARS),
			':from' => filter_var($flight_info['departure'], FILTER_SANITIZE_SPECIAL_CHARS),
			':to' => filter_var($flight_info['destination'], FILTER_SANITIZE_SPECIAL_CHARS),
			':fromtime' => $flight_info['departure_date'],
			':totime' => $flight_info['arrival_date'],
			':price' => $flight_info['price']
		));
		
		return true;
	}
	
	public function delete($id) {
		$stat = $this->db->prepare("DELETE FROM `flight_flight` WHERE `id` = ? ;");
		$stat->execute(array($id));
		
		return $stat->rowCount() === 1;
	}

	public function get_page($sheet_id, $page_no, $sort_col, $sort_ord1, $sort_ord2, $search_col, $search_val) {
		$limit = 10;
		$where_col = array();
		$where_val = array();
		$order_str = "";

		if($sheet_id == 'all') {
			$join_part = "";
		} else {
			$join_part = "INNER JOIN `flight_compare_content` 
				ON `flight_flight`.`id` = `flight_compare_content`.`flight_id`";
			$where_col[] = '`flight_compare_content`.`sheet_id` = :sid';
			$where_val[':sid'] = $sheet_id;
		}
		if($search_col !== null) {
			$where_col[] = "`flight_flight`.`{$search_col}` LIKE :search";
			$where_val[':search'] = "%{$search_val}%";
		}
		if($sort_col !== null) {
			$order_str .= "`{$sort_col}` {$sort_ord1}, ";
		}

		$where_str = count($where_col) > 0 ? "WHERE ".join(" AND ", $where_col) : "";
		$stat = $this->db->prepare("SELECT `flight_flight`.* FROM `flight_flight` {$join_part}  
					{$where_str} ORDER BY {$order_str}`flight_number` {$sort_ord2} LIMIT :pos , :rows ;");

		$stat->bindValue(":pos", ($page_no - 1) * 10, PDO::PARAM_INT);
		$stat->bindValue(":rows", $limit, PDO::PARAM_INT);
		foreach($where_val as $k => $v) {
			$stat->bindValue($k, $v);
		}
		$stat->execute();

		return $stat->fetchAll(PDO::FETCH_ASSOC);
	}
	
	public function get_page_count($sheet_id, $search_col, $search_val) {
		$where_col = array();
		$where_val = array();
		if($sheet_id != 'all') {
			$join_str = 'INNER JOIN `flight_compare_content` ON `flight_flight`.`id` = `flight_compare_content`.`flight_id`';

			$where_col[] = "`flight_compare_content`.`sheet_id` = :sid";
			$where_val[':sid'] = $sheet_id;
		} else {
			$join_str = "";
		}
		if($search_col !== null) {
			$where_col[] = "`flight_flight`.`{$search_col}` LIKE :search";
			$where_val[':search'] = "%{$search_val}%";
		}

		$where_str = count($where_col) > 0 ? "WHERE ".join(" AND ", $where_col) : "";
		$stat = $this->db->prepare("SELECT COUNT(DISTINCT `flight_flight`.`id`) FROM `flight_flight` $join_str $where_str ;");

		$stat->execute($where_val);
		$count = $stat->fetchColumn();
		return ceil($count / 10);
	}
}
?>
