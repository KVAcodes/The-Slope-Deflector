// AUTHOR: KADIRI VICTOR

// Global variables
let beamLength;
let supports; // array of objects
let section; // object 
let settlements;
let pointLoads;
let distributedLoads;
let moments;

// Getting the menu buttons

// menu buttons
beamButton = document.getElementById("beam-button");
supportButton = document.getElementById("support-button");
sectionButton = document.getElementById("section-button");
settlementButton = document.getElementById("settlement-button");
plButton = document.getElementById("pl-button");
dlButton = document.getElementById("dl-button");
mButton = document.getElementById("m-button");
// back button
backButton = document.getElementById("back-button");
// add button
addButton = document.getElementById("add-button");


// E V E N T   L I S T E N E R S
// Adding event listeners to the buttons

// menu buttons
beamButton.addEventListener("click", function () {
    document.querySelector(".menu-buttons").classList.add("d-none");
    document.querySelector(".menu-inputs").classList.remove("d-none"); 
    document.querySelector("[element-type='Beam']").classList.remove("d-none");
});

supportButton.addEventListener("click", function () {
    document.querySelector(".menu-buttons").classList.add("d-none");
    document.querySelector(".menu-inputs").classList.remove("d-none"); 
    document.querySelector("[element-type='Support']").classList.remove("d-none");
});

sectionButton.addEventListener("click", function () {
    document.querySelector(".menu-buttons").classList.add("d-none");
    document.querySelector(".menu-inputs").classList.remove("d-none"); 
    document.querySelector("[element-type='Section']").classList.remove("d-none");
});

settlementButton.addEventListener("click", function () {
    document.querySelector(".menu-buttons").classList.add("d-none");
    document.querySelector(".menu-inputs").classList.remove("d-none"); 
    document.querySelector("[element-type='Settlement']").classList.remove("d-none");
});

plButton.addEventListener("click", function () {
    document.querySelector(".menu-buttons").classList.add("d-none");
    document.querySelector(".menu-inputs").classList.remove("d-none"); 
    document.querySelector("[element-type='Point Load']").classList.remove("d-none");
});

dlButton.addEventListener("click", function () {
    document.querySelector(".menu-buttons").classList.add("d-none");
    document.querySelector(".menu-inputs").classList.remove("d-none"); 
    document.querySelector("[element-type='Distributed Load']").classList.remove("d-none");
});

mButton.addEventListener("click", function () {
    document.querySelector(".menu-buttons").classList.add("d-none");
    document.querySelector(".menu-inputs").classList.remove("d-none"); 
    document.querySelector("[element-type='Moments']").classList.remove("d-none");
});

// back button
// add an event listener to the back button that will add the d-none class to either of the element-type classes without the d-none class and remove the d-none class from the menu-buttons class
backButton.addEventListener("click", function () {
    document.querySelector(".menu-buttons").classList.remove("d-none");
    document.querySelector(".menu-inputs").classList.add("d-none"); 
    document.querySelector(".menu-input-inputs > div:not(.d-none)").classList.add("d-none");
});

// add event listeners to the buttons with ids roller hinge and fixed, when clicked the class active is added to the button clicked and removed from the other buttons
rollerButton = document.getElementById("roller");
hingeButton = document.getElementById("hinge");
fixedButton = document.getElementById("fixed");

rollerButton.addEventListener("click", function () {
    rollerButton.classList.add("active");
    hingeButton.classList.remove("active");
    fixedButton.classList.remove("active");
    // remove the error element added in the collectSupportData function
    if (document.querySelector("#support-input > p") != null) {
        document.querySelector("#support-input > p").remove();
    }
}
);

hingeButton.addEventListener("click", function () {
    rollerButton.classList.remove("active");
    hingeButton.classList.add("active");
    fixedButton.classList.remove("active");
    // remove the error element added in the collectSupportData function
    if (document.querySelector("#support-input > p") != null) {
        document.querySelector("#support-input > p").remove();
    }
}
);

fixedButton.addEventListener("click", function () {
    rollerButton.classList.remove("active");
    hingeButton.classList.remove("active");
    fixedButton.classList.add("active");
    // remove the error element added in the collectSupportData function
    if (document.querySelector("#support-input > p") != null) {
        document.querySelector("#support-input > p").remove();
    }
}
);

// add event listeners to the buttons with ids l-support, m-support and r-support, when clicked the class active is added to the button clicked and removed from the other buttons
lSupportButton = document.getElementById("l-support");
mSupportButton = document.getElementById("m-support");
rSupportButton = document.getElementById("r-support");

lSupportButton.addEventListener("click", function () {
    lSupportButton.classList.add("active");
    mSupportButton.classList.remove("active");
    rSupportButton.classList.remove("active");
});

