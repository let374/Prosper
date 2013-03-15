<?php
	//session_start();

	ob_start();
	include_once('prosperlistingfields.php');
	$output = ob_get_contents();
	ob_end_clean();

 	//query listings
 	$listing_result = $client->Query(array(
 		"authenticationToken" => null,
 		"objectType" => "Listing",
 		"fields" => $desc_name_list,
 		"conditionExpression" => "Status = 2 or LastModifiedDate >= '" . $_GET["modDate"] . "'" //Status = 2 or Status = 8"
 		));

 	/*$header = $client->__getLastResponseHeaders();
 	$position = strpos($header, "Content-Length: ");
 	$content = substr($header, $position + 16);
 	$_SESSION['dataSize']=$content;*/

 	//process listing results
 	$listings_arr = objectToArray($listing_result);
 	$listings_pre = $listings_arr["QueryResult"]["ProsperObjects"]["ProsperObject"]; //strip envelope
 	$copiedFields = array_fill(0, count($listings_pre), $desc_comb_arr);
 	$listings_pre2 = array_map(removeNullFields, $listings_pre, $copiedFields);

 	echo json_encode($listings_pre2);
 	/*
	function objectToArray($d)
	{
		if (is_object($d))
		{
			$d = get_object_vars($d);
		}
 
		if (is_array($d))
		{
			return array_map(__FUNCTION__, $d);
		}
		else
		{
			return $d;
		}
	}

	function needsAuthentication($p)
	{
		return ($p["Authenticated"]==false);
	}

	function getFieldName($p) {return $p["Name"];}
	function getFieldType($p) {return $p["Type"];}*/
	function removeNullFields($p, $r) {
		return array_intersect_key($p, $r);
	}
	//session_destroy();*/
?>