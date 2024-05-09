/*/ Not change any values of the variables below, 
use the "json/config.json" file to make your settings. /*/
$(document).foundation();
let API_KEY = "";
let data_index = "";
let character_name = "";
let character_image = "";
let character_background_color = "";
let character_training = "";
let chat = "";
let pmt = "";
let audio_button_lang = "";
let chat_minlength = 0;
let chat_maxlength = 0;
let array_characters = [];
let array_chat = [];
let shuffle_character = false;
let continuous_chat = false;
let use_php_api = false;
let display_avatar_in_chat = false;
let filter_badwords = true;
let display_audio_button_answers = true;
let chat_history = true;
let filterBotWords = ["Robot:", "Bot:"];
const PHP_url = 'php/api.php';


function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}
	
	//Loads the characters from the config.json file and appends them to the initial slider
	loadData("json/config.json");
	function loadData(url){
		fetch(url)
		.then(res => res.json())
		.then((out) => {
			use_php_api = out.use_php_api;
			API_KEY = out.API_KEY;			
			if(!use_php_api && !API_KEY){
				feedbackError("❌ Error: API key has not been set","error");
			}
			display_avatar_in_chat = out.display_avatar_in_chat;
			display_audio_button_answers = out.display_audio_button_answers;
			filter_badwords = out.filter_badwords;
			chat_history = out.chat_history;
			chat_minlength = out.chat_minlength;
			chat_maxlength = out.chat_maxlength;
			continuous_chat = out.continuous_chat;
			shuffle_character = out.shuffle_character;
			audio_button_lang = out.audio_button_lang;
			$("#chat").attr("maxlength",chat_maxlength)
			
			if(shuffle_character){
				out.character = shuffleArray(out.character);
			}

				$("#load-character").html("");
		    for (var i = 0; i < out.character.length; i++) {
				array_characters.push({
					'name':out.character[i]['name'], 
					'image':out.character[i]['image'], 
					'description':out.character[i]['description'], 
					'welcome_message':out.character[i]['welcome_message'], 
					'display_welcome_message':out.character[i]['display_welcome_message'],
					'expert':out.character[i]['expert'],
					'background_thumb_color':out.character[i]['background_thumb_color'],
					'training':out.character[i]['training'],
					'last_chat':""
				})

				$("#load-character").append(`
				  <div class="swiper-slide">
						<div class="character-card">
							
								<span class="character-category">${array_characters[i]['expert']}</span>
							</div>
							<div class="character-name"><h3>${array_characters[i]['name']}</h3></div>
							 <div class="character-description"><p>${array_characters[i]['description']}</p>
							<div class="character-button">
								<span data-index="${i}" class='open-modal'>Let's Chat</span>
							</div>
							</div>
						</div>				
				  </div>
				`)
		  }
		  swiperCharacters.init();
		  return false;
		  	
		  	//Get Chat history
		  	if(chat_history){
				arr2 = JSON.parse(localStorage.getItem("smartanimals_chat"));
				array_characters.forEach((item1) => {
				  const item2 = (arr2 && arr2.find((item2) => item2.name === item1.name));
				  if (item2) {
				    item1.last_chat = item2.last_chat;
				  }
				});
			}

		}).catch(err => { throw err })}


		//Main function of GPT-3 chat API
		async function getResponse(prompt) {

			//Conversation history
			array_chat.push({"name":"User","message":prompt})

			if(use_php_api){		

			const data = {
			  array_chat: array_chat,
			  character_name: character_name,
			  continuous_chat:continuous_chat
			};				


			fetch(PHP_url, {
			  method: 'POST',
			  body: JSON.stringify(data),
			  headers: {
			    'Content-Type': 'application/json'
			  }
			})
			.then(response => response.json())
			.then(data => {
			  if (data.status == 1) {
			    responseChat(data.message);
			  } else{
			  	feedbackError("❌ "+data.message,"error");
			  }
			})

			}else{

			  let conversations = "";
			  array_chat.forEach(chat => {
			    conversations += `${chat.name}: ${chat.message}\r\n`;
			  });

			  if(continuous_chat){
				  pmt = `The following is a conversation between ${character_name}: and User: \n\n ${conversations}`;
			  }else{
				  pmt = prompt;
			  }			  

			  //Not using php api for response
			  fetch("https://api.openai.com/v1/engines/gpt-3.5-turbo-instruct/completions", {
			    method: "POST",
			    headers: {
			      "Content-Type": "application/json",
			      "Authorization": `Bearer ${API_KEY}`
			    },
			    body: JSON.stringify({
			     "prompt": pmt,
			      "max_tokens": 1500,
			      "temperature": 1,
			      "top_p": 0,
			      "n": 1,
			      "frequency_penalty":0,
			      "presence_penalty":0
			    })
			  })
				.then(response => response.json())
				.then(data => {
				  if (data.choices && data.choices.length > 0 && data.choices[0].text) {
				    responseChat(data.choices[0].text);
				  } else {
				  	feedbackError("❌ "+data.error.message,"error");
				  }
				})

			}
			
		}


		//Function that appends the AI response in the chat in html
		function responseChat(response){

			for (var i = 0; i < filterBotWords.length; i++) {
			    if (response.indexOf(filterBotWords[i]) !== -1) {
			        response = response.replace(filterBotWords[i], "");
			    }
			}

			array_chat.push({"name":character_name,"message":response})
			response = response.trim();
			response = response.replace(new RegExp('\r?\n','g'), '<br />');
			response = response.replace(character_name+":", "");


			avatar_in_chat = "";
			if(display_avatar_in_chat === true){
				avatar_in_chat = `<div class="avatar-chat"><img src="${character_image}" alt="${character_name}" title="${character_name}"></div>`;
			}

			audio_in_chat = "";
			if(display_audio_button_answers === true){
				audio_in_chat = `<div class='chat-audio'><img data-play="false" src='img/btn_tts_play.svg'></div>`;
			}	


			//Save chat history
			array_characters[data_index].last_chat = array_chat

			$("#overflow-chat").append(`
				<div class="chat border-character" style="border-color: ${character_background_color}">	
						${avatar_in_chat}
						${audio_in_chat}
						<div class="wrapper-name-and-chat">
							<div class="name">${character_name}</div>
							<div class="chat-response">${response}</div>
						</div>
				</div>
			`);

			scrollChatBottom();	
			enableChat();

			if (!(/Mobi/.test(navigator.userAgent))) {
				$("#chat").focus();
			} 

			if(chat_history){
				localStorage.setItem("smartanimals_chat", JSON.stringify(array_characters));
			}
			checkCleanChatDisplay();
		}


		//Checks if the chat API gave an error, tries again to send the message.
		function apiError(error){
			feedbackError("❌ Error, try again","error")
			scrollChatBottom();	
			enableChat();
			if (!(/Mobi/.test(navigator.userAgent))) {
				$("#chat").focus();
			} 
		}


		//Function that sends the user's question to the chat in html and to the API
		function sendUserChat(){
			hideFeedback();
			let chat = $("#chat").val();

			//checks if the user has entered the minimum amount of characters
			if(chat.length < chat_minlength){
				feedbackError(`❌ Please enter a message greater than ${chat_minlength} characters`,"error");
				return false;
			}

			if(chat == ""){
				feedbackError("❌ Type a message","error");
				$("#chat").focus();
				return false;
			}

			$("#overflow-chat").append(`
				<div class="chat border-you">	
					<div class="wrapper-name-and-chat">
						<div class="name">You</div>
						<div class="chat-response">${chat}</div>
					</div>
				</div>
			`);
			scrollChatBottom();
			getResponse(chat);
			$("#chat").val("");
			disableChat();
		}

		//Send message in chat by pressing enter
		$("#chat").keypress(function (e) {
		    if(e.which === 13 && !e.shiftKey) {
		        sendUserChat();
		        return false;
		    }
		});

		//Send message
		$(".btn-send-chat").on("click", function(){
			sendUserChat();
		})

		//Close modal
		$(".close-button").on("click", function(){
			hideModal();
		})

		document.addEventListener("keydown", function(event) {
		  if (event.key === "Escape") {
		    hideModal();
		  }
		});		

		function hideModal(){
			$("#chatModal").hide();
			hideFeedback();
			cancelSpeechSynthesis();
		}

		//Open chat modal
		$(document).delegate(".open-modal", "click", function() {
			data_index = $(this).attr("data-index");
			$("#overflow-chat").html("");
			array_chat = [];
			character_name = array_characters[data_index]['name'];
			character_image = array_characters[data_index]['image'];
			character_background_color = array_characters[data_index]['background_thumb_color'];
			character_training = array_characters[data_index]['training'];
			display_welcome_message = array_characters[data_index]['display_welcome_message'];
			welcome_message = array_characters[data_index]['welcome_message'];

			if(display_welcome_message){
				if(array_characters[data_index]['last_chat'].length > 0){
						getLastChat();
				}else{
					array_chat.push({"name":character_name,"message":character_training,"training":true})
					responseChat(welcome_message);
				}
			}else{
				if(array_characters[data_index]['last_chat'].length > 0){
					getLastChat();
				}else{
					array_chat.push({"name":character_name,"message":character_training,"training":true})
				}
			}


			$("#chatModal").fadeIn('fast');
			return false;
		})

		//Clean Chat
		function cleanChat(){
			$("#overflow-chat").html("");
			array_characters[data_index]['last_chat'] = [];
			array_chat = [];
			array_chat.push({"name":character_name,"message":character_training,"training":true})
			localStorage.setItem("smartanimals_chat", JSON.stringify(array_characters));
		}

		//Check Clean Chat display
		function checkCleanChatDisplay(){
			if(array_characters[data_index]['last_chat'].length > 1){
				if(chat_history){
					$("#clean-chat").show();
				}
			}else{
				$("#clean-chat").hide();
			}			
		}

		//Chat history
		function getLastChat(){
			if(chat_history){
				checkCleanChatDisplay();
				for (var i = 0; i < array_characters[data_index]['last_chat'].length; i++) {
					if(array_characters[data_index]['last_chat'][i]['name'] == "User"){

					$("#overflow-chat").append(`
						<div class="chat border-you">	
							<div class="wrapper-name-and-chat">
								<div class="name">You</div>
								<div class="chat-response">${array_characters[data_index]['last_chat'][i]['message']}</div>
							</div>
						</div>
					`);
					array_chat.push({"name":"User","message":array_characters[data_index]['last_chat'][i]['message']})

					}else{

					avatar_in_chat = "";
					if(display_avatar_in_chat === true){
						avatar_in_chat = `<div class="avatar-chat"><img src="${character_image}" alt="${character_name}" title="${character_name}"></div>`;
					}

					audio_in_chat = "";
					if(display_audio_button_answers === true){
						audio_in_chat = `<div class='chat-audio'><img data-play="false" src='img/btn_tts_play.svg'></div>`;
					}					

					if(!array_characters[data_index]['last_chat'][i]['training']){
						$("#overflow-chat").append(`
							<div class="chat border-character" style="border-color: ${character_background_color}">	
									${avatar_in_chat}
									${audio_in_chat}
									<div class="wrapper-name-and-chat">
										<div class="name">${array_characters[data_index]['last_chat'][i]['name']}</div>
										<div class="chat-response">${array_characters[data_index]['last_chat'][i]['message']}</div>
									</div>
							</div>
						`);
					}
					array_chat.push({"name":character_name,"message":array_characters[data_index]['last_chat'][i]['message']})

					}
				}
				setTimeout(function() {
					scrollChatBottom();
				}, 200);	
			
			}else{
				if(display_welcome_message){
					responseChat(welcome_message);
				}
			}
		}

		//Error messages
		function hideFeedback(){
			$("#feedback").hide();
		}

		function feedbackError(message,type=""){
			$("#feedback").removeClass("bg-error");	
			$("#feedback").removeClass("bg-wait");	

			if(type == "error"){
				$("#feedback").addClass("bg-error");	
			}

			$("#feedback").show();
			$("#feedback span").html("");
			$("#feedback span").html(message)
			setTimeout(function() {
					hideFeedback()
			}, 5000);	

			enableChat();
			return false;
		}

		//Force chat to scroll down
		function scrollChatBottom(){
			let objDiv = document.getElementById("overflow-chat");
			objDiv.scrollTop = objDiv.scrollHeight;
		}

		//Enable chat input
		function enableChat(){
				$(".character-typing").hide();
				$(".btn-send-chat,#chat").attr("disabled",false);
		}

		//Disable chat input
		function disableChat(){
				$(".character-typing").fadeIn();
				$(".character-typing").css('display','flex');
				$(".character-typing span").html(character_name);
				$(".btn-send-chat,#chat").attr("disabled",true);
		}

		//Badwords filter
		const inputChat = document.getElementById('chat');

		fetch('json/badwords.json')
		  .then(response => response.json())
		  .then(data => {
		    const badWords = data.badwords.split(',');
		    
		    // Create regex to check if word is forbidden
		    const regex = new RegExp(`\\b(${badWords.join('|')})\\b(?=\\s)`, 'gi');

		    inputChat.addEventListener('input', event => {
		      if(filter_badwords){
		        const message = event.target.value;

		        // Replace bad words with asterisks
		        const sanitizedMessage = message.replace(regex, match => '*'.repeat(match.length));

		        // Update input value with sanitized message
		        event.target.value = sanitizedMessage;
		      }
		    });
		  })
		  .catch(error => console.error(error));



		function createTextFile(data) {
		  let text = "";

		  // Iterate over the array_chat array and add each message to the text variable
		  data.shift();
		  data.forEach(chat => {
		    text += `${chat.name}: ${chat.message}\r\n`;
		  });


		  // Create a Blob object with the text
		  const blob = new Blob([text], { type: "text/plain" });

		  // Return the Blob object
		  return blob;
		}

		// Function to download the file
		function downloadFile(blob, fileName) {
		  // Create a URL object with the Blob
		  const url = URL.createObjectURL(blob);

		  // Create a download link and add it to the document
		  const link = document.createElement("a");
		  link.href = url;
		  link.download = fileName;
		  document.body.appendChild(link);

		  // Simulate a click on the link to trigger the download
		  link.click();

		  // Remove the link from the document
		  document.body.removeChild(link);
		}

		// Function to handle the download button click event
		function handleDownload() {
		  const blob = createTextFile(array_chat);
		  downloadFile(blob, "chat.txt");
		}


		$(document).on("click", ".chat-audio", function() {
		  if($(this).find("img").attr("data-play") == "true"){
			cancelSpeechSynthesis();
			$(this).find("img").attr("data-play","false");
			$(".chat-audio img").attr("src", "img/btn_tts_play.svg");
		  }else{
		  	  $(".chat-audio img").attr("src", "img/btn_tts_play.svg");
		  	  $(".chat-audio img").attr("data-play", "false");
			  $(this).find("img").attr("src", "img/btn_tts_stop.svg");
			  cancelSpeechSynthesis();
			  var chatResponseText = $(this).siblings(".wrapper-name-and-chat").find(".chat-response").text();
			  doSpeechSynthesis(chatResponseText)
		  	  $(this).find("img").attr("data-play","true");
		  }

		});

		function cancelSpeechSynthesis(){
			window.speechSynthesis.cancel();
		}		

		function doSpeechSynthesis(longText){

		  // The maximum number of characters in each part
		  const maxLength = 100;

		  // Divide the text into smaller parts
		  const textParts = [];
		  let startIndex = 0;
		  while (startIndex < longText.length) {
		    let endIndex = Math.min(startIndex + maxLength, longText.length);
		    if (endIndex < longText.length) {
		      endIndex = longText.lastIndexOf(' ', endIndex);
		    }
		    textParts.push(longText.substring(startIndex, endIndex));
		    startIndex = endIndex + 1;
		  }

		  // Create SpeechSynthesisUtterance instances for each piece of text
		  const utterances = textParts.map(textPart => {
		    const utterance = new SpeechSynthesisUtterance(textPart);
		    utterance.lang = audio_button_lang;
		    return utterance;
		  });

		  // Define the end of speech event
		  utterances[utterances.length - 1].addEventListener("end", () => {
		    $(".chat-audio img").attr("src", "img/btn_tts_play.svg");
		    $(".chat-audio img").attr("data-play", "false");
		  });

		  // Read each piece of text sequentially
		  function speakTextParts(index = 0) {
		    if (index < utterances.length) {
		      speechSynthesis.speak(utterances[index]);
		      utterances[index].addEventListener("end", () => speakTextParts(index + 1));
		    }
		  }

		  //Begin speak
		  speakTextParts();
		}



		//Swiper JS (Carousel)
		let swiperCharacters = new Swiper(".swiperCharacters", {
			spaceBetween: 30,
			loop: false,
			navigation: {
			  nextEl: ".swiper-button-next1",
			  prevEl: ".swiper-button-prev1",
			},
		  scrollbar: {
		    el: ".swiper-scrollbar",
		    hide: true,
		  },
	      breakpoints: {  
	        200: {
	          spaceBetween: 15,
	          slidesPerView:1.1,
	        },      	
	        400: {
	          spaceBetween: 20,
	          slidesPerView:1.3,
	        },              
	        640: {
	          slidesPerView:2.2,
	        },
	        768: {
	          slidesPerView: 2.3,
	        },
	        1024: {
	          slidesPerView: 3.1,
	        },
	        1366: {
	          slidesPerView: 3.8,
	        },
	        1440: {
	          slidesPerView: 4.2,
	        },
	        1600: {
	          slidesPerView: 4.2,
	        },
	        1920: {
	          slidesPerView: 5.8,
	        },
	      },  	  
		});