mSupportButton.addEventListener("click", function () {
    lSupportButton.classList.remove("active");
    mSupportButton.classList.add("active");
    rSupportButton.classList.remove("active");
});

rSupportButton.addEventListener("click", function () {
    lSupportButton.classList.remove("active");
    mSupportButton.classList.remove("active");
    rSupportButton.classList.add("active");
});


// Adding event listeners to the add button and the enter key check the element-type class without the d-none class and call the collectData function for the element-type class without the d-none class
addButton.addEventListener("click", function () {
    if (document.querySelector(".menu-input-inputs > div:not(.d-none)") != null) {
        if (document.querySelector(".menu-input-inputs > div:not(.d-none)").getAttribute("element-type") == "Beam") {
            beamLength = collectBeamData();
        }
        if (document.querySelector(".menu-input-inputs > div:not(.d-none)").getAttribute("element-type") == "Support") {
            supports = collectSupportData();
        }
    }
});

// add an event listener to the enter key
document.addEventListener("keydown", function (event) {
    if (event.key == "Enter") {
        if (document.querySelector(".menu-input-inputs > div:not(.d-none)") != null) {
            if (document.querySelector(".menu-input-inputs > div:not(.d-none)").getAttribute("element-type") == "Beam") {
                beamLength = collectBeamData();
            }
            if (document.querySelector(".menu-input-inputs > div:not(.d-none)").getAttribute("element-type") == "Support") {
                supports = collectSupportData();
            }
        }
    }
});



// D A T A   C O L L E C T I O N  A N D   V A L I D A T I O N

// beam data collection and validation
function collectBeamData() {
    // getting the value from the input field with id beamLengthInput and removing the white spaces
    beamLength = document.getElementById("beamLengthInput").value.trim();
    // validate if it's an integer or float and if it's greater than 0
    if (beamLength == "" || isNaN(beamLength) || beamLength <= 0) {
        // make the input field red
        document.getElementById("beamLengthInput").classList.add("is-invalid");
        // create a p element containing the text "verify the highlighted input fields!" and add it to the div with the class 'add-on' as first child
        addErrorElement();
        disableButtons('beam');
        return -1;
    } else {
        // make the input field green
        document.getElementById("beamLengthInput").classList.remove("is-invalid");
        document.getElementById("beamLengthInput").classList.add("is-valid");
        // remove the error element
        if (document.querySelector(".add-on > p") != null) {
            document.querySelector(".add-on > p").remove();
        }
        console.log(parseFloat(beamLength));
        unDisableButtons('beam');
        return parseFloat(beamLength);
    }
}

// support data collection and validation
function collectSupportData() {
    // check the button in the div with id support-type with the class active and get the value of the button from the element-value attribute and if no button is active, add an error element similar to the one in the collectBeamData function but with text "select a support type!" and it should be added as the third child of the div with the id support-input
    if (document.querySelector("#support-type > button.active") != null) {
        supportType = document.querySelector("#support-type > button.active").getAttribute("element-value");
        console.log(supportType);
    } else {
        if (document.querySelector("#support-input > p") == null) {
            error = document.createElement("p");
            error.innerHTML = "select a support type!";
            // add class inline-block to the error element
            error.classList.add("error-text");
            addDiv = document.querySelector("#support-input");
            addDiv.insertBefore(error, addDiv.childNodes[2]);
        }
        return -1;
    }

}


// M I S C E L L A N E O U S  F U N C T I O N S

// function to remove the disabled attribute from the buttons
function unDisableButtons(elementType) {
    if (elementType == 'beam') {
        document.getElementById("support-button").removeAttribute("disabled");
        document.getElementById("section-button").removeAttribute("disabled");
        document.getElementById("pl-button").removeAttribute("disabled");
        document.getElementById("dl-button").removeAttribute("disabled");
        document.getElementById("m-button").removeAttribute("disabled");
    }
}

// function to add the disabled attribute to the buttons
function disableButtons(elementType) {
    if (elementType == 'beam') {
        document.getElementById("support-button").setAttribute("disabled", "");
        document.getElementById("section-button").setAttribute("disabled", "");
        document.getElementById("pl-button").setAttribute("disabled", "");
        document.getElementById("dl-button").setAttribute("disabled", "");
        document.getElementById("m-button").setAttribute("disabled", "");
    }
}

// function to add the error element to the div with the class 'add-on' as done in the collectData function
function addErrorElement() {
    if (document.querySelector(".add-on > p") == null) {
        error = document.createElement("p");
        error.innerHTML = "verify the highlighted input fields!";
        // add class inline-block to the error element
        error.classList.add("d-inline-block");
        error.classList.add("error-text");
        addDiv = document.querySelector(".add-on");
        addDiv.insertBefore(error, addDiv.firstChild);
    }
}