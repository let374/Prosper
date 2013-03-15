<?php

	//session_start();
	$client = new SoapClient("https://services.prosper.com/ProsperAPI/ProsperAPI.asmx?WSDL", array("trace" => true));

	$describe_result = $client->Describe(array(
		"authenticationtoken" => null,
		"objectType" => "Listing"
	));
 
 	//query listing fields and datatype
	$desc_response_arr = objectToArray($describe_result);
 	$desc_fields_arr = $desc_response_arr["DescribeResult"]["Definition"]["Fields"]["Field"]; //isolate only field array
 	$desc_unauthenFields_arr = array_filter($desc_fields_arr, needsAuthentication);
 	$desc_name_arr = array_map(getFieldName, $desc_unauthenFields_arr);
 	$desc_type_arr = array_map(getFieldType, $desc_unauthenFields_arr);
 	$desc_comb_arr = array_combine($desc_name_arr, $desc_type_arr);
 	$desc_name_list = implode(",", $desc_name_arr);

 	// $header = $client->__getLastResponseHeaders();
 	// $position = strpos($header, "Content-Length: ");
 	// $content = substr($header, $position + 16);
 	// echo $content;

 	echo json_encode($desc_comb_arr);

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
	function getFieldType($p) {return $p["Type"];}
 ?>