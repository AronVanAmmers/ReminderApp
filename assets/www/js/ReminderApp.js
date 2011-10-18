// Some configuration.
var serviceUrls = ["http://restserver.cloudified.localhost"];

// Initialize jo.
jo.load();

// Setup a screen to show stuff.
var scn = new joScreen();

// Our array of reminders, empty by default.
var reminderData = [];

// Use a joList to visualize the data.
var list = new joList();

list.formatItem = function(data, index) {
	console.log(data.Title);
	return joList.prototype.formatItem.call(this, data.Title + " - " + data.Location, index);
};

// Data structure for linking the user preferences to the UX.
var pref = new joRecord({
	UserName: ""
});

//var uxUserName = ; 

// Create our view card.
var card = new joCard([
    new joTitle("Hello, cloud storage!"),
	new joDivider(),
	new joExpando([
		new joExpandoTitle("Actions"),
		new joExpandoContent([
		    new joButton("Add random item").selectEvent.subscribe(function() {
		        addRandomItem();
		    }),
		    new joButton("Clear items").selectEvent.subscribe(function() {
		        clearData();
		    }),
			new joExpando([		
				new joExpandoTitle("Local storage"),
			    new joCard([
				    new joButton("Load").selectEvent.subscribe(function() {
				        loadFromLocalStorage();
				    }),
				    new joButton("Save").selectEvent.subscribe(function() {
				        saveToLocalStorage();
				    }),
				]).setStyle({paddingTop:"5px"}),
			]),
			new joExpando([		
				new joExpandoTitle("Cloud storage"),
				new joCard([
				    new joFlexrow([
				    	new joLabel("User name:"),
				    	new joInput(pref.link("UserName")),				    	
					    new joButton("Reset").selectEvent.subscribe(function() {
					        resetUserName();
					    }),
				    ]),
				    new joButton("Load").selectEvent.subscribe(function() {
				        loadFromCloudStorage();
				    }),
				    new joButton("Save").selectEvent.subscribe(function() {
				        saveToCloudStorage();
				    }),
				]).setStyle({paddingTop:"5px"}),
			]),
		]),
	]),
	list,
]);

var scroller = new joScroller(card).attach(document.body);



function reload() {
	list.data = reminderData;
	list.refresh();
}

function loadFromString(reminderDataString)
{
	loadFromObject(JSON.parse(reminderDataString));	
}

function loadFromObject(newReminderData)
{
	reminderData = newReminderData;
	if(reminderData == null)
		reminderData = [];
	reload();
}

/******************* Local storage ******************/

function loadFromLocalStorage() 
{
	var reminderDataString = window.localStorage["reminderData"];
	
	if(reminderDataString!=null)
		loadFromString(reminderDataString);
}


function saveToLocalStorage() 
{
	var reminderDataString = JSON.stringify(reminderData);
	window.localStorage["reminderData"] = reminderDataString;
}

/******************* Cloud configuration  ******************/

function loadUserName()
{
	var userName = window.localStorage["userName"];
	pref.setProperty("UserName", userName);	
}

function saveUserName()
{
	window.localStorage["userName"] = pref.getProperty("UserName");
}

function ensureUserName()
{
	var userName = pref.getProperty("UserName");
	if(userName == null) 
	{
		userName = "User" + Math.floor((Math.random() + 0.1)* 900000);
		scn.alert("Cloud storage", "You've been given a random user name. Want your own? Set it under Actions > Cloud Storage and save.");	
	}
	pref.setProperty("UserName", userName);
}

function resetUserName()
{
	pref.setProperty("UserName", null);
	ensureUserName();
}


/******************* Cloud storage ******************/

function getServiceUrl(userName)
{
	return serviceUrls[0] + "/reminders/" + userName;
}

function loadFromCloudStorage() 
{
	saveUserName();
	$.getJSON(getServiceUrl(pref.getProperty("UserName")), function(data){
		loadFromObject(data);
	})
	//.success(function(){ scn.alert("Success", "Successfully loaded.") }) 
	.error(function(){ scn.alert("An error occurred", "Sorry, an error occurred while loading data.") }); 
}

function saveToCloudStorage() 
{
	saveUserName();
	$.post(getServiceUrl(pref.getProperty("UserName")), JSON.stringify(reminderData))
	.success(function(data){
		//scn.alert("Successfully saved.")
		// Reload to get the ID's of newly added items.
		loadFromCloudStorage();		
		})
	.error(function(){ scn.alert("An error occurred", "Sorry, an error occurred while saving data.") });
	
}

function clearData()
{
	reminderData = [];
	reload();
}

// Code to create random items
var locations = ["supermarket", "home", "office", "school", "swimming pool", "restaurant"];
var verbs = ["fetch", "deliver", "ask about", "talk about", "have a look at", "do research on"];
var objects = ["car", "bike", "bananas", "apples", "pears", "new smartphone", "car audio system", "gardener", "pizza"];

function getRandomElement(sourceArray)
{
	var i = Math.floor(Math.random() * sourceArray.length);
	return sourceArray[i];
}

function getRandomLocation()
{
	return getRandomElement(locations);
}

function getRandomTitle()
{
	return getRandomElement(verbs) + " " + getRandomElement(objects);
}

function addRandomItem()
{
	randomItem = { Title: getRandomTitle(), Location: getRandomLocation() };
	reminderData.push(randomItem);
	reload();
}

// Always do a reload after initializing the interface.
loadFromLocalStorage();
loadUserName();
ensureUserName();