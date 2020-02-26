
//--------------------------------------------------------------------------------------------
// Only ment as a simple control for device-parameters, not to remotecontrol BWS as a whole!!!!
//--------------------------------------------------------------------------------------------
// DONT USE LEARN, neither in BWS nor Autmap/Nocturn!!! 

// Start by editing your automap file and assign the knobs on pages 1-8 to send CC21 to CC84 and the switches (same on all pages) from CC85 to CC92
// and then simply design your mapping-pages internally in BWS' remotecontrol editor as if you were just making macros.

// The script takes the nocturn CCs and send them to the given parameter on the given page so that f.ex. knob one on the Nocturn always references the 
// first parameter on the first BWS parameter-page and so on - note though, that the first 8 parameters (in this default-setup) references the 8 switches!

// By consequently sending CCs from 21 to 84 for knobs and 85 to 92 for Swithes, you have access to 8 pages of 8 parameters and 8 switches (same on all pages).
// This means that you must edit the Autmap for your Nocturn (use the Nocturn software) so that knobs sequentially sends 21 - 85 and switches (all pages) send 85 to 92.
// This way the 8 knobs on page1 of the nocturn will correspond to the 8 parameters on BWS's page one (page-0 for switches) and so on for page 2 to 8.

// Should you (for some reason) chose to put the knobs in an other sequence (and same for the switches) adjust the offsets below.
// The slider can be hard coded so that i always references a given parameter on a given page Se below about hardcoding the slider.

// Unfortunately feedback is somewhat limited: only parameters on the active page in BWS are "monitored", so only those are immediately fed back to the Nocturn. 
// However: everytime a control on the Nocturn is adjusted, the viewed page (on the controller) is updated! 

// As a small "hack" to compensate for this, if a switch is assigned to a certain CC (pageShift, see below) and sends a value from 1 to 8 (momentary), pressing this will make BWS change 
// parameterpage to the one, selected on the controller 

// Likewise, Adjusting a knob/switch on a page, other than the active in BWS maskes BWS change to thos page.

var offsetKnobs = 21; //Knobs typically start on CC21, but change if needed.
var offsetSw = 85;    //Buttons/switches should start on CC85 (8 pages of 8 knobs after first knob). Change if needed.
var switchPage = 0;   //Landing all 8 swithes to the same page (here page 0) - swithes have same function on all controllers pages but must "land" at a given page in BWS for assignments here
var slider = 99; 	  //Hardcoding slider to a given cc (99) for a given parameter. This must correspond to the setting in the automap for the slider. Change to taste
var sliderPage = 1;   //The parameterpage in BWS that the slider adresses (see below). Change to taste
var sliderIndex = 2;  //here: slider points to parameter 2 on a page 1 (see above). Change to taste
var pageShift = 100;  // Pressing a switch assigned to this CC, sending a pagenumber (the "release" -value of the switch, set in automap) will switch to this page (see above)

var selectedPage = 0;
var prevPage = 0;

loadAPI(2);
host.defineController("Novation", "Nocturn", "1.0", "d59adab7-e22d-4ad6-b606-5dfb3bf8c87f");
host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["Automap MIDI"], ["Automap MIDI"]);

function init() {

	cursorTrack = host.createCursorTrack(8, 8);
	cursorDevice = cursorTrack.createCursorDevice();
	controlpage = cursorDevice.createCursorRemoteControlsPage(8);
	controlpage.selectedPageIndex().markInterested();

	for (var parm = 0; parm < 8; parm++) {
		controlpage.getParameter(parm).addValueObserver(128, makeIndexedFunction(parm, handleValue));

	}	

	noteInput = host.getMidiInPort(0).createNoteInput("Noteinput", "???????????????????");
	noteInput.setShouldConsumeEvents(true);
	host.getMidiInPort(0).setMidiCallback(onMidiPort0);
	controlpage.selectedPageIndex().set(selectedPage);

}

function handleValue(parm,value){
		if (controlpage.selectedPageIndex().get() > 0) {
			host.getMidiOutPort(0).sendMidi(176, offsetKnobs + parm + ((controlpage.selectedPageIndex().get() - 1) * 8), value);
		}
		else {
			host.getMidiOutPort(0).sendMidi(176, offsetSw + parm, value);
		}
}

function makeIndexedFunction(parm, f) {
	return function (value) {
		f(parm, value);
	};
}

function onMidiPort0(status, data1, data2) {
	
	//println(status + ", " + data1 + ", " + data2);

	if (isChannelController(status)) {

		selectedPage = controlpage.selectedPageIndex().get();

		// Pageshift
		if (data1 == pageShift && data2>0){
			controlpage.selectedPageIndex().set(data2);
			specialFuncB();
			selectedPage = data2;
		}	

		// Update if new page and touched control
		else if(selectedPage != prevPage){
			prevPage = selectedPage
			specialFuncB();	
		}


		//Slider
		else if (data1 == slider) {
			controlpage.selectedPageIndex().set(sliderPage);
			controlpage.getParameter(sliderIndex).set(data2, 128);
		}

		//Knobs
		else if (data1 >= offsetKnobs && data1 < offsetSw) {
			page = Math.floor((data1 - offsetKnobs) / 8) + 1 //Add one as page0 is for the switches;
			parameter = (data1 - offsetKnobs) % 8;
			controlpage.selectedPageIndex().set(page);
			controlpage.getParameter(parameter).set(data2, 128);
		}

		//Buttons
		else if (data1 >= offsetSw && data1 < offsetSw + 8) {
			page = switchPage;
			parameter = (data1 - offsetSw) % 8;
			controlpage.selectedPageIndex().set(page);
			controlpage.getParameter(parameter).set(data2, 128);
		}
	}
}

function specialFuncA() {
	specialFuncB();
}

function specialFuncB() {
	for (var parm = 0; parm < 8; parm++) {
		if (controlpage.selectedPageIndex().get() > 0) {
			host.getMidiOutPort(0).sendMidi(176, offsetKnobs + parm + ((controlpage.selectedPageIndex().get() - 1) * 8), 127 * controlpage.getParameter(parm).value().get());
		}
		else {
			host.getMidiOutPort(0).sendMidi(176, offsetSw + parm, 127 * controlpage.getParameter(parm).value().get());
		}
	}
}

function exit() {
	println("exit.");
}
